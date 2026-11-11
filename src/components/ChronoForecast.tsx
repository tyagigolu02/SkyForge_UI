import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WeatherStation, ThemeConfig, DailyForecast } from '../types';

interface ChronoForecastProps {
  station: WeatherStation;
  theme: ThemeConfig;
  isCelsius: boolean;
}

type TabKey = '24h' | '7day' | 'past';

function displayTemp(c: number, isCelsius: boolean): string {
  if (isCelsius) return `${Math.round(c)}°`;
  return `${Math.round((c * 9) / 5 + 32)}°`;
}

function WeatherIcon({ type, className = 'w-6 h-6' }: { type: string; className?: string }) {
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
    case 'cloud':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M6 16a5 5 0 1 1 7.94-5.94A3.5 3.5 0 1 1 16.5 16H6Z" fill="#94a3b8" opacity="0.85" />
        </svg>
      );
    case 'storm':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M5 15a5 5 0 1 1 8-5.65A3.5 3.5 0 1 1 15.5 15H5Z" fill="#a855f7" opacity="0.75" />
          <polyline
            points="13,11 10,16 14,16 11,21"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 4px #fbbf24)' }}
          />
        </svg>
      );
    case 'aurora':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M3 18 Q 7 6, 12 10 T 21 6" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
          <path d="M5 20 Q 9 10, 14 13 T 22 9" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    case 'snow':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M5 14a5 5 0 1 1 8-5.65A3.5 3.5 0 1 1 14.5 14H5Z" fill="#bfdbfe" opacity="0.65" />
          {[8, 12, 16].map((x) => (
            <g key={x}>
              <line x1={x} y1="17" x2={x} y2="21" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round" />
              <line x1={x - 1.5} y1="18.5" x2={x + 1.5} y2="18.5" stroke="#bfdbfe" strokeWidth="1" strokeLinecap="round" />
            </g>
          ))}
        </svg>
      );
    default:
      return <div className={`${className} rounded-full bg-white/10`} />;
  }
}

function deterministic7d(station: WeatherStation): DailyForecast[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const highOffsets = [0, 2, -1, 3, 1, -2, 2];
  const lowOffsets = [0, 1, -2, 1, -1, -3, 1];
  const popOffsets = [15, 25, 45, 10, 30, 55, 15];
  const icons: DailyForecast['iconType'][] = ['sun', 'cloud', 'rain', 'sun', 'cloud', 'rain', 'sun'];
  const conditions = ['CLEAR SKY', 'PARTLY CLOUDY', 'LIGHT RAIN', 'SUNNY', 'MOSTLY CLOUDY', 'SHOWERS', 'CLEAR'];
  const today = new Date().getDay();

  return Array.from({ length: 7 }, (_, i) => ({
    date: days[(today + i) % 7],
    highC: Math.round(station.highC + highOffsets[i]),
    lowC: Math.round(station.lowC + lowOffsets[i]),
    pop: popOffsets[i],
    iconType: icons[i],
    condition: conditions[i],
  }));
}

function deterministic3dHistory(station: WeatherStation): DailyForecast[] {
  const offsets = [
    { dHigh: -1, dLow: -1, pop: 18, hum: Math.max(20, station.humidity - 3), cond: 'MOSTLY CLEAR', icon: 'sun' as const },
    { dHigh: -2, dLow: -3, pop: 42, hum: Math.min(95, station.humidity + 6), cond: 'SCATTERED SHOWERS', icon: 'rain' as const },
    { dHigh: 1, dLow: -2, pop: 12, hum: Math.max(20, station.humidity - 6), cond: 'PARTLY CLOUDY', icon: 'cloud' as const },
  ];

  return offsets.map((cfg, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (idx + 1));
    const dateLabel =
      idx === 0
        ? 'Yesterday'
        : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return {
      date: dateLabel,
      highC: Math.round(station.highC + cfg.dHigh),
      lowC: Math.round(station.lowC + cfg.dLow),
      pop: cfg.pop,
      humidity: cfg.hum,
      iconType: cfg.icon,
      condition: cfg.cond,
    };
  });
}

