import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface School {
  id: string;
  name: string;
  logo_url: string | null;
}

function SchoolPill({ school }: { school: School }) {
  const initials = school.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/25 hover:bg-white/25 transition-colors duration-200 flex-shrink-0">
      {school.logo_url ? (
        <div className="w-7 h-7 flex-shrink-0 rounded-full overflow-hidden bg-white/20 ring-1 ring-white/30">
          <img
            src={school.logo_url}
            alt={school.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const next = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (next) next.style.display = 'flex';
            }}
          />
          <span
            className="w-7 h-7 hidden items-center justify-center text-white font-bold text-xs bg-white/20 rounded-full"
            aria-hidden="true"
          >
            {initials}
          </span>
        </div>
      ) : (
        <div className="w-7 h-7 flex-shrink-0 rounded-full bg-white/25 flex items-center justify-center">
          <span className="text-white font-bold text-xs">{initials}</span>
        </div>
      )}
      <span className="text-white font-semibold text-sm whitespace-nowrap">{school.name}</span>
    </div>
  );
}

export default function ActiveSchoolsStrip() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('schools')
      .select('id, name, logo_url')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSchools(
            data.map((s) => ({ ...s, logo_url: s.logo_url?.trim() || null }))
          );
        }
        setIsLoaded(true);
      });
  }, []);

  if (!isLoaded || schools.length === 0) return null;

  const PILL_APPROX_WIDTH = 200;
  const minCopies = Math.max(6, Math.ceil(3000 / (schools.length * PILL_APPROX_WIDTH)));
  const repeated = Array.from({ length: minCopies }, () => schools).flat();
  const speed = Math.max(18, schools.length * 5);

  return (
    <div className="w-full mt-10 sm:mt-12 -mx-4 sm:-mx-6 px-0">
      <p className="text-white/60 text-xs font-semibold tracking-widest uppercase text-center mb-4 px-4">
        Schools already using Go Smart
      </p>

      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-teal-600 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-emerald-600 to-transparent z-10 pointer-events-none"></div>

        <div
          className="flex items-center gap-3 w-max py-1"
          style={{ animation: `marquee ${speed}s linear infinite` }}
        >
          {repeated.map((school, idx) => (
            <SchoolPill key={`${school.id}-${idx}`} school={school} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-${(100 / minCopies).toFixed(4)}%); }
        }
      `}</style>
    </div>
  );
}
