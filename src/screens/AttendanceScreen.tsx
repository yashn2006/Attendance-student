import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, PieChart } from 'lucide-react';
import { getMonthlyAttendance, type MonthlyRow } from '../lib/studentApi';

interface MonthGroup {
  key: string;
  label: string;
  held: number;
  present: number;
  subjects: MonthlyRow[];
}

const toPercentage = (present: number, held: number): number | null => {
  if (held <= 0) return null;
  return Math.round((present / held) * 100);
};

const getTextColor = (percentage: number | null): string => {
  if (percentage === null) return 'text-slate-400 dark:text-slate-500';
  if (percentage >= 75) return 'text-emerald-600 dark:text-emerald-400';
  if (percentage >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
};

const getBarColor = (percentage: number | null): string => {
  if (percentage === null) return 'bg-slate-300 dark:bg-slate-700';
  if (percentage >= 75) return 'bg-emerald-500';
  if (percentage >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
};

const formatMonth = (month: string): string => {
  const date = new Date(`${month}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return month;
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

export const AttendanceScreen: React.FC = () => {
  const [rows, setRows] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getMonthlyAttendance(6);

    if (fetchError) {
      setError(fetchError.message || 'Failed to load attendance.');
      setRows([]);
    } else {
      setRows(data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo<MonthGroup[]>(() => {
    const byMonth = new Map<string, MonthlyRow[]>();

    rows.forEach((row) => {
      const key = row.month || 'unknown';
      const existing = byMonth.get(key);
      if (existing) {
        existing.push(row);
      } else {
        byMonth.set(key, [row]);
      }
    });

    return [...byMonth.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, subjects]) => {
        const held = subjects.reduce((sum, row) => sum + row.held, 0);
        const present = subjects.reduce((sum, row) => sum + row.present, 0);

        return {
          key,
          label: key === 'unknown' ? 'Unknown month' : formatMonth(key),
          held,
          present,
          subjects: [...subjects].sort((a, b) =>
            (a.subject_name ?? 'General').localeCompare(b.subject_name ?? 'General'),
          ),
        };
      });
  }, [rows]);

  return (
    <div className="space-y-5 pb-6 max-w-2xl mx-auto px-4 sm:px-6 pt-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <PieChart className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Attendance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Monthly subject-wise attendance
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-pulse"
            >
              <div className="flex justify-between gap-3">
                <div className="space-y-2">
                  <div className="h-5 w-36 rounded-md bg-slate-300 dark:bg-slate-700" />
                  <div className="h-3 w-28 rounded-md bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-3">
                <div className="h-12 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
                <div className="h-12 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 p-8 text-center space-y-3">
          <AlertCircle className="w-9 h-9 text-rose-500 mx-auto" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Could not load attendance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{error}</p>
          <button
            onClick={() => void load()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-500/25 active:scale-95 transition-transform cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-2">
          <PieChart className="w-9 h-9 text-indigo-500 mx-auto opacity-60" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            No attendance recorded yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Attendance summaries will appear here after your first held class.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const overall = toPercentage(group.present, group.held);

            return (
              <div
                key={group.key}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                      {group.label}
                    </h2>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {group.present} of {group.held} lectures
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-2xl font-black ${getTextColor(overall)}`}>
                      {overall === null ? '—' : `${overall}%`}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Overall
                    </p>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getBarColor(overall)}`}
                    style={{ width: `${overall ?? 0}%` }}
                  />
                </div>

                <div className="space-y-4 pt-1">
                  {group.subjects.map((row, index) => {
                    const percentage = toPercentage(row.present, row.held);

                    return (
                      <div
                        key={`${group.key}-${row.subject_id ?? row.subject_name ?? 'general'}-${index}`}
                        className="space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {row.subject_name || 'General'}
                          </p>
                          <p className={`text-xs font-black shrink-0 ${getTextColor(percentage)}`}>
                            {percentage === null ? '—' : `${percentage}%`}
                          </p>
                        </div>

                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getBarColor(percentage)}`}
                            style={{ width: `${percentage ?? 0}%` }}
                          />
                        </div>

                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          {row.present} of {row.held}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
