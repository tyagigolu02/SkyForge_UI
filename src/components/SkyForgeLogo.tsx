import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export interface SkyForgeLogoProps {
  /** Size variant or exact pixel dimension */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Whether to render the brand name text alongside the emblem */
  showText?: boolean;
  /** Whether to render the 'LIVE WEATHER' or 'SPATIAL 2030' status badge */
  showBadge?: boolean;
  /** Enable Framer Motion floating and hover physics */
  animated?: boolean;
  /** Additional CSS class names for the outer wrapper */
  className?: string;
  /** Optional click handler (e.g. scroll to top or reset) */
  onClick?: () => void;
}

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 42,
  lg: 64,
  xl: 84,
};

/**
 * SkyForgeLogo Component
 *
 * Bespoke brand emblem fusing:
 *  1. "Sky"   → Sweeping aerodynamic troposphere wings & atmospheric isobar radar orbits.
 *  2. "Forge" → A precision-faceted titanium anvil crown & kinetic lightning strike.
 *  3. "Core"  → A glowing quantum plasma fusion spark (real-time telemetry & cache speed).
 *
 * Matches 100% of the "Abyssal Glass / Anti-Gravity" spatial UI design language.
 */
export const SkyForgeLogo: React.FC<SkyForgeLogoProps> = ({
  size = 'md',
  showText = false,
  showBadge = false,
  animated = true,
  className = '',
  onClick,
}) => {
  const { t } = useTranslation();
  const rawId = useId();
  // Sanitize id for SVG attribute safety
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');

  const dimension = typeof size === 'number' ? size : SIZE_MAP[size] || 42;

  const EmblemGraphic = (
    <div
      className="relative flex items-center justify-center flex-shrink-0 select-none"
      style={{ width: dimension, height: dimension }}
    >
      {/* Volumetric Underglow Aura */}
      <div
        className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-400/35 via-blue-500/20 to-purple-600/30 blur-md pointer-events-none transition-all duration-500"
        style={{
          transform: 'scale(1.15)',
        }}
      />

      {/* Frosted Abyssal Glass Frame */}
      <div
        className="relative w-full h-full rounded-2xl abyssal-glass shadow-abyssal flex items-center justify-center overflow-hidden border border-white/15"
        style={{
          borderRadius: Math.max(8, Math.round(dimension * 0.32)),
        }}
      >
        {/* Specular Glaze Highlight across the glass edge */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-cyan-500/10 pointer-events-none" />

        {/* The SkyForge Vector Emblem */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full relative z-10 p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Ambient Radial Underglow */}
            <radialGradient id={`sf-glow-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#7928ca" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#030712" stopOpacity="0" />
            </radialGradient>

            {/* Left Sky Wing: Atmospheric Cyan to Cobalt */}
            <linearGradient id={`sf-wing-left-${uid}`} x1="14" y1="26" x2="48" y2="72" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="15%" stopColor="#00f2fe" />
              <stop offset="65%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.8" />
            </linearGradient>

            {/* Right Sky Wing: Stratospheric Sky to Electric Violet */}
            <linearGradient id={`sf-wing-right-${uid}`} x1="86" y1="26" x2="52" y2="72" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="20%" stopColor="#38bdf8" />
              <stop offset="65%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#7928ca" stopOpacity="0.8" />
            </linearGradient>

            {/* The Forge Anvil Crown & Lightning Bolt Core */}
            <linearGradient id={`sf-bolt-${uid}`} x1="55" y1="14" x2="43" y2="82" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#00f2fe" />
              <stop offset="55%" stopColor="#6366f1" />
              <stop offset="85%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            {/* Facet Specular Highlight */}
            <linearGradient id={`sf-facet-${uid}`} x1="40" y1="20" x2="60" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#00f2fe" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>

            {/* Solar Plasma Spark Radial Flare */}
            <radialGradient id={`sf-spark-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#00f2fe" />
              <stop offset="70%" stopColor="#fbbf24" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>

            {/* Radar Orbit Gradient */}
            <linearGradient id={`sf-orbit-${uid}`} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Ambient Plasma Glow in Background */}
          <circle cx="50" cy="50" r="42" fill={`url(#sf-glow-${uid})`} />

          {/* ── 1. ATMOSPHERIC TELEMETRY RADAR ORBIT (Sky feature) ── */}
          <circle
            cx="50"
            cy="50"
            r="43"
            stroke={`url(#sf-orbit-${uid})`}
            strokeWidth="1"
            strokeDasharray="3 5"
            opacity="0.45"
          />
          <circle
            cx="50"
            cy="50"
            r="46.5"
            stroke="rgba(0, 242, 254, 0.25)"
            strokeWidth="0.75"
            strokeDasharray="14 24"
          />

          {/* 4 Cardinal Telemetry Micro-Sensors */}
          <circle cx="50" cy="3.5" r="1.5" fill="#00f2fe" />
          <circle cx="96.5" cy="50" r="1.5" fill="#38bdf8" />
          <circle cx="50" cy="96.5" r="1.5" fill="#a855f7" />
          <circle cx="3.5" cy="50" r="1.5" fill="#00f2fe" />

          {/* Orbiting Satellite Data Bead */}
          <circle
            cx="80"
            cy="24"
            r="2"
            fill="#00f2fe"
            style={{ filter: 'drop-shadow(0 0 5px #00f2fe)' }}
          />

          {/* ── 2. THE SKY: ATMOSPHERIC AIRFOIL WINGS ── */}
          {/* Left Wing (Upper Stratosphere Airfoil) */}
          <path
            d="M 47 26 
               C 35 27, 23 33, 14 43 
               C 22 47, 32 45, 40 51 
               C 44 54, 46 59, 47 65 
               C 47 51, 46 37, 47 26 Z"
            fill={`url(#sf-wing-left-${uid})`}
            opacity="0.95"
          />
          {/* Left Wing Lower Strata (Isobar Shelf) */}
          <path
            d="M 44 38 
               C 33 39, 21 47, 18 57 
               C 26 59, 34 57, 40 63 
               C 43 66, 44 71, 44 75 
               C 43 63, 43 49, 44 38 Z"
            fill={`url(#sf-wing-left-${uid})`}
            opacity="0.65"
          />

          {/* Right Wing (Upper Stratosphere Airfoil) */}
          <path
            d="M 53 26 
               C 65 27, 77 33, 86 43 
               C 78 47, 68 45, 60 51 
               C 56 54, 54 59, 53 65 
               C 53 51, 54 37, 53 26 Z"
            fill={`url(#sf-wing-right-${uid})`}
            opacity="0.95"
          />
          {/* Right Wing Lower Strata (Isobar Shelf) */}
          <path
            d="M 56 38 
               C 67 39, 79 47, 82 57 
               C 74 59, 66 57, 60 63 
               C 57 66, 56 71, 56 75 
               C 57 63, 57 49, 56 38 Z"
            fill={`url(#sf-wing-right-${uid})`}
            opacity="0.65"
          />

          {/* ── 3. THE FORGE: TITANIUM ANVIL CROWN ── */}
          <path
            d="M 28 22 
               C 38 18, 62 18, 72 22 
               L 67 27 
               C 58 25, 42 25, 33 27 Z"
            fill="#ffffff"
            opacity="0.85"
          />

          {/* ── 4. THE FORGE: KINETIC LIGHTNING STRIKE (Energy Core) ── */}
          <path
            d="M 55 14 
               L 38 44 
               L 49 44 
               L 43 82 
               L 62 48 
               L 51 48 
               L 57 14 Z"
            fill={`url(#sf-bolt-${uid})`}
            style={{
              filter: 'drop-shadow(0 0 7px rgba(0, 242, 254, 0.75))',
            }}
          />

          {/* Beveled Specular Ridge on Lightning Bolt */}
          <path
            d="M 55 14 L 43 44 L 49 44 L 43 82 L 49 52 L 51 48 L 57 14 Z"
            fill={`url(#sf-facet-${uid})`}
            opacity="0.7"
          />

          {/* ── 5. THE SINGULARITY: QUANTUM PLASMA FUSION SPARK ── */}
          {/* Radial Bloom */}
          <circle cx="49" cy="46" r="8" fill={`url(#sf-spark-${uid})`} opacity="0.85" />
          <circle
            cx="49"
            cy="46"
            r="2.8"
            fill="#ffffff"
            style={{ filter: 'drop-shadow(0 0 6px #00f2fe)' }}
          />

          {/* 4-Point Diamond Micro-Flare */}
          <path
            d="M 49 37 
               L 50.8 44.2 
               L 58 46 
               L 50.8 47.8 
               L 49 55 
               L 47.2 47.8 
               L 40 46 
               L 47.2 44.2 Z"
            fill="#ffffff"
            style={{ filter: 'drop-shadow(0 0 4px #fbbf24)' }}
          />

          {/* ── 6. ATMOSPHERIC ISOBAR HARMONICS BENEATH ── */}
          <path
            d="M 30 71 C 42 79, 58 79, 70 71"
            stroke="#00f2fe"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="2 3"
            opacity="0.6"
          />
          <path
            d="M 36 78 C 44 84, 56 84, 64 78"
            stroke="#a855f7"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.45"
          />
        </svg>
      </div>
    </div>
  );

  // If animated is true, wrap in interactive Framer Motion controls
  const InteractiveEmblem = animated ? (
    <motion.div
      whileHover={{
        rotate: [0, -6, 6, 0],
        scale: 1.08,
      }}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="cursor-pointer"
      onClick={onClick}
    >
      {EmblemGraphic}
    </motion.div>
  ) : (
    EmblemGraphic
  );

  // Standalone icon mode
  if (!showText) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        {InteractiveEmblem}
      </div>
    );
  }

  // Full Brand Lockup (Emblem + Typography + Status Badge)
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {InteractiveEmblem}

      <div className="flex flex-col justify-center text-left">
        <div className="flex items-center gap-2">
          {/* Brand Wordmark with Spatial Gradient */}
          <span className="font-display font-black tracking-[0.18em] text-lg sm:text-xl bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-cyan-400 drop-shadow-[0_2px_12px_rgba(0,242,254,0.3)]">
            {t('brand.title')}
          </span>

          {showBadge && (
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] px-2.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 flex items-center gap-1 shadow-[0_0_10px_rgba(0,242,254,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {t('brand.badge')}
            </span>
          )}
        </div>

        <p className="font-mono text-[10px] text-slate-400 tracking-wider flex items-center gap-1.5">
          <span className="text-cyan-400/80">⚡</span>
          <span>{t('brand.subtitle')}</span>
        </p>
      </div>
    </div>
  );
};

export default SkyForgeLogo;

