import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import UserAvatar from '../../../components/feature/UserAvatar';
import type { MarkAlert } from '../../../hooks/useDeanAlerts';

interface HeaderProps {
  onMenuClick?: () => void;
  alerts?: MarkAlert[];
  unreadCount?: number;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNavigateToVerification?: () => void;
}

function timeAgo(dateStr: string) {
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

export default function Header({
  onMenuClick,
  alerts = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateToVerification,
}: HeaderProps) {
  const { profile, signOut, getInitials } = useAuth();
  const [showProfile, setShowProfile]     = useState(false);
  const [showAlerts,  setShowAlerts]      = useState(false);
  const alertRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.full_name || 'Dean';
  const initials    = profile ? getInitials(profile.full_name) : 'D';

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setShowAlerts(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAlertClick = (alert: MarkAlert) => {
    if (!alert.read_at) onMarkAsRead?.(alert.id);
    setShowAlerts(false);
    onNavigateToVerification?.();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex-shrink-0 z-20 relative">
      <div className="flex items-center justify-between">

        {/* Left: hamburger + title */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button onClick={onMenuClick}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
              <i className="ri-menu-line text-xl w-5 h-5 flex items-center justify-center"></i>
            </button>
          )}
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">
              Welcome Back, {displayName.split(' ')[0]}
            </h1>
            <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
              Oversee academic progress and approve marks
            </p>
          </div>
        </div>

        {/* Right: alerts bell + profile */}
        <div className="flex items-center gap-2 md:gap-4">

          {/* ── Notification Bell ── */}
          <div ref={alertRef} className="relative">
            <button
              onClick={() => { setShowAlerts(v => !v); setShowProfile(false); }}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Marks re-submission alerts"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <i className="ri-notification-line text-2xl"></i>
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Alerts Dropdown */}
            {showAlerts && (
              <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl border border-gray-200 z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-sm">Marks Re-submissions</h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => { onMarkAllAsRead?.(); }}
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer whitespace-nowrap"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Alert list */}
                <div className="max-h-80 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="py-10 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i className="ri-notification-off-line text-2xl text-gray-400"></i>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">No alerts yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        You&apos;ll be notified when a teacher re-submits returned marks
                      </p>
                    </div>
                  ) : (
                    alerts.map(alert => (
                      <button
                        key={alert.id}
                        onClick={() => handleAlertClick(alert)}
                        className={`w-full flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer text-left border-b border-gray-50 last:border-0 ${
                          !alert.read_at ? 'bg-teal-50/40' : ''
                        }`}
                      >
                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          !alert.read_at ? 'bg-teal-100' : 'bg-gray-100'
                        }`}>
                          <i className={`ri-refresh-line text-lg ${!alert.read_at ? 'text-teal-600' : 'text-gray-400'}`}></i>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-semibold leading-tight ${!alert.read_at ? 'text-gray-900' : 'text-gray-600'}`}>
                              {alert.teacher_name || 'A teacher'} re-submitted marks
                            </p>
                            {!alert.read_at && (
                              <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {alert.subject_name} · {alert.class_name} · {alert.term_name}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span><i className="ri-group-line mr-1"></i>{alert.student_count} students</span>
                            <span>{timeAgo(alert.created_at)}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                {alerts.length > 0 && (
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={() => { setShowAlerts(false); onNavigateToVerification?.(); }}
                      className="w-full text-center text-sm text-teal-600 hover:text-teal-700 font-semibold cursor-pointer whitespace-nowrap"
                    >
                      Go to Marks Verification <i className="ri-arrow-right-line"></i>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative flex items-center gap-3 pl-2 md:pl-4 border-l border-gray-200">
            <button
              onClick={() => { setShowProfile(v => !v); setShowAlerts(false); }}
              className="flex items-center gap-2 md:gap-3 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors cursor-pointer"
            >
              <UserAvatar avatarUrl={profile?.avatar_url} initials={initials} sizeClass="w-9 h-9 md:w-10 md:h-10" gradientClass="from-teal-500 to-emerald-600" shape="full" />
              <div className="text-left hidden sm:block">
                <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                <div className="text-xs text-gray-500">{profile?.email || 'Dean of Studies'}</div>
              </div>
              <i className="ri-arrow-down-s-line text-gray-400 text-sm hidden sm:block" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-14 w-52 bg-white rounded-xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{profile?.email}</div>
                </div>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button onClick={signOut}
                    className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer whitespace-nowrap">
                    <i className="ri-logout-box-line text-base" />Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
