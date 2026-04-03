import ActiveSchoolsStrip from './ActiveSchoolsStrip';

export default function CTA() {
  return (
    <section className="relative py-20 sm:py-28 lg:py-32 overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-600">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-display text-white leading-tight mb-8 sm:mb-12">
            Join Us Today And{' '}
            <span className="relative inline-block">
              Go Smart!
              <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-1 sm:h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
            </span>
          </h2>

          <p className="text-lg sm:text-xl lg:text-2xl text-white/95 mb-0 font-light">
            Transform your school with Rwanda&apos;s most trusted School Management System
          </p>
        </div>

        {/* Full-width scrolling strip of real schools */}
        <ActiveSchoolsStrip />

        <div className="max-w-3xl mx-auto text-center mt-10 sm:mt-12 mb-12 sm:mb-16">
          <a
            href="/register"
            className="group px-8 sm:px-10 py-4 sm:py-5 bg-white text-teal-700 rounded-full font-bold text-base sm:text-lg hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center justify-center gap-3 sm:gap-4 whitespace-nowrap"
          >
            Get Started
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full flex items-center justify-center group-hover:rotate-90 transition-transform">
              <i className="ri-arrow-right-line text-white"></i>
            </div>
          </a>
        </div>


      </div>
    </section>
  );
}
