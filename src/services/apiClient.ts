export type AppErrorCode =
  | 'not_configured'
  | 'invalid_credentials'
  | 'network'
  | 'unavailable'
  | 'session_expired'
  | 'student_missing'
  | 'unknown';

export interface AppError {
  code: AppErrorCode;
  message: string;
}

export type AppResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export function ok<T>(data: T): AppResult<T> {
  return { ok: true, data };
}

export function fail(code: AppErrorCode, message: string): AppResult<never> {
  return { ok: false, error: { code, message } };
}

export function isLikelyNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }
  if (err instanceof TypeError) {
    return true;
  }
  const message = err instanceof Error ? err.message : String(err ?? '');
  return /failed to fetch|network|offline|load failed/i.test(message);
}

export function mapAuthError(message: string | undefined): AppError {
  const raw = (message ?? '').toLowerCase();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      code: 'network',
      message: 'You appear to be offline. Check your connection and try again.',
    };
  }
  if (
    raw.includes('invalid login') ||
    raw.includes('invalid credentials') ||
    raw.includes('invalid_grant')
  ) {
    return {
      code: 'invalid_credentials',
      message: 'Enrollment number or password is incorrect.',
    };
  }
  if (raw.includes('email not confirmed')) {
    return {
      code: 'invalid_credentials',
      message: 'This account is not confirmed. Ask your teacher to recreate the student login.',
    };
  }
  if (raw.includes('jwt expired') || raw.includes('session expired')) {
    return {
      code: 'session_expired',
      message: 'Your session expired. Please sign in again.',
    };
  }
  return {
    code: 'unavailable',
    message: 'Could not reach the sign-in service. Try again in a moment.',
  };
}
