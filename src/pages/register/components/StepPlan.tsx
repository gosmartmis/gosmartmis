export type PlanId = 'trial' | 'nursery' | 'primary' | 'nursery-primary';

interface Props {
  selected: PlanId;
  onChange: (p: PlanId) => void;
  onNext: () => void;
  onBack: () => void;
}

const PLANS = [
  {
    id: 'trial' as PlanId,
    name: 'Free Trial',
    price: 'Free',
    period: '14 days',
    badge: 'Start here',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-300',
    features: ['Up to 150 students', 'Up to 15 teachers', 'Full portal access', 'No credit card needed'],
  },
  {
    id: 'nursery' as PlanId,
    name: 'Nursery Package',
    price: 'RWF 18,000',
    period: '/month',
    badge: 'Best value',
    badgeColor: 'bg-amber-100 text-amber-700',
    border: 'border-amber-300',
    features: ['Unlimited students', 'All modules included', 'Finance module', 'Email support'],
  },
  {
    id: 'primary' as PlanId,
    name: 'Primary Package',
    price: 'RWF 20,000',
    period: '/month',
    badge: 'Best value',
    badgeColor: 'bg-rose-100 text-rose-700',
    border: 'border-rose-300',
    features: ['Unlimited students', 'All modules included', 'Finance module', 'Priority support'],
  },
  {
    id: 'nursery-primary' as PlanId,
    name: 'Nursery + Primary',
    price: 'RWF 38,000',
    period: '/month',
    badge: 'Most popular',
    badgeColor: 'bg-teal-100 text-teal-700',
    border: 'border-teal-400',
    features: ['Unlimited students', 'Advanced analytics', 'Priority support', 'Custom branding'],
  },
];

export default function StepPlan({ selected, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Choose a plan. You can upgrade anytime after registration.</p>

      <div className="space-y-3">
        {PLANS.map(plan => {
          const isSelected = selected === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onChange(plan.id)}
              className={`w-full text-left rounded-xl border-2 p-4 transition-all cursor-pointer ${
                isSelected ? `${plan.border} bg-white` : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected ? 'border-teal-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-gray-900">{plan.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plan.badgeColor}`}>{plan.badge}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      {plan.features.map((f, i) => (
                        <span key={i} className="text-xs text-gray-500 flex items-center gap-1">
                          <i className="ri-check-line text-teal-500 text-xs"></i>{f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-xs text-gray-400 block">{plan.period}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">Free Trial needs no credit card. Paid plans billed in RWF. Cancel anytime.</p>

      <div className="flex gap-3">
        <button type="button" onClick={onBack}
          className="flex-1 py-3.5 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap">
          <i className="ri-arrow-left-line mr-1"></i> Back
        </button>
        <button type="button" onClick={onNext}
          className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap">
          Review & Launch <i className="ri-arrow-right-line ml-1"></i>
        </button>
      </div>
    </div>
  );
}
