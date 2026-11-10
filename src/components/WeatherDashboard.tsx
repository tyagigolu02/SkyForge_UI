import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WeatherStation, ThemeConfig } from '../types';
import FloatingMetrics from './FloatingMetrics';

interface WeatherDashboardProps {
  station: WeatherStation;
  theme: ThemeConfig;
  isCelsius: boolean;
  onToggleUnit: () => void;
  onSearch: (city: string) => void;
  onSelectStation: (city: string) => void;
  searchesRemaining: number;
  searchesUsed: number;
  maxLimit: number;
  isAuthenticated: boolean;
  isSearching: boolean;
  isColdStarting?: boolean;
  cacheLatencyMs: number;
  isCachePurging: boolean;
  onPurgeCache: () => void;
  cacheHits: number;
}

/**
 * WeatherDashboard Component
 * The central spatial HUD: handles city search, guest quota indicators,
 * responsive sculptural oversized typography, floating micro-metrics, and the draggable chrono-timeline.
 */
export const WeatherDashboard: React.FC<WeatherDashboardProps> = ({
  station,
  theme,
  isCelsius,
  onToggleUnit,
  onSearch,
  onSelectStation,
  searchesRemaining,
  searchesUsed,
  maxLimit,
  isAuthenticated,
  isSearching,
  isColdStarting = false,
  cacheLatencyMs,
  isCachePurging,
  onPurgeCache,
  cacheHits,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeScrubIndex, setActiveScrubIndex] = useState<number | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onSearch(searchQuery.trim());
    setSearchQuery('');
  };

  const displayTemp = (celsius: number) => {
    if (isCelsius) return celsius;
    return Math.round((celsius * 9) / 5 + 32);
  };

  const isQuotaExhausted = !isAuthenticated && searchesRemaining === 0;

  return (
    <div className="w-full">
      
      {/* =========================================================================
          SPATIAL SEARCH CAPSULE WITH FUTURISTIC GUEST ACCESS TELEMETRY
          ========================================================================= */}
      <div className="mb-8">
        <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center rounded-3xl abyssal-glass p-2 shadow-abyssal transition-all focus-within:shadow-[0_0_40px_rgba(0,242,254,0.3)] gap-2 sm:gap-0">
            
            {/* Search Input Box */}
            <div className="flex items-center flex-1">
              <div className="pl-4 pr-2 text-cyan-400">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-none"
              />
            </div>

            {/* Futuristic Guest Access Indicator Badge & Action */}
            <div className="flex items-center justify-between sm:justify-end gap-2 pr-1 sm:pr-2 pl-2 sm:pl-0">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[9px] sm:text-[10px] tracking-wider whitespace-nowrap transition-all ${
                  isAuthenticated
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_15px_rgba(0,255,194,0.2)]'
                    : isQuotaExhausted
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse'
                    : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shadow-[0_0_15px_rgba(0,242,254,0.2)]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isAuthenticated
                      ? 'bg-emerald-400 animate-pulse'
                      : isQuotaExhausted
                      ? 'bg-rose-400'
                      : 'bg-cyan-400'
                  }`}
                />
                <span>
                  {isAuthenticated
                    ? t('header.operatorPro')
                    : isQuotaExhausted
                    ? t('search.guestLimitLocked')
                    : `⚡ ${t('search.guestAccess')}: ${searchesRemaining}/${maxLimit} ${t('search.remaining')}`}
                </span>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isSearching}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono text-xs font-semibold tracking-wider uppercase shadow-underglow-cyan transition-all"
              >
                {isSearching ? t('search.transmitting') : t('search.button')}
              </motion.button>
            </div>
          </div>
        </form>

        {/* Cold Start Notice Banner for Render.com */}
        {isColdStarting && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-2 text-center"
          >
            <span className="font-mono text-[9px] uppercase tracking-widest text-amber-300/90 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              {t('header.coldStartNotice')}
            </span>
          </motion.div>
        )}

        {/* Quick Atmospheric Station Selector Chips */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mr-1">
            {t('search.atmosphericHubs')}
          </span>
          {['tokyo', 'reykjavik', 'atacama', 'svalbard'].map((stationKey) => {
            const isSelected = station?.id === stationKey;
            return (
              <button
                key={stationKey}
                onClick={() => onSelectStation(stationKey)}
                className={`px-3 py-1 rounded-full font-mono text-[10px] tracking-wider transition-all ${
                  isSelected
                    ? 'bg-white/[0.12] text-white shadow-[0_0_15px_rgba(0,242,254,0.35)]'
                    : 'bg-white/[0.03] text-slate-400 hover:text-slate-200'
                }`}
              >
                {stationKey.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          MAIN ASYMMETRICAL HUD SECTION
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT / CENTER: THE MONOLITH CURRENT TEMPERATURE */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          
          {/* Metadata Ribbon */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-wrap items-center gap-3 mb-3 font-mono text-[10px] tracking-[0.2em] text-slate-400"
          >
            <span className="px-2.5 py-1 rounded-full bg-white/[0.04] backdrop-blur-md">
              {t('hud.station')}: {station.code}
            </span>
            <span>{station.latLong}</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="hidden sm:inline">{station.elevation}</span>
          </motion.div>

          {/* City Headline */}
          <div className="relative">
            <motion.h1
              key={station.city}
              initial={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6 }}
              className="font-display font-light tracking-[0.18em] sm:tracking-[0.22em] text-3xl sm:text-5xl md:text-6xl text-white uppercase break-words"
              style={{ textShadow: '0 10px 40px rgba(0,0,0,0.8)' }}
            >
              {station.city}
            </motion.h1>

            <motion.div
              key={station.condition}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-1 font-mono text-xs sm:text-sm tracking-[0.25em] text-cyan-300/80 flex items-center gap-2"
            >
              <span className="inline-block w-2 h-0.5 bg-cyan-400" />
              {station.condition}
            </motion.div>
          </div>

          {/* RESPONSIVE SCULPTURAL CURRENT TEMPERATURE (THE MONOLITH) */}
          <div className="relative my-4 flex flex-wrap sm:flex-nowrap items-baseline gap-4 sm:gap-6">
            <div
              className="absolute -inset-10 filter blur-[90px] opacity-35 rounded-full pointer-events-none transition-colors duration-1000"
              style={{ background: theme.ambientGlowPrimary }}
            />

            <motion.div
              key={station.tempC + (isCelsius ? 'C' : 'F')}
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="relative flex items-start"
            >
              {/* Scaled gracefully using exact Directive: text-[5.5rem] sm:text-[8rem] lg:text-[12rem] */}
              <span
                className="font-display font-extralight tracking-tighter text-[5.5rem] sm:text-[8rem] lg:text-[12rem] leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400 select-none"
                style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.95))' }}
              >
                {displayTemp(station.tempC)}
              </span>

              {/* Detached Floating Degree Symbol & Unit Switcher */}
              <div className="flex flex-col ml-1 sm:ml-3 mt-2 sm:mt-6">
                <button
                  type="button"
                  onClick={onToggleUnit}
                  title="Click to toggle Celsius / Fahrenheit"
                  className="font-display font-light text-4xl sm:text-6xl lg:text-7xl text-cyan-300 hover:text-white transition-colors cursor-pointer"
                  style={{ filter: `drop-shadow(0 0 20px ${theme.accentHex || '#00f2fe'})` }}
                >
                  °
                </button>
                <span className="font-mono text-[10px] sm:text-xs tracking-widest text-slate-500 uppercase mt-1">
                  {isCelsius ? t('hud.celsius') : t('hud.fahrenheit')}
                </span>
              </div>
            </motion.div>

            {/* High / Low / Feels Like Vertical Pill */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="ml-auto sm:ml-4 flex flex-col gap-2 p-3 sm:p-3.5 rounded-3xl abyssal-glass-subtle shadow-abyssal min-w-[120px]"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="font-mono text-[10px] text-slate-400">{t('hud.high')}</span>
                <span className="font-mono text-xs font-semibold text-white ml-auto">
                  {displayTemp(station.highC)}°
                </span>
              </div>

              <div className="w-full h-[1px] bg-white/[0.06]" />

              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="font-mono text-[10px] text-slate-400">{t('hud.low')}</span>
                <span className="font-mono text-xs font-semibold text-white ml-auto">
                  {displayTemp(station.lowC)}°
                </span>
              </div>

              <div className="w-full h-[1px] bg-white/[0.06]" />

              <div className="pt-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 block">
                  {t('hud.feelsLike')}
                </span>
                <span className="font-mono text-xs font-bold text-cyan-300">
                  {displayTemp(station.feelsLikeC)}°
                </span>
              </div>
            </motion.div>
          </div>

          {/* Solar Peak & Geodesic Arc Info */}
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 flex-wrap">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
              {t('hud.solarPeak')}: {station.zenithTime}
            </span>
            <span className="opacity-20 hidden sm:inline">|</span>
            <span className="flex items-center gap-1.5 text-cyan-300/80">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {t('hud.sensorSync')}
            </span>
          </div>

        </div>

        {/* RIGHT: FLOATING MICRO-METRICS */}
        <div className="lg:col-span-5">
          <FloatingMetrics station={station} theme={theme} />
        </div>

      </div>

      {/* =========================================================================
          HORIZONTAL DRAGGABLE CHRONO-TIMELINE (24-Hour Forecast)
          ========================================================================= */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
            <h3 className="font-display font-medium text-xs sm:text-sm tracking-[0.2em] uppercase text-white">
              {t('timeline.chronoForecast')}
            </h3>
            <span className="font-mono text-[10px] text-slate-500 hidden sm:inline">
              {t('timeline.draggable')}
            </span>
          </div>
          <span className="font-mono text-[10px] text-cyan-300/80">
            {t('timeline.swipeHint')}
          </span>
        </div>

        <div className="relative p-2 rounded-3xl abyssal-glass shadow-abyssal overflow-hidden">
          <motion.div
            drag="x"
            dragConstraints={{ left: -320, right: 0 }}
            dragElastic={0.2}
            className="flex items-center gap-4 py-3 px-4 cursor-grab active:cursor-grabbing select-none"
          >
            {station.forecast24h?.map((item, idx) => {
              const isHovered = activeScrubIndex === idx;
              return (
                <motion.div
                  key={item.time}
                  whileHover={{ scale: 1.05, y: -4 }}
                  onClick={() => setActiveScrubIndex(idx)}
                  className={`relative min-w-[125px] sm:min-w-[145px] p-4 rounded-2xl flex flex-col items-center justify-between transition-all duration-300 ${
                    isHovered
                      ? 'bg-white/[0.1] shadow-[0_0_25px_rgba(0,242,254,0.35)]'
                      : 'bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="font-mono text-xs text-slate-300 tracking-wider">
                    {item.time}
                  </span>

                  <div className="my-3">
                    {item.iconType === 'sun' && (
                      <svg className="w-7 h-7 text-amber-300 filter drop-shadow-[0_0_8px_#ffaa00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                      </svg>
                    )}
                    {item.iconType === 'rain' && (
                      <svg className="w-7 h-7 text-cyan-300 filter drop-shadow-[0_0_8px_#00f2fe]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
                        <path d="M8 19v2M8 13v2M16 19v2M16 13v2M12 21v2M12 15v2" />
                      </svg>
                    )}
                    {item.iconType === 'storm' && (
                      <svg className="w-7 h-7 text-purple-300 filter drop-shadow-[0_0_8px_#a855f7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
                        <polyline points="13 11 9 17 15 17 11 23" />
                      </svg>
                    )}
                    {item.iconType === 'aurora' && (
                      <svg className="w-7 h-7 text-emerald-300 filter drop-shadow-[0_0_8px_#00ffc2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M2 12c4-6 8-6 12 0s8 6 12 0" />
                        <path d="M2 17c4-6 8-6 12 0s8 6 12 0" />
                      </svg>
                    )}
                    {item.iconType === 'cloud' && (
                      <svg className="w-7 h-7 text-slate-300 filter drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                      </svg>
                    )}
                    {item.iconType === 'snow' && (
                      <svg className="w-7 h-7 text-sky-200 filter drop-shadow-[0_0_8px_#38bdf8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M12 2v20M17 5l-5 5-5-5M17 19l-5-5-5 5M2 12h20M5 7l5 5-5 5M19 7l-5 5 5 5" />
                      </svg>
                    )}
                  </div>

                  <span className="font-display font-light text-2xl text-white">
                    {displayTemp(item.tempC)}°
                  </span>

                  <div className="mt-2 flex items-center gap-1 font-mono text-[10px] text-cyan-300/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {item.pop}% {t('timeline.pop')}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-amber-500/40 pointer-events-none" />
        </div>
      </div>

    </div>
  );
};

export default WeatherDashboard;

