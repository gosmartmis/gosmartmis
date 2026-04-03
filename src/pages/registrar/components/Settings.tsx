import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import AvatarUpload from '../../../components/feature/AvatarUpload';

export default function Settings() {
  const { profile: authProfile, getInitials } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(authProfile?.avatar_url ?? null);
  const initials = authProfile ? getInitials(authProfile.full_name) : 'RM';

  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    registrationAlerts: true,
    documentUploads: true,
    systemUpdates: false,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
            {[
              { id: 'profile', label: 'Profile', icon: 'ri-user-line' },
              { id: 'notifications', label: 'Notifications', icon: 'ri-notification-3-line' },
              { id: 'security', label: 'Security', icon: 'ri-shield-keyhole-line' },
              { id: 'system', label: 'System', icon: 'ri-computer-line' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className={`${tab.icon} text-xl`}></i>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Profile Information</h3>
              
              <div className="flex items-center gap-6 mb-8">
                {authProfile?.id ? (
                  <AvatarUpload
                    userId={authProfile.id}
                    currentUrl={avatarUrl}
                    initials={initials}
                    size="lg"
                    shape="circle"
                    onSuccess={(url) => setAvatarUrl(url)}
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {initials}
                  </div>
                )}
                <div>
                  <div className="text-xl font-bold text-gray-900">
                    {authProfile?.full_name ?? 'Rose Mukamana'}
                  </div>
                  <div className="text-gray-600">School Registrar</div>
                  <div className="text-sm text-gray-500">{authProfile?.email ?? 'registrar@eliteschool.edu'}</div>
                  <p className="text-xs text-gray-400 mt-1">Click the camera icon to update your photo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    defaultValue="Rose"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    defaultValue="Mukamana"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    defaultValue="registrar@eliteschool.edu"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    defaultValue="+250 78 123 4567"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    rows={4}
                    defaultValue="Experienced school registrar with over 8 years in student administration and enrollment management."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Notification Preferences</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Notification Channels</h4>
                  <div className="space-y-4">
                    {[
                      { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                      { key: 'sms', label: 'SMS Notifications', desc: 'Receive updates via text message' },
                      { key: 'push', label: 'Push Notifications', desc: 'Receive browser push notifications' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900">{item.label}</div>
                          <div className="text-sm text-gray-500">{item.desc}</div>
                        </div>
                        <button
                          onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            notifications[item.key as keyof typeof notifications] ? 'bg-teal-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                            notifications[item.key as keyof typeof notifications] ? 'left-6' : 'left-0.5'
                          }`}></div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4">Notification Types</h4>
                  <div className="space-y-4">
                    {[
                      { key: 'registrationAlerts', label: 'Registration Alerts', desc: 'New registrations and approvals' },
                      { key: 'documentUploads', label: 'Document Uploads', desc: 'When parents upload documents' },
                      { key: 'systemUpdates', label: 'System Updates', desc: 'Maintenance and feature updates' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900">{item.label}</div>
                          <div className="text-sm text-gray-500">{item.desc}</div>
                        </div>
                        <button
                          onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            notifications[item.key as keyof typeof notifications] ? 'bg-teal-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                            notifications[item.key as keyof typeof notifications] ? 'left-6' : 'left-0.5'
                          }`}></div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Security Settings</h3>

              <div className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4">Change Password</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <button className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all">
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="p-6 border border-gray-200 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600 mb-4">Add an extra layer of security to your account</p>
                  <button className="px-6 py-3 border border-teal-500 text-teal-600 rounded-xl hover:bg-teal-50 transition-colors">
                    Enable 2FA
                  </button>
                </div>

                <div className="p-6 border border-gray-200 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4">Login Sessions</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Current Session</div>
                        <div className="text-sm text-gray-500">Chrome on Windows • Kigali, Rwanda</div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">System Information</h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Application Version</div>
                    <div className="font-semibold text-gray-900">v2.4.1</div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Last Updated</div>
                    <div className="font-semibold text-gray-900">October 25, 2024</div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Database Status</div>
                    <div className="font-semibold text-green-600 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Connected
                    </div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Storage Used</div>
                    <div className="font-semibold text-gray-900">45.2 GB / 100 GB</div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4">Data Management</h4>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <i className="ri-download-cloud-line text-xl text-teal-600"></i>
                        <span className="font-medium text-gray-900">Export All Data</span>
                      </div>
                      <i className="ri-arrow-right-line text-gray-400"></i>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <i className="ri-history-line text-xl text-blue-600"></i>
                        <span className="font-medium text-gray-900">View Activity Log</span>
                      </div>
                      <i className="ri-arrow-right-line text-gray-400"></i>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <i className="ri-customer-service-line text-xl text-purple-600"></i>
                        <span className="font-medium text-gray-900">Contact Support</span>
                      </div>
                      <i className="ri-arrow-right-line text-gray-400"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}