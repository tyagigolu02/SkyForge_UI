import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WeatherStation, ThemeConfig } from '../types';
import FloatingMetrics from './FloatingMetrics';
import ChronoForecast from './ChronoForecast';
import AtmosphericBackground from './AtmosphericBackground';
import WeatherRadarSection from './WeatherRadarSection';
import { useRecentSearches } from '../utils/useRecentSearches';
import { searchCitySuggestions, CitySuggestion } from '../services/api';

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

const POPULAR_HUBS = ['New Delhi', 'Meerut', 'Mumbai', 'Tokyo'];

function toMins(t?: string, fallback = 380): number {
  if (!t) return fallback;
  const m = t.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return fallback;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const p = m[3]?.toUpperCase();
  if (p === 'PM' && h < 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

export const WeatherDashboard: React.FC<WeatherDashboardProps> = ({
  station,
  theme,
  isCelsius,
  onToggleUnit,
  onSearch,
  onSelectStation,
  searchesRemaining,
  isAuthenticated,
  isSearching,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [selectedLocMeta, setSelectedLocMeta] = useState<{ state: string; country: string } | null>(null);
  const { recentSearches, addSearch, clearSearches, removeSearch } = useRecentSearches();

  const isQuotaExhausted = !isAuthenticated && searchesRemaining === 0;
  const displayTemp = (c: number) => (isCelsius ? c : Math.round((c * 9) / 5 + 32));
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  // Fetch City Autocomplete Suggestions as User Types
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const list = await searchCitySuggestions(q);
      setSuggestions(list);
      setShowHints(list.length > 0);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Also Resolve State & Country if Backend Didn't Send Region
  useEffect(() => {
    if (station.region && station.region.toLowerCase() !== station.city.toLowerCase()) {
      setSelectedLocMeta({ state: station.region, country: station.country || '' });
      return;
    }
    searchCitySuggestions(station.city).then((list) => {
      if (list[0]) setSelectedLocMeta({ state: list[0].state, country: list[0].country });
    });
  }, [station.city, station.region, station.country]);

  // Real-Time East -> West Sky Arc Dot Calculation
  const skyArcDot = useMemo(() => {
    const rise = toMins(station.sunrise, 375);
    const set = toMins(station.sunset, 1080);
    const match = String(station.localtime || '').match(/(\d{1,2}):(\d{2})/);
    const now = new Date();
    const nowMins = match ? parseInt(match[1], 10) * 60 + parseInt(match[2], 10) : now.getHours() * 60 + now.getMinutes();

    const isDay = nowMins >= rise && nowMins <= set;
    const u = isDay
      ? Math.min(1, Math.max(0, (nowMins - rise) / Math.max(60, set - rise)))
      : Math.min(1, Math.max(0, (nowMins > set ? nowMins - set : 1440 - set + nowMins) / Math.max(60, 1440 - set + rise)));

    const dotX = (1 - u) * (1 - u) * 12 + 2 * (1 - u) * u * 100 + u * u * 188;
    const dotY = (1 - u) * (1 - u) * 36 + 2 * (1 - u) * u * -2 + u * u * 36;
    return { dotX, dotY, isDay };
  }, [station.localtime, station.sunrise, station.sunset]);

  const executeCitySelect = (cityName: string, meta?: { state: string; country: string }) => {
    const cleaned = cityName.trim();
    if (!cleaned) return;
    if (meta) setSelectedLocMeta(meta);
    if (!isQuotaExhausted) addSearch(cleaned);
    setShowHints(false);
    setSearchQuery('');
    onSearch(cleaned);
  };

  const stateLabel = selectedLocMeta?.state || (station.region !== station.city ? station.region : '');
  const countryLabel = selectedLocMeta?.country || station.country || '';
  const locationSubtitle = [stateLabel, countryLabel].filter(Boolean).join(', ');

  return (
    <div id="sec-overview" className="relative w-full min-w-0">
      <AtmosphericBackground station={station} />

      <div className="relative z-10">
        {/* Search Bar with Live Autocomplete Hints Dropdown */}
        <div className="mb-8 relative max-w-2xl mx-auto z-30">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeCitySelect(searchQuery);
            }}
          >
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
                  onFocus={() => suggestions.length > 0 && setShowHints(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className="w-full min-w-0 bg-transparent px-2 sm:px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-none"
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                disabled={isSearching}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono text-xs font-semibold tracking-wider uppercase shadow-underglow-cyan"
              >
                {isSearching ? t('search.transmitting') : t('search.button')}
              </motion.button>
            </div>
          </form>

          {/* City Hints Autocomplete Dropdown */}
          <AnimatePresence>
            {showHints && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 right-0 mt-2 p-2 rounded-3xl abyssal-glass-deep border border-cyan-400/30 shadow-abyssal z-50 divide-y divide-white/[0.06]"
              >
                {suggestions.map((s, idx) => (
                  <button
                    key={`${s.name}-${s.lat}-${idx}`}
                    type="button"
                    onClick={() => executeCitySelect(s.name, { state: s.state, country: s.country })}
                    className="w-full px-4 py-2.5 text-left hover:bg-cyan-400/15 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="font-display text-sm font-medium text-white truncate">{s.name}</span>
                      <span className="font-mono text-[11px] text-cyan-300/85 truncate">
                        {[s.state, s.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 flex-shrink-0">
                      {s.lat.toFixed(2)}°, {s.lon.toFixed(2)}°
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Favorite / Recent Chips */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mr-1">
              {recentSearches.length > 0 ? t('search.recentSearches') : t('search.popularHubs')}:
            </span>
            {(recentSearches.length > 0 ? recentSearches : POPULAR_HUBS).map((city) => {
              const isActive = station?.city?.toLowerCase() === city.toLowerCase();
              return (
                <span
                  key={city}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] tracking-wider transition-all group ${
                    isActive ? 'bg-white/[0.12] text-white shadow-[0_0_15px_rgba(0,242,254,0.35)]' : 'bg-white/[0.05] text-slate-300 hover:text-white'
                  }`}
                >
                  <button type="button" onClick={() => onSelectStation(city)} className="hover:text-cyan-300">
                    {city.toUpperCase()}
                  </button>
                  {recentSearches.length > 0 && (
                    <button type="button" onClick={() => removeSearch(city)} className="opacity-50 group-hover:opacity-100 hover:text-rose-400 text-[10px]">✕</button>
                  )}
                </span>
              );
            })}
            {recentSearches.length > 0 && (
              <button type="button" onClick={clearSearches} className="font-mono text-[9px] text-slate-500 hover:text-rose-400 uppercase px-2 py-1 rounded-full bg-white/[0.03]">
                {t('search.clearAll')}
              </button>
            )}
          </div>
        </div>

        {/* Balanced 12-Col Spatial HUD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between gap-4 min-w-0">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3 font-mono text-[10px] tracking-[0.18em] text-slate-400">
                <span className="px-2.5 py-1 rounded-full bg-white/[0.05]">{t('hud.station')}: {station.code}</span>
                <span>{station.latLong}</span>
                <span className="px-2.5 py-1 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">{todayStr}</span>
              </div>

              {/* City Name + Smaller State & Country Name Right Beside It */}
              <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
                <motion.h1
                  key={station.city}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-display font-light tracking-[0.15em] text-3xl sm:text-5xl md:text-6xl text-white uppercase break-words"
                >
                  {station.city}
                </motion.h1>
                {locationSubtitle && (
                  <span className="font-mono text-xs sm:text-sm tracking-[0.14em] text-slate-400 uppercase">
                    · {locationSubtitle}
                  </span>
                )}
              </div>

              <div className="mt-1.5 font-mono text-xs sm:text-sm tracking-[0.22em] text-cyan-300/85 flex items-center gap-2">
                <span className="inline-block w-2 h-0.5 bg-cyan-400" />
                {station.condition}
              </div>

              <div className="relative my-4 flex flex-wrap items-center justify-between gap-4 min-w-0">
                <div className="relative flex items-start min-w-0">
                  <span className="font-display font-extralight tracking-tighter text-[5rem] sm:text-[7.5rem] lg:text-[9.5rem] leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400 select-none">
                    {displayTemp(station.tempC)}
                  </span>
                  <div className="flex flex-col ml-2 mt-3">
                    <button type="button" onClick={onToggleUnit} className="font-display font-light text-4xl sm:text-6xl text-cyan-300 hover:text-white leading-none">°</button>
                    <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase mt-1">
                      {isCelsius ? t('hud.celsius') : t('hud.fahrenheit')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-4 rounded-3xl abyssal-glass-subtle shadow-abyssal min-w-[140px]">
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /><span className="font-mono text-[10px] text-slate-400">{t('hud.high')}</span><span className="font-mono text-xs font-semibold text-white ml-auto">{displayTemp(station.highC)}°</span></div>
                  <div className="w-full h-[1px] bg-white/[0.06]" />
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /><span className="font-mono text-[10px] text-slate-400">{t('hud.low')}</span><span className="font-mono text-xs font-semibold text-white ml-auto">{displayTemp(station.lowC)}°</span></div>
                  <div className="w-full h-[1px] bg-white/[0.06]" />
                  <div className="flex items-center justify-between gap-3"><span className="font-mono text-[9px] uppercase text-slate-500">{t('hud.feelsLike')}</span><span className="font-mono text-xs font-bold text-cyan-300">{displayTemp(station.feelsLikeC)}°</span></div>
                </div>
              </div>
            </div>

            {/* Bottom Cards Under Temperature: Live Waveform + Real-Time Sky Arc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-4 rounded-3xl abyssal-glass ${theme.underglow} relative overflow-hidden flex flex-col justify-between`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">ATMOSPHERIC WAVEFORM</span>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> {station.windSpeed} km/h
                  </span>
                </div>
                <svg className="w-full h-14 my-1" viewBox="0 0 240 50" fill="none">
                  <motion.path
                    d="M 0 25 Q 30 5, 60 25 T 120 25 T 180 25 T 240 25"
                    stroke="#00f2fe"
                    strokeWidth="2"
                    fill="none"
                    animate={{ d: [
                      'M 0 25 Q 30 5, 60 25 T 120 25 T 180 25 T 240 25',
                      'M 0 25 Q 30 45, 60 25 T 120 25 T 180 25 T 240 25',
                      'M 0 25 Q 30 5, 60 25 T 120 25 T 180 25 T 240 25',
                    ] }}
                    transition={{ duration: Math.max(1.2, 4 - station.windSpeed * 0.08), repeat: Infinity, ease: 'easeInOut' }}
                  />
                </svg>
                <div className="flex justify-between font-mono text-[10px] text-slate-400 pt-2 border-t border-white/[0.06]">
                  <span>Feels: <strong className="text-white">{displayTemp(station.feelsLikeC)}°</strong></span>
                  <span>Cloud: <strong className="text-cyan-300">{station.cloudCover ?? 20}%</strong></span>
                </div>
              </div>

              <div className={`p-4 rounded-3xl abyssal-glass ${theme.underglow} relative overflow-hidden flex flex-col justify-between`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">EAST → WEST SKY ARC</span>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300">
                    {skyArcDot.isDay ? 'SOLAR TRANSIT' : station.moonPhase}
                  </span>
                </div>
                <svg className="w-full h-12" viewBox="0 0 200 42" fill="none">
                  <line x1="8" y1="36" x2="192" y2="36" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                  <path d="M 12 36 Q 100 -2, 188 36" stroke="url(#skyArcGrad)" strokeWidth="2" strokeLinecap="round" />
                  <circle
                    cx={skyArcDot.dotX}
                    cy={skyArcDot.dotY}
                    r="5"
                    fill={skyArcDot.isDay ? '#fbbf24' : '#818cf8'}
                    style={{ filter: `drop-shadow(0 0 8px ${skyArcDot.isDay ? '#fbbf24' : '#818cf8'})` }}
                  />
                  <defs>
                    <linearGradient id="skyArcGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex justify-between font-mono text-[10px] text-slate-300 pt-2 border-t border-white/[0.06]">
                  <span>☀ E: <strong className="text-amber-300">{station.sunrise}</strong></span>
                  <span>🌇 W: <strong className="text-purple-300">{station.sunset}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div id="sec-metrics" className="lg:col-span-5 scroll-mt-24">
            <FloatingMetrics station={station} theme={theme} isCelsius={isCelsius} />
          </div>
        </div>

        <div id="sec-forecast" className="mt-12 scroll-mt-24">
          <ChronoForecast station={station} theme={theme} isCelsius={isCelsius} />
        </div>

        <WeatherRadarSection station={station} theme={theme} />
      </div>
    </div>
  );
};

export default WeatherDashboard;