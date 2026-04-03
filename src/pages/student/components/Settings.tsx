import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import AvatarUpload from '../../../components/feature/AvatarUpload';

export default function Settings() {
  const { profile, getInitials } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const initials = profile ? getInitials(profile.full_name) : 'EW';
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    marks: true,
    attendance: true,
    messages: true,
    announcements: true,
    events: false,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="space-y-2">
          {[
            { id: 'profile', label: 'Profile', icon: 'ri-user-line' },
            { id: 'notifications', label: 'Notifications', icon: 'ri-notification-3-line' },
            { id: 'security', label: 'Security', icon: 'ri-shield-line' },
            { id: 'appearance', label: 'Appearance', icon: 'ri-palette-line' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <i className={`${item.icon} text-xl w-6 h-6 flex items-center justify-center`}></i>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="col-span-3">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Profile Information</h3>
              
              <div className="flex items-center gap-4 mb-6">
                {profile?.id ? (
                  <AvatarUpload
                    userId={profile.id}
                    currentUrl={avatarUrl}
                    initials={initials}
                    size="md"
                    shape="rounded"
                    onSuccess={(url) => setAvatarUrl(url)}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">{initials}</div>
                )}
                <div>
                  <p className="text-sm text-gray-600 font-medium">Profile Photo</p>
                  <p className="text-xs text-gray-500 mt-1">Click the camera icon to upload</p>
                  <p className="text-xs text-gray-400">JPG, PNG, GIF or WebP. Max 5 MB</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    defaultValue="Emma"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    defaultValue="Wilson"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                  <input
                    type="text"
                    defaultValue="STU-2024-001"
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                  <input
                    type="text"
                    defaultValue="P4A"
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    defaultValue="emma.wilson@elite-school.edu"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button className="px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-md transition-shadow">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Notification Preferences</h3>
              
              <div className="space-y-4">
                {[
                  { id: 'marks', label: 'Marks Published', description: 'Get notified when new marks are published' },
                  { id: 'attendance', label: 'Attendance Updates', description: 'Receive daily attendance notifications' },
                  { id: 'messages', label: 'New Messages', description: 'Get notified when you receive new messages' },
                  { id: 'announcements', label: 'School Announcements', description: 'Important updates from the school' },
                  { id: 'events', label: 'Upcoming Events', description: 'Reminders for school events and activities' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof notifications] }))}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        notifications[item.id as keyof typeof notifications] ? 'bg-teal-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          notifications[item.id as keyof typeof notifications] ? 'left-7' : 'left-1'
                        }`}
                      ></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Security Settings</h3>
              
              <div className="space-y-6">
                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">Change Password</p>
                      <p className="text-sm text-gray-600">Update your password regularly for security</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Current Password"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <button className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors">
                    Update Password
                  </button>
                </div>

                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <button className="px-4 py-2 border border-teal-500 text-teal-500 rounded-lg text-sm font-medium hover:bg-teal-50 transition-colors">
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Appearance</h3>
              
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-xl">
                  <p className="font-semibold text-gray-900 mb-4">Theme</p>
                  <div className="flex gap-4">
                    <button className="flex-1 p-4 border-2 border-teal-500 rounded-xl bg-gray-50">
                      <i className="ri-sun-line text-2xl text-teal-500 w-8 h-8 flex items-center justify-center mx-auto"></i>
                      <p className="text-sm font-medium text-center mt-2">Light</p>
                    </button>
                    <button className="flex-1 p-4 border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-gray-50 transition-colors">
                      <i className="ri-moon-line text-2xl text-gray-600 w-8 h-8 flex items-center justify-center mx-auto"></i>
                      <p className="text-sm font-medium text-center mt-2">Dark</p>
                    </button>
                    <button className="flex-1 p-4 border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-gray-50 transition-colors">
                      <i className="ri-computer-line text-2xl text-gray-600 w-8 h-8 flex items-center justify-center mx-auto"></i>
                      <p className="text-sm font-medium text-center mt-2">System</p>
                    </button>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-xl">
                  <p className="font-semibold text-gray-900 mb-4">Language</p>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option>English</option>
                    <option>Kinyarwanda</option>
                    <option>French</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}