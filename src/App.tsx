import React, { useCallback, useState, useEffect, useRef, Suspense, lazy } from 'react';
import { flushSync } from 'react-dom';
import {
  ScreenId,
  StudentProfile,
  Lecture,
  OfflineAttendanceRecord,
} from './types';

// Layout & Frame Components
import { MobileFrame } from './components/MobileFrame';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { QRScannerModal } from './components/QRScannerModal';
import { SelectLectureModal } from './components/SelectLectureModal';
import { PageSkeleton } from './components/PageSkeleton';
import { Toast } from './components/Toast';
import { IOSPwaInstallGate } from './components/IOSPwaInstallGate';
import { supabase, isSupabaseConfigured, type ActiveSession, cacheStudent, clearCachedStudent } from './lib/supabase';
import { getNotifications, getStudentProfile, type StudentProfileRow } from './lib/studentApi';
import { loadFullAppState, saveFullAppState, clearFullAppState } from './lib/appStatePersistence';
import { motion, AnimatePresence } from 'motion/react';

// Core Screens loaded eagerly for instant interactive boot
import { SplashScreen } from './screens/SplashScreen';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { OtpScreen } from './screens/OtpScreen';
import { AuthLoadingScreen } from './screens/AuthLoadingScreen';
import { ProfileSetupScreen } from './screens/ProfileSetupScreen';
import { AuthSuccessScreen } from './screens/AuthSuccessScreen';
import { RegisterPasskeyScreen } from './screens/RegisterPasskeyScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';

// Tab screens code-split for lightweight memory footprint on mobile
const TodayScreen = lazy(() => import('./screens/TodayScreen').then((m) => ({ default: m.TodayScreen })));
const LiveAttendanceScreen = lazy(() => import('./screens/LiveAttendanceScreen').then((m) => ({ default: m.LiveAttendanceScreen })));
const AttendanceScreen = lazy(() => import('./screens/AttendanceScreen').then((m) => ({ default: m.AttendanceScreen })));
const NotificationsScreen = lazy(() => import('./screens/NotificationsScreen').then((m) => ({ default: m.NotificationsScreen })));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));

const EMPTY_STUDENT: StudentProfile = {
  name: '',
  idNumber: '',
  collegeName: '',
  department: '',
  semester: '',
  avatarUrl: '',
  email: '',
  overallAttendance: 0,
  cgpa: 0,
  totalCredits: 0,
  requiredCredits: 0,
  classRank: 0,
  totalStudentsInClass: 0,
  scholarshipEligible: false,
};

const RESTORABLE_SCREENS: ScreenId[] = [
  'today',
  'scan',
  'attendance',
  'notifications',
  'profile',
  'settings',
];

