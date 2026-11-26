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

/* ─── Hamburger Icon (3-line ↔ X morph) ─── */
const HamburgerIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <motion.line
      x1="4" x2="20"
      animate={open ? { y1: 12, y2: 12, rotate: 45 } : { y1: 6, y2: 6, rotate: 0 }}
      style={{ transformOrigin: 'center' }}
      transition={{ duration: 0.25 }}
    />
    <motion.line
      x1="4" y1="12" x2="20" y2="12"
      animate={open ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.15 }}
    />
    <motion.line
      x1="4" x2="20"
      animate={open ? { y1: 12, y2: 12, rotate: -45 } : { y1: 18, y2: 18, rotate: 0 }}
      style={{ transformOrigin: 'center' }}
      transition={{ duration: 0.25 }}
    />
  </svg>
);

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Close mobile menu on resize past mobile breakpoint (<768px)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const displayName = resolveDisplayName(user);

  /* ─── Shared Control Widgets ─── */
  const renderLangToggle = (fullWidth = false) => (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onToggleLanguage}
      className={`${fullWidth ? 'flex-1 justify-center' : ''} px-3.5 py-2 rounded-2xl abyssal-glass text-slate-300 hover:text-white transition-all shadow-abyssal flex items-center gap-1.5 font-mono text-[11px] whitespace-nowrap flex-shrink-0`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe] flex-shrink-0" />
      <span className={i18n.language === 'en' ? 'text-cyan-400 font-bold' : 'opacity-40'}>EN</span>
      <span className="opacity-30">/</span>
      <span className={i18n.language === 'hi' ? 'text-cyan-400 font-bold' : 'opacity-40'}>HI</span>
    </motion.button>
  );

  const renderCacheChip = (fullWidth = false) => (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onPurgeCache}
      className={`${fullWidth ? 'w-full' : ''} cursor-pointer group flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl abyssal-glass shadow-abyssal flex-shrink-0`}
    >
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isCachePurging ? 'bg-amber-400' : 'bg-cyan-400'} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isCachePurging ? 'bg-amber-400' : 'bg-cyan-300'}`} />
      </span>
      <div className="flex flex-col text-left min-w-0">
        <span className="font-mono text-[10px] font-semibold text-slate-200 flex items-center gap-1 whitespace-nowrap">
          <span className="text-cyan-400">⚡</span> {t('header.cacheActive')}
          <span className="text-cyan-300 font-mono">({cacheLatencyMs}ms)</span>
        </span>
        <span className="font-mono text-[8px] text-slate-500 group-hover:text-cyan-400 transition-colors whitespace-nowrap">
          {isCachePurging ? t('header.purging') : `${t('header.redisEdge')} ${cacheHits}%`}
        </span>
      </div>
    </motion.div>
  );

  const renderUnitToggle = (fullWidth = false) => (
    <button
      type="button"
      onClick={onToggleUnit}
      className={`${fullWidth ? 'flex-1 justify-center' : ''} px-4 py-2 rounded-2xl font-mono text-[11px] abyssal-glass text-slate-300 hover:text-white transition-all shadow-abyssal inline-flex items-center whitespace-nowrap flex-shrink-0`}
    >
      <span className={isCelsius ? 'text-cyan-400 font-bold' : 'opacity-40'}>°C</span>
      <span className="opacity-30 mx-1">/</span>
      <span className={!isCelsius ? 'text-cyan-400 font-bold' : 'opacity-40'}>°F</span>
    </button>
  );

  const renderUserChip = (inMobileDrawer = false) =>
    user ? (
      inMobileDrawer ? (
        <div className="flex flex-col gap-2 w-full">
          <div className="w-full px-3.5 py-2 rounded-2xl abyssal-glass shadow-underglow-cyan border border-cyan-400/25 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <div className="flex flex-col text-left min-w-0 flex-1">
              <span className="font-mono text-[10px] text-white tracking-wider font-semibold truncate">
                {displayName}
              </span>
              <span className="font-mono text-[8px] text-cyan-300 whitespace-nowrap">{t('header.operatorPro')}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen(false);
              setMobileMenuOpen(false);
              onSignOut();
            }}
            className="w-full px-3 py-2 rounded-2xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 hover:text-white font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all whitespace-nowrap"
          >
            <span>⏻</span>
            <span>{t('header.disconnect')}</span>
          </button>
        </div>
      ) : (
        <div ref={userMenuRef} className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="px-3.5 py-1.5 rounded-2xl abyssal-glass shadow-underglow-cyan border border-cyan-400/25 hover:border-cyan-400/50 flex items-center gap-2 transition-all whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <div className="flex flex-col text-left">
              <span className="font-mono text-[10px] text-white tracking-wider font-semibold whitespace-nowrap">
                {displayName}
              </span>
              <span className="font-mono text-[8px] text-cyan-300 whitespace-nowrap">{t('header.operatorPro')}</span>
            </div>
            <span className={`font-mono text-[9px] text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                className="absolute right-0 mt-2 w-40 p-1.5 rounded-2xl abyssal-glass-deep border border-white/15 shadow-abyssal z-50"
              >
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 hover:text-white font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all whitespace-nowrap"
                >
                  <span>⏻</span>
                  <span>{t('header.disconnect')}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    ) : (
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          setMobileMenuOpen(false);
          onOpenAuth();
        }}
        className={`${inMobileDrawer ? 'w-full' : ''} px-3.5 py-1.5 rounded-2xl abyssal-glass shadow-abyssal hover:shadow-underglow-cyan transition-all flex items-center gap-2.5 text-left flex-shrink-0 whitespace-nowrap`}
      >
        <span className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${searchesRemaining === 0 ? 'bg-rose-400' : 'bg-cyan-400'}`} />
        <div className="flex flex-col">
          <span className="font-mono text-[10px] tracking-wider text-slate-200 whitespace-nowrap">
            {t('header.signInOperator')}
          </span>
          <span className={`font-mono text-[8px] whitespace-nowrap ${searchesRemaining === 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'}`}>
            {searchesRemaining === 0 ? '0 TRIES · LOCKED' : `${searchesRemaining} ${t('header.searchesLeft')}`}
          </span>
        </div>
      </motion.button>
    );

  return (
    <header className="relative z-30 w-full px-3 sm:px-6 md:px-10 lg:px-12 pt-5 pb-3">
      {/* Mobile (<768px): Logo left + Hamburger right.
          Tablet (768px–1023px): Logo centered above, controls in a clean row below.
          Desktop (1024px+): Logo left + controls row right. */}
      <div className="max-w-7xl mx-auto flex flex-row md:flex-col lg:flex-row items-center justify-between gap-3 md:gap-4">
        {/* Logo — always visible */}
        <SkyForgeLogo
          size="md"
          showText={true}
          showBadge={true}
          animated={true}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />

        {/* ─── Tablet & Desktop (md+, >=768px): Clean non-wrapping row ─── */}
        <div className="hidden md:flex items-center justify-center lg:justify-end gap-3 flex-wrap">
          {renderLangToggle(false)}
          {renderCacheChip(false)}
          {renderUnitToggle(false)}
          {renderUserChip(false)}
        </div>

        {/* ─── Mobile (<md, <768px): Hamburger button at top-right ─── */}
        <div ref={mobileMenuRef} className="relative md:hidden flex-shrink-0">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2.5 rounded-2xl abyssal-glass border border-white/10 text-cyan-300 hover:text-white shadow-abyssal transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <HamburgerIcon open={mobileMenuOpen} />
          </motion.button>

          {/* ─── Mobile Dropdown Drawer ─── */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute right-0 mt-3 w-[264px] max-w-[calc(100vw-24px)] p-3.5 rounded-3xl abyssal-glass-deep border border-cyan-400/20 shadow-[0_20px_60px_-10px_rgba(0,242,254,0.28)] z-50 flex flex-col gap-2.5"
              >
                {/* Row 1: Language + Unit */}
                <div className="flex items-center gap-2">
                  {renderLangToggle(true)}
                  {renderUnitToggle(true)}
                </div>

                {/* Row 2: Cache */}
                {renderCacheChip(true)}

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent my-0.5" />

                {/* Row 3: User / Sign-In */}
                {renderUserChip(true)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default CommandHeader;