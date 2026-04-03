import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface Props {
  onClose: () => void;
}

type Step = 'form' | 'success';

const EMPTY = { name: '', role: '', school: '', quote: '', photo_url: '' };

export default function TestimonialSubmitModal({ onClose }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Partial<typeof EMPTY>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (k: keyof typeof EMPTY, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e: Partial<typeof EMPTY> = {};
    if (!form.name.trim()) e.name = 'Your name is required';
    if (!form.role.trim()) e.role = 'Your role is required';
    if (!form.school.trim()) e.school = 'School name is required';
    if (!form.quote.trim()) e.quote = 'Please write your review';
    else if (form.quote.trim().length < 30) e.quote = 'Please write at least 30 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('testimonial_submissions').insert({
        name: form.name.trim(),
        role: form.role.trim(),
        school: form.school.trim(),
        quote: form.quote.trim(),
        photo_url: form.photo_url.trim(),
        status: 'pending',
      });
      if (error) throw error;
      setStep('success');
    } catch {
      setErrors((e) => ({ ...e, quote: 'Submission failed. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Share Your Experience</h2>
              <p className="text-teal-100 text-xs mt-0.5">Your review helps other schools discover Go Smart</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer">
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
        </div>

        {step === 'success' ? (
          <div className="px-6 py-12 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-emerald-100">
              <i className="ri-checkbox-circle-fill text-emerald-500 text-3xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Thank you!</h3>
            <p className="text-gray-500 text-sm max-w-xs">
              Your review has been submitted and is awaiting approval. It will appear on our landing page shortly.
            </p>
            <button onClick={onClose} className="mt-2 px-6 py-2.5 bg-teal-600 text-white rounded-full font-semibold text-sm hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap">
              Close
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Name + Role */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Jean Claude Mugabo"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Your Role <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => update('role', e.target.value)}
                  placeholder="School Director"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 ${errors.role ? 'border-red-300' : 'border-gray-200'}`}
                />
                {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
              </div>
            </div>

            {/* School */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                School Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.school}
                onChange={(e) => update('school', e.target.value)}
                placeholder="e.g. Bright Futures Academy, Kigali"
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 ${errors.school ? 'border-red-300' : 'border-gray-200'}`}
              />
              {errors.school && <p className="text-xs text-red-500 mt-1">{errors.school}</p>}
            </div>

            {/* Quote */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Your Review <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.quote}
                onChange={(e) => update('quote', e.target.value)}
                placeholder="Tell us how Go Smart System has helped your school…"
                rows={4}
                maxLength={500}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 resize-none ${errors.quote ? 'border-red-300' : 'border-gray-200'}`}
              />
              <div className="flex justify-between mt-1">
                {errors.quote ? <p className="text-xs text-red-500">{errors.quote}</p> : <span />}
                <span className="text-xs text-gray-400">{form.quote.length}/500</span>
              </div>
            </div>

            {/* Photo URL (optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Your Photo URL <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={form.photo_url}
                onChange={(e) => update('photo_url', e.target.value)}
                placeholder="https://example.com/your-photo.jpg"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty — we&apos;ll use your initials avatar</p>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 bg-teal-50 border border-teal-100 rounded-xl">
              <i className="ri-information-line text-teal-500 text-sm flex-shrink-0 mt-0.5"></i>
              <p className="text-xs text-teal-700">
                Your review will be reviewed before appearing on the public page. We may lightly edit for clarity.
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-1 pb-1">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
              >
                {submitting ? <><i className="ri-loader-4-line animate-spin"></i> Submitting…</> : <><i className="ri-send-plane-line"></i> Submit Review</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
