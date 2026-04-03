import { useState, useEffect, useRef } from 'react';
import { School } from '../../../hooks/useSchools';
import { supabase } from '../../../lib/supabase';

interface SchoolFormData {
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_package: string;
  billing_cycle: string;
  subscription_start_date: string;
  subscription_expiry_date: string;
  subscription_amount: number;
  subscription_discount: number;
  auto_renew: boolean;
  max_students: number;
  max_teachers: number;
  is_active: boolean;
  disabled_modules: string[];
  // Onboarding fields (create mode only)
  director_name: string;
  director_email: string;
  create_director_account: boolean;
  send_welcome_email: boolean;
}

const AVAILABLE_MODULES = [
  { id: 'timetable', label: 'Timetable' },
  { id: 'marks', label: 'Marks & Grades' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'fees', label: 'Fee Management' },
  { id: 'messages', label: 'Messaging' },
  { id: 'reports', label: 'Report Cards' },
  { id: 'holiday_packages', label: 'Holiday Packages' },
  { id: 'payroll', label: 'Payroll' },
];

const DEFAULT_FORM: SchoolFormData = {
  name: '',
  slug: '',
  address: '',
  phone: '',
  email: '',
  logo_url: '',
  primary_color: '#0d9488',
  secondary_color: '#059669',
  subscription_plan: 'Basic',
  subscription_status: 'trial',
  subscription_package: 'demo',
  billing_cycle: 'yearly',
  subscription_start_date: '',
  subscription_expiry_date: '',
  subscription_amount: 0,
  subscription_discount: 0,
  auto_renew: false,
  max_students: 500,
  max_teachers: 50,
  is_active: true,
  disabled_modules: [],
  director_name: '',
  director_email: '',
  create_director_account: true,
  send_welcome_email: true,
};

interface Props {
  mode: 'create' | 'edit';
  school?: School | null;
  onClose: () => void;
  onSubmit: (data: SchoolFormData) => Promise<void>;
  submitting: boolean;
}

