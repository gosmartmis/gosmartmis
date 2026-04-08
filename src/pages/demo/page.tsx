import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail } from '../../lib/supabase';

// ─── Demo Credentials ──────────────────────────────────────────────────────
const DEMO_PASSWORD = 'Demo@GoSmart2024';

const normalizeRole = (role?: string | null) => {
  if (!role) return '';
  return role === 'school-manager' ? 'school_manager' : role;
};

const DEMO_ROLES = [
  {
    id: 'director',
    label: 'Director',
    description: 'Full school oversight — analytics, staff management, risk monitoring, and strategic reporting.',
    email: 'demo.director@gosmartmis.rw',
    icon: 'ri-building-2-line',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    route: '/director',
    features: ['School Analytics', 'Risk Alerts', 'Staff Management', 'Report Approval'],
  },
  {
    id: 'dean',
    label: 'Dean of Studies',
    description: 'Academic oversight — marks verification, timetable management, and student monitoring.',
    email: 'demo.dean@gosmartmis.rw',
    icon: 'ri-user-star-line',
    gradient: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    badgeBg: 'bg-violet-100',
    route: '/dean',
    features: ['Marks Approval', 'Timetable', 'Student Risk', 'Academic Reports'],
  },
  {
    id: 'registrar',
    label: 'Registrar',
    description: 'Student enrollment, document management, and bulk registration workflows.',
    email: 'demo.registrar@gosmartmis.rw',
    icon: 'ri-file-list-3-line',
    gradient: 'from-teal-500 to-emerald-500',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    badgeBg: 'bg-teal-100',
    route: '/registrar',
    features: ['Student Enrollment', 'Documents', 'Bulk Import', 'Re-enrollment'],
  },
  {
    id: 'accountant',
    label: 'Accountant',
    description: 'Fee management, payroll, financial reports, and payment tracking.',
    email: 'demo.accountant@gosmartmis.rw',
    icon: 'ri-money-dollar-circle-line',
    gradient: 'from-yellow-500 to-amber-500',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    badgeBg: 'bg-yellow-100',
    route: '/accountant',
    features: ['Fee Records', 'Payroll', 'Financial Reports', 'Tax Management'],
  },
  {
    id: 'teacher',
    label: 'Teacher',
    description: 'Marks entry, attendance tracking, timetable, and student communication.',
    email: 'demo.teacher@gosmartmis.rw',
    icon: 'ri-book-open-line',
    gradient: 'from-teal-500 to-cyan-500',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    badgeBg: 'bg-cyan-100',
    route: '/teacher',
    features: ['Marks Entry', 'Attendance', 'My Classes', 'Timetable'],
  },
  {
    id: 'student',
    label: 'Student',
    description: 'Grades, attendance record, timetable, report cards, and school messages.',
    email: 'demo.student@gosmartmis.rw',
    icon: 'ri-graduation-cap-line',
    gradient: 'from-emerald-500 to-green-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    route: '/student',
    features: ['My Grades', 'Attendance', 'Report Card', 'Timetable'],
  },
  {
    id: 'school_manager',
    label: 'School Manager',
    description: 'Operational management — school settings, leaderboards, and academic planning.',
    email: 'demo.manager@gosmartmis.rw',
    icon: 'ri-settings-3-line',
    gradient: 'from-slate-500 to-gray-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    badgeBg: 'bg-slate-100',
    route: '/school-manager',
    features: ['School Setup', 'Leaderboards', 'Academic Plans', 'Settings'],
  },
];

