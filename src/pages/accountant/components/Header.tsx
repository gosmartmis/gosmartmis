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
  const [showSearch, setShowSearch] = useState(false);

  const displayName = profile?.full_name || 'Accountant';
  const initials = profile ? getInitials(profile.full_name) : 'A';

  return (
    <header className="h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-2 md:gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <i className="ri-menu-line text-xl w-5 h-5 flex items-center justify-center"></i>
          </button>
        )}
        <h1 className="text-base md:text-lg font-bold text-gray-900 whitespace-nowrap">Financial Dashboard</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Desktop search */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search transactions, students..."
            className="w-64 lg:w-80 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-gray-50"
          />
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        </div>

        {/* Mobile search toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <i className="ri-search-line text-lg w-5 h-5 flex items-center justify-center"></i>
        </button>

        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-1.5 md:gap-2 pl-2 pr-2 md:pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              initials={initials}
              sizeClass="w-8 h-8"
              gradientClass="from-amber-500 to-orange-600"
              shape="full"
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-gray-900 leading-tight">{displayName.split(' ')[0]}</div>
              <div className="text-xs text-gray-500">Accountant</div>
            </div>
            <i className="ri-arrow-down-s-line text-gray-400 text-sm hidden sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-52 bg-white rounded-xl border border-gray-200 py-2 z-50" style={{boxShadow:'0 4px 24px rgba(0,0,0,0.10)'}}>
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{profile?.email}</div>
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

      {/* Mobile search bar (expands below header) */}
      {showSearch && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-200 px-4 py-2 z-20 md:hidden">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              autoFocus
              type="text"
              placeholder="Search transactions, students..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-gray-50"
            />
          </div>
        </div>
      )}
    </header>
  );
}