// ─── Hex validation helper ─────────────────────────────────────────────────
function isValidHex(hex: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

// ─── Color Input with picker + hex text ───────────────────────────────────
function ColorInput({
  label, value, onChange, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const [text, setText] = useState(value);

  useEffect(() => { setText(value); }, [value]);

  const handleText = (v: string) => {
    setText(v);
    if (isValidHex(v)) onChange(v);
  };

  const safe = isValidHex(value) ? value : '#0d9488';

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-3">
        {/* Native color picker — acts as the swatch */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-gray-200 cursor-pointer shrink-0 hover:border-gray-300 transition-colors">
          <div className="absolute inset-0 rounded-xl" style={{ backgroundColor: safe }}></div>
          <input
            type="color"
            value={safe}
            onChange={(e) => { onChange(e.target.value); setText(e.target.value); }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            title="Pick a color"
          />
          <div className="absolute bottom-0.5 right-0.5 w-3 h-3 flex items-center justify-center">
            <i className="ri-edit-line text-white text-xs drop-shadow"></i>
          </div>
        </div>

        {/* Hex input */}
        <div className="flex-1">
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500 bg-white">
            <span className="px-3 py-2.5 text-xs text-gray-400 font-mono bg-gray-50 border-r border-gray-200">#</span>
            <input
              type="text"
              value={text.replace('#', '')}
              onChange={(e) => handleText(`#${e.target.value}`)}
              maxLength={6}
              placeholder="0d9488"
              className="flex-1 px-3 py-2.5 text-sm font-mono focus:outline-none bg-white"
            />
          </div>
          {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Live Branding Preview ─────────────────────────────────────────────────
function BrandingPreview({
  name, logoUrl, primary, secondary,
}: {
  name: string; logoUrl: string; primary: string; secondary: string;
}) {
  const p = isValidHex(primary) ? primary : '#0d9488';
  const s = isValidHex(secondary) ? secondary : '#059669';
  const initials = name ? name.charAt(0).toUpperCase() : 'S';

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200">
      {/* Label */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
        <i className="ri-eye-line text-gray-400 text-sm"></i>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Preview</span>
      </div>

      {/* Mock Navbar */}
      <div className="px-4 py-3 bg-white border-b flex items-center justify-between" style={{ borderColor: `${p}25` }}>
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="logo"
              className="w-8 h-8 rounded-lg object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: p }}>
              {initials}
            </div>
          )}
          <div>
            <div className="text-xs font-bold text-gray-900">{name || 'School Name'}</div>
            <div className="text-xs font-medium" style={{ color: p }}>Excellence Through Education</div>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold" style={{ background: `linear-gradient(135deg, ${p}, ${s})` }}>
          Login
        </div>
      </div>

      {/* Mock Hero */}
      <div className="px-4 py-6 flex flex-col items-center text-center" style={{ background: `linear-gradient(135deg, ${p}10, ${s}08)` }}>
        {logoUrl ? (
          <img src={logoUrl} alt="logo" className="w-12 h-12 rounded-xl object-contain mb-3" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold mb-3" style={{ backgroundColor: p }}>
            {initials}
          </div>
        )}
        <div className="text-sm font-bold text-gray-900 mb-1">{name || 'School Name'}</div>
        <div className="text-xs font-medium mb-3" style={{ color: p }}>Excellence Through Education</div>
        <div className="px-4 py-2 rounded-xl text-white text-xs font-semibold" style={{ background: `linear-gradient(135deg, ${p}, ${s})` }}>
          Login to Portal
        </div>
      </div>

      {/* Color swatches */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md border border-gray-200" style={{ backgroundColor: p }}></div>
          <span className="text-xs text-gray-500 font-mono">{p}</span>
          <span className="text-xs text-gray-400">Primary</span>
        </div>
        <div className="w-px h-4 bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md border border-gray-200" style={{ backgroundColor: s }}></div>
          <span className="text-xs text-gray-500 font-mono">{s}</span>
          <span className="text-xs text-gray-400">Secondary</span>
        </div>
      </div>
    </div>
  );
}

// ─── PRESET PALETTES ───────────────────────────────────────────────────────
const PRESETS = [
  { name: 'Teal', primary: '#0d9488', secondary: '#059669' },
  { name: 'Indigo', primary: '#4f46e5', secondary: '#7c3aed' },
  { name: 'Rose', primary: '#e11d48', secondary: '#db2777' },
  { name: 'Amber', primary: '#d97706', secondary: '#b45309' },
  { name: 'Sky', primary: '#0284c7', secondary: '#0369a1' },
  { name: 'Slate', primary: '#475569', secondary: '#334155' },
];

// ─── Logo upload helper ────────────────────────────────────────────────────
async function uploadLogoFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const fileName = `school-logo-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from('school-logos')
    .upload(fileName, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data: urlData } = supabase.storage.from('school-logos').getPublicUrl(data.path);
  return urlData.publicUrl;
}

// ─── Main Modal ────────────────────────────────────────────────────────────
export default function SchoolFormModal({ mode, school, onClose, onSubmit, submitting }: Props) {
  const [form, setForm] = useState<SchoolFormData>(DEFAULT_FORM);
  const [activeSection, setActiveSection] = useState<'basic' | 'subscription' | 'limits' | 'branding' | 'onboarding'>('basic');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState('');
  const logoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'edit' && school) {
      setForm({
        name: school.name || '',
        slug: school.slug || '',
        address: school.address || '',
        phone: school.phone || '',
        email: school.email || '',
        logo_url: school.logo_url || '',
        primary_color: (school as any).primary_color || '#0d9488',
        secondary_color: (school as any).secondary_color || '#059669',
        subscription_plan: school.subscription_plan || 'Basic',
        subscription_status: school.subscription_status || 'trial',
        subscription_package: (school as any).subscription_package || 'demo',
        billing_cycle: (school as any).billing_cycle || 'yearly',
        subscription_start_date: (school as any).subscription_start_date || '',
        subscription_expiry_date: (school as any).subscription_expiry_date || '',
        subscription_amount: (school as any).subscription_amount || 0,
        subscription_discount: (school as any).subscription_discount || 0,
        auto_renew: (school as any).auto_renew || false,
        max_students: school.max_students || 500,
        max_teachers: school.max_teachers || 50,
        is_active: school.is_active ?? true,
        disabled_modules: (school as any).disabled_modules || [],
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [mode, school]);

  const set = (key: keyof SchoolFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleModule = (moduleId: string) => {
    setForm((prev) => ({
      ...prev,
      disabled_modules: prev.disabled_modules.includes(moduleId)
        ? prev.disabled_modules.filter((m) => m !== moduleId)
        : [...prev.disabled_modules, moduleId],
    }));
  };

  const handleSlug = (value: string) =>
    set('slug', value.toLowerCase().replace(/[^a-z0-9-]/g, ''));

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setLogoUploadError('Only JPG, JPEG, and PNG files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadError('File size must be under 5 MB.');
      return;
    }
    setLogoUploadError('');
    setLogoUploading(true);
    try {
      const url = await uploadLogoFile(file);
      set('logo_url', url);
    } catch (err: any) {
      setLogoUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setLogoUploading(false);
      if (logoFileRef.current) logoFileRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: 'ri-building-line' },
    { id: 'subscription', label: 'Subscription', icon: 'ri-bank-card-line' },
    { id: 'limits', label: 'Limits & Modules', icon: 'ri-settings-3-line' },
    { id: 'branding', label: 'Branding', icon: 'ri-palette-line' },
    ...(mode === 'create' ? [{ id: 'onboarding', label: 'Onboarding', icon: 'ri-mail-send-line' }] : []),
  ] as const;

  type SectionId = 'basic' | 'subscription' | 'limits' | 'branding' | 'onboarding';
  const sectionOrder: SectionId[] = mode === 'create'
    ? ['basic', 'subscription', 'limits', 'branding', 'onboarding']
    : ['basic', 'subscription', 'limits', 'branding'];
  const currentIdx = sectionOrder.indexOf(activeSection);
  const isLast = currentIdx === sectionOrder.length - 1;
  const goNext = () => { if (!isLast) setActiveSection(sectionOrder[currentIdx + 1]); };

  const netAmount = form.subscription_amount - form.subscription_discount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <i className={`${mode === 'create' ? 'ri-add-circle-line' : 'ri-edit-line'} text-teal-600 text-xl`}></i>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === 'create' ? 'Add New School' : `Edit — ${school?.name}`}
              </h2>
              <p className="text-xs text-gray-500">
                {mode === 'create' ? 'Register a new school and configure its subscription' : 'Update school details, subscription and branding'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <i className="ri-close-line text-xl text-gray-500"></i>
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeSection === s.id
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className={`${s.icon} text-sm`}></i>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* ── BASIC INFO ── */}
            {activeSection === 'basic' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Greenfield Academy" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain <span className="text-red-500">*</span></label>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                    <input type="text" required value={form.slug} onChange={(e) => handleSlug(e.target.value)} placeholder="greenfield" className="flex-1 px-3 py-2 text-sm font-mono focus:outline-none" />
                    <span className="px-3 py-2 bg-gray-50 text-xs text-gray-400 border-l border-gray-200 whitespace-nowrap">.gosmart.app</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="admin@school.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 234 567 8900" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea value={form.address} onChange={(e) => set('address', e.target.value)} rows={2} placeholder="123 School Street, City, Country" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none" />
                </div>
                <div className="col-span-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => set('is_active', !form.is_active)} className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.is_active ? 'bg-teal-500' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">School is Active</span>
                  </label>
                  <span className="text-xs text-gray-500">Inactive schools cannot be accessed by their users</span>
                </div>
              </div>
            )}

            {/* ── SUBSCRIPTION ── */}
            {activeSection === 'subscription' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                    <select value={form.subscription_plan} onChange={(e) => set('subscription_plan', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm">
                      <option value="Basic">Basic</option>
                      <option value="Professional">Professional</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.subscription_status} onChange={(e) => set('subscription_status', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm">
                      <option value="trial">Trial</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
                    <select value={form.subscription_package} onChange={(e) => set('subscription_package', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm">
                      <option value="demo">Demo</option>
                      <option value="starter">Starter</option>
                      <option value="growth">Growth</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                    <select value={form.billing_cycle} onChange={(e) => set('billing_cycle', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm">
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="date" value={form.subscription_start_date} onChange={(e) => set('subscription_start_date', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input type="date" value={form.subscription_expiry_date} onChange={(e) => set('subscription_expiry_date', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                    <input type="number" min="0" step="0.01" value={form.subscription_amount} onChange={(e) => set('subscription_amount', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
                    <input type="number" min="0" step="0.01" value={form.subscription_discount} onChange={(e) => set('subscription_discount', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl border border-teal-100">
                  <div className="flex items-center gap-2">
                    <i className="ri-money-dollar-circle-line text-teal-600 text-lg"></i>
                    <span className="text-sm font-medium text-teal-800">Net Payable Amount</span>
                  </div>
                  <span className="text-xl font-bold text-teal-700">${netAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => set('auto_renew', !form.auto_renew)} className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.auto_renew ? 'bg-teal-500' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.auto_renew ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Auto-Renew Subscription</span>
                  </label>
                  <span className="text-xs text-gray-500">Automatically renew when subscription expires</span>
                </div>
              </>
            )}

            {/* ── LIMITS & MODULES ── */}
            {activeSection === 'limits' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                    <input type="number" min="1" value={form.max_students} onChange={(e) => set('max_students', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Teachers</label>
                    <input type="number" min="1" value={form.max_teachers} onChange={(e) => set('max_teachers', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disabled Modules
                    <span className="ml-2 text-xs text-gray-400 font-normal">Checked = disabled for this school</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_MODULES.map((mod) => {
                      const isDisabled = form.disabled_modules.includes(mod.id);
                      return (
                        <button key={mod.id} type="button" onClick={() => toggleModule(mod.id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all cursor-pointer text-left ${isDisabled ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:bg-teal-50'}`}>
                          <i className={`${isDisabled ? 'ri-close-circle-fill text-red-500' : 'ri-checkbox-circle-line text-teal-500'} text-base`}></i>
                          {mod.label}
                        </button>
                      );
                    })}
                  </div>
                  {form.disabled_modules.length > 0 && (
                    <p className="mt-2 text-xs text-red-600">
                      <i className="ri-error-warning-line mr-1"></i>
                      {form.disabled_modules.length} module{form.disabled_modules.length > 1 ? 's' : ''} will be disabled for this school
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ── BRANDING ── */}
            {activeSection === 'branding' && (
              <div className="space-y-6">

                {/* Info note */}
                <div className="flex items-start gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                  <i className="ri-palette-line text-teal-600 text-lg shrink-0 mt-0.5"></i>
                  <div>
                    <p className="text-sm font-semibold text-teal-800">School Branding</p>
                    <p className="text-xs text-teal-600 mt-0.5">These settings apply to the school&apos;s public landing page and login page visible to students and parents.</p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left — inputs */}
                  <div className="space-y-5">

                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">School Logo</label>

                      {/* Upload button */}
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          ref={logoFileRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                          onChange={handleLogoFileChange}
                          className="hidden"
                          id="logo-file-upload"
                        />
                        <label
                          htmlFor="logo-file-upload"
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold cursor-pointer transition-all whitespace-nowrap ${
                            logoUploading
                              ? 'border-teal-300 bg-teal-50 text-teal-500 cursor-wait'
                              : 'border-gray-300 bg-white text-gray-600 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-600'
                          }`}
                        >
                          {logoUploading ? (
                            <><i className="ri-loader-4-line animate-spin text-base"></i>Uploading...</>
                          ) : (
                            <><i className="ri-upload-cloud-line text-base"></i>Upload Logo</>
                          )}
                        </label>
                        <span className="text-xs text-gray-400">JPG, JPEG, PNG — max 5 MB</span>
                      </div>

                      {logoUploadError && (
                        <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                          <i className="ri-error-warning-line"></i>{logoUploadError}
                        </p>
                      )}

                      {/* OR paste URL */}
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">URL</div>
                        <input
                          type="url"
                          value={form.logo_url}
                          onChange={(e) => set('logo_url', e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="w-full pl-12 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">Upload a file above or paste a direct image URL.</p>

                      {/* Logo preview */}
                      {form.logo_url && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                          <img
                            src={form.logo_url}
                            alt="Logo preview"
                            className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700">Logo preview</p>
                            <p className="text-xs text-gray-400 truncate">{form.logo_url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => set('logo_url', '')}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove logo"
                          >
                            <i className="ri-delete-bin-line text-sm"></i>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Primary Color */}
                    <ColorInput
                      label="Primary Color"
                      value={form.primary_color}
                      onChange={(v) => set('primary_color', v)}
                      hint="Main brand color — used in buttons, navbar accents, and section highlights"
                    />

                    {/* Secondary Color */}
                    <ColorInput
                      label="Secondary Color"
                      value={form.secondary_color}
                      onChange={(v) => set('secondary_color', v)}
                      hint="Gradient end color — pairs with Primary for buttons and the login panel"
                    />

                    {/* Preset Palettes */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Presets</p>
                      <div className="flex flex-wrap gap-2">
                        {PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => { set('primary_color', preset.primary); set('secondary_color', preset.secondary); }}
                            title={preset.name}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                              form.primary_color === preset.primary && form.secondary_color === preset.secondary
                                ? 'border-gray-400 bg-gray-100 text-gray-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <span className="flex gap-0.5">
                              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: preset.primary }}></span>
                              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: preset.secondary }}></span>
                            </span>
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right — live preview */}
                  <BrandingPreview
                    name={form.name}
                    logoUrl={form.logo_url}
                    primary={form.primary_color}
                    secondary={form.secondary_color}
                  />
                </div>
              </div>
            )}

            {/* ── ONBOARDING (create mode only) ── */}
            {activeSection === 'onboarding' && (
              <div className="space-y-5">
                {/* Info */}
                <div className="flex items-start gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                  <i className="ri-mail-send-line text-teal-600 text-lg shrink-0 mt-0.5"></i>
                  <div>
                    <p className="text-sm font-semibold text-teal-800">Automated Director Onboarding</p>
                    <p className="text-xs text-teal-600 mt-0.5">
                      Automatically create a Director login account and send a welcome email with login credentials and a set-password link.
                    </p>
                  </div>
                </div>

                {/* Create account toggle */}
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                      <i className="ri-user-add-line text-emerald-600 text-base"></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Create Director Account</p>
                      <p className="text-xs text-gray-500">Set up a login account for the school director automatically</p>
                    </div>
                  </div>
                  <div
                    onClick={() => set('create_director_account', !form.create_director_account)}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${form.create_director_account ? 'bg-teal-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.create_director_account ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                  </div>
                </div>

                {form.create_director_account && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Director&apos;s Full Name</label>
                        <input
                          type="text"
                          value={form.director_name}
                          onChange={(e) => set('director_name', e.target.value)}
                          placeholder="e.g. Dr. Marie Uwimana"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Director&apos;s Email <span className="text-red-500">*</span></label>
                        <input
                          type="email"
                          required={form.create_director_account}
                          value={form.director_email}
                          onChange={(e) => set('director_email', e.target.value)}
                          placeholder="director@school.com"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">This will be their login username</p>
                      </div>
                    </div>

                    {/* Send email toggle */}
                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                          <i className="ri-mail-line text-amber-600 text-base"></i>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Send Welcome Email</p>
                          <p className="text-xs text-gray-500">Email the director their credentials + a set-password link</p>
                        </div>
                      </div>
                      <div
                        onClick={() => set('send_welcome_email', !form.send_welcome_email)}
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${form.send_welcome_email ? 'bg-teal-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.send_welcome_email ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                      </div>
                    </div>

                    {form.send_welcome_email && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <i className="ri-information-line text-amber-600 text-sm shrink-0 mt-0.5"></i>
                        <p className="text-xs text-amber-700">
                          Requires a <strong>RESEND_API_KEY</strong> secret in Supabase Edge Functions. Without it, the account will still be created but the email won&apos;t be sent — you&apos;ll see the temp password on screen to share manually.
                        </p>
                      </div>
                    )}

                    {/* Preview of what the director gets */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What the Director Receives</p>
                      {[
                        { icon: 'ri-link-m', text: `Login URL: ${form.slug ? `${form.slug}.gosmartmis.rw` : '<subdomain>.gosmartmis.rw'}` },
                        { icon: 'ri-mail-line', text: `Email: ${form.director_email || '<director email>'}` },
                        { icon: 'ri-lock-password-line', text: 'Temporary password (auto-generated)' },
                        { icon: 'ri-refresh-line', text: 'Set-password link (expires in 24h)' },
                        { icon: 'ri-list-check-2', text: '5-step getting started guide' },
                      ].map((item) => (
                        <div key={item.text} className="flex items-center gap-2">
                          <i className={`${item.icon} text-teal-500 text-sm`}></i>
                          <span className="text-xs text-gray-600">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50 rounded-b-2xl">
            <div className="flex gap-1">
              {sections.map((s) => (
                <div key={s.id} className={`w-2 h-2 rounded-full transition-colors ${activeSection === s.id ? 'bg-teal-500' : 'bg-gray-300'}`} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer">
                Cancel
              </button>
              {!isLast ? (
                <button type="button" onClick={goNext} className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer">
                  Next <i className="ri-arrow-right-line ml-1"></i>
                </button>
              ) : (
                <button type="submit" disabled={submitting} className="px-5 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center gap-2">
                  {submitting ? (
                    <><i className="ri-loader-4-line animate-spin"></i>Saving...</>
                  ) : (
                    <><i className={mode === 'create' ? 'ri-add-line' : 'ri-save-line'}></i>{mode === 'create' ? 'Create School' : 'Save Changes'}</>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
