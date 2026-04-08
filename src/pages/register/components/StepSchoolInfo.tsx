import { useState, useEffect, useCallback } from 'react';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.VITE_PUBLIC_SUPABASE_URL as string | undefined);

const CHECK_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/register-school`
  : '';

const COLORS = [
  { hex: '#0d9488', name: 'Teal' },
  { hex: '#059669', name: 'Emerald' },
  { hex: '#dc2626', name: 'Red' },
  { hex: '#ea580c', name: 'Orange' },
  { hex: '#d97706', name: 'Amber' },
  { hex: '#16a34a', name: 'Green' },
  { hex: '#db2777', name: 'Pink' },
  { hex: '#9333ea', name: 'Purple' },
];

export interface SchoolInfoData {
  schoolName: string;
  slug: string;
  phone: string;
  address: string;
  primaryColor: string;
}

interface Props {
  data: SchoolInfoData;
  onChange: (d: SchoolInfoData) => void;
  onNext: () => void;
}

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function StepSchoolInfo({ data, onChange, onNext }: Props) {
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [slugMsg, setSlugMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof SchoolInfoData, val: string) => onChange({ ...data, [key]: val });

  // Auto-generate slug from school name
  const handleNameChange = (name: string) => {
    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    onChange({ ...data, schoolName: name, slug: autoSlug });
  };

  const checkSlug = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) { setSlugStatus('idle'); setSlugMsg(''); return; }
    if (!CHECK_URL) {
      setSlugStatus('invalid');
      setSlugMsg('Supabase URL is missing. Set VITE_SUPABASE_URL (or VITE_PUBLIC_SUPABASE_URL).');
      return;
    }
    setSlugStatus('checking');
    try {
      const res = await fetch(`${CHECK_URL}?slug=${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (json.error) { setSlugStatus('invalid'); setSlugMsg(json.error); }
      else if (json.available) { setSlugStatus('available'); setSlugMsg(`✓ "${slug}.gosmartmis.rw" is available!`); }
      else { setSlugStatus('taken'); setSlugMsg('This subdomain is already taken. Try another.'); }
    } catch { setSlugStatus('idle'); setSlugMsg(''); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => checkSlug(data.slug), 600);
    return () => clearTimeout(t);
  }, [data.slug, checkSlug]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.schoolName.trim()) e.schoolName = 'School name is required';
    if (!data.slug.trim()) e.slug = 'Subdomain is required';
    if (slugStatus === 'taken' || slugStatus === 'invalid') e.slug = slugMsg;
    if (!data.phone.trim()) e.phone = 'Phone number is required';
    if (!data.address.trim()) e.address = 'Address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate()) onNext(); };

  const slugColor = slugStatus === 'available' ? 'text-emerald-600' : slugStatus === 'taken' || slugStatus === 'invalid' ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">School Name *</label>
        <input
          type="text"
          value={data.schoolName}
          onChange={e => handleNameChange(e.target.value)}
          placeholder="e.g. Go Smart Future Academy"
          className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${errors.schoolName ? 'border-red-400' : 'border-gray-200'}`}
        />
        {errors.schoolName && <p className="mt-1 text-xs text-red-500">{errors.schoolName}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subdomain (Your School URL) *</label>
        <div className="flex items-center border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/40 border-gray-200">
          <input
            type="text"
            value={data.slug}
            onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="yourschool"
            className="flex-1 px-4 py-3 text-sm focus:outline-none"
          />
          <span className="px-3 py-3 bg-gray-50 text-gray-500 text-sm border-l border-gray-200 whitespace-nowrap">.gosmartmis.rw</span>
        </div>
        {slugStatus === 'checking' && <p className="mt-1 text-xs text-gray-400"><i className="ri-loader-4-line animate-spin mr-1"></i>Checking availability…</p>}
        {slugMsg && slugStatus !== 'checking' && <p className={`mt-1 text-xs font-medium ${slugColor}`}>{slugMsg}</p>}
        {errors.slug && !slugMsg && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number *</label>
          <input
            type="tel"
            value={data.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="+250 788 000 000"
            className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">School Address *</label>
          <input
            type="text"
            value={data.address}
            onChange={e => set('address', e.target.value)}
            placeholder="Kigali, Rwanda"
            className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${errors.address ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Color</label>
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map(c => (
            <button
              key={c.hex}
              type="button"
              onClick={() => set('primaryColor', c.hex)}
              title={c.name}
              className={`w-9 h-9 rounded-full border-4 transition-all cursor-pointer ${data.primaryColor === c.hex ? 'border-gray-800 scale-110' : 'border-transparent hover:border-gray-300'}`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">This color will theme your school&apos;s public landing page.</p>
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={slugStatus === 'checking' || slugStatus === 'taken' || slugStatus === 'invalid'}
        className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap disabled:opacity-50"
      >
        Continue <i className="ri-arrow-right-line ml-1"></i>
      </button>
    </div>
  );
}
