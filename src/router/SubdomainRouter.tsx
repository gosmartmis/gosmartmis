import { Outlet } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';
import { getSubdomainInfo, getPlatformBaseUrl } from '../utils/subdomain';

export default function SubdomainRouter() {
  const { isLoading, tenantError, schoolRecord } = useTenant();
  const subdomainInfo = getSubdomainInfo();
  const platformUrl = getPlatformBaseUrl();

  // On main domain, super-admin, or demo — never block, render immediately
  if (subdomainInfo.isMainPlatform || subdomainInfo.isSuperAdmin || subdomainInfo.isDemo) {
    return <Outlet />;
  }

  // On a school subdomain — wait for tenant resolution
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading school...</p>
        </div>
      </div>
    );
  }

  // School not found
  if (tenantError === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-error-warning-line text-4xl text-red-600"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">School Not Found</h1>
          <p className="text-gray-600 mb-6">
            The school subdomain you're trying to access doesn't exist or has been removed.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Current URL:</strong> {window.location.hostname}
            </p>
          </div>
          <a
            href={platformUrl}
            className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            Go to Main Site
          </a>
        </div>
      </div>
    );
  }

  // School suspended/inactive
  if (tenantError === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-pause-circle-line text-4xl text-orange-600"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">School Suspended</h1>
          <p className="text-gray-600 mb-6">
            This school's subscription is currently inactive. Please contact your administrator or support team.
          </p>
          {schoolRecord && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700 mb-2">
                <strong>School:</strong> {schoolRecord.name}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Status:</strong>{' '}
                <span className="text-orange-600 font-medium capitalize">
                  {schoolRecord.subscription_status}
                </span>
              </p>
              {schoolRecord.contact_email && (
                <p className="text-sm text-gray-700">
                  <strong>Contact:</strong> {schoolRecord.contact_email}
                </p>
              )}
            </div>
          )}
          <a
            href={platformUrl}
            className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            Go to Main Site
          </a>
        </div>
      </div>
    );
  }

  // Valid school tenant — render child routes
  return <Outlet />;
}
