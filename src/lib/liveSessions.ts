import { useEffect, useMemo, useState } from 'react';
import { type ActiveSession, getStudentActiveSessions } from './supabase';

export const LIVE_SESSION_POLL_MS = 15000;

const endTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
});

export function windowEndMs(iso: string): number {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

export function formatSessionEndTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return endTimeFormatter.format(date);
}

export function formatWindowEnd(iso: string): string {
  const time = formatSessionEndTime(iso);
  return time ? `ends ${time}` : '';
}

export function filterLiveSessions(
  sessions: ActiveSession[],
  now: number = Date.now(),
): ActiveSession[] {
  return sessions
    .filter((session) => windowEndMs(session.window_end) > now)
    .sort((a, b) => windowEndMs(a.window_end) - windowEndMs(b.window_end));
}

export interface LiveSessionLock {
  isLocked: boolean;
  lockedUntil: string | null;
}

export function useLiveSessionLock(): LiveSessionLock {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const { data, error: fetchError } = await getStudentActiveSessions();
        if (cancelled) return;

        if (fetchError) {
          setError(fetchError.message || 'Failed to check live sessions.');
          setSessions([]);
          return;
        }

        setError(null);
        setSessions(data ?? []);
        setNow(Date.now());
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to check live sessions.');
        setSessions([]);
      }
    };

    void check();
    const interval = window.setInterval(() => {
      void check();
    }, LIVE_SESSION_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const liveSessions = useMemo(
    () => (error ? [] : filterLiveSessions(sessions, now)),
    [sessions, now, error],
  );

  return {
    isLocked: liveSessions.length > 0,
    lockedUntil: liveSessions[0]?.window_end ?? null,
  };
}
