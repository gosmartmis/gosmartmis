import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import ProfileModal from './ProfileModal';
import { type UserProfile } from '../../../lib/supabase';
import NotificationBell from '../../../components/feature/NotificationBell';
import UserAvatar from '../../../components/feature/UserAvatar';

export default function Header() {
  const { profile, signOut, getInitials } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null);

  const active = localProfile || profile;
  const displayName = active?.full_name || 'Super Admin';
  const initials = active ? getInitials(active.full_name) : 'SA';
  const avatarUrl = active?.avatar_url || null;

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
            <p className="text-sm text-gray-600">Manage all schools and subscriptions</p>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />

            <div className="relative flex items-center gap-3 pl-4 border-l border-gray-200">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors cursor-pointer"
              >
                <UserAvatar
                  avatarUrl={avatarUrl}
                  name={displayName}
                  size="md"
                  shape="circle"
                  colorClass="from-rose-500 to-pink-600"
                />
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                  <div className="text-xs text-gray-500">{active?.email || 'System Administrator'}</div>
                </div>
                <i className="ri-arrow-down-s-line text-gray-400 text-sm" />
              </button>

              {showProfile && (
                <div className="absolute right-0 top-14 w-52 bg-white rounded-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{active?.email}</div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setShowProfile(false); setShowProfileModal(true); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-user-settings-line text-base text-gray-500" />
                      Edit Profile
                    </button>
                  </div>
                  <div className="border-t border-gray-100 pt-1">
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

      {showProfileModal && active && (
        <ProfileModal
          profile={active}
          onClose={() => setShowProfileModal(false)}
          onSaved={(updated) => {
            setLocalProfile(updated);
            setShowProfileModal(false);
          }}
        />
      )}
    </>
  );
}
