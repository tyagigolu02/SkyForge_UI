import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeatherStation, ThemeConfig } from '../types';

interface WeatherMediaSectionProps {
  station: WeatherStation;
  theme: ThemeConfig;
}

export const WeatherMediaSection: React.FC<WeatherMediaSectionProps> = ({ station, theme }) => {
  const [activeVideoTitle, setActiveVideoTitle] = useState<string | null>(null);

  const hazards = station.hazards ?? [];
  const videos = station.weatherVideos ?? [];
  const news = station.weatherNews ?? [];

  const lat = station.lat ?? 28.6139;
  const lon = station.lon ?? 77.209;

  return (
    <>
      {/* 1. ATMOSPHERIC ADVISORIES & TELEMETRY ALERTS (#sec-hazards) */}
      <section id="sec-hazards" className="mt-12 scroll-mt-24">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
          <h3 className="font-display font-medium text-xs sm:text-sm tracking-[0.2em] uppercase text-white">
            ATMOSPHERIC ADVISORIES & TELEMETRY ALERTS · {station.city}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hazards.map((hz, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} border border-amber-400/25 relative overflow-hidden`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                <span className="font-mono text-xs font-semibold text-amber-300 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  {hz.title}
                </span>
                <span className="font-mono text-[9px] px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-200 border border-amber-400/20">
                  {hz.source}
                </span>
              </div>
              <p className="font-mono text-xs text-slate-300 leading-relaxed">{hz.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 2. WEATHER VIDEO BRIEFINGS & SATELLITE FEEDS (#sec-media) */}
      <section id="sec-media" className="mt-12 pb-12 scroll-mt-24">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
            <h3 className="font-display font-medium text-xs sm:text-sm tracking-[0.2em] uppercase text-white">
              VIDEO BRIEFINGS & METEOROLOGICAL NEWS · {station.city}
            </h3>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            CLICK ANY VIDEO OR DISPATCH TO LAUNCH STREAM
          </span>
        </div>

        {/* Video Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {videos.map((vid, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5, scale: 1.01 }}
              onClick={() => setActiveVideoTitle(vid.title)}
              className={`group cursor-pointer p-5 rounded-3xl abyssal-glass ${theme.underglow} border border-cyan-400/20 hover:border-cyan-400/50 transition-all flex items-start gap-4`}
            >
              {/* Animated Play Button Thumbnail */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500/25 via-sky-500/15 to-purple-600/25 border border-cyan-400/35 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-[0_0_25px_rgba(0,242,254,0.2)]">
                <div className="w-10 h-10 rounded-full bg-cyan-400/20 border border-cyan-300 flex items-center justify-center">
                  <svg className="w-4 h-4 text-cyan-200 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                    ▶ {vid.source}
                  </span>
                  <span className="font-mono text-[9px] text-slate-400">LIVE HD</span>
                </div>
                <h4 className="font-display text-sm sm:text-base text-white group-hover:text-cyan-300 transition-colors truncate">
                  {vid.title}
                </h4>
                <p className="font-mono text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {vid.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live News Dispatches Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.map((item, i) => {
            const newsUrl = `https://news.google.com/search?q=${encodeURIComponent(station.city + ' weather forecast')}`;
            return (
              <motion.a
                key={i}
                href={newsUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -4 }}
                className={`p-5 rounded-3xl abyssal-glass ${theme.underglow} border border-purple-400/20 hover:border-purple-400/50 transition-all flex flex-col justify-between gap-3`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-400/30">
                      📰 {item.source}
                    </span>
                    <span className="font-mono text-[10px] text-cyan-300">READ DISPATCH ↗</span>
                  </div>
                  <h4 className="font-display text-sm sm:text-base text-white">{item.title}</h4>
                  <p className="font-mono text-xs text-slate-400 mt-1.5 leading-relaxed">{item.description}</p>
                </div>
              </motion.a>
            );
          })}
        </div>
      </section>

      {/* FULL-SCREEN INTERACTIVE SATELLITE & VIDEO STREAM MODAL */}
      <AnimatePresence>
        {activeVideoTitle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveVideoTitle(null)}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl rounded-3xl abyssal-glass border border-cyan-400/40 p-4 sm:p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <span className="font-mono text-[10px] text-cyan-300 uppercase tracking-widest">
                    LIVE SATELLITE & RADAR MOTION STREAM
                  </span>
                  <h3 className="font-display text-lg text-white">{activeVideoTitle}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveVideoTitle(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/30 font-mono text-xs text-white"
                >
                  ✕ CLOSE
                </button>
              </div>
              <iframe
                title={activeVideoTitle}
                src={`https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=6&level=surface&overlay=satellite&product=ecmwf&menu=&message=true&marker=true&calendar=now&type=map&location=coordinates`}
                className="w-full h-[340px] sm:h-[460px] rounded-2xl border-0"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WeatherMediaSection;