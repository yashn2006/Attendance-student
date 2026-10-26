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
