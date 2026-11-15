import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WeatherStation, ThemeConfig } from '../types';

interface FloatingMetricsProps {
  station: WeatherStation;
  theme: ThemeConfig;
  isCelsius?: boolean;
}

function getAqiBadgeClass(aqi = 50): string {
  if (aqi <= 50) return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
  if (aqi <= 100) return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
  if (aqi <= 200) return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
  if (aqi <= 300) return 'bg-rose-500/25 text-rose-300 border-rose-400/35';
  return 'bg-purple-600/30 text-purple-200 border-purple-400/45 shadow-[0_0_12px_rgba(168,85,247,0.4)]';
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
  const aqiVal = station.aqi ?? 100;
  const aqiPct = Math.min(97, Math.max(3, (aqiVal / 500) * 100));

  // Dynamic aerodynamic oscillation for the compass arrow based on windSpeed
  const baseAngle = station.windAngle ?? 315;
  const swayDeg = Math.min(12, Math.max(3, Math.round((station.windSpeed || 5) * 0.45)));
  const swayDuration = Math.max(1.1, 3.2 - Math.min(2, (station.windSpeed || 5) * 0.06));

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
          <span className={`font-mono text-[9px] px-2.5 py-0.5 rounded-full border ${getAqiBadgeClass(aqiVal)}`}>
            {station.aqiLevel ?? 'Poor'}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display font-light text-3xl text-white">{aqiVal}</span>
          <span className="font-mono text-[11px] text-slate-400">AQI</span>
        </div>
        <div className="mt-3 relative">
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
            <div className="h-full w-full bg-gradient-to-r from-emerald-400 via-amber-400 via-rose-500 to-purple-600 rounded-full" />
          </div>
          <div className="absolute top-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-900" style={{ left: `${aqiPct}%`, transform: 'translate(-50%, -50%)' }} />
        </div>
        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-white/[0.06] font-mono text-[9px] text-center">
          <div className="p-1 rounded-lg bg-white/[0.03]"><span className="text-slate-400 block">PM2.5</span><span className="text-cyan-300">{Math.round(station.pm2_5 ?? 185)}</span></div>
          <div className="p-1 rounded-lg bg-white/[0.03]"><span className="text-slate-400 block">PM10</span><span className="text-cyan-300">{Math.round(station.pm10 ?? 290)}</span></div>
          <div className="p-1 rounded-lg bg-white/[0.03]"><span className="text-slate-400 block">NO₂</span><span className="text-cyan-300">{Math.round(station.no2 ?? 24)}</span></div>
          <div className="p-1 rounded-lg bg-white/[0.03]"><span className="text-slate-400 block">O₃</span><span className="text-cyan-300">{Math.round(station.o3 ?? 68)}</span></div>
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
            <p className="font-mono text-[10px] text-slate-400 mt-1.5">
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

      {/* 3. WIND VECTOR: 4-Direction Compass with Live Fluttering Anemometer Arrow */}
      <motion.div
        animate={{ y: [-3, 4, -3] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        whileHover={{ scale: 1.02, y: -5 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} relative overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{t('metrics.windVelocity')}</span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-white/[0.05] text-cyan-300">
            {station.windDirection} · {baseAngle}°
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0 select-none">
            {/* Subtle Pulsing Wind Radar Aura */}
            <motion.div
              animate={{ scale: [0.85, 1.12, 0.85], opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: swayDuration, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-2 rounded-full bg-cyan-400/20 blur-sm"
            />
            <svg className="w-full h-full" viewBox="0 0 64 64" fill="none">
              <path d="M 38 9 A 24 24 0 0 1 55 26" stroke="rgba(255,255,255,0.2)" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M 55 38 A 24 24 0 0 1 38 55" stroke="rgba(255,255,255,0.2)" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M 26 55 A 24 24 0 0 1 9 38" stroke="rgba(255,255,255,0.2)" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M 9 26 A 24 24 0 0 1 26 9" stroke="rgba(255,255,255,0.2)" strokeWidth="3.2" strokeLinecap="round" />
              <text x="32" y="11" textAnchor="middle" className="fill-cyan-300 font-mono text-[8px] font-bold">N</text>
              <text x="56" y="34.5" textAnchor="middle" className="fill-slate-400 font-mono text-[8px] font-semibold">E</text>
              <text x="32" y="59" textAnchor="middle" className="fill-slate-400 font-mono text-[8px] font-semibold">S</text>
              <text x="8" y="34.5" textAnchor="middle" className="fill-slate-400 font-mono text-[8px] font-semibold">W</text>
            </svg>

            {/* Live Fluttering Compass Arrow (Oscillates around windAngle!) */}
            <motion.svg
              key={baseAngle}
              initial={{ rotate: baseAngle }}
              animate={{
                rotate: [
                  baseAngle - swayDeg,
                  baseAngle + swayDeg,
                  baseAngle - Math.round(swayDeg * 0.5),
                  baseAngle + Math.round(swayDeg * 0.7),
                  baseAngle - swayDeg,
                ],
              }}
              transition={{ duration: swayDuration, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 64 64"
            >
              <path
                d="M 32 14 L 40 44 L 32 37.5 L 24 44 Z"
                fill="#38bdf8"
                stroke="#00f2fe"
                strokeWidth="1.2"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 8px rgba(0,242,254,0.8))' }}
              />
              <circle cx="32" cy="32" r="2.2" fill="#ffffff" />
            </motion.svg>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-light text-3xl text-white">{station.windSpeed}</span>
              <span className="font-mono text-xs text-slate-400">km/h</span>
            </div>
            <p className="font-mono text-[10px] text-slate-500 mt-0.5">
              {t('metrics.gustsTo')} <span className="text-slate-300">{station.gusts} km/h</span>
            </p>
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
          <span className="text-slate-200 font-semibold">{station.cloudCover ?? 15}%</span>
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