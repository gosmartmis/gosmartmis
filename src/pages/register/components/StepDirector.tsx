import { useState } from 'react';

export interface DirectorData {
  directorName: string;
  directorEmail: string;
}

interface Props {
  data: DirectorData;
  onChange: (d: DirectorData) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepDirector({ data, onChange, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof DirectorData, val: string) => onChange({ ...data, [key]: val });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.directorName.trim()) e.directorName = 'Full name is required';
    if (!data.directorEmail.trim()) e.directorEmail = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.directorEmail)) e.directorEmail = 'Enter a valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="space-y-5">
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex gap-3">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <i className="ri-information-line text-teal-600 text-lg"></i>
        </div>
        <div>
          <p className="text-sm font-semibold text-teal-800 mb-0.5">Director Account</p>
          <p className="text-xs text-teal-700 leading-relaxed">
            This creates the primary administrator account with full access to the school management system.
            A temporary password will be sent to this email.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Director&apos;s Full Name *</label>
        <input
          type="text"
          value={data.directorName}
          onChange={e => set('directorName', e.target.value)}
          placeholder="e.g. Dr. Marie Uwimana"
          className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${errors.directorName ? 'border-red-400' : 'border-gray-200'}`}
        />
        {errors.directorName && <p className="mt-1 text-xs text-red-500">{errors.directorName}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Director&apos;s Email Address *</label>
        <input
          type="email"
          value={data.directorEmail}
          onChange={e => set('directorEmail', e.target.value)}
          placeholder="director@yourschool.rw"
          className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${errors.directorEmail ? 'border-red-400' : 'border-gray-200'}`}
        />
        {errors.directorEmail && <p className="mt-1 text-xs text-red-500">{errors.directorEmail}</p>}
        <p className="mt-1.5 text-xs text-gray-400">Login credentials and setup instructions will be sent here.</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-xs font-semibold text-gray-600 mb-2">After registration, the director can:</p>
        <ul className="space-y-1.5">
          {[
            'Set up classes, subjects and academic years',
            'Add teachers and configure timetables',
            'Register students and manage enrollments',
            'Access financial reports and payroll',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
              <i className="ri-checkbox-circle-fill text-teal-500 mt-0.5 flex-shrink-0"></i>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack}
          className="flex-1 py-3.5 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap">
          <i className="ri-arrow-left-line mr-1"></i> Back
        </button>
        <button type="button" onClick={() => { if (validate()) onNext(); }}
          className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap">
          Continue <i className="ri-arrow-right-line ml-1"></i>
        </button>
      </div>
    </div>
  );
}
