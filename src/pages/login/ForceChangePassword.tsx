import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Props {
  userFullName: string;
  userRole: string;
  userId: string;
  onSuccess: () => void;
}

function getStrength(pw: string): { score: number; label: string; color: string; bar: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Too weak', color: 'text-red-500', bar: 'bg-red-400' };
  if (score === 2) return { score, label: 'Weak', color: 'text-orange-500', bar: 'bg-orange-400' };
  if (score === 3) return { score, label: 'Fair', color: 'text-amber-500', bar: 'bg-amber-400' };
  if (score === 4) return { score, label: 'Strong', color: 'text-emerald-500', bar: 'bg-emerald-400' };
  return { score, label: 'Very strong', color: 'text-teal-600', bar: 'bg-teal-500' };
}

const ROLE_META: Record<string, { label: string; gradient: string; icon: string }> = {
  student:    { label: 'Student',     gradient: 'from-emerald-500 to-teal-600',   icon: 'ri-graduation-cap-line' },
  teacher:    { label: 'Teacher',     gradient: 'from-indigo-500 to-violet-600',  icon: 'ri-booklet-line' },
  director:   { label: 'Director',    gradient: 'from-amber-500 to-orange-600',   icon: 'ri-building-2-line' },
  dean:       { label: 'Dean',        gradient: 'from-violet-500 to-purple-600',  icon: 'ri-user-star-line' },
  registrar:  { label: 'Registrar',   gradient: 'from-teal-500 to-emerald-600',   icon: 'ri-file-list-line' },
  accountant: { label: 'Accountant',  gradient: 'from-amber-500 to-yellow-600',   icon: 'ri-money-dollar-circle-line' },
  'school-manager': { label: 'School Manager', gradient: 'from-slate-500 to-gray-600', icon: 'ri-settings-3-line' },
};

export default function ForceChangePassword({ userFullName, userRole, userId, onSuccess }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = getStrength(newPassword);
  const firstName = userFullName?.split(' ')[0] || 'there';
  const roleMeta = ROLE_META[userRole] || { label: userRole, gradient: 'from-teal-500 to-emerald-600', icon: 'ri-user-line' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (strength.score < 2) {
      setError('Please choose a stronger password — mix letters, numbers and symbols.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }
    // Prevent reusing the default GoSmart temp password pattern
    if (/^GoSmart@[A-Za-z0-9]{8}$/.test(newPassword)) {
      setError('Please choose a different password from your temporary one.');
      return;
    }

    setLoading(true);
    try {
      // Update Supabase Auth password
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) throw new Error(authError.message);

      // Clear the force-change flag in profile
      await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', userId);

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-teal-50/40 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>

          {/* Top gradient banner */}
          <div className={`bg-gradient-to-r ${roleMeta.gradient} px-8 py-8 text-white`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <i className={`${roleMeta.icon} text-2xl`}></i>
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium">Welcome aboard,</p>
                <h1 className="text-xl font-bold leading-tight">{firstName}!</h1>
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 flex items-start gap-3">
              <i className="ri-shield-keyhole-line text-white/80 text-lg mt-0.5 shrink-0"></i>
              <p className="text-sm text-white/90 leading-relaxed">
                For your security, you must create a personal password before accessing your dashboard. Your temporary password will no longer work after this step.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Set your new password</h2>
            <p className="text-sm text-gray-500 mb-6">Choose something memorable that only you know.</p>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  New Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <i className="ri-lock-password-line text-sm"></i>
                  </span>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className={showNew ? 'ri-eye-off-line text-sm' : 'ri-eye-line text-sm'}></i>
                  </button>
                </div>

                {/* Strength meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 h-1.5 rounded-full transition-all ${i <= strength.score ? strength.bar : 'bg-gray-100'}`}
                        ></div>
                      ))}
                    </div>
                    <p className={`text-xs font-semibold ${strength.color}`}>{strength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <i className="ri-lock-line text-sm"></i>
                  </span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className={showConfirm ? 'ri-eye-off-line text-sm' : 'ri-eye-line text-sm'}></i>
                  </button>
                </div>
                {confirmPassword && newPassword && (
                  <p className={`text-xs mt-1.5 font-medium ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                    {newPassword === confirmPassword
                      ? <><i className="ri-checkbox-circle-line mr-1"></i>Passwords match</>
                      : <><i className="ri-close-circle-line mr-1"></i>Passwords do not match</>
                    }
                  </p>
                )}
              </div>

              {/* Requirements hint */}
              <div className="bg-gray-50 rounded-xl p-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {[
                  { ok: newPassword.length >= 8, text: '8+ characters' },
                  { ok: /[A-Z]/.test(newPassword), text: 'Uppercase letter' },
                  { ok: /[0-9]/.test(newPassword), text: 'Number' },
                  { ok: /[^A-Za-z0-9]/.test(newPassword), text: 'Symbol (!@#...)' },
                ].map((req) => (
                  <span key={req.text} className={`flex items-center gap-1 text-xs ${req.ok ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <i className={req.ok ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'}></i>
                    {req.text}
                  </span>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
                  <i className="ri-error-warning-line mt-0.5 shrink-0"></i>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 cursor-pointer whitespace-nowrap bg-gradient-to-r ${roleMeta.gradient} hover:opacity-90`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i>
                    Saving password…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-shield-check-line"></i>
                    Set Password &amp; Continue
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-5">
          <i className="ri-lock-2-line mr-1"></i>
          Your password is encrypted and never stored in plain text
        </p>
      </div>
    </div>
  );
}
