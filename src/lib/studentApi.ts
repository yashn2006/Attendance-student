import { supabase } from './supabase';

export interface TimetableRow {
  slot_id: string;
  period_number: number;
  label: string;
  start_time: string;
  end_time: string;
  subject_id: string | null;
  subject_name: string | null;
  subject_code: string | null;
  teacher_name: string | null;
  room: string | null;
  slot_type: string | null;
  status: string;
  session_id: string | null;
  marked_at: string | null;
}

export interface MonthlyRow {
  month: string;
  subject_id: string | null;
  subject_name: string | null;
  held: number;
  present: number;
}

export interface NotificationRow {
  id: string;
  title: string;
  body: string;
  created_at: string;
  sender_name: string | null;
  is_read: boolean;
}

export interface StudentProfileRow {
  id: string;
  name: string;
  enrollment_no: string;
  email: string | null;
  webauthn_registered: boolean;
  class_names: string[] | null;
}

interface ApiResult<T> {
  data: T | null;
  error: { message: string } | null;
}

export async function getTimetable(date?: string): Promise<ApiResult<TimetableRow[]>> {
  const { data, error } = await supabase.rpc(
    'student_timetable',
    date ? { p_date: date } : {},
  );

  if (error) {
    return { data: null, error };
  }

  const rows = ((data ?? []) as TimetableRow[]).map((row) => ({
    ...row,
    period_number: Number(row.period_number),
  }));

  return { data: rows, error: null };
}

export async function getMonthlyAttendance(months = 6): Promise<ApiResult<MonthlyRow[]>> {
  const { data, error } = await supabase.rpc('student_attendance_monthly', {
    p_months: months,
  });

  if (error) {
    return { data: null, error };
  }

  const rows = ((data ?? []) as MonthlyRow[]).map((row) => ({
    ...row,
    held: Number(row.held),
    present: Number(row.present),
  }));

  return { data: rows, error: null };
}

export async function getNotifications(limit = 50): Promise<ApiResult<NotificationRow[]>> {
  const { data, error } = await supabase.rpc('student_notifications', {
    p_limit: limit,
  });

  if (error) {
    return { data: null, error };
  }

  return { data: (data ?? []) as NotificationRow[], error: null };
}

export async function markNotificationsRead(ids: string[]): Promise<ApiResult<null>> {
  const { error } = await supabase.rpc('student_mark_notifications_read', {
    p_ids: ids,
  });

  if (error) {
    return { data: null, error };
  }

  return { data: null, error: null };
}

export async function getStudentProfile(): Promise<ApiResult<StudentProfileRow | null>> {
  const { data, error } = await supabase.rpc('student_profile');

  if (error) {
    return { data: null, error };
  }

  const rows = (data ?? []) as StudentProfileRow[];
  return { data: rows.length > 0 ? rows[0] : null, error: null };
}
