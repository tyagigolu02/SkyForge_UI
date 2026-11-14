import React, { useState } from 'react';
import { WeatherStation, ThemeConfig } from '../types';
import WeatherMediaSection from './WeatherMediaSection';

interface WeatherRadarSectionProps {
  station: WeatherStation;
  theme: ThemeConfig;
}

type MapLayer = 'wind' | 'rain' | 'temp' | 'clouds';

const NAV_ITEMS = [
  { id: 'sec-overview', label: 'HUD Overview', short: 'HUD', icon: '☀' },
  { id: 'sec-metrics', label: 'Bento Metrics', short: 'Metrics', icon: '◈' },
  { id: 'sec-forecast', label: '16D Timeline', short: 'Timeline', icon: '◷' },
  { id: 'sec-radar', label: 'Live Radar', short: 'Radar', icon: '⊕' },
  { id: 'sec-hazards', label: 'Advisories', short: 'Alerts', icon: '⚡' },
  { id: 'sec-media', label: 'Video & News', short: 'Media', icon: '▣' },
];

export const WeatherRadarSection: React.FC<WeatherRadarSectionProps> = ({ station, theme }) => {
  const [layer, setLayer] = useState<MapLayer>('wind');
  const [activeNav, setActiveNav] = useState('sec-overview');

  const lat = station.lat ?? 28.6139;
  const lon = station.lon ?? 77.209;

  const scrollToSection = (id: string) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const mapEmbedUrl = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&zoom=7&level=surface&overlay=${layer}&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&metricWind=km%2Fh&metricTemp=%C2%B0C`;

  return (
    <>
      {/* 1. DESKTOP SIDEBAR: Smoothly Expands & Reveals Label on Hover */}
      <aside className="fixed left-3 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-2 p-2 rounded-3xl abyssal-glass border border-white/10 shadow-abyssal">
        {NAV_ITEMS.map((item) => {
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              className={`group relative flex items-center gap-0 hover:gap-3 px-3.5 py-2.5 rounded-2xl font-mono text-xs uppercase tracking-wider transition-all duration-300 ${
                active
                  ? 'bg-cyan-400/20 text-white border border-cyan-400/40 shadow-[0_0_15px_rgba(0,242,254,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <span className="text-base leading-none flex-shrink-0">{item.icon}</span>
              <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[130px] group-hover:opacity-100 transition-all duration-300 text-[11px] font-semibold text-cyan-300">
                {item.label}
              </span>
            </button>
          );
        })}
      </aside>

      {/* 2. MOBILE & TABLET BOTTOM NAVIGATION DOCK */}
      <nav className="xl:hidden fixed bottom-2.5 inset-x-3 z-40 p-1.5 rounded-2xl abyssal-glass border border-white/15 shadow-abyssal flex items-center justify-around gap-1">
        {NAV_ITEMS.map((item) => {
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              className={`flex-1 py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 font-mono transition-all ${
                active
                  ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/35 shadow-[0_0_12px_rgba(0,242,254,0.25)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xs leading-none">{item.icon}</span>
              <span className="text-[9px] tracking-tighter truncate max-w-full">{item.short}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. INTERACTIVE LIVE WEATHER RADAR MAP */}
      <section id="sec-radar" className="mt-10 sm:mt-12 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
            <h3 className="font-display font-medium text-xs sm:text-sm tracking-[0.2em] uppercase text-white">
              LIVE ATMOSPHERIC RADAR · {station.city}
            </h3>
          </div>

          <div className="inline-flex flex-wrap p-1 rounded-2xl abyssal-glass gap-1 self-start sm:self-auto">
            {(['wind', 'rain', 'temp', 'clouds'] as MapLayer[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayer(l)}
                className={`px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase tracking-wider transition-all ${
                  layer === l
                    ? 'bg-cyan-400/20 text-white border border-cyan-400/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className={`rounded-3xl abyssal-glass ${theme.underglow} p-1.5 sm:p-2 border border-white/10 overflow-hidden`}>
          <iframe
            key={`${lat}-${lon}-${layer}`}
            title="SkyForge Live Weather Radar"
            src={mapEmbedUrl}
            className="w-full h-[280px] sm:h-[360px] lg:h-[430px] rounded-2xl border-0"
            loading="lazy"
          />
        </div>
      </section>

      {/* 4. ALWAYS-VISIBLE ADVISORIES, VIDEO BRIEFINGS & LIVE NEWS */}
      <WeatherMediaSection station={station} theme={theme} />
    </>
  );
};

export default WeatherRadarSection;