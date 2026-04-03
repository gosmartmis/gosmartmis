import type { SchoolColors } from '../types';

interface Props { colors: SchoolColors; }

const TESTIMONIALS = [
  { name: 'Marie Uwimana', role: 'Parent, Grade 5', text: 'The online portal has transformed how I stay connected with my daughter\'s progress. I can check her grades and communicate with teachers instantly.', initials: 'MU' },
  { name: 'Jean-Paul Nkurunziza', role: 'Parent, Grade 3', text: 'The teachers are exceptional and truly care about each child. My son\'s confidence has grown tremendously since joining this school.', initials: 'JN' },
  { name: 'Claudine Mukamana', role: 'Parent, Grade 6', text: 'Receiving real-time attendance updates gives me peace of mind every day. This school combines tradition and modern technology perfectly.', initials: 'CM' },
  { name: 'Emmanuel Habimana', role: 'Former Student, Class 2024', text: 'The foundation I received here prepared me for university better than I could have imagined. I am forever grateful for the education I received.', initials: 'EH' },
];

export default function SchoolTestimonials({ colors }: Props) {
  return (
    <section className="py-14 md:py-20 px-4 md:px-8" style={colors.lightBg}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ ...{ backgroundColor: colors.primary + '15' }, ...colors.text }}>Testimonials</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Parents &amp; Students Say</h2>
          <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">Real experiences from our school community.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 relative">
              <i className="ri-double-quotes-l text-4xl md:text-5xl absolute top-4 right-6 opacity-10" style={colors.text}></i>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={colors.iconBg}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm md:text-base">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex gap-0.5 mt-4">
                {[...Array(5)].map((_, s) => (
                  <i key={s} className="ri-star-fill text-amber-400 text-sm"></i>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
