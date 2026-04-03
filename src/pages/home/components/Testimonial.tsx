import { useState } from 'react';
import { TestimonialItem, TestimonialSubmission, DEFAULT_TESTIMONIALS } from '../../../hooks/useLandingContent';
import TestimonialSubmitModal from './TestimonialSubmitModal';

interface TestimonialProps {
  testimonials?: TestimonialItem[];
  approvedTestimonials?: TestimonialSubmission[];
  loading?: boolean;
}

function Avatar({ item, size = 'lg' }: { item: TestimonialItem; size?: 'lg' | 'sm' }) {
  const initials = item.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';

  if (item.photo_url) {
    return (
      <img
        src={item.photo_url}
        alt={item.name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 border-2 border-white/30`}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0 font-bold text-white`}>
      {initials}
    </div>
  );
}

function FounderCard({ item }: { item: TestimonialItem }) {
  return (
    <div className="grid lg:grid-cols-5 gap-0 bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 rounded-2xl sm:rounded-3xl overflow-hidden border border-teal-800/40">
      {/* Left panel — Founder portrait */}
      <div className="lg:col-span-2 relative h-72 sm:h-96 lg:h-auto min-h-[420px] overflow-hidden">
        {/* Full-bleed founder photo — uses uploaded photo from DB, fallback to placeholder */}
        <img
          src={item.photo_url && item.photo_url.trim() !== ''
            ? item.photo_url
            : "https://storage.readdy-site.link/project_files/c80ed66f-e1ec-4c82-96ac-5eeef6bd3a7e/b36fac0b-fde7-4ea8-ab07-9a66a2591b28_0DEAD5D0-B32E-4B85-9846-FD1D5393F820.png?v=9081ebcd4d4815aea2b7cce260205137"}
          alt={item.name}
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent"></div>
        {/* Name + title pinned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div className="text-white font-bold text-lg leading-tight">{item.name}</div>
          <div className="text-teal-300 text-sm mt-0.5">{item.role}</div>
          <div className="flex items-center gap-2 mt-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/30 rounded-full border border-teal-400/40 backdrop-blur-sm">
              <i className="ri-building-4-line text-teal-300 text-xs"></i>
              <span className="text-xs text-teal-200 font-medium">Go Smart M.I.S</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 rounded-full border border-emerald-400/30 backdrop-blur-sm">
              <i className="ri-map-pin-line text-emerald-300 text-xs"></i>
              <span className="text-xs text-emerald-200 font-medium">Rwanda</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:col-span-3 p-8 sm:p-12 lg:p-14 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-teal-800/30">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/20 rounded-full border border-teal-400/30 text-xs font-bold text-teal-300 uppercase tracking-wide mb-6 self-start whitespace-nowrap">
          <i className="ri-quill-pen-line"></i>
          Message from Our Founder
        </div>
        <div className="relative mb-8">
          <i className="ri-double-quotes-l absolute -left-4 sm:-left-8 -top-4 text-7xl text-teal-400/10"></i>
          <blockquote className="text-xl sm:text-2xl lg:text-3xl font-serif font-semibold text-white leading-snug relative z-10">
            {item.quote}
          </blockquote>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-teal-800/40"></div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-500/20 border border-teal-400/30">
              <i className="ri-user-star-line text-teal-300 text-sm"></i>
            </div>
            <span className="text-teal-300 text-sm font-semibold whitespace-nowrap">{item.name}</span>
          </div>
          <div className="h-px flex-1 bg-teal-800/40"></div>
        </div>
      </div>
    </div>
  );
}

function FeaturedCard({ item }: { item: TestimonialItem }) {
  if (item.is_founder_message) return <FounderCard item={item} />;

  return (
    <div className="grid lg:grid-cols-5 gap-0 bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100">
      <div className="lg:col-span-2 relative h-64 sm:h-80 lg:h-auto bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 flex items-center justify-center p-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-8 w-32 h-32 rounded-full border-4 border-white/40"></div>
          <div className="absolute bottom-8 right-8 w-20 h-20 rounded-full border-4 border-white/40"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <Avatar item={item} size="lg" />
          <div>
            <div className="text-white font-bold text-lg">{item.name}</div>
            <div className="text-teal-100 text-sm">{item.role}</div>
            <div className="text-teal-200 text-xs mt-0.5">{item.school}</div>
          </div>
          {item.verified && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 rounded-md border border-green-400/30">
              <i className="ri-checkbox-circle-fill text-green-300 text-xs"></i>
              <span className="text-xs text-green-200 font-medium">Verified</span>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-3 p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full text-xs font-bold text-orange-700 uppercase mb-6 self-start whitespace-nowrap">
          <i className="ri-star-fill"></i>
          Featured Review
        </div>
        <div className="relative mb-8">
          <i className="ri-double-quotes-l absolute -left-4 sm:-left-8 -top-4 text-7xl text-teal-500/15"></i>
          <blockquote className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 leading-snug relative z-10">
            {item.quote}
          </blockquote>
        </div>
        <div className="flex flex-wrap gap-2">
          {[...Array(5)].map((_, i) => (
            <i key={i} className="ri-star-fill text-yellow-400 text-lg"></i>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 hover:border-teal-200 transition-colors">
      <div className="relative">
        <i className="ri-double-quotes-l absolute -left-1 -top-2 text-4xl text-teal-500/15"></i>
        <p className="text-gray-700 text-sm leading-relaxed relative z-10 line-clamp-4">
          {item.quote}
        </p>
      </div>
      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-3">
        <Avatar item={item} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-900 truncate">{item.name}</div>
          <div className="text-xs text-gray-500 truncate">{item.role} &bull; {item.school}</div>
        </div>
        {item.verified && (
          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
            <i className="ri-checkbox-circle-fill text-green-500 text-lg" title="Verified review"></i>
          </div>
        )}
      </div>
    </div>
  );
}

function DBTestimonialCard({ item }: { item: TestimonialSubmission }) {
  const initials = item.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 hover:border-teal-200 transition-colors">
      <div className="relative">
        <i className="ri-double-quotes-l absolute -left-1 -top-2 text-4xl text-teal-500/15"></i>
        <p className="text-gray-700 text-sm leading-relaxed relative z-10 line-clamp-4">{item.quote}</p>
      </div>
      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
          {item.photo_url ? (
            <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-900 truncate">{item.name}</div>
          <div className="text-xs text-gray-500 truncate">{item.role}{item.school ? ` · ${item.school}` : ''}</div>
        </div>
        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
          <i className="ri-checkbox-circle-fill text-green-500 text-lg" title="Verified review"></i>
        </div>
      </div>
    </div>
  );
}

function SkeletonFeatured() {
  return (
    <div className="grid lg:grid-cols-5 gap-0 bg-white rounded-3xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="lg:col-span-2 h-64 lg:h-auto bg-gray-200"></div>
      <div className="lg:col-span-3 p-12 space-y-4">
        <div className="h-4 bg-gray-200 rounded-full w-32"></div>
        <div className="h-8 bg-gray-200 rounded-full w-full"></div>
        <div className="h-8 bg-gray-200 rounded-full w-4/5"></div>
        <div className="h-6 bg-gray-200 rounded-full w-2/3"></div>
      </div>
    </div>
  );
}

export default function Testimonial({ testimonials, approvedTestimonials = [], loading }: TestimonialProps) {
  const [showModal, setShowModal] = useState(false);

  const allStatic = (testimonials && testimonials.length > 0) ? testimonials : DEFAULT_TESTIMONIALS;
  const defaultFounder = DEFAULT_TESTIMONIALS.find((t) => t.is_founder_message);
  const featured = allStatic.find((t) => t.is_founder_message) ?? defaultFounder ?? allStatic[0];

  const staticRegular = allStatic.filter((t) => !t.is_founder_message);
  const regularCards = approvedTestimonials.length > 0 ? approvedTestimonials : staticRegular;
  const totalReviews = approvedTestimonials.length > 0
    ? approvedTestimonials.length
    : staticRegular.filter((t) => t.verified).length;

  if (loading) {
    return (
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SkeletonFeatured />
        </div>
      </section>
    );
  }

  return (
    <>
      {showModal && <TestimonialSubmitModal onClose={() => setShowModal(false)} />}

      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-14">

          {/* ── 1. FOUNDER MESSAGE ── */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full text-xs font-bold text-teal-700 uppercase tracking-wide">
                <i className="ri-quill-pen-line"></i>
                A Word from Our Founder
              </div>
            </div>
            <FeaturedCard item={featured} />
          </div>

          {/* ── 2. WHAT SCHOOLS SAY ── */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full text-xs font-bold text-teal-700 uppercase tracking-wide mb-3">
                  <i className="ri-chat-quote-line"></i>
                  What Schools Say
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                  Trusted by Schools Across Rwanda
                </h2>
                <p className="text-gray-500 text-sm sm:text-base mt-2 max-w-xl">
                  Real feedback from directors, teachers, and administrators who use Go Smart every day.
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-2 border-teal-200 text-teal-700 rounded-full text-sm font-semibold hover:bg-teal-50 transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
              >
                <i className="ri-edit-line"></i>
                Share Your Experience
              </button>
            </div>

            {/* School review cards */}
            {approvedTestimonials.length > 0 ? (
              <div className={`grid gap-5 ${approvedTestimonials.length === 1 ? 'sm:grid-cols-1 max-w-lg' : approvedTestimonials.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                {approvedTestimonials.map((item) => (
                  <DBTestimonialCard key={item.id} item={item} />
                ))}
              </div>
            ) : regularCards.length > 0 && (
              <div className={`grid gap-5 ${regularCards.length === 1 ? 'sm:grid-cols-1 max-w-lg' : regularCards.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                {(regularCards as TestimonialItem[]).map((item, i) => (
                  <TestimonialCard key={i} item={item} />
                ))}
              </div>
            )}

            {/* Count + CTA row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="inline-flex items-center gap-2 text-xs text-gray-400">
                <i className="ri-shield-check-line text-green-500"></i>
                {totalReviews} verified review{totalReviews !== 1 ? 's' : ''} from real schools
                {approvedTestimonials.length > 0 && (
                  <span className="ml-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    live from database
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs text-teal-600 font-semibold hover:underline cursor-pointer"
              >
                Are you a Go Smart user? Add your review →
              </button>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
