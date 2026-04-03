
import { useState } from 'react';

export default function Settings() {
  const [settings, setSettings] = useState({
    platformName: 'Go Smart M.I.S',
    mainDomain: 'gosmartmis.rw',
    adminDomain: 'admin.gosmartmis.rw',
    supportEmail: 'support@gosmartmis.rw',
    supportPhone: '+250 788 000 000',
    demoTrialDays: '30',
    demoMaxStudents: '50',
    emailNotifications: true,
    smsNotifications: true,
    maintenanceMode: false,
  });

  const packages = [
    { id: 1, name: 'Nursery Package', price: '170,000', active: true },
    { id: 2, name: 'Primary Package', price: '230,000', active: true },
    { id: 3, name: 'Nursery + Primary Package', price: '360,000', active: true },
    { id: 4, name: 'Demo Plan', price: '0', active: true },
  ];

  // Helper to safely update nested state
  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
        <p className="text-gray-600 mt-1">Configure platform-wide settings</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <i className="ri-settings-3-line text-xl w-6 h-6 flex items-center justify-center text-primary-600"></i>
            General Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => updateSetting('platformName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Main Domain
              </label>
              <input
                type="text"
                value={settings.mainDomain}
                onChange={(e) => updateSetting('mainDomain', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Admin Domain
              </label>
              <input
                type="text"
                value={settings.adminDomain}
                onChange={(e) => updateSetting('adminDomain', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => updateSetting('supportEmail', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Support Phone
              </label>
              <input
                type="tel"
                value={settings.supportPhone}
                onChange={(e) => updateSetting('supportPhone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Right column: Demo, Notification */}
        <div className="space-y-6">
          {/* Demo Plan Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <i className="ri-time-line text-xl w-6 h-6 flex items-center justify-center text-primary-600"></i>
              Demo Plan Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trial Duration (Days)
                </label>
                <input
                  type="number"
                  value={settings.demoTrialDays}
                  onChange={(e) => updateSetting('demoTrialDays', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Students (Demo)
                </label>
                <input
                  type="number"
                  value={settings.demoMaxStudents}
                  onChange={(e) => updateSetting('demoMaxStudents', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <i className="ri-notification-3-line text-xl w-6 h-6 flex items-center justify-center text-primary-600"></i>
              Notification Settings
            </h3>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Email Notifications</div>
                  <div className="text-sm text-gray-600">Send email notifications to schools</div>
                </div>
                <button
                  onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                  className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${
                    settings.emailNotifications ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.emailNotifications ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* SMS Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">SMS Notifications</div>
                  <div className="text-sm text-gray-600">Send SMS notifications to schools</div>
                </div>
                <button
                  onClick={() => updateSetting('smsNotifications', !settings.smsNotifications)}
                  className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${
                    settings.smsNotifications ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.smsNotifications ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Maintenance Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Maintenance Mode</div>
                  <div className="text-sm text-gray-600">Disable access to all schools</div>
                </div>
                <button
                  onClick={() => updateSetting('maintenanceMode', !settings.maintenanceMode)}
                  className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${
                    settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.maintenanceMode ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Default Packages */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <i className="ri-price-tag-3-line text-xl w-6 h-6 flex items-center justify-center text-primary-600"></i>
          Default Packages
        </h3>

        <div className="grid grid-cols-4 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="font-semibold text-gray-900">{pkg.name}</div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    pkg.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {pkg.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-2xl font-bold text-primary-600 mb-4">
                {pkg.price === '0' ? 'Free' : `${pkg.price} RWF`}
              </div>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:border-gray-400 transition-colors cursor-pointer whitespace-nowrap">
                Edit Package
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-colors cursor-pointer whitespace-nowrap"
          onClick={() => {
            // Reset to the initial default values
            setSettings({
              platformName: 'Go Smart M.I.S',
              mainDomain: 'gosmartmis.rw',
              adminDomain: 'admin.gosmartmis.rw',
              supportEmail: 'support@gosmartmis.rw',
              supportPhone: '+250 788 000 000',
              demoTrialDays: '30',
              demoMaxStudents: '50',
              emailNotifications: true,
              smsNotifications: true,
              maintenanceMode: false,
            });
          }}
        >
          Reset to Default
        </button>
        <button
          type="button"
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
          onClick={() => {
            // Example save handler – replace with real API call
            try {
              console.log('Saving settings:', settings);
              // TODO: await saveSettingsApi(settings);
              alert('Settings saved successfully!');
            } catch (err) {
              console.error('Failed to save settings:', err);
              alert('An error occurred while saving settings.');
            }
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