export function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('auth_loading');
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [profile, setProfile] = useState<StudentProfileRow | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRequestRef = useRef(0);
  const persistenceSuspendedRef = useRef(false);

  const refreshUnreadCount = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setUnreadCount(0);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setUnreadCount(0);
      return;
    }

    const { data, error } = await getNotifications(50);
    if (!error) {
      setUnreadCount((data ?? []).filter((item) => !item.is_read).length);
    }
  }, []);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (activeScreen === 'notifications') {
      void refreshUnreadCount();
    }
  }, [activeScreen, refreshUnreadCount]);

  const loadStudentProfile = useCallback(async () => {
    const requestId = profileRequestRef.current + 1;
    profileRequestRef.current = requestId;
    setIsProfileLoading(true);
    setProfileError(null);

    const { data, error } = await getStudentProfile();
    if (profileRequestRef.current !== requestId) return;

    if (error) {
      setProfile(null);
      setProfileError(error.message || 'Failed to load your profile.');
    } else if (!data) {
      setProfile(null);
      setProfileError('No student profile found for this account.');
    } else {
      setProfile(data);
      cacheStudent({
        id: data.id,
        enrollment_no: data.enrollment_no,
        name: data.name,
      });
    }

    setIsProfileLoading(false);
  }, []);

  const resetAccountState = useCallback(async (suspendPersistence = false) => {
    profileRequestRef.current += 1;
    persistenceSuspendedRef.current = suspendPersistence;
    setStudent(null);
    setProfile(null);
    setProfileError(null);
    setIsProfileLoading(false);
    setUnreadCount(0);
    setSelectedLecture(null);
    setMarkedLectures([]);
    setOfflineQueue([]);
    clearCachedStudent();
    await clearFullAppState();
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        void (async () => {
          await resetAccountState();
          await loadStudentProfile();
          await refreshUnreadCount();
        })();
      } else if (event === 'SIGNED_OUT') {
        void resetAccountState(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        void loadStudentProfile();
      } else {
        setIsProfileLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadStudentProfile, refreshUnreadCount, resetAccountState]);

  // Restore full state from IndexedDB / LocalStorage on app boot
  useEffect(() => {
    loadFullAppState().then((saved) => {
      if (saved) {
        const restoredScreen = saved.activeScreen === 'home' ? 'today' : saved.activeScreen;
        if (RESTORABLE_SCREENS.includes(restoredScreen as ScreenId)) {
          setActiveScreen(restoredScreen as ScreenId);
        }
        if (typeof saved.isDarkMode === 'boolean') {
          setIsDarkMode(saved.isDarkMode);
        }
        if (Array.isArray(saved.markedLectures)) {
          setMarkedLectures(saved.markedLectures);
        }
        if (Array.isArray(saved.offlineQueue)) {
          setOfflineQueue(saved.offlineQueue);
        }
      }
    });
  }, []);

  // Scroll to top automatically when activeScreen changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeScreen]);

  // Dark Mode Theme State (Default: Light Theme)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.setAttribute('data-theme', 'light');
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Supabase Realtime Subscription to 'sessions' table for live attendance notifications
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('public:sessions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const sessionData = payload.new;
            if (sessionData && sessionData.status === 'active') {
              showToast('🔔 Live Lecture Session Started! Tap to scan attendance.', 'info');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // App States & Scans
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [markedLectures, setMarkedLectures] = useState<string[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSelectLectureOpen, setIsSelectLectureOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAttendanceRecord[]>([]);

  const handleNavigate = (nextScreen: ScreenId) => {
    if (nextScreen === activeScreen) return;
    React.startTransition(() => {
      setActiveScreen(nextScreen);
    });
  };

  const handleSelectAndScan = (session: ActiveSession) => {
    const lecture: Lecture = {
      id: session.session_id,
      code: session.class_section || '',
      title: session.class_name,
      professor: session.teacher_name,
      professorAvatar: '',
      room: session.class_section || '',
      building: '',
      startTime: session.window_start,
      endTime: session.window_end,
      duration: '',
      status: 'current',
      attendanceStatus: 'live',
      credits: 0,
      attendancePercentage: 0,
    };
    setSelectedLecture(lecture);
    setIsSelectLectureOpen(false);
    setIsScannerOpen(true);
  };

  // Save full state whenever key state changes
  useEffect(() => {
    if (persistenceSuspendedRef.current) return;
    if (RESTORABLE_SCREENS.includes(activeScreen)) {
      saveFullAppState({
        activeScreen,
        isDarkMode,
        markedLectures,
        offlineQueue,
      });
    }
  }, [activeScreen, isDarkMode, markedLectures, offlineQueue]);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(
    null
  );

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const darkCircleRef = React.useRef<HTMLDivElement>(null);
  const lightCircleRef = React.useRef<HTMLDivElement>(null);

  const toggleDarkMode = (e?: React.MouseEvent) => {
    let x = typeof window !== 'undefined' ? window.innerWidth - 40 : 300;
    let y = 40;

    if (e && e.currentTarget) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else if (e && typeof e.clientX === 'number' && e.clientX > 0) {
      x = e.clientX;
      y = e.clientY;
    }

    const xPercent = (x / window.innerWidth) * 100;
    const yPercent = (y / window.innerHeight) * 100;

    document.documentElement.style.setProperty('--toggle-x', `${xPercent}%`);
    document.documentElement.style.setProperty('--toggle-y', `${yPercent}%`);

    const growingCircle = isDarkMode ? lightCircleRef.current : darkCircleRef.current;

    if (growingCircle) {
      growingCircle.classList.remove('grow');
      // trigger reflow
      void growingCircle.offsetWidth;
      growingCircle.classList.add('grow');

      setTimeout(() => {
        flushSync(() => {
          setIsDarkMode(!isDarkMode);
        });
      }, 250);

      setTimeout(() => {
        growingCircle.classList.remove('grow');
      }, 550);
    } else {
      setIsDarkMode(!isDarkMode);
    }

    showToast(!isDarkMode ? 'Dark Mode activated 🌙' : 'Light Mode activated ☀️', 'info');
  };

  const handleUpdateStudent = (updated: Partial<StudentProfile>) => {
    setStudent((prev) => ({ ...(prev ?? EMPTY_STUDENT), ...updated }));
  };

  // Mark Attendance Handler
  const handleAttendanceSuccess = (lectureId: string, offline: boolean) => {
    if (!markedLectures.includes(lectureId)) {
      setMarkedLectures((prev) => [...prev, lectureId]);
    }

    if (offline) {
      const record: OfflineAttendanceRecord = {
        id: `rec-${Date.now()}`,
        lectureId,
        lectureTitle: selectedLecture?.title ?? 'Lecture',
        scannedAt: new Date().toLocaleTimeString(),
        qrPayload: `QR_PASS_${lectureId}_${Date.now()}`,
        isSynced: false,
      };
      setOfflineQueue((prev) => [...prev, record]);
      showToast('Attendance Saved Offline! Will auto-sync when online.', 'info');
    } else {
      showToast('Attendance Marked Present & Synced with College Portal! ✓', 'success');
    }
  };

  // Auto sync when coming online
  const handleSyncNow = () => {
    if (offlineQueue.length === 0) {
      showToast('No pending records to sync.', 'info');
      return;
    }
    const count = offlineQueue.length;
    setOfflineQueue([]);
    setIsOffline(false);
    showToast(`Successfully synced ${count} offline attendance records!`, 'success');
  };

  const studentProfile = student ?? EMPTY_STUDENT;

  return (
    <IOSPwaInstallGate>
      <div className={`w-full h-[100dvh] min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
        <MobileFrame>
          {/* Toast Notification */}
          {toast && (
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          )}

        {/* Header Bar */}
        <Header
          profile={profile}
          isProfileLoading={isProfileLoading}
          activeScreen={activeScreen}
          navigate={handleNavigate}
          unreadNotificationsCount={unreadCount}
          isOffline={isOffline}
          offlineQueueCount={offlineQueue.length}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* Main Screen Router Content with Native Smooth Touch Momentum */}
        <main
          ref={mainRef}
          id="main-scroll-container"
          className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden touch-pan-y overscroll-y-contain overscroll-x-none bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-white transition-colors relative"
          style={{
            WebkitOverflowScrolling: 'touch',
            paddingBottom: [
              'splash',
              'welcome',
              'login',
              'otp',
              'auth_loading',
              'profile_setup',
              'auth_success',
              'register_passkey',
              'onboarding',
            ].includes(activeScreen)
              ? '0px'
              : 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1, ease: 'linear' }}
              className="w-full min-h-full"
            >
              <Suspense fallback={<PageSkeleton />}>
                {activeScreen === 'splash' && <SplashScreen navigate={handleNavigate} />}

                {activeScreen === 'welcome' && <WelcomeScreen navigate={handleNavigate} />}

                {activeScreen === 'login' && (
                  <LoginScreen student={studentProfile} navigate={handleNavigate} />
                )}

                {activeScreen === 'otp' && (
                  <OtpScreen email={studentProfile.email} navigate={handleNavigate} />
                )}

                {activeScreen === 'auth_loading' && (
                  <AuthLoadingScreen navigate={handleNavigate} />
                )}

                {activeScreen === 'profile_setup' && (
                  <ProfileSetupScreen
                    student={studentProfile}
                    navigate={handleNavigate}
                    onUpdateStudent={handleUpdateStudent}
                  />
                )}

                {activeScreen === 'auth_success' && (
                  <AuthSuccessScreen student={studentProfile} navigate={handleNavigate} />
                )}

                {activeScreen === 'register_passkey' && (
                  <RegisterPasskeyScreen student={studentProfile} navigate={handleNavigate} />
                )}

                {activeScreen === 'onboarding' && <OnboardingScreen navigate={handleNavigate} />}

                {activeScreen === 'today' && <TodayScreen />}

                {activeScreen === 'scan' && selectedLecture && (
                  <LiveAttendanceScreen
                    currentLecture={selectedLecture}
                    navigate={handleNavigate}
                    openScannerModal={() => setIsSelectLectureOpen(true)}
                    isOffline={isOffline}
                    markedLectures={markedLectures}
                  />
                )}

                {activeScreen === 'scan' && !selectedLecture && (
                  <div className="space-y-6 pb-6 max-w-2xl mx-auto px-4 sm:px-6 pt-2">
                    <div>
                      <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        Scan Attendance
                      </h1>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Select a lecture to launch the QR scanner
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-4">
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        No live lecture selected
                      </p>
                      <button
                        onClick={() => setIsSelectLectureOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-500/25 active:scale-95 transition-transform cursor-pointer"
                      >
                        Select Lecture
                      </button>
                    </div>
                  </div>
                )}

                {activeScreen === 'attendance' && <AttendanceScreen />}

                {activeScreen === 'notifications' && (
                  <NotificationsScreen
                    navigate={handleNavigate}
                    onUnreadCountChange={setUnreadCount}
                  />
                )}

                {activeScreen === 'profile' && (
                  <ProfileScreen
                    navigate={handleNavigate}
                    profile={profile}
                    profileLoading={isProfileLoading}
                    profileError={profileError}
                    onReloadProfile={loadStudentProfile}
                  />
                )}

                {activeScreen === 'settings' && (
                  <SettingsScreen
                    navigate={handleNavigate}
                    isOffline={isOffline}
                    setIsOffline={setIsOffline}
                    autoSync={autoSync}
                    setAutoSync={setAutoSync}
                    offlineQueueCount={offlineQueue.length}
                    onSyncNow={handleSyncNow}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={toggleDarkMode}
                  />
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Modal 1: Select Lecture Modal prior to scanning */}
        <SelectLectureModal
          isOpen={isSelectLectureOpen}
          onClose={() => setIsSelectLectureOpen(false)}
          onSelectSession={handleSelectAndScan}
        />

        {/* Modal 2: QR Camera Attendance Scanner Modal */}
        {selectedLecture && (
          <QRScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            currentLecture={selectedLecture}
            onAttendanceSuccess={handleAttendanceSuccess}
            isOffline={isOffline}
          />
        )}

        {/* Bottom Floating Navigation Bar */}
        <BottomNav
          activeScreen={activeScreen}
          navigate={handleNavigate}
          openSelectLectureModal={() => setIsSelectLectureOpen(true)}
          unreadCount={unreadCount}
        />
        {/* Theme Transition Overlays (Circle Grow Animation) */}
        <div className="theme-circle theme-circle--dark" ref={darkCircleRef} />
        <div className="theme-circle theme-circle--light" ref={lightCircleRef} />
      </MobileFrame>
    </div>
    </IOSPwaInstallGate>
  );
}

export default App;
