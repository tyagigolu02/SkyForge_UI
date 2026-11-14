import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WeatherStation, ThemeConfig, DailyForecast } from '../types';
import { DayDetailModal, WeatherIcon, displayTemp } from './DayDetailModal';

interface ChronoForecastProps {
  station: WeatherStation;
  theme: ThemeConfig;
  isCelsius: boolean;
}

type TabKey = '24h' | '7day' | 'past';

export const ChronoForecast: React.FC<ChronoForecastProps> = ({ station, theme, isCelsius }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('24h');
  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(0);
  const [selectedDayModal, setSelectedDayModal] = useState<DailyForecast | null>(null);
  const carouselWrapperRef = useRef<HTMLDivElement | null>(null);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const tabs: { key: TabKey; label: string }[] = [
    { key: '24h', label: t('forecast.hourly', '24H STREAM') },
    { key: '7day', label: t('forecast.weekly', '16-DAY OUTLOOK') },
    { key: 'past', label: t('forecast.past', 'PAST 7 DAYS') },
  ];

  const accent = theme.accentHex || '#00f2fe';
  const forecast16d: DailyForecast[] = station.forecast7d ?? [];
  const history7d: DailyForecast[] = station.history3d ?? [];
  const activeDays = activeTab === '7day' ? forecast16d : history7d;

  const allTemps = activeDays.flatMap((d) => [d.lowC, d.highC]);
  const minTemp = allTemps.length ? Math.min(...allTemps) : 10;
  const maxTemp = allTemps.length ? Math.max(...allTemps) : 35;
  const tempRange = maxTemp - minTemp || 1;

  return (
    <div>
      {/* Header, Today's Live Date & View Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
          <h3 className="font-display font-medium text-xs sm:text-sm tracking-[0.2em] uppercase text-white">
            {t('forecast.title')}
          </h3>
          <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/25">
            TODAY · {todayFormatted}
          </span>
        </div>

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

      {/* Main Glass Container */}
      <div className={`relative rounded-3xl abyssal-glass ${theme.underglow} overflow-hidden`}>
        {/* MODE 1: 24-HOUR INTERACTIVE SCRUB TIMELINE */}
        {activeTab === '24h' && (
          <div ref={carouselWrapperRef} className="p-4 overflow-x-auto no-scrollbar">
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
                    className={`flex-shrink-0 min-w-[120px] sm:min-w-[136px] p-3.5 rounded-2xl border text-center transition-all duration-300 ${
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

        {/* MODE 2 & 3: UNIFIED CARD GRID (16-Day = 4x4 Cards | Past 7-Day = 4 Cards + 3 Spread Cards) */}
        {(activeTab === '7day' || activeTab === 'past') && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
            {activeDays.map((day, i) => {
              // Past 7 Days: Row 1 (first 4 cards) = col-span-3 (4 cards), Row 2 (last 3 cards) = col-span-4 (3 stretched cards!)
              const isPastSecondRow = activeTab === 'past' && activeDays.length === 7 && i >= 4;
              const colSpanClass = isPastSecondRow ? 'lg:col-span-4' : 'lg:col-span-3';

              const barStart = Math.round(((day.lowC - minTemp) / tempRange) * 100);
              const barWidth = Math.max(12, Math.round(((day.highC - day.lowC) / tempRange) * 100));

              return (
                <motion.div
                  key={`${day.date}-${i}`}
                  onClick={() => setSelectedDayModal(day)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className={`${colSpanClass} p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-cyan-400/[0.08] hover:border-cyan-400/35 cursor-pointer transition-all flex flex-col justify-between gap-3`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-cyan-300 font-semibold block truncate">
                        {day.date}
                      </span>
                      {day.fullDate && (
                        <span className="font-mono text-[10px] text-slate-400 block truncate mt-0.5">
                          {day.fullDate}
                        </span>
                      )}
                    </div>
                    <WeatherIcon type={day.iconType} className="w-7 h-7 flex-shrink-0" />
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

                    {/* Thermal Range Bar */}
                    <div className="relative w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden mt-2.5">
                      <div
                        className="absolute h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-400"
                        style={{ left: `${barStart}%`, width: `${barWidth}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] font-mono text-[10px] text-slate-400">
                    <span>
                      {t('forecast.pop')}: <span className="text-cyan-300 font-semibold">{day.pop}%</span>
                    </span>
                    <span>
                      RH: <span className="text-slate-200 font-semibold">{day.humidity ?? 55}%</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="h-1 bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-amber-500/40 pointer-events-none" />
      </div>

      {/* Full-Screen Day Telemetry Modal */}
      <DayDetailModal
        day={selectedDayModal}
        cityName={station.city}
        isCelsius={isCelsius}
        theme={theme}
        onClose={() => setSelectedDayModal(null)}
      />
    </div>
  );
};

export default ChronoForecast;