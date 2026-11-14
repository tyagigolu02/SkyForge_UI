import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WeatherStation, ThemeConfig } from '../types';

interface FloatingMetricsProps {
  station: WeatherStation;
  theme: ThemeConfig;
  isCelsius?: boolean;
}

function getAqiBadgeClass(level?: string): string {
  const l = (level || '').toLowerCase();
  if (l.includes('good')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
  if (l.includes('moderate')) return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
  if (l.includes('unhealthy')) return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
  return 'bg-rose-500/25 text-rose-300 border-rose-400/35';
}

export const FloatingMetrics: React.FC<FloatingMetricsProps> = ({
  station,
  theme,
  isCelsius = true,
}) => {
  const { t } = useTranslation();
  if (!station) return null;

  const accent = theme.accentHex || '#00f2fe';
  const formatTemp = (c?: number) => (c == null ? '--' : isCelsius ? Math.round(c) : Math.round((c * 9) / 5 + 32));
  const tempUnit = isCelsius ? '°C' : '°F';
  const aqiPct = station.aqi != null ? Math.min(97, Math.max(3, (station.aqi / 500) * 100)) : 20;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. AIR QUALITY INDEX + POLLUTANTS */}
      <motion.div
        animate={{ y: [-3, 3, -3] }}
        transition={{ duration: 7.2, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.02, y: -5 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} relative overflow-hidden`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{t('metrics.airQuality')}</span>
          <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full border ${getAqiBadgeClass(station.aqiLevel)}`}>
            {station.aqiLevel ?? 'Moderate'}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display font-light text-3xl text-white">{station.aqi ?? '--'}</span>
          <span className="font-mono text-[11px] text-slate-400">US AQI</span>
        </div>
        <div className="mt-3 relative">
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
            <div className="h-full w-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-600 rounded-full" />
          </div>
          <div className="absolute top-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-900" style={{ left: `${aqiPct}%`, transform: 'translate(-50%, -50%)' }} />
        </div>
        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-white/[0.06] font-mono text-[9px] text-center">
          <div className="p-1 rounded-lg bg-white/[0.03]"><span className="text-slate-400 block">PM2.5</span><span className="text-cyan-300">{Math.round(station.pm2_5 ?? 35)}</span></div>
          <div className="p-1 rounded-lg bg-white/[0.03]"><span className="text-slate-400 block">PM10</span><span className="text-cyan-300">{Math.round(station.pm10 ?? 68)}</span></div>
          <div className="p-1 rounded-lg bg-white/[0.03]"><span className="text-slate-400 block">NO₂</span><span className="text-cyan-300">{Math.round(station.no2 ?? 18)}</span></div>
          <div className="p-1 rounded-lg bg-white/[0.03]"><span className="text-slate-400 block">O₃</span><span className="text-cyan-300">{Math.round(station.o3 ?? 52)}</span></div>
        </div>
      </motion.div>

      {/* 2. HUMIDITY & DEW POINT */}
      <motion.div
        animate={{ y: [3, -3, 3] }}
        transition={{ duration: 7.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        whileHover={{ scale: 1.02, y: -5 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} relative overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{t('metrics.humidityIndex')}</span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-white/[0.05] text-cyan-300">RH</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-light text-3xl text-white">{station.humidity}</span>
              <span className="font-mono text-xs text-cyan-300">%</span>
            </div>
            <p className="font-mono text-[10px] text-slate-400 mt-1">{station.vaporStatus}</p>
            <p className="font-mono text-[10px] text-slate-500 mt-1.5">
              {t('metrics.dewPoint')}: <span className="text-cyan-300 font-semibold">{formatTemp(station.dewPointC)}{tempUnit}</span>
            </p>
          </div>
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={accent} strokeWidth="3.5" strokeDasharray={`${station.humidity}, 100`} strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* 3. WIND VECTOR */}
      <motion.div
        animate={{ y: [-3, 4, -3] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        whileHover={{ scale: 1.02, y: -5 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} relative overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{t('metrics.windVelocity')}</span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-white/[0.05] text-cyan-300">{station.windDirection} · {station.windAngle}°</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-full border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
            <motion.div animate={{ rotate: station.windAngle }} className="w-full h-full absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-6 bg-gradient-to-t from-transparent via-cyan-400 to-cyan-200 rounded-full shadow-[0_0_10px_#00f2fe]" />
            </motion.div>
            <span className="font-mono text-[9px] font-bold text-slate-400">N</span>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-light text-3xl text-white">{station.windSpeed}</span>
              <span className="font-mono text-xs text-slate-400">km/h</span>
            </div>
            <p className="font-mono text-[10px] text-slate-500 mt-0.5">{t('metrics.gustsTo')} <span className="text-slate-300">{station.gusts} km/h</span></p>
          </div>
        </div>
      </motion.div>

      {/* 4. UV INDEX */}
      <motion.div
        animate={{ y: [3, -3, 3] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
        whileHover={{ scale: 1.02, y: -5 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} relative overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{t('metrics.uvRadiation')}</span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">{station.uvDescription}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display font-light text-3xl text-amber-300">{station.uvIndex}</span>
          <span className="font-mono text-[11px] text-slate-400">{t('metrics.index')}</span>
        </div>
        <div className="w-full bg-white/[0.08] h-1.5 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 rounded-full" style={{ width: `${Math.min(Math.max(8, station.uvIndex * 8.5), 100)}%` }} />
        </div>
      </motion.div>

      {/* 5. VISIBILITY & CLOUD COVER */}
      <motion.div
        animate={{ y: [-3, 3, -3] }}
        transition={{ duration: 6.8, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
        whileHover={{ scale: 1.02, y: -5 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} relative overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{t('metrics.visibility')}</span>
          <span className="font-mono text-[9px] text-cyan-300">{station.visibilityStatus}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-display font-light text-3xl text-white">{station.visibilityKm}</span>
          <span className="font-mono text-xs text-slate-400">km</span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.06] font-mono text-[10px]">
          <span className="text-slate-400">{t('metrics.cloudCover')}</span>
          <span className="text-slate-200 font-semibold">{station.cloudCover ?? 20}%</span>
        </div>
      </motion.div>

      {/* 6. BAROMETRIC PRESSURE */}
      <motion.div
        animate={{ y: [3, -3, 3] }}
        transition={{ duration: 8.4, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
        whileHover={{ scale: 1.02, y: -5 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} relative overflow-hidden`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{t('metrics.atmosphericPressure')}</span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300">{station.pressureTendency}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display font-light text-3xl text-white">{station.pressureHpa}</span>
          <span className="font-mono text-xs text-slate-400">hPa</span>
        </div>
        <p className="font-mono text-[10px] text-slate-400 mt-3 pt-2.5 border-t border-white/[0.06]">
          Precip Volume: <span className="text-cyan-300 font-semibold">{station.precipitationMm ?? 0} mm</span>
        </p>
      </motion.div>
    </div>
  );
};

export default FloatingMetrics;