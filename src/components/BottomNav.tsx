import React from 'react';
import { motion } from 'motion/react';
import { ScreenId } from '../types';
import { CalendarDays, ScanLine, PieChart, Bell, User } from 'lucide-react';

interface BottomNavProps {
  activeScreen: ScreenId;
  navigate: (screen: ScreenId) => void;
  openSelectLectureModal: () => void;
  unreadCount?: number;
}

const AUTH_SCREENS: ScreenId[] = [
  'splash',
  'welcome',
  'login',
  'otp',
  'auth_loading',
  'profile_setup',
  'auth_success',
  'register_passkey',
  'onboarding',
];

export const BottomNav: React.FC<BottomNavProps> = React.memo(({
  activeScreen,
  navigate,
  openSelectLectureModal,
  unreadCount = 0,
}) => {
  if (AUTH_SCREENS.includes(activeScreen)) {
    return null;
  }

  const navItems = [
    {
      id: 'today' as ScreenId,
      label: 'Today',
      icon: CalendarDays,
      onClick: () => navigate('today'),
    },
    {
      id: 'scan' as ScreenId,
      label: 'Scan',
      icon: ScanLine,
      onClick: () => {
        navigate('scan');
        openSelectLectureModal();
      },
    },
    {
      id: 'attendance' as ScreenId,
      label: 'Attendance',
      icon: PieChart,
      onClick: () => navigate('attendance'),
    },
    {
      id: 'notifications' as ScreenId,
      label: 'Notifications',
      icon: Bell,
      onClick: () => navigate('notifications'),
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'profile' as ScreenId,
      label: 'Profile',
      icon: User,
      onClick: () => navigate('profile'),
    },
  ];

  return (
    <nav
      id="bottom-navbar"
      aria-label="Main Navigation"
      className="bottom-nav fixed bottom-0 left-0 right-0 w-full z-50 select-none border-t border-slate-200/90 dark:border-slate-800/90 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] transition-colors duration-300"
      style={{
        height: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'var(--bg-primary)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        margin: 0,
      }}
    >
      <div className="w-full sm:max-w-md mx-auto h-[60px] flex items-center justify-around px-2 sm:px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.92 }}
              onClick={item.onClick}
              aria-label={item.label}
              className={`relative flex flex-col items-center justify-center py-1 min-w-[52px] sm:min-w-[60px] min-h-[44px] group transition-colors cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5.5 h-5.5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[2] group-hover:scale-105'
                  }`}
                />
                {item.badge ? (
                  <span className="absolute -top-1 -right-2 min-w-4.5 h-4.5 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs">
                    {item.badge}
                  </span>
                ) : null}

                {isActive && (
                  <motion.div
                    layoutId="activeNavDot"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-xs shadow-indigo-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
              </div>
              <span
                className={`text-[11px] tracking-tight font-bold mt-0.5 transition-all whitespace-nowrap ${
                  isActive ? 'font-black opacity-100' : 'opacity-75 group-hover:opacity-100'
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
});
