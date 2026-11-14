import React, { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { WeatherStation } from '../types';

interface AtmosphericBackgroundProps {
  station: WeatherStation;
}

function toMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const m = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const mer = m[3]?.toUpperCase();
  if (mer === 'PM' && h < 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

// Calculates East (Left = 6vw) to West (Right = 94vw) position if current time is between rise & set
function computeArcPosition(nowMins: number, riseMins: number | null, setMins: number | null) {
  if (riseMins == null || setMins == null) return { visible: false, leftVw: 50, topVh: 15 };

  let duration = setMins - riseMins;
  let elapsed = nowMins - riseMins;

  // Handle overnight cycle (e.g., Moon rises at 19:00 and sets at 06:30 next morning)
  if (duration <= 0) {
    duration += 1440;
    if (nowMins < riseMins) elapsed = 1440 - riseMins + nowMins;
  }

  if (elapsed < 0 || elapsed > duration) {
    return { visible: false, leftVw: 50, topVh: 50 };
  }

  const progress = Math.min(1, Math.max(0, elapsed / Math.max(1, duration)));
  const leftVw = 6 + progress * 88; // 6vw (East) -> 94vw (West)
  const topVh = 5 + Math.pow(progress - 0.5, 2) * 85; // High at zenith (5vh), low at horizons (26vh)
  return { visible: true, leftVw, topVh };
}

export const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = ({ station }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const cond = (station.condition || '').toLowerCase();
  const windKph = Math.max(1, Number(station.windSpeed ?? 10));
  const cloudCover = Math.min(100, Math.max(0, Number(station.cloudCover ?? 0)));

  const isRain = /rain|drizzle|shower|storm|thunder/.test(cond) || (station.precipitationMm ?? 0) > 0;
  const isStorm = /storm|thunder/.test(cond);
  const isSnow = /snow|ice|frost|blizzard/.test(cond) || station.tempC <= 0;

  // Real-time Astronomical Positions from Station Localtime & Rise/Set Telemetry
  const celestial = useMemo(() => {
    const localMatch = String(station.localtime || '').match(/(\d{1,2}):(\d{2})/);
    const sysNow = new Date();
    const nowMins = localMatch
      ? parseInt(localMatch[1], 10) * 60 + parseInt(localMatch[2], 10)
      : sysNow.getHours() * 60 + sysNow.getMinutes();

    const sunRise = toMinutes(station.sunrise);
    const sunSet = toMinutes(station.sunset);
    const moonRise = toMinutes(station.moonrise);
    const moonSet = toMinutes(station.moonset);

    const sun = computeArcPosition(nowMins, sunRise, sunSet);
    // Moon is visible when between moonrise & moonset, or at night when sun is down
    const moon =
      moonRise != null && moonSet != null
        ? computeArcPosition(nowMins, moonRise, moonSet)
        : !sun.visible
          ? computeArcPosition(nowMins, sunSet ?? 1080, sunRise ?? 360)
          : { visible: false, leftVw: 50, topVh: 20 };

    // Cloud occlusion: High cloudCover dims and blurs the Sun/Moon behind the clouds
    const visibilityFactor = Math.max(0.1, 1 - (cloudCover / 100) * 0.85);

    return { sun, moon, isNight: !sun.visible, visibilityFactor };
  }, [station.localtime, station.sunrise, station.sunset, station.moonrise, station.moonset, cloudCover]);

  const windFactor = Math.min(4.5, Math.max(0.3, windKph / 10));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Cloud count & density strictly driven by real `cloudCover` %
    const numClouds = Math.round((cloudCover / 100) * 16);
    const clouds = Array.from({ length: numClouds }, (_, i) => ({
      x: Math.random() * width,
      y: 20 + (i * (height * 0.42)) / Math.max(1, numClouds),
      r: 70 + (i % 4) * 35,
      speed: (0.28 + (i % 3) * 0.18) * windFactor,
      alpha: 0.12 + (cloudCover / 100) * 0.28,
    }));

    const windLines = Array.from({ length: Math.min(32, Math.max(3, Math.round(windKph))) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: 40 + windKph * 2.5,
      speed: (1.8 + Math.random() * 2) * windFactor,
      alpha: Math.min(0.25, 0.04 + windKph * 0.004),
    }));

    const dropCount = isRain ? (isStorm ? 140 : 85) : isSnow ? 60 : 0;
    const drops = Array.from({ length: dropCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: isRain ? (9 + Math.random() * 5) * Math.max(0.8, windFactor * 0.7) : 1.2 + Math.random() * 1.4,
      vx: isRain ? windFactor * 2.2 : windFactor * 0.7,
      size: isRain ? 15 + Math.random() * 10 : 2 + Math.random() * 2,
    }));

    let tick = 0;
    const render = () => {
      tick += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Clouds rendered on top of Sun/Moon so passing clouds physically occlude them!
      clouds.forEach((c) => {
        c.x += c.speed;
        if (c.x - c.r * 3 > width) c.x = -c.r * 3;
        const g = ctx.createRadialGradient(c.x, c.y, c.r * 0.25, c.x, c.y, c.r * 2.5);
        g.addColorStop(0, `rgba(148, 163, 184, ${c.alpha})`);
        g.addColorStop(0.55, `rgba(71, 85, 105, ${c.alpha * 0.75})`);
        g.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * 2.4, 0, Math.PI * 2);
        ctx.fill();
      });

      windLines.forEach((w) => {
        w.x += w.speed;
        if (w.x > width + w.len) { w.x = -w.len; w.y = Math.random() * height; }
        const wg = ctx.createLinearGradient(w.x, w.y, w.x + w.len, w.y);
        wg.addColorStop(0, 'rgba(0, 242, 254, 0)');
        wg.addColorStop(0.5, `rgba(0, 242, 254, ${w.alpha})`);
        wg.addColorStop(1, 'rgba(0, 242, 254, 0)');
        ctx.strokeStyle = wg;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(w.x, w.y);
        ctx.lineTo(w.x + w.len, w.y + Math.sin(tick) * 2);
        ctx.stroke();
      });

      drops.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > height) { p.y = -20; p.x = Math.random() * width; }
        if (p.x > width) p.x = 0;
        if (isRain) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.5, p.y + p.size);
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [cloudCover, isRain, isSnow, isStorm, windFactor, windKph]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* LAYER 1 (BEHIND CLOUDS): Real-Time Sun (Sunrise -> Sunset) */}
      {celestial.sun.visible && (
        <motion.div
          animate={{
            left: `${celestial.sun.leftVw}vw`,
            top: `${celestial.sun.topVh}vh`,
            opacity: celestial.visibilityFactor,
          }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ transform: 'translate(-50%, -50%)' }}
          className="absolute z-0 w-72 h-72 sm:w-[420px] sm:h-[420px] flex items-center justify-center"
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(251,191,36,0.5) 0%, rgba(245,158,11,0.2) 42%, transparent 72%)',
              filter: 'blur(18px)',
            }}
          />
          <div className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-amber-300/45 blur-xl shadow-[0_0_90px_#fbbf24]" />
        </motion.div>
      )}

      {/* LAYER 1B (BEHIND CLOUDS): Real-Time Moon (Moonrise -> Moonset) */}
      {celestial.moon.visible && (
        <motion.div
          animate={{
            left: `${celestial.moon.leftVw}vw`,
            top: `${celestial.moon.topVh}vh`,
            opacity: celestial.visibilityFactor,
          }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ transform: 'translate(-50%, -50%)' }}
          className="absolute z-0 w-60 h-60 sm:w-80 sm:h-80 flex items-center justify-center"
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(165,180,252,0.4) 0%, rgba(99,102,241,0.16) 45%, transparent 72%)',
              filter: 'blur(18px)',
            }}
          />
          <div className="absolute w-16 h-16 sm:w-22 sm:h-22 rounded-full bg-indigo-100/50 blur-md shadow-[0_0_70px_#818cf8]" />
        </motion.div>
      )}

      {/* LAYER 2 (IN FRONT OF SUN/MOON): Moving Clouds, Wind & Rain that physically cover Sun/Moon */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 w-full h-full" />
    </div>
  );
};

export default AtmosphericBackground;