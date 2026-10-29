import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react';
import { ScreenId } from '../types';
import { clearCachedStudent, supabase } from '../lib/supabase';
import type { StudentProfileRow } from '../lib/studentApi';
import { clearFullAppState } from '../lib/appStatePersistence';
import { formatSessionEndTime, useLiveSessionLock } from '../lib/liveSessions';

interface ProfileScreenProps {
  navigate: (screen: ScreenId) => void;
  profile: StudentProfileRow | null;
  profileLoading: boolean;
  profileError: string | null;
  onReloadProfile: () => Promise<void>;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  navigate,
  profile,
  profileLoading,
  profileError,
  onReloadProfile,
}) => {
  const [loggingOut, setLoggingOut] = useState(false);
  const { isLocked, lockedUntil } = useLiveSessionLock();

  const handleLogout = async () => {
    if (isLocked || loggingOut) return;

    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch {
      /* still clear local state and leave */
    } finally {
      clearCachedStudent();
      await clearFullAppState();
      setLoggingOut(false);
      navigate('welcome');
    }
  };

  const classNames =
    profile?.class_names && profile.class_names.length > 0
      ? profile.class_names.join(', ')
      : 'Not assigned';

  const initials = (profile?.name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const lockedUntilTime = lockedUntil ? formatSessionEndTime(lockedUntil) : '';

  return (
    <div className="space-y-5 pb-6 max-w-2xl mx-auto px-4 sm:px-6 pt-2">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('today')}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-transform active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Student Profile
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Official academic identity
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('settings')}
          title="Settings"
          aria-label="Settings"
          className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-transform active:scale-95 shrink-0"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {profileLoading ? (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-2">
                <div className="h-5 w-40 rounded-md bg-slate-300 dark:bg-slate-700" />
                <div className="h-3 w-28 rounded-md bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
            <div className="h-12 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
            <div className="h-12 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
          </div>
        </div>
      ) : profileError ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 p-8 text-center space-y-3">
          <AlertCircle className="w-9 h-9 text-rose-500 mx-auto" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Could not load your profile
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{profileError}</p>
          <button
            onClick={() => void onReloadProfile()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-500/25 active:scale-95 transition-transform cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : profile ? (
        <>
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[32px] p-6 shadow-2xl border border-indigo-500/30 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-2xl shadow-xl ring-2 ring-white/20 shrink-0">
                {initials}
              </div>

              <div className="space-y-1.5 min-w-0">
                <h2 className="text-2xl font-black tracking-tight text-white truncate">
                  {profile.name}
                </h2>
                <p className="text-xs font-extrabold text-indigo-300 flex items-center justify-center sm:justify-start gap-2">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>{profile.enrollment_no}</span>
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Campus OS student account
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-4 h-4" />
              <span>Student Details</span>
            </h3>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Email
              </span>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{profile.email || 'Not set'}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Classes
              </span>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span>{classNames}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Device passkey
                  </span>
                </div>
                <span
                  className={`flex items-center gap-1 text-[11px] font-black shrink-0 ${
                    profile.webauthn_registered
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {profile.webauthn_registered ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  {profile.webauthn_registered ? 'Registered' : 'Not registered'}
                </span>
              </div>

              {!profile.webauthn_registered && (
                <button
                  onClick={() => navigate('register_passkey')}
                  className="w-full mt-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Register this device</span>
                </button>
              )}
            </div>
          </div>
        </>
      ) : null}

      <button
        onClick={() => void handleLogout()}
        disabled={loggingOut || isLocked}
        className="w-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all border border-rose-200 dark:border-rose-900/50 cursor-pointer shadow-2xs active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLocked ? <Lock className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
        <span>{loggingOut ? 'Signing out...' : 'Log Out of Campus OS'}</span>
      </button>

      {isLocked && lockedUntilTime && (
        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 text-center leading-relaxed">
          Logout is locked while a class session is live (until {lockedUntilTime})
        </p>
      )}
    </div>
  );
};
