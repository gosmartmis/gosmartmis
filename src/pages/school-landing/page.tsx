import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { setSchoolContext } from '../../utils/subdomain';
import type { SchoolColors } from './types';

import SchoolNavbar from './components/SchoolNavbar';
import SchoolHero from './components/SchoolHero';
import SchoolStats from './components/SchoolStats';
import SchoolFeatures from './components/SchoolFeatures';
import SchoolGallery from './components/SchoolGallery';
import SchoolTestimonials from './components/SchoolTestimonials';
import SchoolContact from './components/SchoolContact';
import SchoolFooter from './components/SchoolFooter';

// ─── Color helpers ────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function useSchoolColors(primary?: string | null, secondary?: string | null): SchoolColors {
  const p = primary || '#0d9488';
  const s = secondary || '#059669';
  return useMemo(() => ({
    primary: p,
    secondary: s,
    primaryRgb: hexToRgb(p),
    btn: { background: `linear-gradient(135deg, ${p}, ${s})` } as React.CSSProperties,
    iconBg: { backgroundColor: p } as React.CSSProperties,
    text: { color: p } as React.CSSProperties,
    lightBg: { backgroundColor: `rgba(${hexToRgb(p)}, 0.07)` } as React.CSSProperties,
    ctaBg: { background: `linear-gradient(135deg, ${p} 0%, ${s} 100%)` } as React.CSSProperties,
    borderColor: { borderColor: `rgba(${hexToRgb(p)}, 0.25)` } as React.CSSProperties,
  }), [p, s]);
}

// ─── Loading screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg font-medium">Loading school...</p>
      </div>
    </div>
  );
}

// ─── School not found ─────────────────────────────────────────────────────────
function SchoolNotFound({ slug }: { slug: string | null }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-error-warning-line text-4xl text-red-500"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">School Not Found</h2>
        <p className="text-gray-600 mb-6">
          The school <strong>&ldquo;{slug}&rdquo;</strong> doesn&apos;t exist in our system.
        </p>
        <a href="https://gosmartmis.rw" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap">
          <i className="ri-home-4-line"></i>Go to Main Site
        </a>
      </div>
    </div>
  );
}

// ─── Suspended screen ─────────────────────────────────────────────────────────
function SchoolSuspended({ name, contact }: { name?: string; contact?: string | null }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 px-4">
      <div className="text-center max-w-md bg-white rounded-2xl p-10 border border-orange-200">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-pause-circle-line text-4xl text-orange-500"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">School Suspended</h2>
        {name && <p className="text-sm font-semibold text-gray-600 mb-3">{name}</p>}
        <p className="text-gray-600 mb-6">
          This school&apos;s subscription is inactive. Please contact your administrator to restore access.
        </p>
        {contact && (
          <a href={`mailto:${contact}`} className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors cursor-pointer whitespace-nowrap mb-3">
            <i className="ri-mail-line"></i>Contact Support
          </a>
        )}
        <div>
          <a href="https://gosmartmis.rw" className="text-sm text-gray-400 hover:text-gray-600 underline">Go to main site</a>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SchoolLandingPage() {
  const { schoolRecord, tenantError, isLoading, schoolSlug } = useTenant();
  const navigate = useNavigate();
  const colors = useSchoolColors(schoolRecord?.primary_color, schoolRecord?.secondary_color);

  useEffect(() => {
    if (schoolRecord) {
      setSchoolContext(schoolRecord.id, schoolRecord.name, schoolRecord.slug);
      document.title = `${schoolRecord.name} — Student Portal`;
    }
    return () => { document.title = 'Go Smart M.I.S'; };
  }, [schoolRecord]);

  if (isLoading) return <LoadingScreen />;
  if (tenantError === 'not_found') return <SchoolNotFound slug={schoolSlug} />;
  if (tenantError === 'inactive') return <SchoolSuspended name={schoolRecord?.name} contact={schoolRecord?.contact_email} />;
  if (!schoolRecord) return null;

  const isExpired = schoolRecord.subscription_status === 'expired';
  const isTrial = schoolRecord.subscription_status === 'trial';
  let trialDaysRemaining = 0;
  if (isTrial && schoolRecord.subscription_expiry) {
    const diff = new Date(schoolRecord.subscription_expiry).getTime() - Date.now();
    trialDaysRemaining = Math.max(0, Math.ceil(diff / 86400000));
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Expired banner */}
      {isExpired && (
        <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white py-3 px-6 relative z-[60]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <i className="ri-error-warning-line text-xl flex-shrink-0"></i>
              <span className="text-sm font-semibold">Subscription expired — contact your administrator to renew.</span>
            </div>
            <span className="text-xs opacity-80 whitespace-nowrap hidden sm:block">gosmartmis.rw</span>
          </div>
        </div>
      )}

      {/* Trial banner */}
      {isTrial && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 px-6 relative z-[60]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <i className="ri-time-line text-xl flex-shrink-0"></i>
              <span className="text-sm font-semibold">Trial period — {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining</span>
            </div>
            <span className="text-xs opacity-80 whitespace-nowrap hidden sm:block">Contact us to upgrade</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <SchoolNavbar school={schoolRecord} colors={colors} />

      {/* Hero */}
      <SchoolHero school={schoolRecord} colors={colors} />

      {/* About + Stats */}
      <SchoolStats school={schoolRecord} colors={colors} />

      {/* Portal Features */}
      <SchoolFeatures school={schoolRecord} colors={colors} />

      {/* Photo Gallery */}
      <SchoolGallery colors={colors} />

      {/* Testimonials */}
      <SchoolTestimonials colors={colors} />

      {/* Contact */}
      <SchoolContact school={schoolRecord} colors={colors} />

      {/* Footer */}
      <SchoolFooter school={schoolRecord} colors={colors} />
    </div>
  );
}
