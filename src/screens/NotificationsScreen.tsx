import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Bell, CheckCheck, RefreshCw, User } from 'lucide-react';
import { ScreenId } from '../types';
import {
  getNotifications,
  markNotificationsRead,
  type NotificationRow,
} from '../lib/studentApi';

interface NotificationsScreenProps {
  navigate: (screen: ScreenId) => void;
  onUnreadCountChange?: (count: number) => void;
}

const getKolkataDateKey = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
};

const formatRelativeTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMinutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const dateKey = getKolkataDateKey(date);
  const todayKey = getKolkataDateKey(now);

  if (dateKey === todayKey) {
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
  }

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (dateKey === getKolkataDateKey(yesterday)) return 'Yesterday';

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
};

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  navigate,
  onUnreadCountChange,
}) => {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [markError, setMarkError] = useState<{ message: string; ids: string[] } | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const { data, error } = await getNotifications();

    if (error) {
      setLoadError(error.message || 'Failed to load notifications.');
      setItems([]);
    } else {
      const rows = [...(data ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setItems(rows);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    onUnreadCountChange?.(items.filter((item) => !item.is_read).length);
  }, [items, onUnreadCountChange]);

  const setReadState = (ids: string[], isRead: boolean) => {
    const idSet = new Set(ids);
    setItems((prev) =>
      prev.map((item) => (idSet.has(item.id) ? { ...item, is_read: isRead } : item)),
    );
  };

  const markRead = async (ids: string[]) => {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return;

    setMarkError(null);
    setReadState(uniqueIds, true);

    const { error } = await markNotificationsRead(uniqueIds);

    if (error) {
      setReadState(uniqueIds, false);
      setMarkError({
        message: error.message || 'Could not mark notifications as read.',
        ids: uniqueIds,
      });
    }
  };

  const unreadCount = items.filter((item) => !item.is_read).length;

  const handleMarkAll = async () => {
    const unreadIds = items.filter((item) => !item.is_read).map((item) => item.id);
    if (unreadIds.length === 0) return;

    setMarkingAll(true);
    try {
      await markRead(unreadIds);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-5 pb-6 max-w-2xl mx-auto px-4 sm:px-6 pt-2">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('today')}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Notifications
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>

        <button
          onClick={() => void handleMarkAll()}
          disabled={unreadCount === 0 || markingAll}
          className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:no-underline disabled:cursor-default shrink-0"
        >
          <CheckCheck className={`w-4 h-4 ${markingAll ? 'animate-pulse' : ''}`} />
          <span>Mark all as read</span>
        </button>
      </div>

      {markError && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-xs font-bold text-rose-700 dark:text-rose-300 truncate">
              {markError.message}
            </p>
          </div>
          <button
            onClick={() => void markRead(markError.ids)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-[11px] font-black active:scale-95 transition-transform cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 space-y-3 animate-pulse"
            >
              <div className="flex justify-between gap-3">
                <div className="h-3 w-24 rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-16 rounded-md bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-4 w-48 rounded-md bg-slate-300 dark:bg-slate-700" />
              <div className="h-3 w-full rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-2/3 rounded-md bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 p-8 text-center space-y-3">
          <AlertCircle className="w-9 h-9 text-rose-500 mx-auto" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Could not load notifications
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{loadError}</p>
          <button
            onClick={() => void load()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-500/25 active:scale-95 transition-transform cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-2">
          <Bell className="w-9 h-9 text-indigo-500 mx-auto opacity-60" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">No notifications yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Updates from your teachers will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isUnread = item.is_read === false;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (isUnread) void markRead([item.id]);
                }}
                className={`w-full text-left p-4.5 rounded-2xl border shadow-2xs transition-all ${
                  isUnread
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                } ${isUnread ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 min-w-0">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.sender_name || 'Teacher'}</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                    {formatRelativeTime(item.created_at)}
                  </span>
                </div>

                <div className="mt-2 flex items-start gap-2">
                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  )}
                  <h3
                    className={`text-[15px] leading-snug ${
                      isUnread
                        ? 'font-black text-slate-900 dark:text-white'
                        : 'font-bold text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {item.title}
                  </h3>
                </div>

                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                  {item.body}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