// ─── Countdown to next reset ───────────────────────────────────────────────
function useResetCountdown() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const computeTimeLeft = () => {
      const now = Date.now();
      const base = new Date('2024-01-01T00:00:00Z').getTime();
      const cycle = 72 * 60 * 60 * 1000;
      const elapsed = (now - base) % cycle;
      const remaining = cycle - elapsed;

      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };

    computeTimeLeft();
    const id = setInterval(computeTimeLeft, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

// ─── Role Card ─────────────────────────────────────────────────────────────
function RoleCard({
  role,
  onEnter,
  loading,
}: {
  role: typeof DEMO_ROLES[0];
  onEnter: (role: typeof DEMO_ROLES[0]) => void;
  loading: boolean;
}) {
  return (
    <div
      className={`group relative bg-white rounded-2xl border-2 ${role.border} hover:border-transparent transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1`}
      onClick={() => !loading && onEnter(role)}
    >
      {/* Gradient top bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${role.gradient}`}></div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${role.gradient} flex-shrink-0`}>
            <i className={`${role.icon} text-white text-xl`}></i>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${role.badgeBg} ${role.text}`}>
            {role.id.toUpperCase()}
          </span>
        </div>

        {/* Role name + desc */}
        <h3 className="text-gray-900 font-bold text-base mb-1">{role.label}</h3>
        <p className="text-gray-500 text-xs leading-relaxed mb-4">{role.description}</p>

        {/* Features */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {role.features.map((f) => (
            <span key={f} className={`text-xs px-2 py-0.5 rounded-full ${role.bg} ${role.text} font-medium`}>
              {f}
            </span>
          ))}
        </div>

        {/* Credential */}
        <div className="bg-gray-50 rounded-xl p-2.5 mb-4 flex items-center gap-2">
          <i className="ri-mail-line text-gray-400 text-xs flex-shrink-0"></i>
          <span className="text-gray-500 text-xs truncate font-mono">{role.email}</span>
        </div>

        {/* CTA */}
        <button
          disabled={loading}
          className={`w-full py-2.5 rounded-xl text-white text-sm font-semibold bg-gradient-to-r ${role.gradient} hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap disabled:opacity-60 flex items-center justify-center gap-2`}
          onClick={(e) => { e.stopPropagation(); !loading && onEnter(role); }}
        >
          {loading ? (
            <>
              <i className="ri-loader-4-line animate-spin text-sm"></i>
              Entering...
            </>
          ) : (
            <>
              <i className="ri-login-box-line text-sm"></i>
              Enter as {role.label}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Stats strip ──────────────────────────────────────────────────────────
const STATS = [
  { icon: 'ri-user-3-line', value: '7 Roles', label: 'Available' },
  { icon: 'ri-database-2-line', value: 'Live Data', label: 'Real Supabase' },
  { icon: 'ri-loop-left-line', value: '72-Hour', label: 'Data Reset' },
  { icon: 'ri-eye-line', value: 'No Login', label: 'One-Click Access' },
];

// ─── Main Demo Portal ──────────────────────────────────────────────────────
export default function DemoPortalPage() {
  const navigate = useNavigate();
  const countdown = useResetCountdown();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Silently pre-seed demo accounts on page load so they\'re ready when user clicks
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
    fetch(`${supabaseUrl}/functions/v1/seed-test-users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => { /* silent — not critical */ });
  }, []);

  const seedDemoAccounts = async (): Promise<void> => {
    const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
    await fetch(`${supabaseUrl}/functions/v1/seed-test-users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const handleEnterRole = async (role: typeof DEMO_ROLES[0]) => {
    setLoadingRole(role.id);
    setErrorMsg('');
    try {
      const profile = await signInWithEmail(role.email, DEMO_PASSWORD);
      sessionStorage.setItem('user_role', normalizeRole(profile.role));
      sessionStorage.setItem('user_email', profile.email);
      sessionStorage.setItem('user_name', profile.full_name);
      if (profile.school_id) {
        sessionStorage.setItem('user_school_id', profile.school_id);
      }
      sessionStorage.setItem('is_demo_session', 'true');
      navigate(role.route);
    } catch {
      // Demo accounts might not be seeded yet — try seeding then retry once
      try {
        await seedDemoAccounts();
        const profile = await signInWithEmail(role.email, DEMO_PASSWORD);
        sessionStorage.setItem('user_role', normalizeRole(profile.role));
        sessionStorage.setItem('user_email', profile.email);
        sessionStorage.setItem('user_name', profile.full_name);
        if (profile.school_id) {
          sessionStorage.setItem('user_school_id', profile.school_id);
        }
        sessionStorage.setItem('is_demo_session', 'true');
        navigate(role.route);
      } catch {
        setErrorMsg(`Could not log in as ${role.label}. Please try again in a moment.`);
      }
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 font-sans">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <img
          src="https://readdy.ai/api/search-image?query=modern%20Rwandan%20school%20campus%2C%20bright%20sunny%20day%2C%20students%20in%20uniforms%20walking%20on%20clean%20pathways%2C%20lush%20green%20environment%2C%20contemporary%20educational%20architecture%2C%20professional%20photography%2C%20wide%20angle%2C%20warm%20golden%20light%2C%20African%20school%20setting%20with%20modern%20facilities%20and%20computers%20visible%20through%20windows&width=1440&height=500&seq=demo-hero-bg-01&orientation=landscape"
          alt="Demo hero"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/85 via-slate-900/80 to-teal-800/85"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          {/* Logo row */}
          <div className="flex items-center gap-3 mb-10">
            <img
              src="https://static.readdy.ai/image/d7eb4a7e93d99b74b32bb102c193d15a/009057a20b674fc10ec4bca9372f81d6.jpeg"
              alt="Go Smart MIS"
              className="w-10 h-10 rounded-full border-2 border-white/30 object-contain"
            />
            <span className="text-white font-bold text-lg">Go Smart M.I.S</span>
            <span className="ml-1 text-xs bg-amber-500 text-white font-bold px-2.5 py-1 rounded-full">LIVE DEMO</span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
              Experience Go Smart MIS<br />
              <span className="text-teal-300">Live — No Registration Needed</span>
            </h1>
            <p className="text-teal-100 text-lg leading-relaxed mb-8 max-w-2xl">
              Explore every corner of the platform. Click any role below to instantly access a fully populated dashboard with real data. Perfect for presentations and evaluations.
            </p>

            {/* Countdown pill */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-time-line text-amber-400 text-xl"></i>
              </div>
              <div>
                <div className="text-xs text-teal-200 font-medium">Next demo data reset in</div>
                <div className="text-white font-bold text-xl font-mono tracking-widest">{countdown}</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-xs text-teal-200 leading-tight">
                Demo users &amp; accounts<br />
                <span className="text-white font-semibold">always stay active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-teal-50">
                  <i className={`${s.icon} text-teal-600 text-lg`}></i>
                </div>
                <div>
                  <div className="text-gray-900 font-bold text-sm">{s.value}</div>
                  <div className="text-gray-400 text-xs">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Role cards ───────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        {/* Section header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-6 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full"></div>
            <span className="text-sm font-bold text-teal-600 uppercase tracking-widest">Choose Your Role</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Click any role to enter instantly
          </h2>
          <p className="text-gray-500 text-sm max-w-xl">
            Each role opens a fully featured dashboard pre-loaded with realistic school data.
            No password prompt — just one click.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-start gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm">
            <i className="ri-error-warning-line flex-shrink-0 mt-0.5"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {DEMO_ROLES.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEnter={handleEnterRole}
              loading={loadingRole === role.id}
            />
          ))}
        </div>
      </div>

      {/* ── How demo works ───────────────────────────────────────────────── */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — explanation */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                <span className="text-sm font-bold text-amber-600 uppercase tracking-widest">How it works</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                A fully live system — not a prototype
              </h2>
              <div className="space-y-4">
                {[
                  {
                    icon: 'ri-user-shared-line',
                    title: 'Permanent demo accounts',
                    desc: 'Seven dedicated accounts (one per role) that never expire. Accounts are read from live Supabase auth.',
                  },
                  {
                    icon: 'ri-database-2-line',
                    title: 'Real data, automated reset',
                    desc: 'Marks, attendance, fees, and other records are pre-populated with realistic Rwandan school data. All demo data auto-resets every 72 hours so the demo always looks fresh.',
                  },
                  {
                    icon: 'ri-lock-unlock-line',
                    title: 'Open to everyone',
                    desc: 'No credentials needed — visitors, partners, and potential clients can explore the full platform without creating an account.',
                  },
                  {
                    icon: 'ri-presentation-2-line',
                    title: 'Presentation-ready',
                    desc: 'A visible demo banner in every dashboard keeps context clear when presenting to audiences.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-50 flex-shrink-0 mt-0.5">
                      <i className={`${item.icon} text-teal-600 text-base`}></i>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{item.title}</div>
                      <div className="text-gray-500 text-xs leading-relaxed mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — credentials table */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-white flex items-center gap-2">
                <i className="ri-key-2-line text-teal-600"></i>
                <span className="font-bold text-gray-800 text-sm">Demo Account Credentials</span>
                <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">All use same password</span>
              </div>
              <div className="divide-y divide-gray-100">
                {DEMO_ROLES.map((role) => (
                  <div key={role.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br ${role.gradient} flex-shrink-0`}>
                      <i className={`${role.icon} text-white text-xs`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-700">{role.label}</div>
                      <div className="text-xs text-gray-400 font-mono truncate">{role.email}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 bg-teal-50 border-t border-teal-100 flex items-center gap-2">
                <i className="ri-shield-keyhole-line text-teal-600 text-sm"></i>
                <span className="text-xs text-teal-700">
                  Password: <strong className="font-mono">Demo@GoSmart2024</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA footer ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-white font-bold text-xl mb-1">Ready to get your school on Go Smart MIS?</h3>
            <p className="text-teal-100 text-sm">Set up your school in minutes. Full features, real support.</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href="https://gosmartmis.rw/register"
              className="bg-white text-teal-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-teal-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Register Your School
            </a>
            <a
              href="https://gosmartmis.rw"
              className="text-white/80 hover:text-white text-sm font-medium underline underline-offset-2 cursor-pointer whitespace-nowrap"
            >
              Learn more
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
