import { useState, useEffect, useRef } from 'react';
import { LiveStats } from '../../../hooks/useLandingContent';

interface HeroProps {
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  loading?: boolean;
  liveStats?: LiveStats;
}

const DEFAULT_TITLE = 'Do You Need To Go Smart?';
const DEFAULT_SUBTITLE = 'Please Come And Go With Us!';

function formatStat(n: number): string {
  if (n === 0) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K+`;
  return `${n}+`;
}

/** Counts from 0 → target with an ease-out curve over `duration` ms */
function useCountUp(target: number, duration = 1800, active = true): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const prevTargetRef = useRef<number>(0);

  useEffect(() => {
    if (!active || target === 0) {
      setCount(target);
      return;
    }
    if (target !== prevTargetRef.current) {
      prevTargetRef.current = target;
      startTimeRef.current = null;
      setCount(0);
    }

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, active]);

  return count;
}

interface StatCardProps {
  rawValue: number;
  label: string;
  icon: string;
  color: string;
  iconColor: string;
  animate: boolean;
  loading: boolean;
}

function StatCard({ rawValue, label, icon, color, iconColor, animate, loading }: StatCardProps) {
  const animated = useCountUp(rawValue, 1800 + Math.random() * 400, animate && !loading);
  const display = loading ? '…' : formatStat(animate ? animated : rawValue);

  return (
    <div
      className={`flex flex-col items-center gap-2 p-4 sm:p-5 bg-gradient-to-br ${color} backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/25 hover:scale-105 transition-all duration-200`}
    >
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10">
        <i className={`${icon} ${iconColor} text-lg`}></i>
      </div>
      <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">{display}</span>
      <span className="text-xs text-white/60 font-medium text-center flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse flex-shrink-0"></span>
        {label}
      </span>
    </div>
  );
}

export default function Hero({ heroTitle, heroSubtitle, heroImageUrl, loading, liveStats }: HeroProps) {
  const title = heroTitle || DEFAULT_TITLE;
  const subtitle = heroSubtitle || DEFAULT_SUBTITLE;

  const [animateStats, setAnimateStats] = useState(false);
  useEffect(() => {
    if (!loading && liveStats) {
      const t = setTimeout(() => setAnimateStats(true), 300);
      return () => clearTimeout(t);
    }
  }, [loading, liveStats]);

  const stats = [
    { value: liveStats?.schoolCount ?? 0,    label: 'Active Schools',   icon: 'ri-building-2-line',    color: 'from-teal-500/30 to-emerald-500/30',   iconColor: 'text-teal-400'    },
    { value: liveStats?.studentCount ?? 0,   label: 'Students',          icon: 'ri-graduation-cap-line', color: 'from-cyan-500/30 to-teal-500/30',       iconColor: 'text-cyan-400'    },
    { value: liveStats?.teacherCount ?? 0,   label: 'Teachers',          icon: 'ri-user-star-line',      color: 'from-emerald-500/30 to-green-500/30',   iconColor: 'text-emerald-400' },
    { value: liveStats?.deanCount ?? 0,      label: 'Deans of Studies',  icon: 'ri-shield-user-line',    color: 'from-amber-500/30 to-yellow-500/30',    iconColor: 'text-amber-400'   },
    { value: liveStats?.registrarCount ?? 0, label: 'Registrars',        icon: 'ri-file-user-line',      color: 'from-violet-500/30 to-purple-500/30',   iconColor: 'text-violet-400'  },
    { value: liveStats?.directorCount ?? 0,  label: 'Directors',         icon: 'ri-vip-crown-line',      color: 'from-rose-500/30 to-pink-500/30',       iconColor: 'text-rose-400'    },
  ];

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 pt-16 sm:pt-20"
      style={heroImageUrl ? { backgroundImage: `url('${heroImageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {heroImageUrl && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60"></div>
      )}

      {!heroImageUrl && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-1/4 w-72 h-72 sm:w-[500px] sm:h-[500px] bg-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-1/4 w-64 h-64 sm:w-[400px] sm:h-[400px] bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[600px] sm:h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
      )}

      {!heroImageUrl && (
        <div className="absolute inset-0 opacity-5"
          style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px'}}>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28 z-10 w-full">
        <div className="flex flex-col items-center text-center">

          {/* ── GO SMART LOGO ── */}
          <div className="relative mb-8 sm:mb-10">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 blur-2xl opacity-40 scale-125 animate-pulse"></div>
            <div className="relative p-1.5 rounded-full bg-gradient-to-br from-teal-400 via-emerald-400 to-cyan-400 shadow-2xl">
              <div className="p-1 rounded-full bg-slate-900">
                <img
                  src="https://static.readdy.ai/image/d7eb4a7e93d99b74b32bb102c193d15a/009057a20b674fc10ec4bca9372f81d6.jpeg"
                  alt="Go Smart System Co. Logo"
                  className="w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-full object-cover"
                />
              </div>
            </div>
            <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50 animate-bounce"></div>
          </div>

          {/* Brand name */}
          <div className="mb-4 sm:mb-5">
            <span className="text-teal-400 text-sm sm:text-base font-semibold tracking-[0.3em] uppercase">Go Smart System Co.</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6 sm:mb-8">
            <i className="ri-shield-check-line text-teal-400 text-sm"></i>
            <span className="text-xs sm:text-sm text-white/80 font-medium">
              Trusted by {loading ? '…' : formatStat(liveStats?.schoolCount ?? 0)} Schools Across Rwanda
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-display text-white leading-tight mb-4 sm:mb-6 max-w-4xl">
            {loading ? (
              <span className="inline-block w-96 h-16 bg-white/10 rounded-xl animate-pulse" />
            ) : (
              <>
                {title.includes('Go Smart') ? (
                  <>
                    {title.split('Go Smart')[0]}
                    <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                      Go Smart
                    </span>
                    {title.split('Go Smart')[1]}
                  </>
                ) : title}
              </>
            )}
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl text-teal-300 font-semibold mb-4 sm:mb-6">
            {loading ? (
              <span className="inline-block w-64 h-8 bg-white/10 rounded-lg animate-pulse" />
            ) : subtitle}
          </p>

          <p className="text-base sm:text-lg text-white/60 font-light mb-10 sm:mb-12 leading-relaxed max-w-2xl">
            Complete School Management System for nursery and primary schools. Manage academics, finance, and communication from one intelligent platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-10 sm:mb-14">
            <a
              href="https://demo.gosmartmis.rw"
              className="group px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full font-semibold text-base sm:text-lg hover:shadow-2xl hover:shadow-teal-500/30 hover:scale-105 transition-all flex items-center gap-3 whitespace-nowrap"
            >
              Navigate Through Our Demo
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-90 transition-transform">
                <i className="ri-arrow-right-line text-white text-sm"></i>
              </div>
            </a>

          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-xs sm:text-sm text-white/50 mb-14 sm:mb-20">
            <span className="flex items-center gap-2">
              <i className="ri-checkbox-circle-fill text-emerald-400"></i>
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <i className="ri-checkbox-circle-fill text-emerald-400"></i>
              14-day free trial
            </span>
            <span className="flex items-center gap-2">
              <i className="ri-checkbox-circle-fill text-emerald-400"></i>
              Cancel anytime
            </span>
          </div>

          {/* 6-card animated stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 w-full max-w-5xl">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                rawValue={stat.value}
                label={stat.label}
                icon={stat.icon}
                color={stat.color}
                iconColor={stat.iconColor}
                animate={animateStats}
                loading={!!loading}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"></div>
    </section>
  );
}
