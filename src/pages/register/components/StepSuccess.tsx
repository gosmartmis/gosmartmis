interface Props {
  schoolName: string;
  slug: string;
  directorEmail: string;
  tempPassword: string | null;
  resetLink: string;
  trialExpiry: string;
  emailSent: boolean;
  plan: string;
}

export default function StepSuccess({ schoolName, slug, directorEmail, tempPassword, resetLink, trialExpiry, emailSent, plan }: Props) {
  const portalUrl = `https://${slug}.gosmartmis.rw`;
  const loginUrl = `${portalUrl}/login`;

  return (
    <div className="text-center space-y-6">
      {/* Celebration */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white text-4xl mb-4">
          <i className="ri-rocket-line"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">🎉 Your School is Live!</h2>
        <p className="text-gray-500 text-sm">{schoolName} is now on GoSmart MIS</p>
      </div>

      {/* Portal URL */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
        <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">Your School Portal</p>
        <a
          href={loginUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-600 font-bold text-lg hover:underline break-all"
        >
          {portalUrl}
        </a>
        <p className="text-xs text-teal-600 mt-1 opacity-80">Click to visit your school&apos;s public landing page</p>
      </div>

      {/* Credentials */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 text-left space-y-3">
        <p className="text-sm font-bold text-gray-900">Director Login Credentials</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center gap-3">
            <span className="text-gray-500 text-xs">Email</span>
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-800 break-all">{directorEmail}</span>
          </div>
          {tempPassword && (
            <div className="flex justify-between items-center gap-3">
              <span className="text-gray-500 text-xs">Temp Password</span>
              <span className="font-mono text-sm bg-amber-100 px-2 py-1 rounded text-amber-800 font-bold">{tempPassword}</span>
            </div>
          )}
          <div className="flex justify-between items-center gap-3">
            <span className="text-gray-500 text-xs">Login URL</span>
            <a href={loginUrl} className="text-teal-600 text-xs font-semibold hover:underline">{loginUrl}</a>
          </div>
          {plan === 'trial' && (
            <div className="flex justify-between items-center gap-3">
              <span className="text-gray-500 text-xs">Trial Expires</span>
              <span className="text-xs font-semibold text-amber-700">{trialExpiry}</span>
            </div>
          )}
        </div>
      </div>

      {emailSent && (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <i className="ri-mail-check-line text-emerald-600 text-lg flex-shrink-0"></i>
          <p className="text-sm text-emerald-800">Login details sent to <strong>{directorEmail}</strong></p>
        </div>
      )}

      {resetLink && (
        <a
          href={resetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap text-center"
        >
          <i className="ri-key-line mr-2"></i>Set Permanent Password
        </a>
      )}

      <a
        href={loginUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-3.5 border-2 border-teal-500 text-teal-600 rounded-xl font-bold text-sm hover:bg-teal-50 transition-colors cursor-pointer whitespace-nowrap text-center"
      >
        <i className="ri-external-link-line mr-2"></i>Open School Portal
      </a>

      {/* Next steps */}
      <div className="bg-gray-50 rounded-2xl p-5 text-left border border-gray-100">
        <p className="text-sm font-bold text-gray-900 mb-3">Quick Start Checklist</p>
        <ol className="space-y-2">
          {[
            'Log in and set your permanent password',
            'Set up your Academic Year and Terms',
            'Add your Classes and Subjects',
            'Register teachers and assign classes',
            'Start enrolling students',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
