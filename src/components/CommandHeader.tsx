import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import SkyForgeLogo from './SkyForgeLogo';

interface CommandHeaderProps {
  user: User | null;
  isCelsius: boolean;
  onToggleUnit: () => void;
  onToggleLanguage: () => void;
  cacheLatencyMs: number;
  isCachePurging: boolean;
  cacheHits: number;
  onPurgeCache: () => void;
  searchesRemaining: number;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

function resolveDisplayName(user: User | null): string {
  if (!user) return '';
  const rawName = user.name || user.username || '';
  if (rawName && !['OPERATOR', 'PRO ACCOUNT', 'STORED_OP'].includes(rawName.toUpperCase())) {
    return rawName.toUpperCase();
  }
  if (user.token) {
    try {
      const base64Url = user.token.split('.')[1];
      if (base64Url) {
        const json = JSON.parse(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
        const fromJwt = json.name || json.username || json.sub;
        if (fromJwt) return String(fromJwt).split('@')[0].toUpperCase();
      }
    } catch {}
  }
  return (rawName || 'USER').toUpperCase();
}

export const CommandHeader: React.FC<CommandHeaderProps> = ({
  user,
  isCelsius,
  onToggleUnit,
  onToggleLanguage,
  cacheLatencyMs,
  isCachePurging,
  cacheHits,
  onPurgeCache,
  searchesRemaining,
  onOpenAuth,
  onSignOut,
}) => {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const displayName = resolveDisplayName(user);

  return (
    <header className="relative z-30 w-full px-3 sm:px-8 md:px-12 pt-5 pb-3">
      {/* Stacks centered on Mobile & Mid-Screen (Screenshot 2), splits Left/Right on Large Desktop */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        <SkyForgeLogo
          size="md"
          showText={true}
          showBadge={true}
          animated={true}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />

        {/* Mobile (<640px): Compact 2x2 Grid with Outer Left & Outer Right Edges Aligned!
            Mid-Screen & Desktop (>=640px): Single Centered Row [EN/HI -> CACHE -> °C/°F -> USER] */}
        <div className="w-fit mx-auto lg:mx-0 grid grid-cols-[auto_auto] sm:flex items-center justify-center gap-x-3 gap-y-2.5 sm:gap-3">
          {/* 1. EN / HI: Top-Left on Mobile (Left Edge Aligned) | 1st on Mid/Desktop */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onToggleLanguage}
            className="order-1 sm:order-1 justify-self-start px-3.5 py-2 rounded-2xl abyssal-glass text-slate-300 hover:text-white transition-all shadow-abyssal flex items-center gap-1.5 font-mono text-[11px]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
            <span className={i18n.language === 'en' ? 'text-cyan-400 font-bold' : 'opacity-40'}>EN</span>
            <span className="opacity-30">/</span>
            <span className={i18n.language === 'hi' ? 'text-cyan-400 font-bold' : 'opacity-40'}>HI</span>
          </motion.button>

          {/* 2. CACHE: Top-Right on Mobile (Right Edge Aligned) | 2nd on Mid/Desktop */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onPurgeCache}
            className="order-2 sm:order-2 justify-self-end cursor-pointer group flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl abyssal-glass shadow-abyssal"
          >
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isCachePurging ? 'bg-amber-400' : 'bg-cyan-400'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isCachePurging ? 'bg-amber-400' : 'bg-cyan-300'}`} />
            </span>
            <div className="flex flex-col text-left">
              <span className="font-mono text-[10px] font-semibold text-slate-200 flex items-center gap-1 whitespace-nowrap">
                <span className="text-cyan-400">⚡</span> {t('header.cacheActive')}
                <span className="text-cyan-300 font-mono">({cacheLatencyMs}ms)</span>
              </span>
              <span className="font-mono text-[8px] text-slate-500 group-hover:text-cyan-400 transition-colors">
                {isCachePurging ? t('header.purging') : `${t('header.redisEdge')} ${cacheHits}%`}
              </span>
            </div>
          </motion.div>

          {/* 3. USER / SIGN IN: Bottom-Left on Mobile (Left Edge Aligned with EN/HI!) | 4th on Mid/Desktop */}
          {user ? (
            <div ref={menuRef} className="order-3 sm:order-4 relative justify-self-start">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="px-3.5 py-1.5 rounded-2xl abyssal-glass shadow-underglow-cyan border border-cyan-400/25 hover:border-cyan-400/50 flex items-center gap-2 transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="font-mono text-[10px] text-white tracking-wider font-semibold whitespace-nowrap">
                    {displayName}
                  </span>
                  <span className="font-mono text-[8px] text-cyan-300">{t('header.operatorPro')}</span>
                </div>
                <span className={`font-mono text-[9px] text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-40 p-1.5 rounded-2xl abyssal-glass border border-white/15 shadow-abyssal z-50"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 hover:text-white font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                      <span>⏻</span>
                      <span>{t('header.disconnect')}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={onOpenAuth}
              className="order-3 sm:order-4 justify-self-start px-3.5 py-1.5 rounded-2xl abyssal-glass shadow-abyssal hover:shadow-underglow-cyan transition-all flex items-center gap-2 text-left"
            >
              <span className={`w-2 h-2 rounded-full animate-pulse ${searchesRemaining === 0 ? 'bg-rose-400' : 'bg-cyan-400'}`} />
              <div className="flex flex-col">
                <span className="font-mono text-[10px] tracking-wider text-slate-200">
                  {t('header.signInOperator')}
                </span>
                <span className={`font-mono text-[8px] ${searchesRemaining === 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'}`}>
                  {searchesRemaining === 0 ? '0 TRIES · LOCKED' : `${searchesRemaining} ${t('header.searchesLeft')}`}
                </span>
              </div>
            </motion.button>
          )}

          {/* 4. °C / °F: Bottom-Right on Mobile (Right Edge Aligned with CACHE!) | 3rd on Mid/Desktop */}
          <button
            type="button"
            onClick={onToggleUnit}
            className="order-4 sm:order-3 justify-self-end px-4 py-2 rounded-2xl font-mono text-[11px] abyssal-glass text-slate-300 hover:text-white transition-all shadow-abyssal"
          >
            <span className={isCelsius ? 'text-cyan-400 font-bold' : 'opacity-40'}>°C</span>
            <span className="opacity-30 mx-1">/</span>
            <span className={!isCelsius ? 'text-cyan-400 font-bold' : 'opacity-40'}>°F</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default CommandHeader;