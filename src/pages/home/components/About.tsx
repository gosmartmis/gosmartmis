import { useMemo } from 'react';
import { LandingContent, LiveStats, DEFAULT_CONTENT, ChecklistItem } from '../../../hooks/useLandingContent';

interface AboutProps {
  content: LandingContent | null;
  liveStats: LiveStats;
  loading: boolean;
}

function formatCount(n: number): string {
  if (n === 0) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K+`;
  return `${n}`;
}

export default function About({ content, liveStats, loading }: AboutProps) {
  const aboutTitle = content?.about_title || DEFAULT_CONTENT.about_title;
  const aboutSubtitle = content?.about_subtitle || DEFAULT_CONTENT.about_subtitle;
  const paragraph1 = content?.about_paragraph1 || DEFAULT_CONTENT.about_paragraph1;
  const paragraph2 = content?.about_paragraph2 || DEFAULT_CONTENT.about_paragraph2;
  const checklist: ChecklistItem[] = useMemo(() => {
    if (content?.about_checklist && Array.isArray(content.about_checklist) && content.about_checklist.length > 0) {
      return content.about_checklist;
    }
    return DEFAULT_CONTENT.about_checklist;
  }, [content]);
  const uptime = content?.about_stat_uptime || DEFAULT_CONTENT.about_stat_uptime;

  const stats = [
    { value: formatCount(liveStats.schoolCount), label: 'Active Schools', icon: 'ri-building-2-line', color: 'text-teal-600' },
    { value: formatCount(liveStats.studentCount), label: 'Students Managed', icon: 'ri-user-3-line', color: 'text-emerald-600' },
    { value: uptime, label: 'Uptime', icon: 'ri-shield-check-line', color: 'text-green-600' },
  ];

  return (
    <section id="about" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — text */}
          <div>
            {loading ? (
              <div className="space-y-4">
                <div className="h-4 w-32 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-10 w-3/4 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded-full animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-200 rounded-full animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-teal-600 text-xs font-bold uppercase tracking-widest mb-4">
                  {aboutSubtitle}
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-gray-900 mb-4 sm:mb-6 leading-tight">
                  {aboutTitle}
                </h2>

                <div className="space-y-4 text-sm sm:text-base text-gray-600 leading-relaxed mb-6 sm:mb-8">
                  <p>{paragraph1}</p>
                  <p>{paragraph2}</p>
                </div>

                <div className="space-y-3 mb-6 sm:mb-8">
                  {checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <i className="ri-checkbox-circle-fill text-green-500 text-lg sm:text-xl flex-shrink-0"></i>
                      <span className="text-sm sm:text-base text-gray-700 font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>

                <button className="group px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full font-semibold text-sm sm:text-base hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer">
                  Explore Platform Architecture
                  <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
                </button>

              </>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 sm:mt-12">
              {stats.map((stat) => (
                <div key={stat.label} className="p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl border border-gray-100 hover:border-teal-100 transition-colors">
                  <div className="w-8 h-8 flex items-center justify-center mb-2">
                    <i className={`${stat.icon} ${stat.color} text-xl`}></i>
                  </div>
                  {loading ? (
                    <>
                      <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse mb-1" />
                      <div className="h-3 w-20 bg-gray-100 rounded-full animate-pulse" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tabular-nums">
                        {stat.value}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">{stat.label}</div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Live badge */}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
              School &amp; student counts are updated in real-time from the database
            </div>
          </div>

          {/* Right — images */}
          <div className="relative order-first lg:order-last">
            <div className="relative">
              <div className="absolute top-4 right-4 sm:top-0 sm:right-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center border border-gray-100 z-10">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs font-semibold text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="hidden sm:inline">sms.ac.rw</span>
                    <span className="sm:hidden">Live</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="transform hover:scale-105 transition-transform">
                  <img
                    src="https://readdy.ai/api/search-image?query=modern%20school%20director%20dashboard%20with%20academic%20risk%20alerts%20student%20performance%20metrics%20clean%20interface%20professional%20design%20teal%20green%20accents%20educational%20software%20screenshot%20showing%20charts%20and%20data%20analytics&width=600&height=400&seq=about-dashboard-v2&orientation=landscape"
                    alt="Director Dashboard"
                    className="rounded-xl sm:rounded-2xl w-full h-48 sm:h-64 object-cover object-top"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <img
                    src="https://readdy.ai/api/search-image?query=student%20performance%20graphs%20colorful%20bar%20charts%20academic%20analytics%20educational%20data%20visualization%20clean%20modern%20interface%20teal%20green%20theme%20school%20software%20dashboard&width=300&height=250&seq=about-graph-v2&orientation=squarish"
                    alt="Performance Analytics"
                    className="rounded-lg sm:rounded-xl w-full h-40 sm:h-48 object-cover object-top"
                  />
                  <img
                    src="https://readdy.ai/api/search-image?query=school%20finance%20module%20payment%20tracking%20interface%20clean%20professional%20design%20financial%20dashboard%20educational%20software%20teal%20accents%20fee%20management%20Rwanda&width=300&height=250&seq=about-finance-v2&orientation=squarish"
                    alt="Finance Module"
                    className="rounded-lg sm:rounded-xl w-full h-40 sm:h-48 object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
