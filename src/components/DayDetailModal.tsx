import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailyForecast, ThemeConfig } from '../types';

export function displayTemp(c: number, isCelsius: boolean): string {
  return isCelsius ? `${Math.round(c)}°` : `${Math.round((c * 9) / 5 + 32)}°`;
}

export function WeatherIcon({ type, className = 'w-6 h-6' }: { type: string; className?: string }) {
  switch (type) {
    case 'sun':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="5" fill="#fbbf24" style={{ filter: 'drop-shadow(0 0 6px #fbbf24)' }} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1={12 + 7 * Math.cos((deg * Math.PI) / 180)}
              y1={12 + 7 * Math.sin((deg * Math.PI) / 180)}
              x2={12 + 9.5 * Math.cos((deg * Math.PI) / 180)}
              y2={12 + 9.5 * Math.sin((deg * Math.PI) / 180)}
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ))}
        </svg>
      );
    case 'rain':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M6 15a5 5 0 1 1 7.94-5.94A3.5 3.5 0 1 1 16.5 15H6Z" fill="#38bdf8" opacity="0.85" />
          <line x1="8" y1="17" x2="7" y2="20" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="12" y1="17" x2="11" y2="20" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="16" y1="17" x2="15" y2="20" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'storm':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M5 15a5 5 0 1 1 8-5.65A3.5 3.5 0 1 1 15.5 15H5Z" fill="#a855f7" opacity="0.75" />
          <polyline points="13,11 10,16 14,16 11,21" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'snow':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M5 14a5 5 0 1 1 8-5.65A3.5 3.5 0 1 1 14.5 14H5Z" fill="#bfdbfe" opacity="0.7" />
          <circle cx="8" cy="18" r="1.2" fill="#bfdbfe" />
          <circle cx="12" cy="19" r="1.2" fill="#bfdbfe" />
          <circle cx="16" cy="18" r="1.2" fill="#bfdbfe" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M6 16a5 5 0 1 1 7.94-5.94A3.5 3.5 0 1 1 16.5 16H6Z" fill="#94a3b8" opacity="0.85" />
        </svg>
      );
  }
}

interface DayDetailModalProps {
  day: DailyForecast | null;
  cityName: string;
  isCelsius: boolean;
  theme: ThemeConfig;
  onClose: () => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ day, cityName, isCelsius, theme, onClose }) => {
  return (
    <AnimatePresence>
      {day && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.94, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-5xl rounded-3xl abyssal-glass ${theme.underglow} border border-cyan-400/30 p-5 sm:p-8 max-h-[92vh] overflow-y-auto`}
          >
            {/* Header with Full Date & Close Button */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10">
              <div className="flex items-center gap-4">
                <WeatherIcon type={day.iconType} className="w-12 h-12" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                      {day.date}
                    </span>
                    <span className="font-mono text-xs text-slate-400">{cityName}</span>
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl text-white mt-1">
                    {day.fullDate || day.date}
                  </h2>
                  <p className="font-mono text-xs text-cyan-300/90 mt-0.5">{day.condition}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/25 border border-white/15 hover:border-rose-400/40 font-mono text-xs text-white transition-all"
              >
                ✕ ESC
              </button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
                <span className="font-mono text-[10px] uppercase text-slate-400">High / Low</span>
                <p className="font-display text-2xl text-white mt-1">
                  {displayTemp(day.highC, isCelsius)}{' '}
                  <span className="text-slate-400 text-base">/ {displayTemp(day.lowC, isCelsius)}</span>
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
                <span className="font-mono text-[10px] uppercase text-slate-400">Rain Probability</span>
                <p className="font-display text-2xl text-cyan-300 mt-1">
                  {day.pop}% <span className="font-mono text-xs text-slate-400">({day.totalPrecipMm ?? 0} mm)</span>
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
                <span className="font-mono text-[10px] uppercase text-slate-400">Max Wind & UV</span>
                <p className="font-display text-2xl text-white mt-1">
                  {day.maxWindKph ?? 12} <span className="font-mono text-xs text-slate-400">km/h · UV {day.uvIndex ?? 4}</span>
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
                <span className="font-mono text-[10px] uppercase text-slate-400">Avg Humidity</span>
                <p className="font-display text-2xl text-emerald-300 mt-1">{day.humidity ?? 58}%</p>
              </div>
            </div>

            {/* Sun & Moon Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] font-mono text-xs">
              <div><span className="text-amber-300">☀ Sunrise:</span> <span className="text-white">{day.sunrise ?? '06:20 AM'}</span></div>
              <div><span className="text-purple-300">🌇 Sunset:</span> <span className="text-white">{day.sunset ?? '05:45 PM'}</span></div>
              <div><span className="text-cyan-300">🌙 Moonrise:</span> <span className="text-white">{day.moonrise ?? '06:40 PM'}</span></div>
              <div><span className="text-indigo-300">🌑 Phase:</span> <span className="text-white">{day.moonPhase ?? 'Waxing'} ({day.moonIllumination ?? 65}%)</span></div>
            </div>

            {/* 24-Hour Telemetry Grid */}
            <h4 className="font-mono text-xs uppercase tracking-widest text-slate-300 mb-3">
              24-Hour Telemetry Breakdown ({day.fullDate || day.date})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {(day.hours && day.hours.length > 0 ? day.hours : []).map((h, idx) => (
                <div
                  key={`${h.time}-${idx}`}
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center text-center"
                >
                  <span className="font-mono text-[11px] text-slate-400 mb-1.5">{h.time}</span>
                  <WeatherIcon type={h.iconType} className="w-6 h-6 mb-1.5" />
                  <span className="font-display text-lg text-white">{displayTemp(h.tempC, isCelsius)}</span>
                  <span className="font-mono text-[10px] text-cyan-300 mt-1">{h.pop}% Rain</span>
                  {h.windKph != null && (
                    <span className="font-mono text-[9px] text-slate-500 mt-0.5">{h.windKph} km/h</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DayDetailModal;