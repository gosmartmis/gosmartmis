import { useState, useEffect } from 'react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#about' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 sm:gap-3 group">
              <img
                src="https://static.readdy.ai/image/d7eb4a7e93d99b74b32bb102c193d15a/009057a20b674fc10ec4bca9372f81d6.jpeg"
                alt="Go Smart System Co."
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded-full group-hover:scale-110 transition-transform"
              />
              <span
                className={`text-lg sm:text-xl font-bold font-display transition-colors ${
                  isScrolled ? 'text-gray-900' : 'text-white'
                }`}
              >
                Go Smart System
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-teal-600 ${
                    isScrolled ? 'text-gray-700' : 'text-white/90'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* CTA Button - Desktop */}
            <div className="hidden lg:flex items-center gap-4">
              <a
                href="/login"
                className={`text-sm font-medium transition-colors ${
                  isScrolled ? 'text-gray-700 hover:text-teal-600' : 'text-white/90 hover:text-white'
                }`}
              >
                Sign In
              </a>
              <a
                href="/register"
                className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-full font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all whitespace-nowrap"
              >
                Get Started Free
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                isScrolled ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <i className="ri-close-line text-2xl"></i>
              ) : (
                <i className="ri-menu-line text-2xl"></i>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-80 bg-white z-50 transform transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-900">Menu</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <i className="ri-close-line text-2xl text-gray-900"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-lg font-medium text-gray-700 hover:text-teal-600 transition-colors"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-6 border-t border-gray-200 space-y-3">
            <a
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full px-5 py-3 text-center border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:border-teal-600 hover:text-teal-600 transition-all whitespace-nowrap"
            >
              Sign In
            </a>
            <a
              href="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-full font-semibold hover:shadow-lg transition-all whitespace-nowrap text-center"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </div>
    </>
  );
}