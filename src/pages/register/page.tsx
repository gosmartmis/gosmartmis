import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StepProgress from './components/StepProgress';
import StepSchoolInfo, { type SchoolInfoData } from './components/StepSchoolInfo';
import StepDirector, { type DirectorData } from './components/StepDirector';
import StepPlan, { type PlanId } from './components/StepPlan';
import StepReview from './components/StepReview';
import StepSuccess from './components/StepSuccess';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.VITE_PUBLIC_SUPABASE_URL as string | undefined);

const REGISTER_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/register-school`
  : '';

interface SuccessData {
  school_name: string;
  slug: string;
  director_email: string;
  temp_password: string | null;
  reset_link: string;
  trial_expiry: string;
  email_sent: boolean;
  plan: string;
}

const FEATURES = [
  { icon: 'ri-graduation-cap-line', text: 'Student & teacher portals' },
  { icon: 'ri-file-text-line', text: 'Digital report cards' },
  { icon: 'ri-bar-chart-2-line', text: 'Grades & analytics' },
  { icon: 'ri-wallet-3-line', text: 'Fee & payroll management' },
  { icon: 'ri-calendar-check-line', text: 'Attendance tracking' },
  { icon: 'ri-message-3-line', text: 'Internal messaging' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const [schoolInfo, setSchoolInfo] = useState<SchoolInfoData>({
    schoolName: '', slug: '', phone: '', address: '', primaryColor: '#0d9488',
  });
  const [director, setDirector] = useState<DirectorData>({ directorName: '', directorEmail: '' });
  const [plan, setPlan] = useState<PlanId>(() => {
    const raw = searchParams.get('plan');
    if (raw === 'trial' || raw === 'nursery' || raw === 'primary' || raw === 'nursery-primary') return raw;
    return 'trial';
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      if (!REGISTER_URL) {
        setSubmitError('Supabase URL is missing. Set VITE_SUPABASE_URL (or VITE_PUBLIC_SUPABASE_URL).');
        return;
      }

      const res = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_name: schoolInfo.schoolName,
          slug: schoolInfo.slug,
          phone: schoolInfo.phone,
          address: schoolInfo.address,
          primary_color: schoolInfo.primaryColor,
          director_name: director.directorName,
          director_email: director.directorEmail,
          plan,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Registration failed. Please try again.');
        setSubmitting(false);
        return;
      }
      setSuccessData({
        school_name: data.school_name,
        slug: data.slug,
        director_email: data.director_email,
        temp_password: data.temp_password,
        reset_link: data.reset_link || '',
        trial_expiry: data.trial_expiry || '',
        email_sent: data.email_sent,
        plan,
      });
      setStep(4);
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    'School Information',
    'Director Account',
    'Choose Your Plan',
    'Review & Launch',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex flex-col lg:flex-row">
      {/* Left panel — branding */}
      <div className="lg:w-[420px] xl:w-[480px] bg-gradient-to-b from-teal-600 to-emerald-700 text-white flex flex-col lg:fixed lg:inset-y-0 lg:left-0">
        {/* Top section */}
        <div className="p-6 lg:p-10 flex-1 flex flex-col justify-between">
          <div>
            {/* Brand */}
            <button onClick={() => navigate('/')} className="flex items-center gap-3 mb-8 lg:mb-12 cursor-pointer hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white text-lg font-bold">G</div>
              <div>
                <p className="font-bold text-lg leading-tight">Go Smart M.I.S</p>
                <p className="text-teal-200 text-xs">School Management System</p>
              </div>
            </button>

            <h1 className="text-2xl lg:text-3xl font-bold mb-3 leading-tight">Get your school online in minutes</h1>
            <p className="text-teal-100 text-sm lg:text-base leading-relaxed mb-8">
              Register your school and get a fully branded portal with student management, grades, attendance, payroll and more.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className={`${f.icon} text-sm`}></i>
                  </div>
                  <span className="text-xs text-teal-100">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="hidden lg:block bg-white/10 rounded-2xl p-5 border border-white/20">
            <p className="text-sm text-teal-50 italic mb-3 leading-relaxed">
              &ldquo;Setting up took less than 5 minutes. Our parents and students love the portal — everything is accessible from their phones.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">MU</div>
              <div>
                <p className="text-xs font-semibold">Dr. Marie Uwimana</p>
                <p className="text-xs text-teal-300">Director, Future Academy Kigali</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="px-6 lg:px-10 py-4 border-t border-white/10">
          <p className="text-xs text-teal-300">Already have an account? <button onClick={() => navigate('/login')} className="text-white font-semibold underline cursor-pointer">Login here</button></p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 lg:ml-[420px] xl:ml-[480px] flex items-start justify-center p-4 sm:p-6 lg:p-10 min-h-screen">
        <div className="w-full max-w-xl py-6 lg:py-12">
          {/* Mobile top brand */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-6 lg:hidden cursor-pointer">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">G</div>
            <span className="font-bold text-gray-900 text-sm">Go Smart M.I.S</span>
          </button>

          {step < 4 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              {/* Header */}
              <div className="mb-6">
                <StepProgress current={step} />
                <h2 className="text-xl font-bold text-gray-900">{stepTitles[step]}</h2>
                <p className="text-xs text-gray-400 mt-1">Step {step + 1} of 4</p>
              </div>

              {step === 0 && (
                <StepSchoolInfo data={schoolInfo} onChange={setSchoolInfo} onNext={() => setStep(1)} />
              )}
              {step === 1 && (
                <StepDirector data={director} onChange={setDirector} onNext={() => setStep(2)} onBack={() => setStep(0)} />
              )}
              {step === 2 && (
                <StepPlan selected={plan} onChange={setPlan} onNext={() => setStep(3)} onBack={() => setStep(1)} />
              )}
              {step === 3 && (
                <StepReview
                  schoolInfo={schoolInfo}
                  director={director}
                  plan={plan}
                  submitting={submitting}
                  submitError={submitError}
                  onSubmit={handleSubmit}
                  onBack={() => setStep(2)}
                />
              )}
            </div>
          ) : successData ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              <StepSuccess
                schoolName={successData.school_name}
                slug={successData.slug}
                directorEmail={successData.director_email}
                tempPassword={successData.temp_password}
                resetLink={successData.reset_link}
                trialExpiry={successData.trial_expiry}
                emailSent={successData.email_sent}
                plan={successData.plan}
              />
            </div>
          ) : null}

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            By registering you agree to our Terms of Service. &nbsp;
            <a href="mailto:support@gosmartmis.rw" className="text-teal-600 hover:underline">Need help?</a>
          </p>
        </div>
      </div>
    </div>
  );
}
