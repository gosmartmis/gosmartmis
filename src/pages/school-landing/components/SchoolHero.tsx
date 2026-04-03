import { useNavigate } from 'react-router-dom';
import type { SchoolRecord, SchoolColors } from '../types';

interface Props {
  school: SchoolRecord;
  colors: SchoolColors;
}

export default function SchoolHero({ school, colors }: Props) {
  const navigate = useNavigate();
  const logo = school.logo_url;

  const scrollToContact = () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://readdy.ai/api/search-image?query=modern%20african%20school%20campus%20exterior%20beautiful%20architecture%20lush%20green%20trees%20blue%20sky%20students%20walking%20bright%20sunny%20day%20educational%20institution%20Rwanda&width=1400&height=900&seq=school-subdomain-hero-01&orientation=landscape"
          alt="School campus"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/70"></div>
      </div>

      {/* Decorative gradient blob */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20"
        style={{ background: `radial-gradient(circle, ${colors.primary}, transparent 70%)` }}></div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 md:px-8 max-w-4xl mx-auto pt-24 pb-16">
        {/* Logo */}
        {logo ? (
          <img src={logo} alt={school.name} className="w-20 h-20 md:w-28 md:h-28 object-contain mx-auto mb-6 rounded-2xl ring-4 ring-white/20" />
        ) : (
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-white text-3xl md:text-4xl font-bold mx-auto mb-6 ring-4 ring-white/20" style={colors.iconBg}>
            {school.name.charAt(0)}
          </div>
        )}

        {/* School name */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
          {school.name}
        </h1>
        <p className="text-base sm:text-xl md:text-2xl font-light text-white/80 mb-3 tracking-wide">
          Excellence Through Education
        </p>
        <div className="w-16 h-1 rounded-full mx-auto mb-6 md:mb-8" style={{ background: colors.primary }}></div>
        <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto leading-relaxed mb-8 md:mb-10">
          Nurturing future leaders with world-class education, strong values, and a commitment to
          academic excellence in the heart of Rwanda.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 md:px-8 py-3.5 md:py-4 text-white rounded-2xl font-bold text-sm md:text-base hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
            style={colors.btn}
          >
            <i className="ri-login-box-line text-lg"></i>Login to Student Portal
          </button>
          <button
            onClick={scrollToContact}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 md:px-8 py-3.5 md:py-4 bg-white/10 backdrop-blur border border-white/30 text-white rounded-2xl font-semibold text-sm md:text-base hover:bg-white/20 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-phone-line text-lg"></i>Contact Us
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/60 rounded-full"></div>
        </div>
      </div>
    </section>
  );
}
