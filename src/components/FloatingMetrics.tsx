import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WeatherStation, ThemeConfig } from '../types';

interface FloatingMetricsProps {
  station: WeatherStation;
  theme: ThemeConfig;
}

/**
 * FloatingMetrics Component
 * Renders anti-gravity floating micro-metric orbs with asynchronous levitation physics,
 * luminous under-glows, borderless frosted glassmorphism, and multi-language support.
 */
export const FloatingMetrics: React.FC<FloatingMetricsProps> = ({ station, theme }) => {
  const { t } = useTranslation();
  if (!station) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      
      {/* 1. WIND VELOCITY & VECTOR COMPASS */}
      <motion.div
        animate={{ y: [-4, 5, -4], rotate: [-0.3, 0.3, -0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.02, y: -6 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} transition-all duration-300 relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full filter blur-2xl" />

        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
            {t('metrics.windVelocity')}
          </span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-white/[0.05] text-cyan-300">
            {station.windDirection} // {station.windAngle}°
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-full border border-cyan-400/20 flex items-center justify-center">
            <motion.div
              animate={{ rotate: station.windAngle }}
              transition={{ type: 'spring', stiffness: 80, damping: 15 }}
              className="w-full h-full absolute inset-0 flex items-center justify-center"
            >
              <div className="w-1 h-6 bg-gradient-to-t from-transparent via-cyan-400 to-cyan-200 rounded-full shadow-[0_0_10px_#00f2fe]" />
            </motion.div>
            <span className="font-mono text-[9px] font-bold text-slate-400">N</span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-light text-3xl text-white">
                {station.windSpeed}
              </span>
              <span className="font-mono text-xs text-slate-400">km/h</span>
            </div>
            <p className="font-mono text-[10px] text-slate-500 mt-0.5">
              {t('metrics.gustsTo')} <span className="text-slate-300">{station.gusts} km/h</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* 2. HUMIDITY & VAPOR MENISCUS */}
      <motion.div
        animate={{ y: [4, -5, 4], rotate: [0.3, -0.3, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        whileHover={{ scale: 1.02, y: -6 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} transition-all duration-300 relative overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
            {t('metrics.humidityIndex')}
          </span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-white/[0.05] text-cyan-300">
            REL: RH
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-light text-3xl text-white">
                {station.humidity}
              </span>
              <span className="font-mono text-xs text-cyan-300">%</span>
            </div>
            <p className="font-mono text-[10px] text-slate-400 mt-1">
              {station.vaporStatus}
            </p>
          </div>

          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="3.5"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={theme.accentHex || '#00f2fe'}
                strokeWidth="3.5"
                strokeDasharray={`${station.humidity}, 100`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 6px ${theme.accentHex || '#00f2fe'})` }}
              />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* 3. UV RADIATION SPECTRAL PILL */}
      <motion.div
        animate={{ y: [-5, 4, -5] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        whileHover={{ scale: 1.02, y: -6 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} transition-all duration-300 relative overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
            {t('metrics.uvRadiation')}
          </span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display font-light text-3xl text-amber-300">
            {station.uvIndex}
          </span>
          <span className="font-mono text-[11px] text-slate-400">{t('metrics.index')}</span>
        </div>

        <div className="w-full bg-white/[0.08] h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 rounded-full"
            style={{ width: `${Math.min(station.uvIndex * 8, 100)}%` }}
          />
        </div>
        <p className="font-mono text-[9px] text-slate-400 mt-2 truncate">
          {station.uvDescription}
        </p>
      </motion.div>

      {/* 4. OPTICAL CLARITY (VISIBILITY) */}
      <motion.div
        animate={{ y: [4, -4, 4] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        whileHover={{ scale: 1.02, y: -6 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} transition-all duration-300 relative overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
            {t('metrics.visibility')}
          </span>
          <svg className="w-4 h-4 text-cyan-300 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="font-display font-light text-3xl text-white">
            {station.visibilityKm}
          </span>
          <span className="font-mono text-xs text-slate-400">km</span>
        </div>
        <p className="font-mono text-[10px] text-cyan-300/90 mt-1">
          {station.visibilityStatus}
        </p>
      </motion.div>

      {/* 5. BAROMETRIC PRESSURE CHAMBER */}
      <motion.div
        animate={{ y: [-3, 3, -3] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        whileHover={{ scale: 1.01, y: -4 }}
        className={`sm:col-span-2 p-5 rounded-3xl abyssal-glass ${theme.underglow} transition-all duration-300 relative overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
              {t('metrics.atmosphericPressure')}
            </span>
            <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300">
              {t('metrics.isobarChamber')}
            </span>
          </div>
          <span className="font-mono text-[10px] text-cyan-400">
            {station.pressureTendency}
          </span>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="font-display font-light text-3xl text-white">
            {station.pressureHpa}
          </span>
          <span className="font-mono text-xs text-slate-400">hPa</span>

          <div className="ml-auto w-36 h-8">
            <svg className="w-full h-full" viewBox="0 0 100 24" fill="none">
              <path
                d="M0 16 Q 25 4, 50 14 T 100 8"
                stroke={theme.accentHex || '#00f2fe'}
                strokeWidth="1.5"
                strokeLinecap="round"
                className="opacity-80"
                style={{ filter: `drop-shadow(0 0 6px ${theme.accentHex || '#00f2fe'})` }}
              />
              <path
                d="M0 16 Q 25 4, 50 14 T 100 8 L 100 24 L 0 24 Z"
                fill="url(#pressure-grad)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="pressure-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.accentHex || '#00f2fe'} />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </motion.div>

    </div>
  );
};

export default FloatingMetrics;

