import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import AvatarUpload from '../../../components/feature/AvatarUpload';
import { useTestimonialSubmissions } from '../../../hooks/useTestimonialSubmissions';
import { useTenant } from '../../../contexts/TenantContext';
import RegistrationSettings from './RegistrationSettings';

function FeedbackTab() {
  const { profile: authProfile } = useAuth();
  const { schoolRecord } = useTenant();
  const { submit, submitting, submissions, loading: loadingSubs } = useTestimonialSubmissions();

  const [form, setForm] = useState({
    name: authProfile?.full_name ?? '',
    role: 'School Director',
    school: schoolRecord?.name ?? '',
    quote: '',
    photo_url: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // check if this director already submitted
  const existingSubmission = submissions.find(
    (s) => s.school?.toLowerCase() === (schoolRecord?.name ?? '').toLowerCase()
  );

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.quote.trim()) return;
    if (form.quote.length > 500) { setError('Quote must be under 500 characters.'); return; }
    setError('');
    const ok = await submit(form);
    if (ok) setSubmitted(true);
    else setError('Something went wrong. Please try again.');
  };

  if (loadingSubs) {
    return (
      <div className="flex items-center justify-center py-16">
        <i className="ri-loader-4-line animate-spin text-teal-500 text-2xl"></i>
      </div>
    );
  }

  if (submitted || existingSubmission) {
    const sub = existingSubmission;
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center gap-5">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
            sub?.status === 'approved' ? 'bg-green-100 text-green-600' :
            sub?.status === 'rejected' ? 'bg-red-100 text-red-500' :
            'bg-amber-100 text-amber-500'
          }`}>
            <i className={
              sub?.status === 'approved' ? 'ri-checkbox-circle-fill' :
              sub?.status === 'rejected' ? 'ri-close-circle-fill' :
              'ri-time-line'
            }></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {sub?.status === 'approved' ? 'Your review is live!' :
               sub?.status === 'rejected' ? 'Review not published' :
               'Review submitted!'}
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              {sub?.status === 'approved'
                ? 'Your review is now displayed on the Go Smart landing page. Thank you for sharing your experience!'
                : sub?.status === 'rejected'
                ? 'Your review was not approved for the landing page. Contact Go Smart support for more information.'
                : 'Your review is pending approval by the Go Smart team. It will appear on the landing page once approved.'}
            </p>
          </div>
          {sub && (
            <div className="w-full max-w-md bg-gray-50 rounded-xl p-5 border border-gray-200 text-left">
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  sub.status === 'approved' ? 'bg-green-100 text-green-700' :
                  sub.status === 'rejected' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  <i className={
                    sub.status === 'approved' ? 'ri-checkbox-circle-fill' :
                    sub.status === 'rejected' ? 'ri-close-circle-fill' :
                    'ri-time-line'
                  }></i>
                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </span>
                <span className="text-xs text-gray-400">
                  Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 italic line-clamp-3">&quot;{sub.quote}&quot;</p>
              <div className="mt-2 text-xs text-gray-500">— {sub.name} · {sub.school}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro card */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-6 flex items-start gap-4">
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-teal-100 text-teal-600 flex-shrink-0">
          <i className="ri-chat-quote-line text-xl"></i>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-1">Share Your Experience</h3>
          <p className="text-sm text-gray-600">
            Your testimonial will be reviewed by the Go Smart team and, once approved, displayed on the
            public landing page to help other schools discover the platform.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3">Your Review</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your Full Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your Role</label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">School Name</label>
          <input
            type="text"
            value={form.school}
            onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your Photo URL (optional)</label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
              {form.photo_url
                ? <img src={form.photo_url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : (form.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?')}
            </div>
            <input
              type="url"
              value={form.photo_url}
              onChange={(e) => setForm((f) => ({ ...f, photo_url: e.target.value }))}
              placeholder="https://example.com/your-photo.jpg"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your Experience with Go Smart <span className="text-red-400">*</span></label>
          <textarea
            value={form.quote}
            onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
            placeholder="Tell us how Go Smart has helped your school — what problems it solved, what you love most…"
            rows={5}
            maxLength={500}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400">{form.quote.length}/500 characters</p>
            {form.quote.length > 480 && <p className="text-xs text-amber-500">Almost at limit</p>}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <i className="ri-error-warning-line"></i>
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            <i className="ri-shield-check-line text-teal-500 mr-1"></i>
            Your review is reviewed before publishing
          </p>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim() || !form.quote.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            {submitting ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-send-plane-line"></i>}
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { profile: authProfile, getInitials } = useAuth();
  const { schoolRecord } = useTenant();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(authProfile?.avatar_url ?? null);
  const initials = authProfile ? getInitials(authProfile.full_name) : 'JD';

  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'ri-user-line' },
    { id: 'registration', label: 'Registration No.', icon: 'ri-hashtag' },
    { id: 'security', label: 'Security', icon: 'ri-shield-line' },
    { id: 'notifications', label: 'Notifications', icon: 'ri-notification-3-line' },
    { id: 'system', label: 'System', icon: 'ri-settings-3-line' },
    { id: 'feedback', label: 'Share Review', icon: 'ri-chat-quote-line' },
  ];

  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'director@eliteschool.rw',
    phone: '+250 788 123 456',
    position: 'School Director',
    bio: 'Experienced educator with over 15 years in school administration.',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    riskAlerts: true,
    marksApproval: true,
    feeReminders: true,
    newStudents: true,
    attendanceAlerts: true,
    systemUpdates: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    loginNotifications: true,
    passwordExpiry: false,
    sessionTimeout: true,
  });

  const toggleNotification = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSecurity = (key: keyof typeof securitySettings) => {
    setSecuritySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-600">Manage your account and system preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className={`${tab.icon} text-lg`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Registration Number Settings */}
      {activeTab === 'registration' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Student Registration Numbers</h2>
            <p className="text-sm text-gray-500 mt-0.5">Configure the automatic registration number format for your school&apos;s students</p>
          </div>
          {schoolRecord?.id ? (
            <RegistrationSettings schoolId={schoolRecord.id} />
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-700 text-sm">
              School information not loaded. Please refresh and try again.
            </div>
          )}
        </div>
      )}

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-6">
              {authProfile?.id ? (
                <AvatarUpload
                  userId={authProfile.id}
                  currentUrl={avatarUrl}
                  initials={initials}
                  size="lg"
                  shape="rounded"
                  onSuccess={(url) => setAvatarUrl(url)}
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{initials}</span>
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900">{profileData.firstName} {profileData.lastName}</h3>
                <p className="text-teal-600 font-medium">{profileData.position}</p>
                <p className="text-xs text-gray-400 mt-1">Click the camera icon to update your photo</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button className="px-6 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                Change Password
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Security Options</h3>
            <div className="space-y-4">
              {[
                { key: 'twoFactorAuth', label: 'Two-Factor Authentication', description: 'Require a verification code in addition to your password' },
                { key: 'loginNotifications', label: 'Login Notifications', description: 'Receive email alerts for new login attempts' },
                { key: 'passwordExpiry', label: 'Password Expiry', description: 'Force password change every 90 days' },
                { key: 'sessionTimeout', label: 'Session Timeout', description: 'Automatically log out after 30 minutes of inactivity' },
              ].map((option) => (
                <div key={option.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                  <button
                    onClick={() => toggleSecurity(option.key as keyof typeof securitySettings)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      securitySettings[option.key as keyof typeof securitySettings] ? 'bg-teal-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                      securitySettings[option.key as keyof typeof securitySettings] ? 'left-6' : 'left-0.5'
                    }`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { key: 'emailAlerts', label: 'Email Alerts', description: 'Receive notifications via email' },
              { key: 'smsAlerts', label: 'SMS Alerts', description: 'Receive urgent notifications via SMS' },
              { key: 'riskAlerts', label: 'Academic Risk Alerts', description: 'Get notified about student performance risks' },
              { key: 'marksApproval', label: 'Marks Approval', description: 'Receive alerts when marks need approval' },
              { key: 'feeReminders', label: 'Fee Payment Reminders', description: 'Get notified about overdue fee payments' },
              { key: 'newStudents', label: 'New Student Registrations', description: 'Receive alerts for new student enrollments' },
              { key: 'attendanceAlerts', label: 'Attendance Alerts', description: 'Get notified about consecutive absences' },
              { key: 'systemUpdates', label: 'System Updates', description: 'Receive notifications about system maintenance' },
            ].map((option) => (
              <div key={option.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
                <button
                  onClick={() => toggleNotification(option.key as keyof typeof notificationSettings)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    notificationSettings[option.key as keyof typeof notificationSettings] ? 'bg-teal-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                    notificationSettings[option.key as keyof typeof notificationSettings] ? 'left-6' : 'left-0.5'
                  }`}></div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Settings */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">System Version</label>
                <input
                  type="text"
                  value="Go Smart System v2.1.0"
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <input
                  type="text"
                  value="January 15, 2025"
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Database Status</label>
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">Connected</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Storage Usage</label>
                <div className="px-4 py-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>2.3 GB / 10 GB</span>
                    <span className="text-gray-600">23%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: '23%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Data Management</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div className="font-medium text-gray-900">Export All Data</div>
                  <div className="text-sm text-gray-600">Download a complete backup of your school data</div>
                </div>
                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Export
                </button>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div className="font-medium text-gray-900">Clear Cache</div>
                  <div className="text-sm text-gray-600">Clear temporary files to improve performance</div>
                </div>
                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Clear
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-red-600">Delete Account</div>
                  <div className="text-sm text-gray-600">Permanently delete your account and all data</div>
                </div>
                <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Review */}
      {activeTab === 'feedback' && <FeedbackTab />}
    </div>
  );
}