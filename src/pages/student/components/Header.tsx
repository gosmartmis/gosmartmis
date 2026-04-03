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

  const displayName = profile?.full_name || 'Student';
  const initials = profile ? getInitials(profile.full_name) : 'S';

  return (
    <header className="bg-white border-b border-gray-200 px-3 md:px-6 lg:px-8 py-3 md:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer flex-shrink-0"
            >
              <i className="ri-menu-line text-xl w-5 h-5 flex items-center justify-center"></i>
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 truncate">Welcome back, {displayName.split(' ')[0]}!</h2>
            <p className="text-xs md:text-sm text-gray-600 hidden sm:block truncate">Here&apos;s your academic overview</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <NotificationBell />

          <div className="relative flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-200">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-1.5 md:gap-3 hover:bg-gray-50 rounded-lg px-1 md:px-2 py-1 transition-colors cursor-pointer"
            >
              <UserAvatar
                avatarUrl={profile?.avatar_url}
                initials={initials}
                sizeClass="w-9 h-9 md:w-10 md:h-10"
                gradientClass="from-green-500 to-lime-600"
                shape="xl"
              />
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{displayName}</p>
                <p className="text-xs text-gray-600">Student</p>
              </div>
              <i className="ri-arrow-down-s-line text-gray-400 text-sm hidden md:block" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 md:top-14 w-52 bg-white rounded-xl border border-gray-200 py-2 z-50" style={{boxShadow:'0 4px 24px rgba(0,0,0,0.10)'}}>
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-semibold text-gray-900 truncate">{displayName}</div>
                  {(profile as any)?.registration_number && (
                    <div className="flex items-center gap-1 mt-1">
                      <i className="ri-hashtag text-teal-500 text-xs"></i>
                      <span className="text-xs font-mono font-bold text-teal-600">{(profile as any).registration_number}</span>
                    </div>
                  )}
                  {profile?.email && !profile.email.includes('gosmart') && (
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{profile.email}</div>
                  )}
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
