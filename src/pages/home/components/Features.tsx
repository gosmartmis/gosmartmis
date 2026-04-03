import { FeatureItem } from '../../../hooks/useLandingContent';

interface FeaturesProps {
  features?: FeatureItem[];
  loading?: boolean;
}

const GRADIENT_POOL = [
  'from-teal-500 to-teal-600',
  'from-emerald-500 to-emerald-600',
  'from-cyan-500 to-cyan-600',
  'from-green-500 to-green-600',
  'from-orange-500 to-orange-600',
  'from-red-500 to-red-600',
  'from-indigo-500 to-indigo-600',
  'from-pink-500 to-pink-600',
  'from-yellow-500 to-yellow-600',
];

const FEATURE_IMAGES = [
  'https://readdy.ai/api/search-image?query=academic%20marks%20approval%20workflow%20interface%20showing%20three%20tier%20verification%20process%20teacher%20dean%20director%20approval%20clean%20professional%20educational%20software%20design&width=800&height=500&seq=feature-academic-1&orientation=landscape',
  'https://readdy.ai/api/search-image?query=multi%20school%20management%20dashboard%20grid%20showing%20multiple%20school%20subdomains%20isolated%20data%20professional%20interface%20clean%20design%20educational%20platform&width=800&height=500&seq=feature-multi-1&orientation=landscape',
];

export default function Features({ features = [], loading }: FeaturesProps) {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <div className="text-teal-600 text-xs font-bold uppercase tracking-widest mb-4">
            PLATFORM CAPABILITIES
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-gray-900 mb-4 sm:mb-6">
            Everything Your School Needs In One System
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
            From academics to finance, manage every aspect seamlessly
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const gradient = GRADIENT_POOL[index % GRADIENT_POOL.length];
              const isLarge = index < 2;
              const imgSrc = FEATURE_IMAGES[index] || null;

              if (isLarge && imgSrc) {
                return (
                  <div key={index} className="sm:col-span-2 group">
                    <div className="h-full bg-white rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border border-gray-100">
                      <div className="grid sm:grid-cols-2 h-full">
                        <div className={`p-6 sm:p-8 bg-gradient-to-br ${gradient} flex flex-col justify-center`}>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                            <i className={`${feature.icon} text-2xl sm:text-3xl text-white`}></i>
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">{feature.title}</h3>
                          <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">{feature.description}</p>
                          <a href="#" className="text-white font-semibold inline-flex items-center gap-2 hover:gap-3 transition-all whitespace-nowrap text-sm sm:text-base" rel="nofollow">
                            Learn More <i className="ri-arrow-right-line"></i>
                          </a>
                        </div>
                        <div className="relative h-64 sm:h-auto min-h-[300px]">
                          <img
                            src={imgSrc}
                            alt={feature.title}
                            className="absolute inset-0 w-full h-full object-cover object-top"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (index >= 2 && index < 6) {
                return (
                  <div key={index} className="group">
                    <div className={`h-full min-h-[280px] sm:min-h-[320px] p-6 sm:p-8 bg-gradient-to-br ${gradient} rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col justify-center items-center text-center cursor-pointer`}>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3 sm:mb-4">
                        <i className={`${feature.icon} text-4xl sm:text-5xl text-white`}></i>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">{feature.title}</h3>
                      <p className="text-white/90 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className="group">
                  <div className="h-full min-h-[220px] sm:min-h-[240px] p-5 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all border-l-4 border-gray-900 cursor-pointer">
                    <div className="w-8 h-8 flex items-center justify-center mb-3">
                      <i className={`${feature.icon} text-2xl sm:text-3xl text-gray-900`}></i>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
