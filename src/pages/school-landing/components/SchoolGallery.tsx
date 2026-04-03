import type { SchoolColors } from '../types';

interface Props {
  colors: SchoolColors;
}

const GALLERY = [
  { src: 'https://readdy.ai/api/search-image?query=african%20primary%20school%20students%20outdoor%20playground%20happy%20smiling%20Rwanda%20bright%20sunny%20day%20colorful%20uniforms&width=600&height=450&seq=school-gallery-01&orientation=landscape', label: 'Campus Life' },
  { src: 'https://readdy.ai/api/search-image?query=school%20students%20science%20laboratory%20experiment%20african%20kids%20learning%20modern%20classroom%20Rwanda&width=600&height=450&seq=school-gallery-02&orientation=landscape', label: 'Science Lab' },
  { src: 'https://readdy.ai/api/search-image?query=school%20graduation%20ceremony%20african%20students%20caps%20gowns%20celebrating%20achievement%20Rwanda&width=600&height=450&seq=school-gallery-03&orientation=landscape', label: 'Graduation Day' },
  { src: 'https://readdy.ai/api/search-image?query=school%20library%20african%20students%20reading%20books%20studying%20modern%20well-equipped%20Rwanda&width=600&height=450&seq=school-gallery-04&orientation=landscape', label: 'Library' },
  { src: 'https://readdy.ai/api/search-image?query=african%20school%20sports%20day%20students%20running%20competing%20green%20field%20colorful%20uniforms%20Rwanda&width=600&height=450&seq=school-gallery-05&orientation=landscape', label: 'Sports Day' },
  { src: 'https://readdy.ai/api/search-image?query=african%20school%20computer%20lab%20students%20learning%20technology%20coding%20modern%20classroom%20Rwanda&width=600&height=450&seq=school-gallery-06&orientation=landscape', label: 'Computer Lab' },
];

export default function SchoolGallery({ colors }: Props) {
  return (
    <section id="gallery" className="py-14 md:py-20 px-4 md:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ ...colors.lightBg, ...colors.text }}>Gallery</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Life at Our School</h2>
          <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">A glimpse into the vibrant, enriching experience we offer every student every day.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {GALLERY.map((item, i) => (
            <div key={i} className={`relative overflow-hidden rounded-xl md:rounded-2xl group ${i === 0 ? 'row-span-2' : ''}`} style={{ height: i === 0 ? 'auto' : '180px' }}>
              <div className={i === 0 ? 'h-full min-h-[364px]' : 'h-full'}>
                <img
                  src={item.src}
                  alt={item.label}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 md:p-4">
                  <span className="text-white text-xs md:text-sm font-semibold">{item.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
