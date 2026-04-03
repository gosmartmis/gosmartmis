import type { SchoolInfoData } from './StepSchoolInfo';
import type { DirectorData } from './StepDirector';
import type { PlanId } from './StepPlan';

const PLAN_LABELS: Record<PlanId, string> = {
  trial: 'Free Trial (14 days)',
  nursery: 'Nursery Package — RWF 50,000/month',
  primary: 'Primary Package — RWF 75,000/month',
  'nursery-primary': 'Nursery + Primary — RWF 100,000/month',
};

interface Props {
  schoolInfo: SchoolInfoData;
  director: DirectorData;
  plan: PlanId;
  submitting: boolean;
  submitError: string;
  onSubmit: () => void;
  onBack: () => void;
}

export default function StepReview({ schoolInfo, director, plan, submitting, submitError, onSubmit, onBack }: Props) {
  const rows = [
    { label: 'School Name', value: schoolInfo.schoolName },
    { label: 'Portal URL', value: `${schoolInfo.slug}.gosmartmis.rw` },
    { label: 'Phone', value: schoolInfo.phone },
    { label: 'Address', value: schoolInfo.address },
    { label: 'Director Name', value: director.directorName },
    { label: 'Director Email', value: director.directorEmail },
    { label: 'Plan', value: PLAN_LABELS[plan] },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Please review your details before launching your school portal.</p>

      <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
        {rows.map((row, i) => (
          <div key={i} className="flex items-start justify-between gap-3 px-4 py-3">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap flex-shrink-0">{row.label}</span>
            <span className={`text-sm font-medium text-right break-all ${row.label === 'Portal URL' ? 'text-teal-600 font-mono' : 'text-gray-900'}`}>
              {row.label === 'Portal URL' ? `🌐 ${row.value}` : row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Brand color preview */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Brand Color</span>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: schoolInfo.primaryColor }}></div>
          <span className="text-xs font-mono text-gray-600">{schoolInfo.primaryColor}</span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <i className="ri-information-line text-amber-600 text-lg flex-shrink-0 mt-0.5"></i>
        <p className="text-xs text-amber-800 leading-relaxed">
          By launching, we&apos;ll create your school portal and send login credentials to <strong>{director.directorEmail}</strong>.
          {plan === 'trial' && ' Your 14-day free trial starts immediately — no payment required.'}
        </p>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <i className="ri-error-warning-line text-red-500 text-lg flex-shrink-0"></i>
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} disabled={submitting}
          className="flex-1 py-3.5 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50">
          <i className="ri-arrow-left-line mr-1"></i> Back
        </button>
        <button type="button" onClick={onSubmit} disabled={submitting}
          className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap disabled:opacity-70">
          {submitting
            ? <><i className="ri-loader-4-line animate-spin mr-2"></i>Launching…</>
            : <><i className="ri-rocket-line mr-2"></i>Launch My School Portal</>}
        </button>
      </div>
    </div>
  );
}
