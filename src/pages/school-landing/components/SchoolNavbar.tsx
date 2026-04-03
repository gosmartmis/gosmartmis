import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SchoolRecord, SchoolColors } from '../types';

interface Props {
  school: SchoolRecord;
  colors: SchoolColors;
}

export default function SchoolNavbar({ school, colors }: Props) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const logo = school.logo_url;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur border-b border-gray-100' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-4">
        {/* Logo + Name */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {logo ? (
            <img src={logo} alt={school.name} className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-xl" />
          ) : (
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={colors.iconBg}>
              {school.name.charAt(0)}
            </div>
          )}
          <div>
            <p className={`font-bold text-sm md:text-base leading-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>{school.name}</p>
            <p className="text-xs hidden sm:block" style={scrolled ? colors.text : { color: 'rgba(255,255,255,0.8)' }}>Excellence Through Education</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {['about', 'features', 'gallery', 'contact'].map(id => (
            <button key={id} onClick={() => scrollTo(id)}
              className={`text-sm font-medium capitalize transition-colors cursor-pointer ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'}`}>
              {id === 'features' ? 'Portal' : id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 md:px-6 py-2 md:py-2.5 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
            style={colors.btn}
          >
            <i className="ri-login-box-line mr-1.5"></i>
            <span className="hidden sm:inline">Login to Portal</span>
            <span className="sm:hidden">Login</span>
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors cursor-pointer ${scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}
          >
            <i className={`${menuOpen ? 'ri-close-line' : 'ri-menu-line'} text-xl w-5 h-5 flex items-center justify-center`}></i>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 pb-4">
          {['about', 'features', 'gallery', 'contact'].map(id => (
            <button key={id} onClick={() => scrollTo(id)}
              className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg capitalize cursor-pointer">
              {id === 'features' ? 'Student Portal' : id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
