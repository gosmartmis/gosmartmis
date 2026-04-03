import type { SchoolRecord, SchoolColors } from '../types';

interface Props {
  school: SchoolRecord;
  colors: SchoolColors;
}

export default function SchoolFooter({ school, colors }: Props) {
  const logo = school.logo_url;
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <footer style={{ backgroundColor: '#111827' }} className="text-white">
      {/* Main footer */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              {logo ? (
                <img src={logo} alt={school.name} className="w-12 h-12 object-contain rounded-xl" />
              ) : (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={colors.iconBg}>
                  {school.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-sm leading-tight">{school.name}</p>
                <p className="text-xs text-gray-400">Excellence Through Education</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              A leading school committed to developing future leaders through quality education and strong values.
            </p>
            <div className="flex gap-3">
              {['ri-facebook-fill', 'ri-twitter-fill', 'ri-instagram-line', 'ri-youtube-fill'].map((icon, i) => (
                <div key={i} className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer hover:opacity-80 transition-opacity" style={colors.iconBg}>
                  <i className={`${icon} text-sm`}></i>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm mb-5 text-gray-300 uppercase tracking-widest">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'About Us', id: 'about' },
                { label: 'Student Portal', id: 'features' },
                { label: 'Photo Gallery', id: 'gallery' },
                { label: 'Contact Us', id: 'contact' },
              ].map((link, i) => (
                <li key={i}>
                  <button onClick={() => scrollTo(link.id)}
                    className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                    <i className="ri-arrow-right-s-line text-xs" style={colors.text}></i>{link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Portal Access */}
          <div>
            <h4 className="font-bold text-sm mb-5 text-gray-300 uppercase tracking-widest">Portal Access</h4>
            <ul className="space-y-2.5">
              {['Student Login', 'Teacher Login', 'Parent Login', 'Administrator'].map((item, i) => (
                <li key={i}>
                  <button className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                    <i className="ri-arrow-right-s-line text-xs" style={colors.text}></i>{item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm mb-5 text-gray-300 uppercase tracking-widest">Contact</h4>
            <div className="space-y-3">
              {[
                { icon: 'ri-map-pin-line', text: (school as { address?: string }).address || 'Kigali, Rwanda' },
                { icon: 'ri-phone-line', text: (school as { phone?: string }).phone || '+250 788 000 000' },
                { icon: 'ri-mail-line', text: school.contact_email || `info@${school.slug}.gosmartmis.rw` },
                { icon: 'ri-time-line', text: 'Mon – Fri: 7:30 AM – 5:00 PM' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <i className={`${item.icon} text-sm mt-0.5 flex-shrink-0`} style={colors.text}></i>
                  <span className="text-sm text-gray-400 leading-snug">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} {school.name}. All rights reserved.</p>
          <p className="text-xs text-gray-600">
            Powered by <span className="font-semibold" style={colors.text}>Go Smart M.I.S</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
