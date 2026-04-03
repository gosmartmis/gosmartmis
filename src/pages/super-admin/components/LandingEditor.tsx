import { useState, useCallback } from 'react';
import { useLandingContent, DEFAULT_CONTENT, FeatureItem, ChecklistItem, TestimonialItem, DEFAULT_TESTIMONIALS } from '../../../hooks/useLandingContent';
import { useTestimonialSubmissions, TestimonialSubmission } from '../../../hooks/useTestimonialSubmissions';

type EditorTab = 'hero' | 'about' | 'pricing' | 'features' | 'testimonials';

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl font-medium text-sm shadow-xl transition-all
      ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      <i className={type === 'success' ? 'ri-checkbox-circle-line text-lg' : 'ri-error-warning-line text-lg'}></i>
      {message}
    </div>
  );
}

// ─── Hero Editor ─────────────────────────────────────────────────────────────
function HeroEditor({ heroTitle, heroSubtitle, heroImageUrl, onChange }: {
  heroTitle: string; heroSubtitle: string; heroImageUrl: string;
  onChange: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Main Headline</label>
        <input type="text" value={heroTitle} onChange={(e) => onChange('hero_title', e.target.value)} placeholder={DEFAULT_CONTENT.hero_title} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50" />
        <p className="text-xs text-gray-400 mt-1">The big heading visitors see first on the landing page</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-headline / Tagline</label>
        <input type="text" value={heroSubtitle} onChange={(e) => onChange('hero_subtitle', e.target.value)} placeholder={DEFAULT_CONTENT.hero_subtitle} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50" />
        <p className="text-xs text-gray-400 mt-1">Secondary line shown below the headline in teal</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Background Image URL</label>
        <input type="url" value={heroImageUrl} onChange={(e) => onChange('hero_image_url', e.target.value)} placeholder="https://example.com/image.jpg (leave blank for default gradient)" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50" />
        <p className="text-xs text-gray-400 mt-1">Paste a direct image URL. Leave empty to keep the animated gradient background.</p>
        {heroImageUrl && (
          <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
            <img src={heroImageUrl} alt="Hero preview" className="w-full h-48 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <p className="text-xs text-gray-400 px-3 py-2 bg-gray-50">Image preview</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── About Editor ─────────────────────────────────────────────────────────────
function AboutEditor({ aboutSubtitle, aboutTitle, paragraph1, paragraph2, checklist, uptime, liveSchools, liveStudents, onChange, onChecklist }: {
  aboutSubtitle: string; aboutTitle: string; paragraph1: string; paragraph2: string;
  checklist: ChecklistItem[]; uptime: string; liveSchools: number; liveStudents: number;
  onChange: (k: string, v: string) => void;
  onChecklist: (items: ChecklistItem[]) => void;
}) {
  const [newItem, setNewItem] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');

  const addItem = () => {
    if (!newItem.trim()) return;
    onChecklist([...checklist, { text: newItem.trim() }]);
    setNewItem('');
  };
  const startEdit = (i: number) => { setEditIdx(i); setEditVal(checklist[i].text); };
  const saveEdit = () => {
    if (editIdx === null || !editVal.trim()) return;
    const updated = [...checklist]; updated[editIdx] = { text: editVal.trim() };
    onChecklist(updated); setEditIdx(null);
  };
  const removeItem = (i: number) => { onChecklist(checklist.filter((_, idx) => idx !== i)); if (editIdx === i) setEditIdx(null); };

  return (
    <div className="space-y-8">
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
        <div className="flex items-start gap-3">
          <i className="ri-database-2-line text-teal-600 text-lg flex-shrink-0 mt-0.5"></i>
          <div>
            <p className="text-sm font-semibold text-teal-800 mb-1">Live Stats (auto from database)</p>
            <p className="text-xs text-teal-600 mb-3">These are pulled in real-time and cannot be manually overridden:</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2"><i className="ri-building-2-line text-teal-600"></i><span className="text-sm font-bold text-teal-800">{liveSchools}</span><span className="text-xs text-teal-600">Active Schools</span></div>
              <div className="flex items-center gap-2"><i className="ri-user-3-line text-teal-600"></i><span className="text-sm font-bold text-teal-800">{liveStudents}</span><span className="text-xs text-teal-600">Students Managed</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-5">
        <h4 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-2">Section Text</h4>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Badge Label</label>
          <input type="text" value={aboutSubtitle} onChange={(e) => onChange('about_subtitle', e.target.value)} placeholder={DEFAULT_CONTENT.about_subtitle} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Section Title</label>
          <textarea value={aboutTitle} onChange={(e) => onChange('about_title', e.target.value)} placeholder={DEFAULT_CONTENT.about_title} rows={2} maxLength={500} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Paragraph 1</label>
          <textarea value={paragraph1} onChange={(e) => onChange('about_paragraph1', e.target.value)} placeholder={DEFAULT_CONTENT.about_paragraph1} rows={3} maxLength={500} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Paragraph 2</label>
          <textarea value={paragraph2} onChange={(e) => onChange('about_paragraph2', e.target.value)} placeholder={DEFAULT_CONTENT.about_paragraph2} rows={3} maxLength={500} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 resize-none" />
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-2">Uptime Stat</h4>
        <input type="text" value={uptime} onChange={(e) => onChange('about_stat_uptime', e.target.value)} placeholder="99.9%" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50" />
        <p className="text-xs text-gray-400">Displayed as the third stat card (e.g. &quot;99.9%&quot;)</p>
      </div>
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-2">Checklist Items</h4>
        <div className="space-y-2">
          {checklist.map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${editIdx === i ? 'border-teal-300 bg-teal-50/40' : 'border-gray-200 bg-white'}`}>
              <i className="ri-checkbox-circle-fill text-green-500 text-lg flex-shrink-0"></i>
              {editIdx === i ? (
                <>
                  <input type="text" value={editVal} onChange={(e) => setEditVal(e.target.value)} className="flex-1 px-3 py-1.5 border border-teal-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" autoFocus />
                  <button onClick={saveEdit} className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg font-semibold cursor-pointer whitespace-nowrap">Save</button>
                  <button onClick={() => setEditIdx(null)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 cursor-pointer whitespace-nowrap">Cancel</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-700">{item.text}</span>
                  <button onClick={() => startEdit(i)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-teal-600 cursor-pointer"><i className="ri-pencil-line text-base"></i></button>
                  <button onClick={() => removeItem(i)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 cursor-pointer"><i className="ri-delete-bin-line text-base"></i></button>
                </>
              )}
            </div>
          ))}
          {checklist.length === 0 && <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">No checklist items. Add one below.</div>}
        </div>
        <div className="flex gap-2 mt-2">
          <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} placeholder="Add a checklist item…" className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50" />
          <button onClick={addItem} disabled={!newItem.trim()} className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"><i className="ri-add-line"></i> Add</button>
        </div>
      </div>
    </div>
  );
}

// ─── Pricing Editor ───────────────────────────────────────────────────────────
function PricingEditor({ pricingBasic, pricingPro, pricingEnterprise, onChange }: {
  pricingBasic: string; pricingPro: string; pricingEnterprise: string;
  onChange: (k: string, v: string) => void;
}) {
  const plans = [
    { key: 'pricing_basic', label: 'Nursery Package', value: pricingBasic, placeholder: DEFAULT_CONTENT.pricing_basic, color: 'from-teal-50 to-teal-100 border-teal-200' },
    { key: 'pricing_pro', label: 'Primary Package', value: pricingPro, placeholder: DEFAULT_CONTENT.pricing_pro, color: 'from-emerald-50 to-emerald-100 border-emerald-200' },
    { key: 'pricing_enterprise', label: 'Nursery + Primary', value: pricingEnterprise, placeholder: DEFAULT_CONTENT.pricing_enterprise, color: 'from-cyan-50 to-cyan-100 border-cyan-200' },
  ];
  return (
    <div className="space-y-5">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-start gap-2">
        <i className="ri-information-line text-lg flex-shrink-0 mt-0.5"></i>
        <span>Enter prices in RWF (e.g. <strong>50,000</strong> for monthly). Yearly is auto-calculated at 80%.</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.key} className={`p-5 bg-gradient-to-br ${plan.color} rounded-xl border`}>
            <div className="font-semibold text-gray-800 text-sm mb-1">{plan.label}</div>
            <div className="text-xs text-gray-500 mb-3">Monthly price (RWF)</div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">RWF</span>
              <input type="text" value={plan.value} onChange={(e) => onChange(plan.key, e.target.value)} placeholder={plan.placeholder} className="flex-1 px-3 py-2 border border-white/70 rounded-lg text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            {plan.value && (
              <div className="mt-2 text-xs text-gray-500">
                Yearly: RWF <span className="font-semibold text-gray-700">{Math.round(parseFloat(plan.value.replace(/,/g, '')) * 12 * 0.8).toLocaleString()}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Features Editor ──────────────────────────────────────────────────────────
function FeaturesEditor({ features, onChange }: { features: FeatureItem[]; onChange: (f: FeatureItem[]) => void }) {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<FeatureItem>({ icon: '', title: '', description: '' });
  const [adding, setAdding] = useState(false);

  const startEdit = (idx: number) => { setEditIndex(idx); setDraft({ ...features[idx] }); setAdding(false); };
  const startAdd = () => { setAdding(true); setEditIndex(null); setDraft({ icon: 'ri-star-line', title: '', description: '' }); };
  const saveEdit = () => {
    if (!draft.title.trim()) return;
    if (adding) onChange([...features, draft]);
    else if (editIndex !== null) { const u = [...features]; u[editIndex] = draft; onChange(u); }
    setEditIndex(null); setAdding(false);
  };
  const remove = (idx: number) => { onChange(features.filter((_, i) => i !== idx)); if (editIndex === idx) setEditIndex(null); };
  const move = (idx: number, dir: -1 | 1) => {
    const u = [...features]; const t = idx + dir;
    if (t < 0 || t >= u.length) return;
    [u[idx], u[t]] = [u[t], u[idx]]; onChange(u);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{features.length} features configured</p>
        <button onClick={startAdd} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"><i className="ri-add-line"></i>Add Feature</button>
      </div>
      {(adding || editIndex !== null) && (
        <div className="p-5 bg-teal-50 border-2 border-teal-300 rounded-xl space-y-4">
          <h4 className="font-semibold text-teal-800 text-sm">{adding ? 'Add New Feature' : 'Edit Feature'}</h4>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Remix Icon Class</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-gray-200 flex-shrink-0"><i className={`${draft.icon} text-xl text-gray-700`}></i></div>
              <input type="text" value={draft.icon} onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))} placeholder="ri-book-2-line" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Browse icons at <a href="https://remixicon.com" target="_blank" rel="nofollow noreferrer" className="text-teal-600 underline">remixicon.com</a></p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
            <input type="text" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Feature Title" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="Short description..." rows={3} maxLength={500} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={saveEdit} disabled={!draft.title.trim()} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 cursor-pointer whitespace-nowrap">{adding ? 'Add Feature' : 'Save Changes'}</button>
            <button onClick={() => { setEditIndex(null); setAdding(false); }} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {features.map((feat, idx) => (
          <div key={idx} className={`flex items-center gap-3 p-4 bg-white border rounded-xl transition-all ${editIndex === idx ? 'border-teal-300 bg-teal-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg flex-shrink-0"><i className={`${feat.icon} text-xl text-gray-600`}></i></div>
            <div className="flex-1 min-w-0"><div className="font-semibold text-sm text-gray-800">{feat.title}</div><div className="text-xs text-gray-500 truncate">{feat.description}</div></div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => move(idx, -1)} disabled={idx === 0} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"><i className="ri-arrow-up-s-line text-lg"></i></button>
              <button onClick={() => move(idx, 1)} disabled={idx === features.length - 1} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"><i className="ri-arrow-down-s-line text-lg"></i></button>
              <button onClick={() => startEdit(idx)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-teal-600 cursor-pointer"><i className="ri-pencil-line text-base"></i></button>
              <button onClick={() => remove(idx)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 cursor-pointer"><i className="ri-delete-bin-line text-base"></i></button>
            </div>
          </div>
        ))}
        {features.length === 0 && <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">No features yet. Click &quot;Add Feature&quot; above to get started.</div>}
      </div>
    </div>
  );
}

// ─── Testimonials Editor ──────────────────────────────────────────────────────
const EMPTY_TESTIMONIAL: TestimonialItem = { name: '', role: '', school: '', quote: '', photo_url: '', verified: false };

function FounderMessageEditor({ item, onSave }: {
  item: TestimonialItem;
  onSave: (updated: TestimonialItem) => void;
}) {
  const [draft, setDraft] = useState<TestimonialItem>({ ...item });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<TestimonialItem>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = () => {
    onSave({ ...draft, is_founder_message: true });
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = draft.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'GS';

  return (
    <div className="border-2 border-teal-300 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-slate-800 to-teal-900">
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-400/20 border border-teal-400/40">
          <i className="ri-quill-pen-line text-teal-300 text-sm"></i>
        </div>
        <div>
          <div className="text-sm font-bold text-white">Founder&apos;s Welcome Message</div>
          <div className="text-xs text-teal-300">Displayed as the large featured card at the top of testimonials</div>
        </div>
        {saved && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full">
            <i className="ri-checkbox-circle-fill text-emerald-400 text-xs"></i>
            <span className="text-xs text-emerald-300 font-medium">Saved</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 bg-slate-50 space-y-5">
        {/* Name + Role row */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Founder&apos;s Full Name</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="e.g. Mugisha Jean Pierre"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title / Role</label>
            <input
              type="text"
              value={draft.role}
              onChange={(e) => update({ role: e.target.value })}
              placeholder="Founder &amp; CEO"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Photo */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Founder&apos;s Photo URL</label>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden border-2 border-teal-300 bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-base">
              {draft.photo_url ? (
                <img
                  src={draft.photo_url}
                  alt="Founder"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : initials}
            </div>
            <div className="flex-1 space-y-1">
              <input
                type="url"
                value={draft.photo_url}
                onChange={(e) => update({ photo_url: e.target.value })}
                placeholder="https://example.com/founder-photo.jpg"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-xs text-gray-400">
                Paste a direct image URL. Leave empty to show the Go Smart logo instead.
              </p>
            </div>
          </div>
          {draft.photo_url && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-200">
              <img
                src={draft.photo_url}
                alt="Preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-teal-300"
                onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
              />
              <div className="text-xs text-gray-500">
                <div className="font-semibold text-gray-700">Photo preview</div>
                <div>This will replace the Go Smart logo on the featured card</div>
              </div>
            </div>
          )}
        </div>

        {/* Welcome message */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Welcome Message</label>
          <textarea
            value={draft.quote}
            onChange={(e) => update({ quote: e.target.value })}
            placeholder="Write your welcoming message to new schools…"
            rows={5}
            maxLength={500}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{draft.quote.length}/500 characters</p>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between pt-1">
          {dirty && <p className="text-xs text-amber-600 flex items-center gap-1.5"><i className="ri-error-warning-line"></i>Unsaved changes — click Save, then &quot;Save All Changes&quot; above</p>}
          <button
            onClick={handleSave}
            disabled={!draft.name.trim() || !draft.quote.trim()}
            className="ml-auto flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-check-line"></i>Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingSubmissionsPanel({ onImport }: { onImport: (sub: TestimonialSubmission) => Promise<void> | void }) {
  const { submissions, loading, updateStatus } = useTestimonialSubmissions();
  const pending = submissions.filter((s) => s.status === 'pending');
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const handleApprove = async (sub: TestimonialSubmission) => {
    setPublishingId(sub.id);
    await updateStatus(sub.id, 'approved');
    await onImport(sub);
    setPublishingId(null);
  };
  const handleReject = async (id: string) => { await updateStatus(id, 'rejected'); };

  if (loading) return (
    <div className="flex items-center justify-center py-6 text-gray-400 text-sm gap-2">
      <i className="ri-loader-4-line animate-spin"></i> Loading submissions…
    </div>
  );

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <i className="ri-inbox-line text-amber-500"></i>
        Pending School Submissions
        {pending.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{pending.length}</span>
        )}
      </h3>

      {pending.length === 0 ? (
        <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 text-center">
          No pending reviews from schools yet. Directors can submit reviews from their Settings page.
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((sub) => (
            <div key={sub.id} className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-gray-900">{sub.name}</span>
                    <span className="text-xs text-gray-500">{sub.role} · {sub.school}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3 italic">&quot;{sub.quote}&quot;</p>
                  <p className="text-xs text-gray-400 mt-1">Submitted {new Date(sub.submitted_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(sub)}
                    disabled={publishingId === sub.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-70 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {publishingId === sub.id
                      ? <><i className="ri-loader-4-line animate-spin"></i>Publishing…</>
                      : <><i className="ri-check-line"></i>Approve &amp; Publish</>}
                  </button>
                  <button
                    onClick={() => handleReject(sub.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-close-line"></i>Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TestimonialsEditor({ testimonials, onChange, onApproveAutoSave }: {
  testimonials: TestimonialItem[];
  onChange: (t: TestimonialItem[]) => void;
  onApproveAutoSave?: (newList: TestimonialItem[]) => Promise<void>;
}) {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<TestimonialItem>(EMPTY_TESTIMONIAL);
  const [adding, setAdding] = useState(false);

  // Separate founder message from regular testimonials
  const founderIdx = testimonials.findIndex((t) => t.is_founder_message);
  const founderItem = founderIdx !== -1 ? testimonials[founderIdx] : null;
  const regularTestimonials = testimonials.filter((t) => !t.is_founder_message);

  const handleFounderSave = (updated: TestimonialItem) => {
    const clone = [...testimonials];
    if (founderIdx !== -1) {
      clone[founderIdx] = updated;
    } else {
      clone.unshift(updated);
    }
    onChange(clone);
  };

  const regularToFullIdx = (regularIdx: number) => {
    // map index in regularTestimonials back to index in full testimonials array
    let count = 0;
    for (let i = 0; i < testimonials.length; i++) {
      if (!testimonials[i].is_founder_message) {
        if (count === regularIdx) return i;
        count++;
      }
    }
    return -1;
  };

  const startEdit = (regularIdx: number) => {
    const fullIdx = regularToFullIdx(regularIdx);
    setEditIndex(fullIdx);
    setDraft({ ...testimonials[fullIdx] });
    setAdding(false);
  };
  const startAdd = () => { setAdding(true); setEditIndex(null); setDraft({ ...EMPTY_TESTIMONIAL }); };
  const cancelEdit = () => { setEditIndex(null); setAdding(false); };

  const saveEdit = () => {
    if (!draft.name.trim() || !draft.quote.trim()) return;
    if (adding) {
      onChange([...testimonials, draft]);
    } else if (editIndex !== null) {
      const u = [...testimonials]; u[editIndex] = draft; onChange(u);
    }
    setEditIndex(null); setAdding(false);
  };

  const remove = (regularIdx: number) => {
    const fullIdx = regularToFullIdx(regularIdx);
    onChange(testimonials.filter((_, i) => i !== fullIdx));
    if (editIndex === fullIdx) setEditIndex(null);
  };

  const move = (regularIdx: number, dir: -1 | 1) => {
    const a = regularToFullIdx(regularIdx);
    const b = regularToFullIdx(regularIdx + dir);
    if (a === -1 || b === -1) return;
    const u = [...testimonials];
    [u[a], u[b]] = [u[b], u[a]];
    onChange(u);
  };

  const initials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="space-y-7">
      {/* ── Pending Submissions ── */}
      <PendingSubmissionsPanel onImport={async (sub) => {
        const already = testimonials.some((t) => !t.is_founder_message && t.name === sub.name && t.school === sub.school);
        if (!already) {
          const newList = [...testimonials, { name: sub.name, role: sub.role, school: sub.school, quote: sub.quote, photo_url: sub.photo_url, verified: true }];
          onChange(newList);
          if (onApproveAutoSave) await onApproveAutoSave(newList);
        }
      }} />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Published Content</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {/* ── Founder Message ── */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <i className="ri-shield-star-line text-teal-600"></i>
          Featured Welcome Card
        </h3>
        {founderItem ? (
          <FounderMessageEditor item={founderItem} onSave={handleFounderSave} />
        ) : (
          <div className="p-4 border border-dashed border-gray-300 rounded-xl text-sm text-gray-400 text-center">
            No founder message found. It will be shown once saved.
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">School Testimonials</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {/* ── Regular Testimonials ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{regularTestimonials.length} review{regularTestimonials.length !== 1 ? 's' : ''} &bull; {regularTestimonials.filter((t) => t.verified).length} verified</p>
          <button onClick={startAdd} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap">
            <i className="ri-add-line"></i>Add Review
          </button>
        </div>

        {/* Add / Edit form */}
        {(adding || (editIndex !== null && !testimonials[editIndex]?.is_founder_message)) && (
          <div className="p-5 bg-teal-50 border-2 border-teal-300 rounded-xl space-y-4">
            <h4 className="font-semibold text-teal-800 text-sm">{adding ? 'Add New Review' : 'Edit Review'}</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name <span className="text-red-400">*</span></label>
                <input type="text" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Jean Claude Mugabo" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Role / Title</label>
                <input type="text" value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))} placeholder="School Director" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">School Name</label>
              <input type="text" value={draft.school} onChange={(e) => setDraft((d) => ({ ...d, school: e.target.value }))} placeholder="Elite School Kigali" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Quote / Review <span className="text-red-400">*</span></label>
              <textarea value={draft.quote} onChange={(e) => setDraft((d) => ({ ...d, quote: e.target.value }))} placeholder="What did they say about Go Smart System?" rows={4} maxLength={500} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              <p className="text-xs text-gray-400 mt-1">{draft.quote.length}/500 characters</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Photo URL (optional)</label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                  {draft.photo_url ? (
                    <img src={draft.photo_url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : initials(draft.name)}
                </div>
                <input type="url" value={draft.photo_url} onChange={(e) => setDraft((d) => ({ ...d, photo_url: e.target.value }))} placeholder="https://example.com/photo.jpg" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setDraft((d) => ({ ...d, verified: !d.verified }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${draft.verified ? 'bg-green-500' : 'bg-gray-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${draft.verified ? 'translate-x-6' : 'translate-x-1'}`}></span>
              </button>
              <div>
                <div className="text-sm font-semibold text-gray-700">Mark as Verified</div>
                <div className="text-xs text-gray-400">Shows a green &quot;Verified&quot; badge</div>
              </div>
            </div>
            <div className="flex gap-3 pt-2 border-t border-teal-200">
              <button onClick={saveEdit} disabled={!draft.name.trim() || !draft.quote.trim()} className="px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 cursor-pointer whitespace-nowrap">{adding ? 'Add Review' : 'Save Changes'}</button>
              <button onClick={cancelEdit} className="px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancel</button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {regularTestimonials.map((t, rIdx) => {
            const fullIdx = regularToFullIdx(rIdx);
            return (
              <div key={rIdx} className={`flex items-start gap-4 p-4 bg-white border rounded-xl transition-all ${editIndex === fullIdx ? 'border-teal-300 bg-teal-50/20' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gray-100 text-gray-500">{rIdx + 1}</div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                  {t.photo_url ? <img src={t.photo_url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : initials(t.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800">{t.name}</span>
                    {t.verified && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 rounded-full text-xs text-green-700 font-medium"><i className="ri-checkbox-circle-fill text-xs"></i>Verified</span>}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">{t.role}{t.school ? ` · ${t.school}` : ''}</div>
                  <p className="text-xs text-gray-600 line-clamp-2">{t.quote}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => move(rIdx, -1)} disabled={rIdx === 0} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"><i className="ri-arrow-up-s-line text-lg"></i></button>
                  <button onClick={() => move(rIdx, 1)} disabled={rIdx === regularTestimonials.length - 1} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"><i className="ri-arrow-down-s-line text-lg"></i></button>
                  <button onClick={() => startEdit(rIdx)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-teal-600 cursor-pointer"><i className="ri-pencil-line text-base"></i></button>
                  <button onClick={() => remove(rIdx)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 cursor-pointer"><i className="ri-delete-bin-line text-base"></i></button>
                </div>
              </div>
            );
          })}
          {regularTestimonials.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl space-y-2">
              <i className="ri-chat-quote-line text-3xl text-gray-300 block"></i>
              <p>No reviews yet. Click &quot;Add Review&quot; to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main LandingEditor ───────────────────────────────────────────────────────
export default function LandingEditor() {
  const { content, liveStats, loading, saving, saveContent } = useLandingContent();
  const [activeTab, setActiveTab] = useState<EditorTab>('hero');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [pricingBasic, setPricingBasic] = useState('');
  const [pricingPro, setPricingPro] = useState('');
  const [pricingEnterprise, setPricingEnterprise] = useState('');
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [aboutSubtitle, setAboutSubtitle] = useState('');
  const [aboutTitle, setAboutTitle] = useState('');
  const [paragraph1, setParagraph1] = useState('');
  const [paragraph2, setParagraph2] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [uptime, setUptime] = useState('');
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (content && !initialized) {
    setHeroTitle(content.hero_title);
    setHeroSubtitle(content.hero_subtitle);
    setHeroImageUrl(content.hero_image_url || '');
    setPricingBasic(content.pricing_basic);
    setPricingPro(content.pricing_pro);
    setPricingEnterprise(content.pricing_enterprise);
    setFeatures(Array.isArray(content.features) ? content.features : DEFAULT_CONTENT.features);
    setAboutSubtitle(content.about_subtitle || DEFAULT_CONTENT.about_subtitle);
    setAboutTitle(content.about_title || DEFAULT_CONTENT.about_title);
    setParagraph1(content.about_paragraph1 || DEFAULT_CONTENT.about_paragraph1);
    setParagraph2(content.about_paragraph2 || DEFAULT_CONTENT.about_paragraph2);
    setChecklist(Array.isArray(content.about_checklist) && content.about_checklist.length > 0 ? content.about_checklist : DEFAULT_CONTENT.about_checklist);
    setUptime(content.about_stat_uptime || DEFAULT_CONTENT.about_stat_uptime);
    setTestimonials(Array.isArray(content.testimonials) && content.testimonials.length > 0 ? content.testimonials : DEFAULT_TESTIMONIALS);
    setInitialized(true);
  }

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleFieldChange = useCallback((key: string, value: string) => {
    if (key === 'hero_title') setHeroTitle(value);
    else if (key === 'hero_subtitle') setHeroSubtitle(value);
    else if (key === 'hero_image_url') setHeroImageUrl(value);
    else if (key === 'pricing_basic') setPricingBasic(value);
    else if (key === 'pricing_pro') setPricingPro(value);
    else if (key === 'pricing_enterprise') setPricingEnterprise(value);
    else if (key === 'about_subtitle') setAboutSubtitle(value);
    else if (key === 'about_title') setAboutTitle(value);
    else if (key === 'about_paragraph1') setParagraph1(value);
    else if (key === 'about_paragraph2') setParagraph2(value);
    else if (key === 'about_stat_uptime') setUptime(value);
  }, []);

  const handleApproveAutoSave = useCallback(async (newTestimonials: TestimonialItem[]) => {
    const ok = await saveContent({
      hero_title: heroTitle || DEFAULT_CONTENT.hero_title,
      hero_subtitle: heroSubtitle || DEFAULT_CONTENT.hero_subtitle,
      hero_image_url: heroImageUrl,
      pricing_basic: pricingBasic || DEFAULT_CONTENT.pricing_basic,
      pricing_pro: pricingPro || DEFAULT_CONTENT.pricing_pro,
      pricing_enterprise: pricingEnterprise || DEFAULT_CONTENT.pricing_enterprise,
      features,
      about_subtitle: aboutSubtitle || DEFAULT_CONTENT.about_subtitle,
      about_title: aboutTitle || DEFAULT_CONTENT.about_title,
      about_paragraph1: paragraph1 || DEFAULT_CONTENT.about_paragraph1,
      about_paragraph2: paragraph2 || DEFAULT_CONTENT.about_paragraph2,
      about_checklist: checklist.length > 0 ? checklist : DEFAULT_CONTENT.about_checklist,
      about_stat_uptime: uptime || DEFAULT_CONTENT.about_stat_uptime,
      testimonials: newTestimonials.length > 0 ? newTestimonials : DEFAULT_TESTIMONIALS,
    });
    showToast(
      ok ? 'Review approved & published to the landing page!' : 'Approved but failed to auto-save — please click Save Changes',
      ok ? 'success' : 'error',
    );
  }, [heroTitle, heroSubtitle, heroImageUrl, pricingBasic, pricingPro, pricingEnterprise, features, aboutSubtitle, aboutTitle, paragraph1, paragraph2, checklist, uptime, saveContent, showToast]);

  const handleSave = async () => {
    const ok = await saveContent({
      hero_title: heroTitle || DEFAULT_CONTENT.hero_title,
      hero_subtitle: heroSubtitle || DEFAULT_CONTENT.hero_subtitle,
      hero_image_url: heroImageUrl,
      pricing_basic: pricingBasic || DEFAULT_CONTENT.pricing_basic,
      pricing_pro: pricingPro || DEFAULT_CONTENT.pricing_pro,
      pricing_enterprise: pricingEnterprise || DEFAULT_CONTENT.pricing_enterprise,
      features,
      about_subtitle: aboutSubtitle || DEFAULT_CONTENT.about_subtitle,
      about_title: aboutTitle || DEFAULT_CONTENT.about_title,
      about_paragraph1: paragraph1 || DEFAULT_CONTENT.about_paragraph1,
      about_paragraph2: paragraph2 || DEFAULT_CONTENT.about_paragraph2,
      about_checklist: checklist.length > 0 ? checklist : DEFAULT_CONTENT.about_checklist,
      about_stat_uptime: uptime || DEFAULT_CONTENT.about_stat_uptime,
      testimonials: testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS,
    });
    showToast(ok ? 'Landing page updated successfully!' : 'Failed to save — please try again', ok ? 'success' : 'error');
  };

  const tabs: { id: EditorTab; label: string; icon: string; count?: number }[] = [
    { id: 'hero', label: 'Hero Section', icon: 'ri-image-line' },
    { id: 'about', label: 'About Section', icon: 'ri-information-line' },
    { id: 'pricing', label: 'Pricing', icon: 'ri-price-tag-3-line' },
    { id: 'features', label: 'Features', icon: 'ri-grid-line', count: features.length },
    { id: 'testimonials', label: 'Testimonials', icon: 'ri-chat-quote-line', count: testimonials.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <i className="ri-loader-4-line text-3xl animate-spin text-teal-500"></i>
          <span className="text-sm">Loading landing content…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Landing Page Editor</h2>
          <p className="text-sm text-gray-500 mt-1">Changes are reflected on the public landing page immediately after saving.</p>
          {content?.updated_at && (
            <p className="text-xs text-gray-400 mt-0.5">Last saved: {new Date(content.updated_at).toLocaleString()}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" rel="nofollow noreferrer" className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap">
            <i className="ri-external-link-line"></i>Preview Site
          </a>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap">
            {saving ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-save-line"></i>}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1.5 bg-gray-100 rounded-xl flex-wrap">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <i className={tab.icon}></i>
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500'}`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Editor panel */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        {activeTab === 'hero' && <HeroEditor heroTitle={heroTitle} heroSubtitle={heroSubtitle} heroImageUrl={heroImageUrl} onChange={handleFieldChange} />}
        {activeTab === 'about' && (
          <AboutEditor aboutSubtitle={aboutSubtitle} aboutTitle={aboutTitle} paragraph1={paragraph1} paragraph2={paragraph2} checklist={checklist} uptime={uptime} liveSchools={liveStats.schoolCount} liveStudents={liveStats.studentCount} onChange={handleFieldChange} onChecklist={setChecklist} />
        )}
        {activeTab === 'pricing' && <PricingEditor pricingBasic={pricingBasic} pricingPro={pricingPro} pricingEnterprise={pricingEnterprise} onChange={handleFieldChange} />}
        {activeTab === 'features' && <FeaturesEditor features={features} onChange={setFeatures} />}
        {activeTab === 'testimonials' && <TestimonialsEditor testimonials={testimonials} onChange={setTestimonials} onApproveAutoSave={handleApproveAutoSave} />}
      </div>

      {/* Save footer */}
      <div className="flex justify-end pt-2">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap">
          {saving ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-save-line"></i>}
          {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
