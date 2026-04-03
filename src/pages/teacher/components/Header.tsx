import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import NotificationBell from '../../../components/feature/NotificationBell';
import UserAvatar from '../../../components/feature/UserAvatar';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { profile, signOut, getInitials } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  const displayName = profile?.full_name || 'Teacher';
  const initials = profile ? getInitials(profile.full_name) : 'T';

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-menu-line text-xl w-5 h-5 flex items-center justify-center"></i>
            </button>
          )}
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">Welcome Back, {displayName.split(' ')[0]}</h1>
            <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Here is your schedule and class overview for today</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <i className="ri-mail-line text-2xl w-6 h-6 flex items-center justify-center"></i>
          </button>

          <div className="relative flex items-center gap-3 pl-4 border-l border-gray-200">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors cursor-pointer"
            >
              <UserAvatar
                avatarUrl={profile?.avatar_url}
                initials={initials}
                sizeClass="w-10 h-10"
                gradientClass="from-sky-500 to-cyan-600"
                shape="full"
              />              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                <div className="text-xs text-gray-500">{profile?.email || 'Teacher'}</div>
              </div>
              <i className="ri-arrow-down-s-line text-gray-400 text-sm" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-14 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{profile?.email}</div>
                </div>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={signOut}
                    className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-logout-box-line text-base" />
                    Sign Out
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
