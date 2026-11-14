import React from 'react';
import { motion } from 'framer-motion';
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

  return (
    <header className="relative z-30 w-full px-4 sm:px-8 md:px-12 pt-6 pb-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <SkyForgeLogo
          size="md"
          showText={true}
          showBadge={true}
          animated={true}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-center">
          {/* EN / HI Language Toggle */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleLanguage}
            title="Switch Language (English / Hindi)"
            className="px-3.5 py-1.5 rounded-2xl abyssal-glass text-slate-300 hover:text-white transition-all shadow-abyssal flex items-center gap-1.5 font-mono text-[11px]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
            <span className={i18n.language === 'en' ? 'text-cyan-400 font-bold' : 'opacity-40'}>EN</span>
            <span className="opacity-30">/</span>
            <span className={i18n.language === 'hi' ? 'text-cyan-400 font-bold' : 'opacity-40'}>HI</span>
          </motion.button>

          {/* Redis Cache Latency Pill */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={onPurgeCache}
            title="Click to refresh Redis edge cache status"
            className="cursor-pointer group flex items-center gap-2.5 px-3 py-1.5 rounded-2xl abyssal-glass shadow-abyssal"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  isCachePurging ? 'bg-amber-400' : 'bg-cyan-400'
                } opacity-75`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isCachePurging ? 'bg-amber-400' : 'bg-cyan-300'
                }`}
              />
            </span>
            <div className="flex flex-col text-left">
              <span className="font-mono text-[10px] font-semibold text-slate-200 flex items-center gap-1">
                <span className="text-cyan-400">⚡</span> {t('header.cacheActive')}
                <span className="text-cyan-300 font-mono">({cacheLatencyMs}ms)</span>
              </span>
              <span className="font-mono text-[8px] text-slate-500 group-hover:text-cyan-400 transition-colors">
                {isCachePurging ? t('header.purging') : `${t('header.redisEdge')} ${cacheHits}%`}
              </span>
            </div>
          </motion.div>

          {/* Unit Switcher (°C / °F) */}
          <button
            type="button"
            onClick={onToggleUnit}
            className="px-2.5 py-1.5 rounded-xl font-mono text-[11px] abyssal-glass text-slate-300 hover:text-white transition-all shadow-abyssal"
          >
            <span className={isCelsius ? 'text-cyan-400 font-bold' : 'opacity-40'}>°C</span>
            <span className="opacity-30 mx-1">/</span>
            <span className={!isCelsius ? 'text-cyan-400 font-bold' : 'opacity-40'}>°F</span>
          </button>

          {/* Account Status / Permanent 3-Try Guest Status (Zero Reset Button!) */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-2xl abyssal-glass shadow-underglow-cyan flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div className="flex flex-col text-left">
                  <span className="font-mono text-[10px] text-white tracking-wider font-semibold">
                    {user.name || user.username}
                  </span>
                  <span className="font-mono text-[8px] text-cyan-300">{t('header.operatorPro')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all font-mono text-[10px]"
              >
                {t('header.disconnect')}
              </button>
            </div>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-2xl abyssal-glass shadow-abyssal hover:shadow-underglow-cyan transition-all flex items-center gap-2 text-left"
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  searchesRemaining === 0 ? 'bg-rose-400' : 'bg-cyan-400'
                }`}
              />
              <div className="flex flex-col">
                <span className="font-mono text-[10px] tracking-wider text-slate-200">
                  {t('header.signInOperator')}
                </span>
                <span
                  className={`font-mono text-[8px] ${
                    searchesRemaining === 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {searchesRemaining === 0
                    ? '0 TRIES LEFT · LOCKED'
                    : `${searchesRemaining} ${t('header.searchesLeft')}`}
                </span>
              </div>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
};

export default CommandHeader;