export const ChronoForecast: React.FC<ChronoForecastProps> = ({ station, theme, isCelsius }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('24h');
  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(0);
  const carouselWrapperRef = useRef<HTMLDivElement | null>(null);

  const tabs: { key: TabKey; label: string }[] = [
    { key: '24h', label: t('forecast.hourly') },
    { key: '7day', label: t('forecast.weekly') },
    { key: 'past', label: t('forecast.past') },
  ];

  const accent = theme.accentHex || '#00f2fe';
  const forecast7d: DailyForecast[] =
    station.forecast7d && station.forecast7d.length > 0
      ? station.forecast7d
      : deterministic7d(station);

  const history3d: DailyForecast[] =
    station.history3d && station.history3d.length > 0
      ? station.history3d
      : deterministic3dHistory(station);

  const weekMin = Math.min(...forecast7d.map((d) => d.lowC));
  const weekMax = Math.max(...forecast7d.map((d) => d.highC));
  const weekRange = weekMax - weekMin || 1;

  return (
    <div>
      {/* Header & Interactive View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
          <h3 className="font-display font-medium text-xs sm:text-sm tracking-[0.2em] uppercase text-white">
            {t('forecast.title')}
          </h3>
          {activeTab === '24h' && (
            <span className="font-mono text-[10px] text-slate-500 hidden md:inline">
              · {t('forecast.draggable')}
            </span>
          )}
          {activeTab === 'past' && (
            <span className="font-mono text-[10px] text-slate-500 hidden md:inline">
              · {t('forecast.pastSubtitle')}
            </span>
          )}
        </div>

        {/* 3 View Mode Tabs */}
        <div className="inline-flex p-1 rounded-2xl abyssal-glass self-start sm:self-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-3.5 py-1.5 rounded-xl font-mono text-[10px] sm:text-[11px] tracking-wider uppercase transition-colors ${
                  isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="chrono-active-tab"
                    className="absolute inset-0 rounded-xl bg-cyan-400/15 border border-cyan-400/35"
                    style={{ boxShadow: `0 0 14px ${accent}40` }}
                    transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <div className={`relative rounded-3xl abyssal-glass ${theme.underglow} overflow-hidden`}>
        {/* MODE 1: 24-HOUR INTERACTIVE SCRUB TIMELINE */}
        {activeTab === '24h' && (
          <div ref={carouselWrapperRef} className="p-4 overflow-hidden">
            <motion.div
              drag="x"
              dragConstraints={carouselWrapperRef}
              dragElastic={0.15}
              className="flex gap-3 cursor-grab active:cursor-grabbing select-none"
              style={{ width: 'max-content' }}
            >
              {station.forecast24h.map((hour, i) => {
                const isSelected = selectedHourIdx === i;
                return (
                  <motion.div
                    key={`${hour.time}-${i}`}
                    onClick={() => setSelectedHourIdx(i)}
                    whileHover={{ y: -4, scale: 1.03 }}
                    className={`flex-shrink-0 min-w-[120px] sm:min-w-[138px] p-3.5 rounded-2xl border text-center transition-all duration-300 ${
                      isSelected
                        ? 'bg-white/[0.1] border-cyan-400/40 shadow-[0_0_20px_rgba(0,242,254,0.25)]'
                        : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    <p className="font-mono text-[11px] text-slate-300 mb-2">{hour.time}</p>
                    <div className="flex justify-center mb-2">
                      <WeatherIcon type={hour.iconType} className="w-7 h-7" />
                    </div>
                    <p className="font-display font-light text-xl text-white">
                      {displayTemp(hour.tempC, isCelsius)}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="font-mono text-[9px] text-cyan-300/90">
                        {hour.pop}% {t('forecast.pop')}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}

        {/* MODE 2: 7-DAY FUTURE FORECAST */}
        {activeTab === '7day' && (
          <div className="p-4 flex flex-col gap-2">
            {forecast7d.map((day, i) => {
              const lowPct = ((day.lowC - weekMin) / weekRange) * 100;
              const highPct = ((day.highC - weekMin) / weekRange) * 100;
              const barStart = Math.round(lowPct);
              const barWidth = Math.max(10, Math.round(highPct - lowPct));

              return (
                <motion.div
                  key={`${day.date}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors"
                >
                  <span className="font-mono text-xs text-slate-300 w-10 flex-shrink-0 font-semibold">
                    {day.date}
                  </span>

                  <WeatherIcon type={day.iconType} className="w-6 h-6 flex-shrink-0" />

                  <span className="font-mono text-[10px] sm:text-xs text-slate-400 flex-1 truncate">
                    {day.condition}
                  </span>

                  {/* Precipitation % */}
                  <div className="hidden xs:flex sm:flex items-center gap-1 w-14 justify-end flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span className="font-mono text-[10px] text-cyan-300">{day.pop}%</span>
                  </div>

                  {/* Low – Range Bar – High */}
                  <div className="flex items-center gap-2 flex-shrink-0 w-32 sm:w-44">
                    <span className="font-mono text-[11px] text-slate-400 w-8 text-right">
                      {displayTemp(day.lowC, isCelsius)}
                    </span>
                    <div className="relative flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className="absolute h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-400"
                        style={{ left: `${barStart}%`, width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-white font-semibold w-8">
                      {displayTemp(day.highC, isCelsius)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* MODE 3: PAST HISTORY (PAST 3 DAYS WEATHER TELEMETRY) */}
        {activeTab === 'past' && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {history3d.map((day, i) => (
              <motion.div
                key={`${day.date}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-cyan-300 font-semibold">{day.date}</span>
                  <WeatherIcon type={day.iconType} className="w-7 h-7" />
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-light text-2xl text-white">
                      {displayTemp(day.highC, isCelsius)}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      / {displayTemp(day.lowC, isCelsius)}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-slate-300 mt-1 truncate">{day.condition}</p>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] font-mono text-[10px] text-slate-400">
                  <span>
                    {t('forecast.pop')}: <span className="text-cyan-300">{day.pop}%</span>
                  </span>
                  {day.humidity != null && (
                    <span>
                      {t('forecast.humidity')}: <span className="text-slate-200">{day.humidity}%</span>
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="h-1 bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-amber-500/40 pointer-events-none" />
      </div>
    </div>
  );
};

export default ChronoForecast;
