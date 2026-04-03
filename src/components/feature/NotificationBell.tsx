import { useState, useRef, useEffect } from 'react';
import { useNotifications, type AppNotification } from '../../hooks/useNotifications';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function typeStyles(type: AppNotification['type']) {
  switch (type) {
    case 'success': return { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', dot: 'bg-emerald-500' };
    case 'warning': return { bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', dot: 'bg-amber-500' };
    case 'error': return { bg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600', dot: 'bg-red-500' };
    default: return { bg: 'bg-teal-50/50', iconBg: 'bg-teal-100', iconColor: 'text-teal-600', dot: 'bg-teal-500' };
  }
}

interface Props {
  /** Optional extra class on the trigger button wrapper */
  className?: string;
}

export default function NotificationBell({ className = '' }: Props) {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (n: AppNotification) => {
    if (!n.is_read) markRead(n.id);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        title="Notifications"
      >
        <div className="w-6 h-6 flex items-center justify-center">
          <i className={`text-xl ${unreadCount > 0 ? 'ri-notification-3-fill text-gray-700' : 'ri-notification-line'}`}></i>
        </div>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-12 w-[360px] bg-white rounded-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-900 text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer whitespace-nowrap"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="py-10 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center px-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="ri-notification-off-line text-2xl text-gray-400"></i>
                </div>
                <p className="text-sm font-semibold text-gray-600">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">New notifications will appear here in real time</p>
              </div>
            ) : (
              notifications.map((n) => {
                const styles = typeStyles(n.type);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer text-left border-b border-gray-50 last:border-0 ${!n.is_read ? styles.bg : ''}`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 ${!n.is_read ? styles.iconBg : 'bg-gray-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <i className={`${n.icon} text-lg ${!n.is_read ? styles.iconColor : 'text-gray-400'}`}></i>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold leading-snug ${!n.is_read ? 'text-gray-900' : 'text-gray-500'}`}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className={`w-2 h-2 ${styles.dot} rounded-full flex-shrink-0 mt-1`}></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-xs text-gray-400">{notifications.length} notifications loaded</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}