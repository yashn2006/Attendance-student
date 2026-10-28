import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveSession, getStudentActiveSessions } from '../lib/supabase';
import { X, QrCode, Clock, Sparkles, ChevronRight, User, RefreshCw, AlertCircle } from 'lucide-react';

interface SelectLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: ActiveSession) => void;
}

const POLL_INTERVAL_MS = 15000;

const endTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
});

function formatWindowEnd(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `ends ${endTimeFormatter.format(date)}`;
}

function windowEndMs(iso: string): number {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

export const SelectLectureModal: React.FC<SelectLectureModalProps> = ({
  isOpen,
  onClose,
  onSelectSession,
}) => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const loadSessions = useCallback(async (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getStudentActiveSessions();
      if (fetchError) {
        setError(fetchError.message || 'Failed to load live sessions.');
      } else {
        setSessions(data ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load live sessions.');
    } finally {
      if (showLoading) setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  // Tick every second so already-expired sessions drop out without a refetch.
  useEffect(() => {
    if (!isOpen) return;

    setNow(Date.now());
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [isOpen]);

  const visibleSessions = useMemo(
    () =>
      sessions
        .filter((session) => !(windowEndMs(session.window_end) <= now))
        .sort((a, b) => windowEndMs(a.window_end) - windowEndMs(b.window_end)),
    [sessions, now],
  );

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const run = async (showLoading: boolean) => {
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await getStudentActiveSessions();
        if (cancelled) return;
        if (fetchError) {
          setError(fetchError.message || 'Failed to load live sessions.');
        } else {
          setSessions(data ?? []);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load live sessions.');
      } finally {
        if (!cancelled) {
          if (showLoading) setLoading(false);
          setHasLoaded(true);
        }
      }
    };

    setHasLoaded(false);
    void run(true);

    const interval = window.setInterval(() => {
      void run(false);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const showInitialLoading = loading && !hasLoaded;
  const showError = Boolean(error) && !showInitialLoading;
  const showEmpty =
    !showInitialLoading && !error && hasLoaded && visibleSessions.length === 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transform-gpu"
        >
          {/* Top Notch Handle */}
          <div className="w-full flex justify-center pt-2.5 pb-1 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>

          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                <QrCode className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    Select Lecture to Scan
                  </h3>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Choose your class session to activate the QR scanner
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
              className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 dark:hover:bg-rose-500/35 hover:scale-105 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-xs"
              title="Close"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Body: Session Cards */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
              <span>Live sessions</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[10px]">
                {visibleSessions.length} SESSIONS OPEN
              </span>
            </div>

            {showInitialLoading && (
              <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
                <span className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Loading live sessions…
                </p>
              </div>
            )}

            {showError && (
              <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-300">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 max-w-xs">
                  {error}
                </p>
                <button
                  onClick={() => void loadSessions(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-500/25 active:scale-95 transition-transform cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {showEmpty && (
              <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 max-w-xs">
                  No live session right now. Ask your teacher to start one.
                </p>
                <button
                  onClick={() => void loadSessions(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-500/25 active:scale-95 transition-transform cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            )}

            {!showInitialLoading &&
              !showError &&
              visibleSessions.map((session) => {
                const windowEnd = formatWindowEnd(session.window_end);

                return (
                  <motion.div
                    key={session.session_id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectSession(session)}
                    className="p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {/* Status Indicator Stripe */}
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-indigo-600 dark:bg-indigo-400" />

                    <div className="pl-2 flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {session.class_section && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">
                              {session.class_section}
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800 animate-pulse">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Live Session
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {session.class_name}
                          {session.class_section ? ` • ${session.class_section}` : ''}
                        </h4>

                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs flex-wrap pt-0.5">
                          {windowEnd && (
                            <div className="flex items-center gap-1 font-mono text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{windowEnd}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[11px]">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{session.teacher_name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-center self-center w-8 h-8 rounded-xl bg-indigo-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                        <ChevronRight className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>

          {/* Footer Note */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tap any session to launch the high-speed camera QR & OTP scanner
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
