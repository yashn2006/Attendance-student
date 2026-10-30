import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Clock,
  MapPin,
  RefreshCw,
  User,
} from 'lucide-react';
import { getTimetable, type TimetableRow } from '../lib/studentApi';
import { useLiveSessionLock } from '../lib/liveSessions';
import {
  StackedHeroCards,
  type HeroCardStatusTone,
  type StackedHeroCardData,
} from '../components/StackedHeroCards';

const warnedStatuses = new Set<string>();

interface TodayScreenProps {
  openSelectLectureModal: () => void;
}

interface StatusMeta {
  label: string;
  note?: string;
  className: string;
}

const getStatusMeta = (status: string): StatusMeta => {
  const normalized = (status ?? '').trim().toLowerCase();

  if (normalized === 'present' || normalized === 'manual') {
    return {
      label: 'Marked',
      note: normalized === 'manual' ? 'by teacher' : undefined,
      className:
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    };
  }

  if (normalized === 'not_held') {
    return {
      label: 'No session yet',
      className:
        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    };
  }

  if (!warnedStatuses.has(normalized)) {
    warnedStatuses.add(normalized);
    console.warn('[TodayScreen] Unhandled attendance status:', status);
  }

  return {
    label: 'Not marked',
    className:
      'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25',
  };
};

const formatTime = (value: string | null): string => {
  if (!value) return '--:--';
  return value.slice(0, 5);
};

const toMinutes = (value: string | null): number | null => {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const getNowMinutes = (): number => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Kolkata',
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
};

const formatMarkedAt = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }).format(date);
};

const getTodayLabel = (): string =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

const isBreakRow = (row: TimetableRow): boolean => {
  const slotType = (row.slot_type ?? '').toLowerCase();
  const label = (row.label ?? '').toLowerCase();
  return slotType.includes('break') || label.includes('break');
};

export const TodayScreen: React.FC<TodayScreenProps> = ({ openSelectLectureModal }) => {
  const [rows, setRows] = useState<TimetableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialCardIndex, setInitialCardIndex] = useState(0);
  const { isLocked: hasLiveSession } = useLiveSessionLock();

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const { data, error: fetchError } = await getTimetable();

    if (fetchError) {
      setError(fetchError.message || 'Failed to load today’s timetable.');
      setRows([]);
    } else {
      setRows(data ?? []);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load('initial');
  }, [load]);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.period_number - b.period_number),
    [rows],
  );

  const todayLabel = useMemo(() => getTodayLabel(), []);

  const lectureRows = useMemo(
    () => sortedRows.filter((row) => !isBreakRow(row)),
    [sortedRows],
  );

  const nowMinutes = getNowMinutes();

  const heroCards = useMemo<StackedHeroCardData[]>(
    () =>
      lectureRows.map((row) => {
        const normalized = (row.status ?? '').trim().toLowerCase();
        const isMarked = normalized === 'present' || normalized === 'manual';
        const startMinutes = toMinutes(row.start_time);
        const hasStarted = startMinutes !== null && startMinutes <= nowMinutes;

        let statusLabel = 'NOT MARKED';
        let statusTone: HeroCardStatusTone = 'not-marked';

        if (isMarked) {
          statusLabel = 'MARKED';
          statusTone = 'marked';
        } else if (normalized === 'not_held') {
          statusLabel = hasStarted ? 'NO SESSION' : 'UPCOMING';
          statusTone = 'upcoming';
        }

        return {
          id: row.slot_id,
          title: row.subject_name || 'Lecture',
          subtitle: `Period ${row.period_number} · ${formatTime(row.start_time)} - ${formatTime(row.end_time)}`,
          teacher: row.teacher_name,
          detail: row.room,
          statusLabel,
          statusTone,
          canMarkAttendance: !isMarked && hasLiveSession,
          periodNumber: row.period_number,
        };
      }),
    [lectureRows, nowMinutes, hasLiveSession],
  );

  useEffect(() => {
    if (lectureRows.length === 0) {
      setInitialCardIndex(0);
      return;
    }

    const now = getNowMinutes();
    const currentIndex = lectureRows.findIndex((row) => {
      const start = toMinutes(row.start_time);
      const end = toMinutes(row.end_time);
      return start !== null && end !== null && start <= now && now < end;
    });

    if (currentIndex >= 0) {
      setInitialCardIndex(currentIndex);
      return;
    }

    const nextIndex = lectureRows.findIndex((row) => {
      const start = toMinutes(row.start_time);
      return start !== null && start > now;
    });

    setInitialCardIndex(nextIndex >= 0 ? nextIndex : 0);
  }, [lectureRows]);

  return (
    <div className="space-y-5 pb-6 max-w-2xl mx-auto px-4 sm:px-6 pt-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Today
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
              {todayLabel}
            </p>
          </div>
        </div>

        <button
          onClick={() => void load('refresh')}
          disabled={refreshing || loading}
          className="flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-60 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {!loading && !error && heroCards.length > 0 && (
        <StackedHeroCards
          cards={heroCards}
          initialIndex={initialCardIndex}
          onMarkAttendance={openSelectLectureModal}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 animate-pulse"
            >
              <div className="flex justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-28 rounded-md bg-slate-200 dark:bg-slate-800" />
                  <div className="h-5 w-44 rounded-md bg-slate-300 dark:bg-slate-700" />
                  <div className="h-3 w-36 rounded-md bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-7 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 p-8 text-center space-y-3">
          <AlertCircle className="w-9 h-9 text-rose-500 mx-auto" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Could not load today’s lectures
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{error}</p>
          <button
            onClick={() => void load('initial')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-500/25 active:scale-95 transition-transform cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : sortedRows.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-2">
          <CalendarDays className="w-9 h-9 text-indigo-500 mx-auto opacity-60" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">No lectures today</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Your timetable will appear here once classes are scheduled.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRows.map((row) =>
            isBreakRow(row) ? (
              <div key={row.slot_id} className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {row.label || 'Break'}
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>
            ) : (
              <div
                key={row.slot_id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4.5 sm:p-5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-wider">
                        {row.label || `Period ${row.period_number}`}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        {formatTime(row.start_time)} - {formatTime(row.end_time)}
                      </span>
                    </div>

                    <h3 className="text-[15px] font-black text-slate-900 dark:text-white leading-snug truncate">
                      {row.subject_name || 'Lecture'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      {row.teacher_name && (
                        <span className="flex items-center gap-1 min-w-0">
                          <User className="w-3 h-3 shrink-0" />
                          <span className="truncate">{row.teacher_name}</span>
                        </span>
                      )}
                      {row.room && (
                        <span className="flex items-center gap-1 min-w-0">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{row.room}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    {(() => {
                      const meta = getStatusMeta(row.status);
                      return (
                        <>
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${meta.className}`}
                          >
                            {meta.label}
                          </span>
                          {meta.note && (
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                              {meta.note}
                            </p>
                          )}
                          {['present', 'manual'].includes((row.status ?? '').toLowerCase()) && row.marked_at && (
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                              {formatMarkedAt(row.marked_at)}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
};
