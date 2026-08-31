import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ScreenId, StudentProfile } from '../types';
import {
  signInStudent,
  getStudentByUserId,
  cacheStudent,
  isSupabaseConfigured,
} from '../lib/supabase';
import {
  QrCode,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Lock,
  Sparkles,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface LoginScreenProps {
  student: StudentProfile;
  navigate: (screen: ScreenId) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ student, navigate }) => {
  const [studentId, setStudentId] = useState(student.idNumber || '');
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning 👋';
    if (hour < 18) return 'Good Afternoon 👋';
    return 'Good Evening 👋';
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const enrollmentNo = studentId.trim();
    if (!enrollmentNo || !password) return;

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      if (!isSupabaseConfigured) {
        setErrorMessage('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
        return;
      }

      const { data: authData, error: authError } = await signInStudent(enrollmentNo, password);
      if (authError || !authData.user) {
        setErrorMessage(
          authError?.message?.toLowerCase().includes('invalid')
            ? 'Enrollment number or password is incorrect.'
            : authError?.message || 'Sign-in failed.',
        );
        return;
      }

      const { data: studentRow, error: studentErr } = await getStudentByUserId(authData.user.id);
      if (studentErr || !studentRow) {
        setErrorMessage('Account not linked to a student record. Contact your teacher.');
        return;
      }

      cacheStudent({
        id: studentRow.id,
        enrollment_no: studentRow.enrollment_no,
        name: studentRow.name,
      });

      navigate('home');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full min-h-full bg-[#F8FAFC] dark:bg-[#070B14] text-[#0F172A] dark:text-white flex flex-col px-4 sm:px-5 py-4 selection:bg-indigo-500 overflow-y-auto font-sans relative"
      style={{
        paddingTop: 'max(1rem, calc(env(safe-area-inset-top, 0px) + 8px))',
        paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 8px))',
      }}
    >
      {/* Background Subtle Gradient Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row (Safe from status bar) */}
      <div className="w-full flex justify-between items-center z-10 max-w-sm mx-auto shrink-0 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] text-white flex items-center justify-center font-black text-xs shadow-xs">
            OS
          </div>
          <span className="text-sm font-black tracking-tight text-[#0F172A] dark:text-white">
            Campus OS
          </span>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          SYSTEM ONLINE
        </span>
      </div>

      {/* Main Login Workspace Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center z-10 space-y-5 py-2"
      >
        {/* Welcome Section */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-[28px] font-black text-[#0F172A] dark:text-white tracking-tight">
            {getGreeting()}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
            Welcome to Campus OS
          </p>
        </div>

        {/* Minimal Student ID Card Illustration */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}
          className="relative bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 border border-indigo-500/30 shadow-[0_16px_36px_-8px_rgba(99,102,241,0.25)] overflow-hidden"
        >
          {/* Card Glass Sheen Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

          <div className="flex justify-between items-start z-10 relative">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] text-white font-black text-xs flex items-center justify-center ring-2 ring-white/30 shadow-xs">
                SP
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight text-white leading-tight">
                  {student.name || 'Saad Parkar'}
                </h4>
                <p className="text-[11px] font-semibold text-indigo-200 mt-0.5">
                  {student.department || 'B.Sc. Computer Science'}
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[9px] font-black tracking-widest uppercase">
              STUDENT ID
            </span>
          </div>

          <div className="mt-5 pt-3 border-t border-indigo-500/20 flex justify-between items-center z-10 relative">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-300" />
              <span className="font-mono text-xs font-bold tracking-widest text-white">
                {studentId || 'STU-2026-8894'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-300">
              <QrCode className="w-4 h-4 text-cyan-300" />
              <span>NFC Pass</span>
            </div>
          </div>
        </motion.div>

        {/* Login Form: Student ID */}
        <form onSubmit={handleContinue} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[#0F172A] dark:text-slate-200 tracking-tight flex items-center justify-between">
              <span>Enter Student ID / Enrollment No</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                SIES Portal Sync
              </span>
            </label>

            {/* Input Field with Animated Focus State */}
            <div
              className={`relative flex items-center rounded-2xl bg-white dark:bg-slate-900 border-2 transition-all duration-200 ${
                isFocused
                  ? 'border-[#6366F1] shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="pl-4 pr-2 text-slate-400">
                <Lock className={`w-5 h-5 transition-colors ${isFocused ? 'text-[#6366F1]' : ''}`} />
              </div>

              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="e.g. STU-2026-8894"
                className="w-full py-3.5 pr-4 bg-transparent text-sm font-extrabold tracking-wider text-[#0F172A] dark:text-white placeholder:text-slate-400 focus:outline-none uppercase"
                required
              />

              {studentId && (
                <button
                  type="button"
                  onClick={() => setStudentId('')}
                  className="pr-4 text-xs font-extrabold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pl-1">
              Sign in with the enrollment number issued by your teacher.
            </p>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[#0F172A] dark:text-slate-200 tracking-tight">
              Temporary Password
            </label>
            <div
              className={`relative flex items-center rounded-2xl bg-white dark:bg-slate-900 border-2 transition-all duration-200 ${
                isPasswordFocused
                  ? 'border-[#6366F1] shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="pl-4 pr-2 text-slate-400">
                <Lock className={`w-5 h-5 transition-colors ${isPasswordFocused ? 'text-[#6366F1]' : ''}`} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full py-3.5 pr-4 bg-transparent text-sm font-extrabold tracking-wider text-[#0F172A] dark:text-white placeholder:text-slate-400 focus:outline-none"
                required
              />
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-2xl border border-rose-200 dark:border-rose-800 font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Large Glass / Gradient Continue Button */}
          <button
            type="submit"
            disabled={!studentId.trim() || !password || isSubmitting}
            className={`w-full h-13 min-h-[50px] rounded-2xl font-black text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.97] active:opacity-90 relative overflow-hidden ${
              studentId.trim() && password
                ? 'bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] shadow-indigo-500/30'
                : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4.5 h-4.5 stroke-[2.3]" />
              </>
            )}
          </button>
        </form>

        {/* Enrollment is set up by your teacher via the create-student flow. */}
        <div className="pt-1 flex items-center justify-center">
          <p className="px-4 py-2.5 min-h-[44px] text-center flex items-center gap-2 text-xs font-bold text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Credentials are issued by your teacher.</span>
          </p>
        </div>
      </motion.div>

      {/* Footer Info */}
      <div className="pt-2 text-center z-10 max-w-sm mx-auto w-full">
        <p className="text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
          <span>Encrypted Student Auth • SIES College Campus OS</span>
        </p>
      </div>
    </div>
  );
};
