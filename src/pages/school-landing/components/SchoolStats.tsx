import type { SchoolRecord, SchoolColors } from '../types';

interface Props {
  school: SchoolRecord;
  colors: SchoolColors;
}

const STATS = [
  { icon: 'ri-graduation-cap-line', value: '1,200+', label: 'Students Enrolled' },
  { icon: 'ri-user-star-line', value: '85+', label: 'Qualified Teachers' },
  { icon: 'ri-trophy-line', value: '15+', label: 'Years of Excellence' },
  { icon: 'ri-medal-line', value: '98%', label: 'Pass Rate' },
];

export default function SchoolStats({ colors }: Props) {
  return (
    <section id="about" className="py-14 md:py-20 px-4 md:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ ...colors.lightBg, ...colors.text }}>About Our School</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Building Tomorrow&apos;s Leaders Today</h2>
          <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            We are committed to providing a holistic education that develops the intellect, character, and creativity
            of every student — preparing them for success in university, career, and life.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          {STATS.map((stat, i) => (
            <div key={i} className="rounded-2xl p-5 md:p-7 text-center border border-gray-100 hover:border-gray-200 transition-colors" style={colors.lightBg}>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-white mx-auto mb-3 md:mb-4" style={colors.iconBg}>
                <i className={`${stat.icon} text-xl md:text-2xl`}></i>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Two-column about section */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Our Mission &amp; Values</h3>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-5">
              Our mission is to empower every student with the knowledge, skills, and values needed to thrive in an
              increasingly complex world. We believe that education is the greatest investment a society can make.
            </p>
            <div className="space-y-3">
              {[
                { icon: 'ri-book-open-line', title: 'Academic Excellence', desc: 'Rigorous curriculum aligned with national standards' },
                { icon: 'ri-heart-line', title: 'Character Development', desc: 'Instilling integrity, respect, and responsibility' },
                { icon: 'ri-global-line', title: 'Global Perspective', desc: 'Preparing students for a connected world' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={colors.iconBg}>
                    <i className={`${item.icon} text-sm`}></i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden h-56 md:h-72">
            <img
              src="https://readdy.ai/api/search-image?query=african%20students%20classroom%20happy%20engaged%20learning%20modern%20school%20interior%20bright%20colorful%20teacher%20teaching%20Rwanda%20primary%20school&width=600&height=450&seq=school-about-img-01&orientation=landscape"
              alt="Students in classroom"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
