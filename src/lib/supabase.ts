import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Browser client only. Uses the publishable/anon key from environment variables.
 * Never add a service-role key here.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export { supabaseUrl };

/** Active session record returned by the get_student_active_sessions RPC. */
export interface ActiveSession {
  session_id: string;
  class_id: string;
  class_name: string;
  class_section: string;
  teacher_name: string;
  window_start: string;
  window_end: string;
  status: string;
  created_at: string;
}

/**
 * Fetches active attendance sessions for the currently authenticated student.
 * Uses the get_student_active_sessions SECURITY DEFINER RPC which resolves
 * the student via auth.uid() → students.supabase_user on the server.
 */
export async function getStudentActiveSessions(): Promise<{
  data: ActiveSession[] | null;
  error: any;
}> {
  const { data, error } = await supabase.rpc('get_student_active_sessions');
  return { data: data as ActiveSession[] | null, error };
}

// ---------------------------------------------------------------------------
// Student identity helpers
// ---------------------------------------------------------------------------
//
// create-student provisions every student a Supabase Auth account using a
// synthetic email of the form `<enrollment_no>@students.internal` (with a
// random temp password the teacher then hands to the student). Student login
// therefore reconstructs the same email from the enrollment number.
// ---------------------------------------------------------------------------

const STUDENT_EMAIL_DOMAIN = 'students.internal';

export interface StudentRecord {
  id: string;
  enrollment_no: string;
  name: string;
  email: string | null;
  supabase_user: string;
  webauthn_registered: boolean;
}

export function enrollmentEmail(enrollmentNo: string): string {
  return `${enrollmentNo.trim()}@${STUDENT_EMAIL_DOMAIN}`;
}

/** Sign a student in using the email/password pattern create-student provisions. */
export async function signInStudent(enrollmentNo: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: enrollmentEmail(enrollmentNo),
    password,
  });
}

/** Resolve the authenticated student's row via auth.uid() → students.supabase_user. */
export async function getStudentByUserId(userId: string): Promise<{
  data: StudentRecord | null;
  error: any;
}> {
  const { data, error } = await supabase
    .from('students')
    .select('id, enrollment_no, name, email, supabase_user, webauthn_registered')
    .eq('supabase_user', userId)
    .maybeSingle();
  return { data: data as StudentRecord | null, error };
}

// ---------------------------------------------------------------------------
// Cached student identity (id is required by the attendance edge functions)
// ---------------------------------------------------------------------------

const STUDENT_CACHE_KEY = 'campus_os_student';

export interface CachedStudent {
  id: string;
  enrollment_no: string;
  name?: string;
}

export function cacheStudent(student: CachedStudent): void {
  try {
    localStorage.setItem(STUDENT_CACHE_KEY, JSON.stringify(student));
  } catch {
    /* ignore */
  }
}

export function getCachedStudent(): CachedStudent | null {
  try {
    const raw = localStorage.getItem(STUDENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.id) return parsed as CachedStudent;
  } catch {
    /* ignore */
  }
  return null;
}

