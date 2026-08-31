import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ScreenId, StudentProfile } from '../types';
import {
  getCachedStudent,
  getStudentByUserId,
  supabase,
  getWebAuthnRegisterOptions,
  registerOptionsToCredentialCreationOptions,
  publicKeyCredentialToRegistration,
  verifyWebAuthnRegistration,
} from '../lib/supabase';
import {
  ShieldCheck,
  Smartphone,
  Fingerprint,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface RegisterPasskeyScreenProps {
  student: StudentProfile;
  navigate: (screen: ScreenId) => void;
}

type Stage = 'idle' | 'registering' | 'success' | 'error';

export const RegisterPasskeyScreen: React.FC<RegisterPasskeyScreenProps> = ({
  student,
  navigate,
}) => {
  const [stage, setStage] = useState<Stage>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const resolveStudentId = useCallback(async (): Promise<string | null> => {
    const cached = getCachedStudent();
    if (cached?.id) return cached.id;

    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: row } = await getStudentByUserId(data.user.id);
      if (row?.id) return row.id;
    }
    return null;
  }, []);

  const handleRegister = useCallback(async () => {
    if (stage === 'registering') return;
    setErrorMessage('');
    setStage('registering');

    try {
      const studentId = await resolveStudentId();
      if (!studentId) {
        setErrorMessage('You are not signed in. Please log in again.');
        setStage('error');
        return;
      }

      // 1. Fetch a registration challenge from the server.
      const optionsResult = await getWebAuthnRegisterOptions(studentId);
      if (optionsResult.error || !optionsResult.data) {
        setErrorMessage(optionsResult.error || 'Could not load registration options.');
        setStage('error');
        return;
      }

      // 2. Run the credential creation ceremony on the device.
      let credential: Credential | null = null;
      try {
        const creationOptions = registerOptionsToCredentialCreationOptions(optionsResult.data);
        credential = await navigator.credentials.create({ publicKey: creationOptions });
      } catch {
        setErrorMessage('Device registration was cancelled or is not supported on this device.');
        setStage('error');
        return;
      }

      if (!credential) {
        setErrorMessage('No credential was returned by your device.');
        setStage('error');
        return;
      }

      // 3. Verify the credential with the server.
      const verification = await verifyWebAuthnRegistration(
        studentId,
        publicKeyCredentialToRegistration(credential),
      );
      if (verification.error) {
        setErrorMessage(verification.error);
        setStage('error');
        return;
      }

      setStage('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Device registration failed.');
      setStage('error');
    }
  }, [resolveStudentId, stage]);

  return (
    <div
      className="w-full min-h-full bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-white flex flex-col justify-between items-center px-5 font-sans relative overflow-y-auto"
      style={{
        paddingTop: 'max(1.25rem, calc(env(safe-area-inset-top, 0px) + 12px))',
        paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 12px))',
      }}
    >
      {/* Background Soft Aurora Light Gradients */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-200/40 dark:bg-indigo-950/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-200/40 dark:bg-cyan-950/30 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-sm mx-auto flex justify-between items-center z-10">
        <span className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-[10px] font-extrabold border border-indigo-200 dark:border-indigo-800 shadow-2xs">
          One-Time Setup
        </span>
        <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 stroke-[2.3]" /> Device Binding
        </span>
      </div>

      {/* Main Container */}
      <div className="my-auto max-w-sm w-full mx-auto space-y-6 z-10 py-4">
        {/* Hero Illustration */}
        <div className="flex flex-col items-center text-center space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] p-0.5 shadow-[0_16px_40px_rgba(99,102,241,0.35)]"
          >
            <div className="w-full h-full bg-white dark:bg-[#0D1527] rounded-[22px] flex items-center justify-center">
              {stage === 'success' ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-500 stroke-[2.2]" />
              ) : stage === 'registering' ? (
                <Loader2 className="w-10 h-10 text-indigo-500 stroke-[2.2] animate-spin" />
              ) : (
                <Fingerprint className="w-10 h-10 text-indigo-500 stroke-[2] animate-pulse" />
              )}
            </div>
          </motion.div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-[#0F172A] dark:text-white">
              {stage === 'success' ? 'Device Bound' : 'Register Your Device'}
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-300 font-medium leading-relaxed max-w-xs">
              {stage === 'success'
                ? 'Your device is now verified with your campus identity. You can check in to lectures.'
                : `To verify your attendance, ${student.name || 'Student'}, this app binds your device using a secure passkey. Your screen lock (face, fingerprint, or PIN) confirms it's really you — nothing biometric is ever uploaded.`}
            </p>
          </div>
        </div>

        {/* Info Card */}
        {stage !== 'success' && (
          <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xs space-y-2">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                A hardware-bound passkey proves this exact device is authorised to mark
                attendance — preventing proxy/remote check-ins.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Only a cryptographic public key is stored. Your face, fingerprint, or PIN
                never leaves this device.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {stage === 'error' && (
          <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/50 p-3 rounded-2xl border border-rose-200 dark:border-rose-800 font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button */}
        {stage === 'success' ? (
          <button
            onClick={() => navigate('home')}
            className="w-full h-13 min-h-[50px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-95 text-white font-bold rounded-2xl text-xs sm:text-sm tracking-wide shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer"
          >
            <span>Continue to Dashboard</span>
            <ArrowRight className="w-4 h-4 stroke-[2.2]" />
          </button>
        ) : (
          <button
            onClick={handleRegister}
            disabled={stage === 'registering'}
            className="w-full h-13 min-h-[50px] bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] hover:opacity-95 disabled:opacity-60 text-white font-bold rounded-2xl text-xs sm:text-sm tracking-wide shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer"
          >
            {stage === 'registering' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering device...</span>
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                <span>Register This Device</span>
              </>
            )}
          </button>
        )}

        {/* Skip Link */}
        {stage !== 'success' && (
          <div className="flex justify-center">
            <button
              onClick={() => navigate('home')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Skip for now &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 text-center z-10 max-w-sm mx-auto w-full">
        <p className="text-[11px] text-slate-400 font-medium">
          SIES College of Arts, Science & Commerce • Student Portal v2.4
        </p>
      </div>
    </div>
  );
};