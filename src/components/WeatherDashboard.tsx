import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WeatherStation, ThemeConfig } from '../types';
import FloatingMetrics from './FloatingMetrics';
import ChronoForecast from './ChronoForecast';
import { useRecentSearches } from '../utils/useRecentSearches';

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

const POPULAR_HUBS = ['New Delhi', 'London', 'New York', 'Tokyo'];

export const WeatherDashboard: React.FC<WeatherDashboardProps> = ({
  station,
  theme,
  isCelsius,
  onToggleUnit,
  onSearch,
  onSelectStation,
  searchesRemaining,
  maxLimit,
  isAuthenticated,
  isSearching,
  isColdStarting = false,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const { recentSearches, addSearch, clearSearches, removeSearch } = useRecentSearches();

  const isQuotaExhausted = !isAuthenticated && searchesRemaining === 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = searchQuery.trim();
    if (!cleaned) return;
    if (!isQuotaExhausted) {
      addSearch(cleaned);
    }
    onSearch(cleaned);
    setSearchQuery('');
  };

  const handleChipSelect = (city: string) => {
    if (!isQuotaExhausted) {
      addSearch(city);
    }
    onSelectStation(city);
  };

  const displayTemp = (celsius: number) => {
    if (isCelsius) return celsius;
    return Math.round((celsius * 9) / 5 + 32);
  };

  return (
    <div className="w-full min-w-0">
      {/* Search Bar & Dynamic History */}
      <div className="mb-8">
        <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center rounded-3xl abyssal-glass p-2 shadow-abyssal transition-all focus-within:shadow-[0_0_40px_rgba(0,242,254,0.3)] gap-2 sm:gap-0">
            <div className="flex items-center flex-1 min-w-0">
              <div className="pl-3 sm:pl-4 pr-2 text-cyan-400 flex-shrink-0">
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
                className="w-full min-w-0 bg-transparent px-2 sm:px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-none"
              />
            </div>

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
                      : `${t('search.guestAccess')}: ${searchesRemaining}/${maxLimit} ${t('search.remaining')}`}
                </span>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                disabled={isSearching}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono text-xs font-semibold tracking-wider uppercase shadow-underglow-cyan transition-all"
              >
                {isSearching ? t('search.transmitting') : t('search.button')}
              </motion.button>
            </div>
          </div>
        </form>

        {/* Cold-start notice */}
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

        {/* Recent Searches or Popular Hubs Fallback */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          {recentSearches.length > 0 ? (
            <>
              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mr-1">
                {t('search.recentSearches')}:
              </span>
              {recentSearches.map((city) => {
                const isActive = station?.city?.toLowerCase() === city.toLowerCase();
                return (
                  <span
                    key={city}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] tracking-wider transition-all group ${
                      isActive
                        ? 'bg-white/[0.12] text-white shadow-[0_0_15px_rgba(0,242,254,0.35)]'
                        : 'bg-white/[0.05] text-slate-300 hover:text-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleChipSelect(city)}
                      className="hover:text-cyan-300 transition-colors"
                    >
                      {city.toUpperCase()}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSearch(city)}
                      className="opacity-50 group-hover:opacity-100 hover:text-rose-400 transition-all text-[10px] leading-none"
                      aria-label={`Remove ${city}`}
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
              <button
                type="button"
                onClick={clearSearches}
                className="font-mono text-[9px] text-slate-500 hover:text-rose-400 transition-colors uppercase tracking-wider px-2 py-1 rounded-full bg-white/[0.03]"
              >
                {t('search.clearAll')}
              </button>
            </>
          ) : (
            <>
              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mr-1">
                {t('search.popularHubs')}:
              </span>
              {POPULAR_HUBS.map((city) => {
                const isActive = station?.city?.toLowerCase() === city.toLowerCase();
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleChipSelect(city)}
                    className={`px-3 py-1 rounded-full font-mono text-[10px] tracking-wider transition-all ${
                      isActive
                        ? 'bg-white/[0.12] text-white shadow-[0_0_15px_rgba(0,242,254,0.35)]'
                        : 'bg-white/[0.04] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {city.toUpperCase()}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Main Asymmetrical Spatial HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Primary Weather Telemetry */}
        <div className="lg:col-span-7 flex flex-col justify-between min-w-0">
          {/* Station Coordinates & Elevation */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap items-center gap-3 mb-3 font-mono text-[10px] tracking-[0.18em] text-slate-400"
          >
            <span className="px-2.5 py-1 rounded-full bg-white/[0.05] backdrop-blur-md">
              {t('hud.station')}: {station.code}
            </span>
            <span>{station.latLong}</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="hidden sm:inline">{station.elevation}</span>
          </motion.div>

          {/* City & Condition */}
          <div className="relative min-w-0">
            <motion.h1
              key={station.city}
              initial={{ opacity: 0, x: -16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.5 }}
              className="font-display font-light tracking-[0.12em] sm:tracking-[0.2em] text-3xl sm:text-5xl md:text-6xl text-white uppercase break-words"
              style={{ textShadow: '0 10px 40px rgba(0,0,0,0.8)' }}
            >
              {station.city}
            </motion.h1>

            <motion.div
              key={station.condition}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-1.5 font-mono text-xs sm:text-sm tracking-[0.22em] text-cyan-300/85 flex items-center gap-2"
            >
              <span className="inline-block w-2 h-0.5 bg-cyan-400" />
              {station.condition}
            </motion.div>
          </div>

          {/* Monolith Current Temperature (Responsive, zero clipping on <400px viewports) */}
          <div className="relative my-5 flex flex-wrap items-center justify-between gap-4 sm:gap-6 min-w-0">
            <div
              className="absolute -inset-10 filter blur-[90px] opacity-35 rounded-full pointer-events-none transition-colors duration-1000"
              style={{ background: theme.ambientGlowPrimary }}
            />

            <motion.div
              key={station.tempC + (isCelsius ? 'C' : 'F')}
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="relative flex items-start min-w-0"
            >
              <span
                className="font-display font-extralight tracking-tighter text-[5rem] sm:text-[8rem] lg:text-[11.5rem] leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400 select-none"
                style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.95))' }}
              >
                {displayTemp(station.tempC)}
              </span>

              <div className="flex flex-col ml-1 sm:ml-3 mt-1 sm:mt-5 flex-shrink-0">
                <button
                  type="button"
                  onClick={onToggleUnit}
                  title="Toggle Celsius / Fahrenheit"
                  className="font-display font-light text-4xl sm:text-6xl lg:text-7xl text-cyan-300 hover:text-white transition-colors cursor-pointer leading-none"
                  style={{ filter: `drop-shadow(0 0 20px ${theme.accentHex || '#00f2fe'})` }}
                >
                  °
                </button>
                <span className="font-mono text-[10px] sm:text-xs tracking-widest text-slate-400 uppercase mt-1">
                  {isCelsius ? t('hud.celsius') : t('hud.fahrenheit')}
                </span>
              </div>
            </motion.div>

            {/* High / Low / Feels Like Card */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col gap-2 p-3 sm:p-4 rounded-3xl abyssal-glass-subtle shadow-abyssal min-w-[130px] sm:ml-auto"
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

              <div className="pt-0.5 flex items-center justify-between gap-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                  {t('hud.feelsLike')}
                </span>
                <span className="font-mono text-xs font-bold text-cyan-300">
                  {displayTemp(station.feelsLikeC)}°
                </span>
              </div>
            </motion.div>
          </div>

          {/* Solar Noon & Live Telemetry Status */}
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 flex-wrap">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
              {t('hud.solarPeak')}: {station.zenithTime}
            </span>
            <span className="opacity-20 hidden sm:inline">|</span>
            <span className="flex items-center gap-1.5 text-cyan-300/85">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {t('hud.sensorSync')}
            </span>
          </div>
        </div>

        {/* Right: Complete 7-Card Atmospheric Metrics Matrix */}
        <div className="lg:col-span-5">
          <FloatingMetrics station={station} theme={theme} isCelsius={isCelsius} />
        </div>
      </div>

      {/* Multi-Mode Chrono-Forecast */}
      <div className="mt-12">
        <ChronoForecast station={station} theme={theme} isCelsius={isCelsius} />
      </div>
    </div>
  );
};

export default WeatherDashboard;