export function clearCachedStudent(): void {
  try {
    localStorage.removeItem(STUDENT_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Session resolution
// ---------------------------------------------------------------------------

export interface ResolvedSession {
  sessionId: string;
  classId: string;
  teacherId: string;
  windowEnd: string;
}

function normalizeResolveResult(data: any): { data: ResolvedSession | null; error: string | null } {
  if (data?.status === 'error') {
    return { data: null, error: data.message || 'Session lookup failed' };
  }
  if (!data?.sessionId) {
    return { data: null, error: 'Session lookup failed' };
  }
  return { data: data as ResolvedSession, error: null };
}

/** Resolve a session from a typed 6-digit rotating code. */
export async function resolveSessionByCode(code: string): Promise<{
  data: ResolvedSession | null;
  error: string | null;
}> {
  const { data, error } = await supabase.functions.invoke('session-resolve', {
    body: { code: code.trim() },
  });
  if (error) return { data: null, error: error.message || 'Network error' };
  return normalizeResolveResult(data);
}

/** Resolve a session from a raw sessionId (QR path). */
export async function resolveSessionById(sessionId: string): Promise<{
  data: ResolvedSession | null;
  error: string | null;
}> {
  const { data, error } = await supabase.functions.invoke('session-resolve', {
    body: { sessionId: sessionId.trim() },
  });
  if (error) return { data: null, error: error.message || 'Network error' };
  return normalizeResolveResult(data);
}

// ---------------------------------------------------------------------------
// WebAuthn authentication options
// ---------------------------------------------------------------------------

export interface WebAuthnAuthOptions {
  challenge: string;
  rpId: string;
  allowCredentials: { id: string; type?: string }[];
  userVerification: string;
  timeout?: number;
}

/** Request a PublicKeyCredentialRequestOptions for the student's registered device. */
export async function getWebAuthnAuthOptions(studentId: string): Promise<{
  data: WebAuthnAuthOptions | null;
  error: string | null;
}> {
  const { data, error } = await supabase.functions.invoke('webauthn-auth-options', {
    body: { studentId },
  });
  if (error) return { data: null, error: error.message || 'Network error' };
  if (data?.status === 'error') {
    return { data: null, error: data.message || 'No registered device found' };
  }
  return { data: data as WebAuthnAuthOptions, error: null };
}

// ---------------------------------------------------------------------------
// Attendance marking
// ---------------------------------------------------------------------------

export interface AttendanceMarkResult {
  status: string;
  reason?: string;
  timestamp?: string;
  attendanceId?: string;
}

export interface AttendanceMarkPayload {
  sessionId: string;
  studentId: string;
  codeEntered: string;
  deviceFingerprint: string;
  webauthnAssertion: unknown;
}

/** Submit attendance to the attendance-mark Edge Function. */
export async function markAttendance(
  payload: AttendanceMarkPayload,
): Promise<{ data: AttendanceMarkResult | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('attendance-mark', {
    body: {
      sessionId: payload.sessionId,
      studentId: payload.studentId,
      codeEntered: payload.codeEntered,
      deviceFingerprint: payload.deviceFingerprint,
      webauthnAssertion: payload.webauthnAssertion,
    },
  });
  if (error) return { data: null, error: error.message || 'Network error' };
  return { data: data as AttendanceMarkResult, error: null };
}

// ---------------------------------------------------------------------------
// Base64url helpers (WebAuthn browser ceremony)
// ---------------------------------------------------------------------------

export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64UrlToBuffer(value: string): ArrayBuffer {
  const standard = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard.padEnd(Math.ceil(standard.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Serialize a native PublicKeyCredential (returned by navigator.credentials.get)
 * into the base64url JSON shape that attendance-mark's verifyAuthenticationResponse
 * expects.
 */
export function publicKeyCredentialToAssertion(credential: any): unknown {
  const response = credential.response ?? {};
  const assertion: Record<string, unknown> = {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type ?? 'public-key',
    response: {
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      authenticatorData: bufferToBase64Url(response.authenticatorData),
      signature: bufferToBase64Url(response.signature),
    },
  };
  if (response.userHandle != null) {
    (assertion.response as Record<string, unknown>).userHandle = bufferToBase64Url(response.userHandle);
  }
  return assertion;
}

/**
 * Convert the WebAuthnAuthOptions returned by webauthn-auth-options into the
 * PublicKeyCredentialRequestOptions shape navigator.credentials.get expects.
 */
export function authOptionsToCredentialRequestOptions(
  options: WebAuthnAuthOptions,
): PublicKeyCredentialRequestOptions {
  return {
    challenge: base64UrlToBuffer(options.challenge),
    rpId: options.rpId,
    allowCredentials: (options.allowCredentials ?? []).map((c) => ({
      id: base64UrlToBuffer(c.id),
      type: (c.type as PublicKeyCredentialType) ?? 'public-key',
    })),
    userVerification: options.userVerification as UserVerificationRequirement,
    timeout: options.timeout,
  };
}