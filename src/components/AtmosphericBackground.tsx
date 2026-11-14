import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { WeatherStation } from '../types';

interface AtmosphericBackgroundProps {
  station: WeatherStation;
}

export const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = ({ station }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const cond = (station.condition || '').toLowerCase();
  const windKph = Math.max(2, Number(station.windSpeed ?? 12));
  const cloudCover = station.cloudCover ?? (cond.includes('cloud') ? 65 : 20);

  const isRain = /rain|drizzle|shower|storm|thunder/.test(cond);
  const isStorm = /storm|thunder/.test(cond);
  const isSnow = /snow|ice|frost|blizzard/.test(cond) || station.tempC <= 0;

  // Detect Night vs Day from station.localtime ("YYYY-MM-DD HH:mm") or system clock
  const currentHour = (() => {
    const match = String(station.localtime || '').match(/\s(\d{1,2}):/);
    return match ? parseInt(match[1], 10) : new Date().getHours();
  })();
  const isNight = currentHour < 6 || currentHour >= 18;
  const showSun = !isNight && !isStorm && cloudCover < 85;

  // Wind multiplier: Halki hawa (<10km/h) = slow (0.5x), Tej hawa (>25km/h) = fast (2.5x+)
  const windSpeedMultiplier = Math.min(4.2, Math.max(0.45, windKph / 10));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 1. Volumetric Drifting Clouds (Count & opacity scale with cloudCover)
    const numClouds = cloudCover >= 60 ? 12 : cloudCover >= 25 ? 7 : 3;
    const clouds = Array.from({ length: numClouds }, (_, i) => ({
      x: Math.random() * width,
      y: 40 + (i * (height * 0.45)) / numClouds,
      radius: 55 + (i % 4) * 28,
      baseSpeed: (0.35 + (i % 3) * 0.22) * windSpeedMultiplier,
      alpha: cloudCover >= 60 ? 0.16 : 0.09,
    }));

    // 2. Aerodynamic Wind Streaks (Speed & count scale with windKph)
    const numWindLines = Math.min(35, Math.max(6, Math.round(windKph * 0.9)));
    const windLines = Array.from({ length: numWindLines }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 45 + windKph * 2.5,
      speed: (2.2 + Math.random() * 2.5) * windSpeedMultiplier,
      alpha: Math.min(0.28, 0.06 + windKph * 0.005),
    }));

    // 3. Raindrops / Snowflakes
    const numParticles = isRain ? (isStorm ? 140 : 85) : isSnow ? 65 : 0;
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: isRain ? (9 + Math.random() * 6) * Math.max(0.8, windSpeedMultiplier * 0.7) : 1.2 + Math.random() * 1.5,
      vx: isRain ? windSpeedMultiplier * 2.4 : windSpeedMultiplier * 0.8,
      size: isRain ? 14 + Math.random() * 12 : 2 + Math.random() * 2.5,
    }));

    // 4. Night Stars
    const stars = Array.from({ length: isNight ? 60 : 0 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.65),
      r: 0.8 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
    }));

    let tick = 0;
    const render = () => {
      tick += 0.025;
      ctx.clearRect(0, 0, width, height);

      // Draw Twinkling Night Stars
      if (isNight) {
        stars.forEach((s) => {
          const twinkle = 0.25 + 0.65 * Math.abs(Math.sin(tick + s.phase));
          ctx.fillStyle = `rgba(226, 232, 240, ${twinkle})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw Multi-Puff Moving Clouds
      clouds.forEach((c) => {
        c.x += c.baseSpeed;
        if (c.x - c.radius * 3 > width) c.x = -c.radius * 3;

        const grad = ctx.createRadialGradient(c.x, c.y, c.radius * 0.2, c.x, c.y, c.radius * 2.4);
        grad.addColorStop(0, `rgba(186, 230, 253, ${c.alpha})`);
        grad.addColorStop(0.5, `rgba(148, 163, 184, ${c.alpha * 0.6})`);
        grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius * 2.2, 0, Math.PI * 2);
        ctx.arc(c.x + c.radius * 1.1, c.y + 10, c.radius * 1.7, 0, Math.PI * 2);
        ctx.arc(c.x - c.radius * 1.1, c.y + 14, c.radius * 1.6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Moving Wind Streamlines
      windLines.forEach((w) => {
        w.x += w.speed;
        w.y += Math.sin(tick + w.x * 0.01) * 0.35;
        if (w.x > width + w.length) {
          w.x = -w.length;
          w.y = Math.random() * height;
        }
        const wGrad = ctx.createLinearGradient(w.x, w.y, w.x + w.length, w.y);
        wGrad.addColorStop(0, 'rgba(0, 242, 254, 0)');
        wGrad.addColorStop(0.5, `rgba(0, 242, 254, ${w.alpha})`);
        wGrad.addColorStop(1, 'rgba(0, 242, 254, 0)');
        ctx.strokeStyle = wGrad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(w.x, w.y);
        ctx.lineTo(w.x + w.length, w.y);
        ctx.stroke();
      });

      // Draw Rain or Snow Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > height) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width) p.x = 0;

        if (isRain) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.6, p.y + p.size);
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
      window.removeEventListener('resize', handleResize);
    };
  }, [cloudCover, isNight, isRain, isSnow, isStorm, windKph, windSpeedMultiplier]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Real-Time 60FPS Physics Canvas for Clouds, Wind, Rain & Snow */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Animated Rotating Sun (Daytime) */}
      {showSun && (
        <div className="absolute top-6 right-6 sm:top-10 sm:right-16 w-44 h-44 sm:w-64 sm:h-64 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0.75, 0.45] }}
            transition={{ duration: Math.max(2.5, 6 - windSpeedMultiplier), repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-amber-400/25 blur-2xl"
          />
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: Math.max(14, 36 - windKph * 0.5), repeat: Infinity, ease: 'linear' }}
            className="w-full h-full text-amber-300/45"
            viewBox="0 0 100 100"
          >
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line
                key={deg}
                x1="50"
                y1="10"
                x2="50"
                y2="22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${deg} 50 50)`}
              />
            ))}
            <circle cx="50" cy="50" r="22" fill="rgba(251, 191, 36, 0.35)" />
          </motion.svg>
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-400 shadow-[0_0_60px_#fbbf24]" />
        </div>
      )}

      {/* Animated Glowing Moon (Nighttime) */}
      {isNight && (
        <motion.div
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-10 right-8 sm:right-20 w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center"
        >
          <div className="absolute inset-0 rounded-full bg-indigo-400/25 blur-2xl animate-pulse" />
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-slate-100 via-indigo-100 to-slate-300 shadow-[0_0_50px_rgba(165,180,252,0.8)]" />
        </motion.div>
      )}
    </div>
  );
};

export default AtmosphericBackground;