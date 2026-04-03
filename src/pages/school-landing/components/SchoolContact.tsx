import { useState } from 'react';
import type { SchoolRecord, SchoolColors } from '../types';

interface Props {
  school: SchoolRecord;
  colors: SchoolColors;
}

const SUBMIT_URL = 'https://readdy.ai/api/form/d73atpafp7tlt849nh40';

export default function SchoolContact({ school, colors }: Props) {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const address = (school as { address?: string }).address || 'Kigali, Rwanda';
  const phone = (school as { phone?: string }).phone || '+250 788 000 000';
  const contactEmail = (school as { email?: string }).email || school.contact_email || `info@${school.slug}.gosmartmis.rw`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitStatus('loading');
    const form = e.currentTarget;
    const data = new URLSearchParams(new FormData(form) as unknown as URLSearchParams);
    try {
      const res = await fetch(SUBMIT_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: data.toString() });
      if (res.ok) { setSubmitStatus('success'); form.reset(); }
      else setSubmitStatus('error');
    } catch { setSubmitStatus('error'); }
  };

  return (
    <section id="contact" className="py-14 md:py-20 px-4 md:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ ...colors.lightBg, ...colors.text }}>Contact Us</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Get in Touch</h2>
          <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">Have a question? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          {/* Info */}
          <div className="space-y-6">
            <div className="rounded-2xl p-6 md:p-8 border border-gray-100" style={colors.lightBg}>
              <h3 className="text-lg font-bold text-gray-900 mb-5">School Information</h3>
              <div className="space-y-4">
                {[
                  { icon: 'ri-map-pin-2-fill', label: 'Address', value: address },
                  { icon: 'ri-phone-fill', label: 'Phone', value: phone },
                  { icon: 'ri-mail-fill', label: 'Email', value: contactEmail },
                  { icon: 'ri-time-fill', label: 'Office Hours', value: 'Mon – Fri: 7:30 AM – 5:00 PM' },
                  { icon: 'ri-calendar-fill', label: 'Academic Year', value: '2025/2026 — Now Open for Admissions' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0 mt-0.5" style={colors.iconBg}>
                      <i className={`${item.icon} text-sm`}></i>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{item.label}</p>
                      <p className="text-sm text-gray-800 font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admissions CTA */}
            <div className="rounded-2xl p-6 text-white" style={colors.ctaBg}>
              <h4 className="font-bold text-base mb-2"><i className="ri-graduation-cap-line mr-2"></i>Admissions Open 2025/2026</h4>
              <p className="text-sm opacity-90 mb-4">Limited spaces available. Register your child today to secure their place in our institution.</p>
              <button className="w-full py-2.5 bg-white rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap" style={colors.text}>
                Download Admission Form
              </button>
            </div>
          </div>

          {/* Form */}
          <div>
            {submitStatus === 'success' ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-gray-100" style={colors.lightBg}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mb-4" style={colors.iconBg}>
                  <i className="ri-checkbox-circle-line"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm mb-5">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
                <button onClick={() => setSubmitStatus('idle')} className="px-6 py-2.5 text-white rounded-xl font-semibold text-sm cursor-pointer whitespace-nowrap" style={colors.btn}>
                  Send Another
                </button>
              </div>
            ) : (
              <form
                data-readdy-form
                onSubmit={handleSubmit}
                className="space-y-4 bg-white rounded-2xl p-6 md:p-8 border border-gray-100"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Full Name *</label>
                    <input name="full_name" type="text" required placeholder="Your full name" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={{ '--tw-ring-color': colors.primary } as React.CSSProperties} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Phone Number</label>
                    <input name="phone" type="tel" placeholder="+250 7XX XXX XXX" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email Address *</label>
                  <input name="email" type="email" required placeholder="your.email@example.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Subject *</label>
                  <select name="subject" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-white">
                    <option value="">Select a subject</option>
                    <option value="Admissions Inquiry">Admissions Inquiry</option>
                    <option value="School Tour Request">School Tour Request</option>
                    <option value="Fee Information">Fee Information</option>
                    <option value="Portal Access Issue">Portal Access Issue</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Message *</label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    maxLength={500}
                    placeholder="Write your message here..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 resize-none"
                  />
                </div>
                {submitStatus === 'error' && (
                  <p className="text-red-500 text-xs font-medium"><i className="ri-error-warning-line mr-1"></i>Something went wrong. Please try again.</p>
                )}
                <button
                  type="submit"
                  disabled={submitStatus === 'loading'}
                  className="w-full py-3.5 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap disabled:opacity-60"
                  style={colors.btn}
                >
                  {submitStatus === 'loading' ? (
                    <><i className="ri-loader-4-line animate-spin mr-2"></i>Sending…</>
                  ) : (
                    <><i className="ri-send-plane-line mr-2"></i>Send Message</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
