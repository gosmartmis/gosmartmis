import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordReset } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

export default function ForgotPasswordPage() {
  const { schoolRecord } = useTenant();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const primaryColor = schoolRecord?.primary_color || '#0d9488';
  const secondaryColor = schoolRecord?.secondary_color || '#059669';
  const btnStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
  };
  const textStyle: React.CSSProperties = { color: primaryColor };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordReset(email.trim());
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-white to-teal-50/40 overflow-x-hidden">

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden">
        <img
          src="https://readdy.ai/api/search-image?query=modern%20school%20campus%20building%20with%20students%20walking%2C%20bright%20sunny%20day%2C%20clean%20architecture%2C%20lush%20green%20surroundings%2C%20professional%20educational%20environment%2C%20warm%20natural%20light%2C%20minimalist%20aesthetic%2C%20high%20quality%20photography&width=800&height=1080&seq=login-bg-01&orientation=portrait"
          alt="School campus"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 via-teal-800/70 to-emerald-900/80" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div className="flex items-center gap-3">
            {schoolRecord?.logo_url ? (
              <img src={schoolRecord.logo_url} alt={schoolRecord.name} className="h-12 w-12 object-contain rounded-full border-2 border-white/30" />
            ) : (
              <img src="https://static.readdy.ai/image/d7eb4a7e93d99b74b32bb102c193d15a/009057a20b674fc10ec4bca9372f81d6.jpeg" alt="Go Smart" className="h-12 w-12 object-contain rounded-full border-2 border-white/30" />
            )}
            <span className="text-white text-xl font-bold">
              {schoolRecord?.name || 'Go Smart M.I.S'}
            </span>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Secure access<br />to your<br />portal
            </h2>
            <p className="text-teal-100 text-sm leading-relaxed max-w-xs">
              We&apos;ll send a secure link to your email so you can reset your password and get back in.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              {[
                { icon: 'ri-shield-check-line', text: 'Secure password reset link' },
                { icon: 'ri-time-line', text: 'Link expires in 24 hours' },
                { icon: 'ri-mail-check-line', text: 'Sent directly to your email' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-teal-100 text-sm">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 flex-shrink-0">
                    <i className={`${item.icon} text-teal-200`} />
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            {schoolRecord?.logo_url ? (
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

          <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-10">

            {success ? (
              /* ── Success state ── */
              <div className="text-center py-6">
                <div className="w-20 h-20 flex items-center justify-center rounded-full bg-teal-50 mx-auto mb-5">
                  <i className="ri-mail-check-line text-4xl text-teal-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h1>
                <p className="text-gray-500 text-sm leading-relaxed mb-1">
                  We&apos;ve sent a password reset link to
                </p>
                <p className="font-semibold text-gray-800 text-sm mb-6 break-all">{email}</p>
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-left mb-6 space-y-2">
                  {[
                    'Check your spam/junk folder if you don\'t see it',
                    'The link expires in 24 hours',
                    'Only the most recent link will work',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-teal-700">
                      <i className="ri-information-line mt-0.5 flex-shrink-0" />
                      {tip}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setSuccess(false); setEmail(''); }}
                  className="text-sm font-medium hover:underline cursor-pointer"
                  style={textStyle}
                >
                  Didn&apos;t receive it? Send again
                </button>
                <div className="mt-6">
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                  >
                    <i className="ri-arrow-left-line" />
                    Back to sign in
                  </Link>
                </div>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-arrow-left-line" />Back to sign in
                </Link>

                {/* Icon */}
                <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-teal-50 border border-teal-100 mb-6">
                  <i className="ri-lock-password-line text-2xl text-teal-600" />
                </div>

                <div className="mb-7">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reset your password</h1>
                  <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
                    Enter your registered email and we&apos;ll send you a secure link to reset it.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <i className="ri-mail-line text-sm" />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        placeholder="you@school.edu"
                        className="w-full pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
                      <i className="ri-error-warning-line mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-70 cursor-pointer whitespace-nowrap"
                    style={btnStyle}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="ri-loader-4-line animate-spin" />Sending reset link...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <i className="ri-send-plane-line" />Send Reset Link
                      </span>
                    )}
                  </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-6">
                  Remember your password?{' '}
                  <Link to="/login" className="font-medium hover:underline" style={textStyle}>
                    Sign in here
                  </Link>
                </p>
              </>
            )}
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Still having trouble?{' '}
            <a href="mailto:support@gosmartmis.rw" className="font-medium hover:underline" style={textStyle} rel="nofollow">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
