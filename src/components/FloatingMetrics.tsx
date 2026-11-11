import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WeatherStation, ThemeConfig } from '../types';

interface FloatingMetricsProps {
  station: WeatherStation;
  theme: ThemeConfig;
  isCelsius?: boolean;
}

function parseMinutes(hhmm?: string): number | null {
  if (!hhmm) return null;
  const match = hhmm.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function formatCountdown(diffMins: number): string {
  const m = Math.max(0, Math.round(diffMins));
  const hrs = Math.floor(m / 60);
  const mins = m % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

function getAqiBadgeClass(level?: string): string {
  const l = (level || '').toLowerCase();
  if (l.includes('good')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
  if (l.includes('moderate')) return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
  if (l.includes('unhealthy')) return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
  if (l.includes('severe') || l.includes('hazard')) return 'bg-rose-500/25 text-rose-300 border-rose-400/35';
  return 'bg-slate-500/20 text-slate-300 border-white/10';
}

function getAqiMarkerPercent(aqi: number | null | undefined): number {
  if (aqi == null) return 0;
  if (aqi >= 1 && aqi <= 5) {
    return Math.min(97, Math.max(4, ((aqi - 0.5) / 5) * 100));
  }
  return Math.min(97, Math.max(3, (aqi / 500) * 100));
}

export const FloatingMetrics: React.FC<FloatingMetricsProps> = ({
  station,
  theme,
  isCelsius = true,
}) => {
  const { t } = useTranslation();

  const solarArcData = useMemo(() => {
    const riseMins = parseMinutes(station.sunrise) ?? 378; // 06:18
    const setMins = parseMinutes(station.sunset) ?? 1094; // 18:14

    // Determine current time in station timezone if available, else local browser time
    let nowMins: number;
    if (station.timezoneOffsetSec != null) {
      const shiftedMs = Date.now() + station.timezoneOffsetSec * 1000;
      const d = new Date(shiftedMs);
      nowMins = d.getUTCHours() * 60 + d.getUTCMinutes();
    } else {
      const d = new Date();
      nowMins = d.getHours() * 60 + d.getMinutes();
    }

    const totalDaylight = Math.max(60, setMins - riseMins);
    const isDaytime = nowMins >= riseMins && nowMins <= setMins;
    const progress = isDaytime
      ? Math.min(1, Math.max(0, (nowMins - riseMins) / totalDaylight))
      : nowMins < riseMins
        ? 0
        : 1;

    // Quadratic Bezier point along M 10 38 Q 100 -4, 190 38
    const u = progress;
    const p0 = { x: 10, y: 38 };
    const p1 = { x: 100, y: -4 };
    const p2 = { x: 190, y: 38 };
    const dotX = (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * p1.x + u * u * p2.x;
    const dotY = (1 - u) * (1 - u) * p0.y + 2 * (1 - u) * u * p1.y + u * u * p2.y;

    let countdownLabel: string;
    if (isDaytime) {
      countdownLabel = `${t('metrics.sunsetIn')} ${formatCountdown(setMins - nowMins)}`;
    } else if (nowMins < riseMins) {
      countdownLabel = `${t('metrics.sunriseIn')} ${formatCountdown(riseMins - nowMins)}`;
    } else {
      const minsUntilTomorrowRise = 24 * 60 - nowMins + riseMins;
      countdownLabel = `${t('metrics.sunriseIn')} ${formatCountdown(minsUntilTomorrowRise)}`;
    }

    return { dotX, dotY, isDaytime, countdownLabel };
  }, [station.sunrise, station.sunset, station.timezoneOffsetSec, t]);

  if (!station) return null;

  const accent = theme.accentHex || '#00f2fe';
  const formatTemp = (c?: number) => {
    if (c == null) return '--';
    return isCelsius ? Math.round(c) : Math.round((c * 9) / 5 + 32);
  };
  const tempUnit = isCelsius ? '°C' : '°F';

  const uvTipKey =
    station.uvIndex <= 2
      ? 'low'
      : station.uvIndex <= 5
        ? 'moderate'
        : station.uvIndex <= 7
          ? 'high'
          : station.uvIndex <= 10
            ? 'veryHigh'
            : 'extreme';

  const translatedAqiLevel = station.aqiLevel
    ? t(`metrics.aqiLevels.${station.aqiLevel}`, station.aqiLevel)
    : undefined;

  const isLevelScale = station.aqi != null && station.aqi >= 1 && station.aqi <= 5;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. AIR QUALITY INDEX (AQI) */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 7.2, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.02, y: -6 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} transition-all duration-300 relative overflow-hidden`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            {t('metrics.airQuality')}
          </span>
          {translatedAqiLevel && (
            <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full border ${getAqiBadgeClass(station.aqiLevel)}`}>
              {translatedAqiLevel}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display font-light text-3xl text-white">
            {station.aqi != null ? station.aqi : '--'}
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            {isLevelScale ? 'LVL (1-5)' : 'AQI'}
          </span>
        </div>

        <div className="mt-3 relative">
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
            <div className="h-full w-full bg-gradient-to-r from-emerald-400 via-amber-400 via-orange-500 to-rose-600 rounded-full" />
          </div>
          {station.aqi != null && (
            <div
              className="absolute top-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-900 shadow-md"
              style={{
                left: `${getAqiMarkerPercent(station.aqi)}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}
        </div>

        <div className="flex justify-between mt-1 font-mono text-[8px] text-slate-500">
          <span className="text-emerald-400">{isLevelScale ? '1' : '0'}</span>
          <span className="text-amber-400">{isLevelScale ? '3' : '150'}</span>
          <span className="text-rose-400">{isLevelScale ? '5' : '500'}</span>
        </div>

        {station.aqiDominant && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
            <span className="font-mono text-[9px] text-slate-400">{t('metrics.dominantPollutant')}:</span>
            <span className="font-mono text-[9px] font-semibold text-cyan-300">{station.aqiDominant}</span>
          </div>
        )}
      </motion.div>

      {/* 2. HUMIDITY & DEW POINT */}
      <motion.div
        animate={{ y: [4, -4, 4] }}
        transition={{ duration: 7.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        whileHover={{ scale: 1.02, y: -6 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} transition-all duration-300 relative overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            {t('metrics.humidityIndex')}
          </span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-white/[0.05] text-cyan-300">
            RH
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-light text-3xl text-white">{station.humidity}</span>
              <span className="font-mono text-xs text-cyan-300">%</span>
            </div>
            <p className="font-mono text-[10px] text-slate-400 mt-1">{station.vaporStatus}</p>
            <p className="font-mono text-[10px] text-slate-500 mt-1.5">
              {t('metrics.dewPoint')}:{' '}
              <span className="text-cyan-300 font-semibold">
                {formatTemp(station.dewPointC)}{tempUnit}
              </span>
            </p>
          </div>

          <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
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
                stroke={accent}
                strokeWidth="3.5"
                strokeDasharray={`${station.humidity}, 100`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
              />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* 3. WIND VECTOR */}
      <motion.div
        animate={{ y: [-4, 5, -4], rotate: [-0.25, 0.25, -0.25] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        whileHover={{ scale: 1.02, y: -6 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} transition-all duration-300 relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full filter blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            {t('metrics.windVelocity')}
          </span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-white/[0.05] text-cyan-300">
            {station.windDirection} · {station.windAngle}°
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-full border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
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
              <span className="font-display font-light text-3xl text-white">{station.windSpeed}</span>
              <span className="font-mono text-xs text-slate-400">km/h</span>
            </div>
            <p className="font-mono text-[10px] text-slate-500 mt-0.5">
              {t('metrics.gustsTo')} <span className="text-slate-300">{station.gusts} km/h</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* 4. UV INDEX & SUN SAFETY */}
      <motion.div
        animate={{ y: [4, -4, 4] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        whileHover={{ scale: 1.02, y: -6 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} transition-all duration-300 relative overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            {t('metrics.uvRadiation')}
          </span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
            {station.uvDescription}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display font-light text-3xl text-amber-300">{station.uvIndex}</span>
          <span className="font-mono text-[11px] text-slate-400">{t('metrics.index')}</span>
        </div>

        <div className="w-full bg-white/[0.08] h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(Math.max(8, station.uvIndex * 8.5), 100)}%` }}
          />
        </div>

        <p className="font-mono text-[10px] text-amber-300/90 mt-2">
          ☀ {t(`metrics.uvTips.${uvTipKey}`)}
        </p>
      </motion.div>

      {/* 5. OPTICAL VISIBILITY & CLOUD COVER */}
      <motion.div
        animate={{ y: [-3, 4, -3] }}
        transition={{ duration: 6.8, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
        whileHover={{ scale: 1.02, y: -6 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} transition-all duration-300 relative overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            {t('metrics.visibility')}
          </span>
          <svg className="w-4 h-4 text-cyan-300 opacity-75" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="font-display font-light text-3xl text-white">{station.visibilityKm}</span>
          <span className="font-mono text-xs text-slate-400">km</span>
        </div>
        <p className="font-mono text-[10px] text-cyan-300/90 mt-1">{station.visibilityStatus}</p>

        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.5 20q-2.275 0-3.887-1.575Q1 16.85 1 14.575q0-1.95 1.175-3.475Q3.35 9.575 5.25 9.1q.525-2.35 2.4-3.725Q9.525 4 12 4q2.925 0 4.962 2.038Q19 8.075 19 11q1.725.2 2.863 1.488Q23 13.775 23 15.5q0 1.875-1.312 3.188Q20.375 20 18.5 20Z" />
            </svg>
            <span className="font-mono text-[10px] text-slate-400">{t('metrics.cloudCover')}</span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-slate-200">
            {station.cloudCover ?? '--'}%
          </span>
        </div>
      </motion.div>

      {/* 6. BAROMETRIC PRESSURE */}
      <motion.div
        animate={{ y: [3, -3, 3] }}
        transition={{ duration: 8.4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        whileHover={{ scale: 1.02, y: -6 }}
        className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} transition-all duration-300 relative overflow-hidden`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            {t('metrics.atmosphericPressure')}
          </span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 whitespace-nowrap">
            {station.pressureTendency}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-display font-light text-3xl text-white">{station.pressureHpa}</span>
          <span className="font-mono text-xs text-slate-400">hPa</span>
        </div>

        <div className="w-full h-9">
          <svg className="w-full h-full" viewBox="0 0 120 26" fill="none" preserveAspectRatio="none">
            <path
              d="M0 18 Q 30 6, 60 15 T 120 9"
              stroke={accent}
              strokeWidth="1.6"
              strokeLinecap="round"
              className="opacity-85"
              style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
            />
            <path
              d="M0 18 Q 30 6, 60 15 T 120 9 L 120 26 L 0 26 Z"
              fill="url(#pressure-grad)"
              opacity="0.22"
            />
            <defs>
              <linearGradient id="pressure-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>

      {/* 7. CELESTIAL CYCLES: SUNRISE & SUNSET COUNTDOWN ARC */}
      <motion.div
        animate={{ y: [-2, 3, -2] }}
        transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut', delay: 2.4 }}
        whileHover={{ scale: 1.01, y: -4 }}
        className={`sm:col-span-2 p-5 rounded-3xl abyssal-glass ${theme.underglow} transition-all duration-300 relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            {t('metrics.celestial')}
          </span>
          <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
            {solarArcData.countdownLabel}
          </span>
        </div>

        {/* Dynamic Solar Progress Arc */}
        <div className="mb-3">
          <svg className="w-full h-12" viewBox="0 0 200 44" fill="none">
            {/* Horizon line */}
            <line x1="6" y1="38" x2="194" y2="38" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 4" />
            {/* Solar trajectory arc */}
            <path
              d="M10 38 Q 100 -4, 190 38"
              stroke="url(#celestial-arc)"
              strokeWidth="1.75"
              strokeLinecap="round"
              opacity="0.7"
            />
            {/* Live sun/moon marker computed from current time vs sunrise/sunset */}
            <circle
              cx={solarArcData.dotX}
              cy={solarArcData.dotY}
              r="4.2"
              fill={solarArcData.isDaytime ? '#fbbf24' : '#a78bfa'}
              style={{
                filter: `drop-shadow(0 0 7px ${solarArcData.isDaytime ? '#fbbf24' : '#a78bfa'})`,
              }}
            />
            <defs>
              <linearGradient id="celestial-arc" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M4.93 10.93l1.41 1.41M2 18h20M17.66 12.34l1.41-1.41M16 18a4 4 0 0 0-8 0" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-amber-400/80 block">
                {t('metrics.sunrise')}
              </span>
              <span className="font-display font-light text-lg text-amber-100">
                {station.sunrise ?? '--:--'}
              </span>
            </div>
          </div>

          <span className="font-mono text-[9px] text-slate-500 hidden sm:inline">
            {t('metrics.localSolar')}
          </span>

          <div className="flex items-center gap-3 text-right">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-purple-400/80 block">
                {t('metrics.sunset')}
              </span>
              <span className="font-display font-light text-lg text-purple-100">
                {station.sunset ?? '--:--'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/15 border border-purple-400/25 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FloatingMetrics;
