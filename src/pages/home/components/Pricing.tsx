import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PricingProps {
  pricingBasic?: string;
  pricingPro?: string;
  pricingEnterprise?: string;
  loading?: boolean;
}

function toYearly(monthly: string): string {
  const num = parseFloat(monthly.replace(/,/g, ''));
  if (isNaN(num)) return monthly;
  return Math.round(num * 12 * 0.8).toLocaleString();
}

export default function Pricing({
  pricingBasic = '50,000',
  pricingPro = '75,000',
  pricingEnterprise = '120,000',
  loading,
}: PricingProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const navigate = useNavigate();

  const enterpriseYearly = toYearly(pricingEnterprise);
  const basicYearly = toYearly(pricingBasic);
  const proYearly = toYearly(pricingPro);

  // Original (pre-discount) enterprise monthly = basic + pro
  const enterpriseOriginalMonthly = (() => {
    const b = parseFloat(pricingBasic.replace(/,/g, ''));
    const p = parseFloat(pricingPro.replace(/,/g, ''));
    if (!isNaN(b) && !isNaN(p)) return (b + p).toLocaleString();
    return '';
  })();
  const enterpriseOriginalYearly = (() => {
    const num = parseFloat(enterpriseOriginalMonthly.replace(/,/g, ''));
    if (isNaN(num)) return '';
    return Math.round(num * 12 * 0.8).toLocaleString();
  })();

  const plans = [
    {
      name: 'Demo Plan',
      planId: 'trial',
      price: 'Free',
      duration: '14 days',
      description: 'Perfect for testing the platform',
      features: [
        { text: 'Limited to 50 students', available: true, limited: true },
        { text: 'Basic academic management', available: true },
        { text: 'Student dashboard', available: true },
        { text: 'Attendance tracking', available: true },
        { text: 'Finance module disabled', available: false, limited: true },
        { text: 'Limited reports', available: false, limited: true },
      ],
      badge: 'FREE TRIAL',
      badgeColor: 'bg-green-500',
      buttonStyle: 'border-2 border-gray-300 text-gray-700 hover:border-teal-600 hover:text-teal-600',
      popular: false,
    },
    {
      name: 'Nursery Package',
      planId: 'starter',
      price: loading ? '…' : (billingCycle === 'monthly' ? pricingBasic : basicYearly),
      duration: billingCycle === 'monthly' ? 'per month' : 'per year',
      description: 'Complete solution for nursery schools',
      features: [
        { text: 'Unlimited students', available: true },
        { text: 'Academic management', available: true },
        { text: 'Student & parent dashboard', available: true },
        { text: 'Attendance system', available: true },
        { text: 'Messaging system', available: true },
        { text: 'Finance module', available: true },
        { text: 'Report cards', available: true },
        { text: 'Risk alerts', available: true },
      ],
      buttonStyle: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:shadow-lg',
      popular: false,
    },
    {
      name: 'Primary Package',
      planId: 'pro',
      price: loading ? '…' : (billingCycle === 'monthly' ? pricingPro : proYearly),
      duration: billingCycle === 'monthly' ? 'per month' : 'per year',
      description: 'Designed for primary schools',
      features: [
        { text: 'Unlimited students', available: true },
        { text: 'Advanced academic management', available: true },
        { text: 'Marks approval workflow', available: true },
        { text: 'Student & parent dashboard', available: true },
        { text: 'Attendance system', available: true },
        { text: 'Messaging system', available: true },
        { text: 'Finance module', available: true },
        { text: 'Report cards & analytics', available: true },
        { text: 'Risk alerts', available: true },
        { text: 'Timetable management', available: true },
      ],
      buttonStyle: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:shadow-lg',
      popular: false,
    },
    {
      name: 'Nursery + Primary',
      planId: 'pro',
      price: loading ? '…' : (billingCycle === 'monthly' ? pricingEnterprise : enterpriseYearly),
      duration: billingCycle === 'monthly' ? 'per month' : 'per year',
      description: 'Complete package for both levels',
      originalPrice: loading ? undefined : (billingCycle === 'monthly' ? enterpriseOriginalMonthly : enterpriseOriginalYearly),
      features: [
        { text: 'Everything in both packages', available: true },
        { text: 'Unlimited students', available: true },
        { text: 'Multi-level management', available: true },
        { text: 'Advanced analytics', available: true },
        { text: 'Priority support', available: true },
        { text: 'Custom branding', available: true },
        { text: 'API access', available: true },
        { text: 'Dedicated account manager', available: true },
      ],
      badge: 'MOST POPULAR',
      badgeColor: 'bg-gradient-to-r from-teal-600 to-emerald-600',
      buttonStyle: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:shadow-2xl',
      popular: true,
      glow: true,
    },
  ];

  return (
    <section id="pricing" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <div className="text-teal-600 text-xs font-bold uppercase tracking-widest mb-4">
            FLEXIBLE PRICING
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-gray-900 mb-4 sm:mb-6">
            Choose The Perfect Package For Your School
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Start with our free demo, upgrade anytime. No hidden fees.
          </p>

          <div className="inline-flex items-center gap-2 sm:gap-4 p-1.5 sm:p-2 bg-gray-100 rounded-full">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all relative whitespace-nowrap ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 px-1.5 sm:px-2 py-0.5 bg-green-500 text-white text-[10px] sm:text-xs rounded-full whitespace-nowrap">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all ${
                plan.popular
                  ? 'border-2 border-transparent bg-gradient-to-br from-teal-50 to-emerald-50 shadow-2xl md:scale-105'
                  : plan.name === 'Demo Plan'
                  ? 'border-2 border-dashed border-gray-300'
                  : 'border-2 border-gray-200 hover:border-gray-300'
              } ${plan.glow ? 'shadow-teal-200' : 'shadow-lg hover:shadow-xl'}`}
            >
              {plan.badge && (
                <div className={`absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 sm:py-1.5 ${plan.badgeColor} text-white text-[10px] sm:text-xs font-bold rounded-full whitespace-nowrap`}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-6 pt-2">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  {plan.price !== 'Free' && plan.price !== '…' && (
                    <span className="text-sm sm:text-lg text-gray-600">RWF</span>
                  )}
                  <span className={`text-4xl sm:text-5xl font-black text-gray-900 ${loading ? 'opacity-40' : ''}`}>
                    {plan.price}
                  </span>
                </div>
                {plan.originalPrice && (
                  <div className="text-xs sm:text-sm text-gray-500 line-through mt-1">
                    RWF {plan.originalPrice}
                  </div>
                )}
                <div className="text-xs sm:text-sm text-gray-600 mt-1">{plan.duration}</div>
              </div>

              <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    {feature.available ? (
                      <i className={`ri-checkbox-circle-fill text-base sm:text-lg ${feature.limited ? 'text-orange-500' : 'text-green-500'} flex-shrink-0 mt-0.5`}></i>
                    ) : (
                      <i className="ri-close-circle-fill text-base sm:text-lg text-gray-300 flex-shrink-0 mt-0.5"></i>
                    )}
                    <span className={`text-xs sm:text-sm ${feature.available ? 'text-gray-700' : 'text-gray-400'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate(`/register?plan=${plan.planId}`)}
                className={`w-full py-3 sm:py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all ${plan.buttonStyle} cursor-pointer whitespace-nowrap`}>
                {plan.name === 'Demo Plan' ? 'Start Free Trial' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <a href="#comparison" className="text-teal-600 font-semibold hover:underline inline-flex items-center gap-2 whitespace-nowrap text-sm sm:text-base">
            View detailed feature comparison
            <i className="ri-arrow-right-line"></i>
          </a>
        </div>

        {/* Payment Methods Section */}
        <div className="mt-10 sm:mt-14 rounded-2xl sm:rounded-3xl border border-gray-100 bg-white px-6 sm:px-10 py-6 sm:py-8">
          <p className="text-center text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
            Accepted Payment Methods in Rwanda
          </p>

          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* MTN Mobile Money */}
            <div className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 bg-yellow-400 rounded-xl sm:rounded-2xl">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white/30 rounded-lg flex-shrink-0">
                <i className="ri-smartphone-line text-yellow-900 text-base sm:text-lg"></i>
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-black text-yellow-900 uppercase tracking-wide leading-none">MTN</div>
                <div className="text-[10px] sm:text-xs font-semibold text-yellow-800 leading-none mt-0.5">Mobile Money</div>
              </div>
            </div>

            {/* Airtel Money */}
            <div className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 bg-red-500 rounded-xl sm:rounded-2xl">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white/20 rounded-lg flex-shrink-0">
                <i className="ri-smartphone-line text-white text-base sm:text-lg"></i>
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wide leading-none">AIRTEL</div>
                <div className="text-[10px] sm:text-xs font-semibold text-red-100 leading-none mt-0.5">Airtel Money</div>
              </div>
            </div>

            {/* Bank Transfer */}
            <div className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 bg-gray-100 rounded-xl sm:rounded-2xl">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white rounded-lg flex-shrink-0">
                <i className="ri-bank-line text-gray-600 text-base sm:text-lg"></i>
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-black text-gray-700 uppercase tracking-wide leading-none">BANK</div>
                <div className="text-[10px] sm:text-xs font-semibold text-gray-500 leading-none mt-0.5">Bank Transfer</div>
              </div>
            </div>

            {/* Cash */}
            <div className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 bg-emerald-50 rounded-xl sm:rounded-2xl border border-emerald-100">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-emerald-100 rounded-lg flex-shrink-0">
                <i className="ri-money-cny-circle-line text-emerald-600 text-base sm:text-lg"></i>
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-black text-emerald-800 uppercase tracking-wide leading-none">CASH</div>
                <div className="text-[10px] sm:text-xs font-semibold text-emerald-600 leading-none mt-0.5">In-person payment</div>
              </div>
            </div>
          </div>

          {/* Trust badges row */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-8 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <i className="ri-shield-check-line text-lg text-teal-600"></i>
              </div>
              <span>Secure &amp; Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <i className="ri-refresh-line text-lg text-teal-600"></i>
              </div>
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <i className="ri-customer-service-2-line text-lg text-teal-600"></i>
              </div>
              <span>Rwanda-Based Support</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <i className="ri-map-pin-2-line text-lg text-teal-600"></i>
              </div>
              <span>Prices in RWF — No FX Fees</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
