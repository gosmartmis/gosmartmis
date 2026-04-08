import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { getSubdomainInfo } from '../../utils/subdomain';
import { supabase, signInWithEmail, sendPasswordReset, type UserProfile } from '../../lib/supabase';
import ForceChangePassword from './ForceChangePassword';

const normalizeRole = (role?: string | null) => {
  if (!role) return '';
  return role === 'school-manager' ? 'school_manager' : role;
};

// ─── School color helper ───────────────────────────────────────────────────
function useSchoolColors(primary?: string | null, secondary?: string | null) {
  const p = primary || '#0d9488';
  const s = secondary || '#059669';
  return useMemo(() => ({
    primary: p,
    secondary: s,
    btn: { background: `linear-gradient(135deg, ${p}, ${s})` } as React.CSSProperties,
    panelBg: { background: `linear-gradient(145deg, ${p}ee, ${s}cc)` } as React.CSSProperties,
    ringFocus: { '--tw-ring-color': `${p}55` } as React.CSSProperties,
    text: { color: p } as React.CSSProperties,
    badgeBg: { backgroundColor: `${p}18`, borderColor: `${p}44`, color: p } as React.CSSProperties,
  }), [p, s]);
}

const ALL_ROLES = [
  { id: 'school_manager', label: 'School Manager', icon: 'ri-settings-3-line', color: 'from-slate-500 to-gray-600', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', route: '/school-manager', description: 'School operations management' },
  { id: 'super-admin', label: 'Super Admin', icon: 'ri-shield-star-line', color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', route: '/super-admin', description: 'System-wide administration' },
  { id: 'director', label: 'Director', icon: 'ri-building-2-line', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', route: '/director', description: 'School-level management' },
  { id: 'dean', label: 'Dean', icon: 'ri-user-star-line', color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', route: '/dean', description: 'Academic oversight' },
  { id: 'registrar', label: 'Registrar', icon: 'ri-file-list-3-line', color: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', route: '/registrar', description: 'Enrollment & records' },
  { id: 'accountant', label: 'Accountant', icon: 'ri-money-dollar-circle-line', color: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', route: '/accountant', description: 'Financial management' },
  { id: 'teacher', label: 'Teacher', icon: 'ri-book-open-line', color: 'from-teal-500 to-cyan-600', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', route: '/teacher', description: 'Classes & grading' },
  { id: 'student', label: 'Student', icon: 'ri-graduation-cap-line', color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', route: '/student', description: 'Grades & attendance' },
];

// ─── Forgot Password ───────────────────────────────────────────────────────
function ForgotPasswordScreen({ onBack, schoolColors }: { onBack: () => void; schoolColors: ReturnType<typeof useSchoolColors> }) {
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setForgotError('Please enter your email address.'); return; }
    setForgotLoading(true); setForgotError('');
    try {
      await sendPasswordReset(forgotEmail);
      setForgotSuccess(true);
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-teal-50/40 items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer whitespace-nowrap">
            <i className="ri-arrow-left-line" />Back to sign in
          </button>
          {forgotSuccess ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-teal-50 mx-auto mb-4">
                <i className="ri-mail-check-line text-3xl text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-gray-500 text-sm">Reset link sent to <strong>{forgotEmail}</strong></p>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
                <p className="text-gray-500 text-sm mt-1">Enter your email to receive a reset link</p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><i className="ri-mail-line text-sm" /></span>
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@school.edu" className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white" />
                  </div>
                </div>
                {forgotError && (
                  <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
                    <i className="ri-error-warning-line" /><span>{forgotError}</span>
                  </div>
                )}
                <button type="submit" disabled={forgotLoading} className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-70 cursor-pointer whitespace-nowrap" style={schoolColors.btn}>
                  {forgotLoading ? <span className="flex items-center justify-center gap-2"><i className="ri-loader-4-line animate-spin" />Sending...</span> : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── School Left Panel ─────────────────────────────────────────────────────
function SchoolPanel({ schoolRecord, schoolColors }: {
  schoolRecord: { name: string; slug: string; logo_url?: string | null; contact_email?: string | null; address?: string | null };
  schoolColors: ReturnType<typeof useSchoolColors>;
}) {
  const logo = schoolRecord.logo_url;
  return (
    <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden flex-col justify-between p-10" style={schoolColors.panelBg}>
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/10" style={{ transform: 'translate(30%,-30%)' }}></div>
      <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/10" style={{ transform: 'translate(-30%,30%)' }}></div>

      {/* Top — school identity */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-10">
          {logo ? (
            <img src={logo} alt={schoolRecord.name} className="w-12 h-12 object-contain rounded-xl bg-white/20 p-1" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/25 flex items-center justify-center text-white font-bold text-xl">
              {schoolRecord.name.charAt(0)}
            </div>
          )}
          <span className="text-white text-xl font-bold">{schoolRecord.name}</span>
        </div>
      </div>

      {/* Centre — big message */}
      <div className="relative z-10 flex-1 flex flex-col justify-center">
        {logo && (
          <img src={logo} alt={schoolRecord.name} className="w-24 h-24 object-contain rounded-2xl bg-white/20 p-2 mb-8" />
        )}
        {!logo && (
          <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-5xl mb-8">
            {schoolRecord.name.charAt(0)}
          </div>
        )}
        <h2 className="text-4xl font-bold text-white leading-tight mb-3">
          Welcome back<br />to {schoolRecord.name}
        </h2>
        <p className="text-white/75 text-sm leading-relaxed max-w-xs">
          Your student portal gives you instant access to grades, attendance, timetables, and messages.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {[
            { icon: 'ri-file-text-line', label: 'Report Cards' },
            { icon: 'ri-calendar-check-line', label: 'Attendance' },
            { icon: 'ri-bar-chart-line', label: 'Grades' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-2">
              <i className={`${f.icon} text-white text-sm`}></i>
              <span className="text-white text-xs font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom — powered by */}
      <div className="relative z-10 flex items-center gap-2 mt-10">
        <img src="https://static.readdy.ai/image/d7eb4a7e93d99b74b32bb102c193d15a/009057a20b674fc10ec4bca9372f81d6.jpeg" alt="Go Smart" className="w-7 h-7 rounded-full border-2 border-white/30 object-contain" />
        <span className="text-white/60 text-xs">Powered by <span className="text-white/90 font-semibold">Go Smart M.I.S</span></span>
      </div>
    </div>
  );
}

// ─── Platform Left Panel ───────────────────────────────────────────────────
function PlatformPanel() {
  return (
    <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden">
      <img src="https://readdy.ai/api/search-image?query=modern%20school%20campus%20building%20with%20students%20walking%2C%20bright%20sunny%20day%2C%20clean%20architecture%2C%20lush%20green%20surroundings%2C%20professional%20educational%20environment%2C%20warm%20natural%20light%2C%20minimalist%20aesthetic%2C%20high%20quality%20photography&width=800&height=1080&seq=login-bg-01&orientation=portrait" alt="School campus" className="absolute inset-0 w-full h-full object-cover object-top" />
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 via-teal-800/70 to-emerald-900/80" />
      <div className="relative z-10 flex flex-col justify-between p-10 w-full">
        <div className="flex items-center gap-3">
          <img src="https://static.readdy.ai/image/d7eb4a7e93d99b74b32bb102c193d15a/009057a20b674fc10ec4bca9372f81d6.jpeg" alt="Go Smart" className="h-12 w-12 object-contain rounded-full border-2 border-white/30" />
          <span className="text-white text-xl font-bold">Go Smart M.I.S</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">Empowering<br />Education<br />Together</h2>
          <p className="text-teal-100 text-sm leading-relaxed max-w-xs">A unified platform for schools, teachers, students, and administrators to collaborate and grow.</p>
          <div className="mt-8 flex gap-4">
            {['500+', '50K+', '98%'].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 text-center">
                <div className="text-white font-bold text-lg">{stat}</div>
                <div className="text-teal-200 text-xs mt-0.5">{['Schools', 'Students', 'Satisfaction'][i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main LoginPage ────────────────────────────────────────────────────────
export default function LoginPage() {
  const { schoolId, schoolRecord } = useTenant();
  const subdomainInfo = getSubdomainInfo();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isSchoolSubdomain = subdomainInfo.isSchool;
  const isSuperAdminSubdomain = subdomainInfo.isSuperAdmin;

  const schoolColors = useSchoolColors(
    schoolRecord?.primary_color,
    schoolRecord?.secondary_color,
  );

  const [selectedRole, setSelectedRole] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'role' | 'credentials' | 'force_change'>('role');
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);

  // ── Detect existing session that still requires a password change ──────────
  // Covers two cases:
  //   1. User refreshes while on the login page before completing force-change
  //   2. ProtectedRoute redirected here with ?must_change=1
  useEffect(() => {
    const mustChangeParam = searchParams.get('must_change');
    const mustChangeCached = sessionStorage.getItem('must_change_password');

    // Only run the check if either signal is present
    if (mustChangeParam !== '1' && mustChangeCached !== 'true') return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.must_change_password) {
            setPendingProfile(data as UserProfile);
            setStep('force_change');
          }
        });
    });
  }, []);

  // Registration number login: detect pattern like GS001/2026
  const isRegNumber = (val: string) => /^[A-Za-z]{1,8}\d{1,6}\/\d{4}$/.test(val.trim());
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Determine which roles to show
  const availableRoles = useMemo(() => {
    if (isSuperAdminSubdomain) return ALL_ROLES.filter((r) => r.id === 'super-admin');
    if (isSchoolSubdomain) return ALL_ROLES.filter((r) => r.id !== 'super-admin');
    return ALL_ROLES;
  }, [isSchoolSubdomain, isSuperAdminSubdomain]);

  const selectedRoleData = ALL_ROLES.find((r) => r.id === selectedRole);

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setStep('credentials');
    setError('');
  };

  const handleBack = () => { setStep('role'); setError(''); setEmail(''); setPassword(''); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email or registration number.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }

    setLoading(true);
    setError('');

    try {
      let loginEmail = email.trim();

      // Registration number login for students
      if (selectedRole === 'student' && isRegNumber(email)) {
        const lookupRes = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/lookup-reg-number`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registration_number: email.trim().toUpperCase(),
              school_slug: schoolRecord?.slug ?? undefined,
            }),
          }
        );
        const lookupData = await lookupRes.json();
        if (!lookupData.found) {
          setError(lookupData.error || 'Registration number not found. Please check and try again.');
          setLoading(false);
          return;
        }
        loginEmail = lookupData.email;
      }

      const profile = await signInWithEmail(loginEmail, password);

      const normalizedProfileRole = normalizeRole(profile.role);

      if (normalizedProfileRole !== selectedRole) {
        setError(`This account is registered as "${profile.role}". Please go back and select the correct role.`);
        setLoading(false);
        return;
      }

      if (
        isSchoolSubdomain &&
        schoolId &&
        profile.role !== 'super-admin' &&
        profile.school_id &&
        profile.school_id !== schoolId
      ) {
        setError('You do not belong to this school. Please contact your administrator.');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('user_role', normalizedProfileRole);
      sessionStorage.setItem('user_email', profile.email);
      sessionStorage.setItem('user_name', profile.full_name);
      if (profile.school_id) sessionStorage.setItem('user_school_id', profile.school_id);

      // ── Force password change for first-time logins ───────────────────────
      if (profile.must_change_password) {
        setPendingProfile(profile);
        setStep('force_change');
        setLoading(false);
        return;
      }

      const routeMap: Record<string, string> = {
        'super-admin': '/super-admin', 'director': '/director', 'school_manager': '/school-manager',
        'dean': '/dean', 'registrar': '/registrar', 'accountant': '/accountant',
        'teacher': '/teacher', 'student': '/student',
      };
      navigate(routeMap[normalizedProfileRole] || '/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return <ForgotPasswordScreen onBack={() => setShowForgotPassword(false)} schoolColors={schoolColors} />;
  }

  // ── Force password change screen ──────────────────────────────────────────
  if (step === 'force_change' && pendingProfile) {
    const routeMap: Record<string, string> = {
      'super-admin': '/super-admin', director: '/director', 'school_manager': '/school-manager',
      dean: '/dean', registrar: '/registrar', accountant: '/accountant',
      teacher: '/teacher', student: '/student',
    };
    return (
      <ForceChangePassword
        userFullName={pendingProfile.full_name}
        userRole={pendingProfile.role}
        userId={pendingProfile.id}
        onSuccess={() => {
          sessionStorage.removeItem('must_change_password');
          navigate(routeMap[normalizeRole(pendingProfile.role)] || '/');
        }}
      />
    );
  }

  const accentBtn = isSchoolSubdomain ? schoolColors.btn : { background: 'linear-gradient(135deg, #0d9488, #059669)' };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-white to-teal-50/40 overflow-x-hidden">

      {/* ── Left panel ── */}
      {isSchoolSubdomain && schoolRecord ? (
        <SchoolPanel schoolRecord={schoolRecord} schoolColors={schoolColors} />
      ) : (
        <PlatformPanel />
      )}

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            {isSchoolSubdomain && schoolRecord?.logo_url ? (
              <>
                <img src={schoolRecord.logo_url} alt={schoolRecord.name} className="h-10 w-10 object-contain rounded-lg" />
                <span className="text-gray-900 text-lg font-bold">{schoolRecord.name}</span>
              </>
            ) : (
              <>
                <img src="https://static.readdy.ai/image/d7eb4a7e93d99b74b32bb102c193d15a/009057a20b674fc10ec4bca9372f81d6.jpeg" alt="Go Smart" className="h-10 w-10 object-contain rounded-full" />
                <span className="text-gray-900 text-lg font-bold">Go Smart M.I.S</span>
              </>
            )}
          </div>

          {/* School / subdomain context badge */}
          {(isSchoolSubdomain || isSuperAdminSubdomain) && (
            <div className="mb-6 p-3 rounded-xl border flex items-center gap-2 text-sm" style={isSchoolSubdomain ? schoolColors.badgeBg : { backgroundColor: '#fdf2f8', borderColor: '#f9a8d4', color: '#be185d' }}>
              {isSchoolSubdomain ? (
                <>
                  {schoolRecord?.logo_url && (
                    <img src={schoolRecord.logo_url} alt="" className="w-5 h-5 rounded object-contain" />
                  )}
                  {!schoolRecord?.logo_url && <i className="ri-building-4-line"></i>}
                  <span className="font-medium">{schoolRecord?.name || subdomainInfo.schoolSlug}</span>
                  <span className="text-gray-400 text-xs ml-auto">School Portal</span>
                </>
              ) : (
                <>
                  <i className="ri-shield-star-line"></i>
                  <span className="font-semibold">Super Admin Portal</span>
                </>
              )}
            </div>
          )}

          {/* Step: Role selection */}
          {step === 'role' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {isSchoolSubdomain ? `Sign in to ${schoolRecord?.name || 'your school portal'}` : 'Select your role to sign in'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {availableRoles.map((role) => (
                  <button key={role.id} onClick={() => handleRoleSelect(role.id)} className={`relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer text-center ${selectedRole === role.id ? `${role.border} ${role.bg} scale-[1.02]` : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}`}>
                    {selectedRole === role.id && (
                      <span className="absolute top-2 right-2 w-4 h-4 flex items-center justify-center">
                        <i className={`ri-checkbox-circle-fill text-sm ${role.text}`} />
                      </span>
                    )}
                    <div className={`w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br ${role.color}`}>
                      <i className={`${role.icon} text-white text-lg`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{role.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-tight line-clamp-2">{role.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <div className="flex items-start gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5 mb-4">
                  <i className="ri-error-warning-line mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-center text-xs text-gray-400 mt-4">
                Having trouble? <a href="#" rel="nofollow" className="hover:underline font-medium" style={schoolColors.text}>Contact support</a>
              </p>
              <p className="text-center text-xs text-gray-400 mt-2">
                <Link to="/forgot-password" className="hover:underline font-medium" style={schoolColors.text}>Forgot your password?</Link>
              </p>
            </>
          )}

          {/* Step: Credentials */}
          {step === 'credentials' && (
            <>
              <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer whitespace-nowrap">
                <i className="ri-arrow-left-line" />Back to role selection
              </button>

              {selectedRoleData && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${selectedRoleData.bg} ${selectedRoleData.border} border mb-6`}>
                  <div className={`w-5 h-5 flex items-center justify-center rounded-md bg-gradient-to-br ${selectedRoleData.color}`}>
                    <i className={`${selectedRoleData.icon} text-white text-xs`} />
                  </div>
                  <span className={`text-xs font-semibold ${selectedRoleData.text}`}>{selectedRoleData.label}</span>
                </div>
              )}

              <div className="mb-7">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sign in</h1>
                <p className="text-gray-500 text-sm mt-1">Enter your credentials to access your dashboard</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    {selectedRole === 'student' ? 'Email or Registration Number' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <i className={selectedRole === 'student' ? 'ri-id-card-line text-sm' : 'ri-mail-line text-sm'} />
                    </span>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedRole === 'student' ? 'GS001/2026 or you@school.edu' : 'you@school.edu'}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white"
                    />
                  </div>
                  {selectedRole === 'student' && (
                    <p className="text-xs text-gray-400 mt-1">You can use your registration number (e.g. GS001/2026) or email</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-600">Password</label>
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs font-medium hover:underline cursor-pointer whitespace-nowrap" style={schoolColors.text}>Forgot password?</button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><i className="ri-lock-line text-sm" /></span>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                      <i className={showPassword ? 'ri-eye-off-line text-sm' : 'ri-eye-line text-sm'} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-gray-300 accent-teal-600 cursor-pointer" />
                  <label htmlFor="remember" className="text-xs text-gray-500 cursor-pointer">Keep me signed in for 30 days</label>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
                    <i className="ri-error-warning-line mt-0.5 flex-shrink-0" />
                    <span className="break-words">{error}</span>
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-70 cursor-pointer whitespace-nowrap mt-2" style={accentBtn}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="ri-loader-4-line animate-spin" />Signing in...
                    </span>
                  ) : (
                    <span>Sign In <i className="ri-login-box-line ml-2" /></span>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-6">
                Need an account? <a href="#" rel="nofollow" className="font-medium hover:underline" style={schoolColors.text}>Contact your administrator</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
