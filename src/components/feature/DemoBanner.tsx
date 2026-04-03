import { useState } from 'react';
import { getSubdomainInfo } from '../../utils/subdomain';

interface DemoBannerProps {
  role: string;
}

export default function DemoBanner({ role }: DemoBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const subdomainInfo = getSubdomainInfo();

  if (!subdomainInfo.isDemo || dismissed) return null;

  const getDemoEmail = (r: string) => {
    const map: Record<string, string> = {
      director: 'demo.director@gosmartmis.rw',
      teacher: 'demo.teacher@gosmartmis.rw',
      student: 'demo.student@gosmartmis.rw',
      registrar: 'demo.registrar@gosmartmis.rw',
      accountant: 'demo.accountant@gosmartmis.rw',
      dean: 'demo.dean@gosmartmis.rw',
      'school-manager': 'demo.manager@gosmartmis.rw',
    };
    return map[r] || 'demo@gosmartmis.rw';
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-sm z-50 relative">
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-1.5 font-bold">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-presentation-line text-base"></i>
          </div>
          <span>LIVE DEMO</span>
        </div>
        <span className="text-amber-100 hidden sm:inline">|</span>
        <span className="text-amber-100 hidden sm:inline">
          You&apos;re viewing the <strong className="text-white">{role.charAt(0).toUpperCase() + role.slice(1)}</strong> dashboard in demo mode
        </span>
        <span className="bg-white/20 border border-white/30 rounded-full px-2.5 py-0.5 text-xs font-medium hidden md:inline">
          {getDemoEmail(role)}
        </span>
        <span className="bg-white/20 border border-white/30 rounded-full px-2.5 py-0.5 text-xs font-medium hidden md:inline">
          Data resets every 72 hours
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href={`${window.location.protocol}//${window.location.hostname}`}
          className="text-xs bg-white/20 hover:bg-white/30 border border-white/40 rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer whitespace-nowrap"
        >
          Switch Role
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="Dismiss banner"
        >
          <i className="ri-close-line text-sm"></i>
        </button>
      </div>
    </div>
  );
}
