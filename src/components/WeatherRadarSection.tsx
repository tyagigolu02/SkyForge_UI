import React, { useState } from 'react';
import { Sun, Activity, Calendar, Compass, Zap, PlaySquare } from 'lucide-react';
import { WeatherStation, ThemeConfig } from '../types';
import WeatherMediaSection from './WeatherMediaSection';

interface WeatherRadarSectionProps {
  station: WeatherStation;
  theme: ThemeConfig;
}

type MapLayer = 'wind' | 'rain' | 'temp' | 'clouds';

const NAV_ITEMS = [
  { id: 'sec-overview', label: 'HUD Overview', short: 'HUD', Icon: Sun },
  { id: 'sec-metrics', label: 'Bento Metrics', short: 'Metrics', Icon: Activity },
  { id: 'sec-forecast', label: '16D Timeline', short: 'Timeline', Icon: Calendar },
  { id: 'sec-radar', label: 'Live Radar', short: 'Radar', Icon: Compass },
  { id: 'sec-hazards', label: 'Advisories', short: 'Alerts', Icon: Zap },
  { id: 'sec-media', label: 'Video & News', short: 'Media', Icon: PlaySquare },
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
      {/* 1. DESKTOP SIDEBAR: Perfectly Centered 44x44 Icon Buttons + Floating Hover Label */}
      <aside className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-2.5 p-2 rounded-3xl abyssal-glass border border-white/10 shadow-abyssal">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = activeNav === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className={`group relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                active
                  ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/45 shadow-[0_0_18px_rgba(0,242,254,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[1.8] flex-shrink-0" />

              {/* Floating Label Pill on Hover */}
              <span className="pointer-events-none absolute left-14 px-3 py-1.5 rounded-xl abyssal-glass border border-cyan-400/35 font-mono text-[11px] font-semibold uppercase tracking-wider text-cyan-200 whitespace-nowrap opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shadow-abyssal">
                {label}
              </span>
            </button>
          );
        })}
      </aside>

      {/* 2. MOBILE & TABLET BOTTOM NAVIGATION DOCK */}
      <nav className="xl:hidden fixed bottom-2.5 inset-x-3 z-40 p-1.5 rounded-2xl abyssal-glass border border-white/15 shadow-abyssal flex items-center justify-around gap-1">
        {NAV_ITEMS.map(({ id, short, Icon }) => {
          const active = activeNav === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className={`flex-1 py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 font-mono transition-all ${
                active
                  ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/35 shadow-[0_0_12px_rgba(0,242,254,0.25)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 stroke-[1.8]" />
              <span className="text-[9px] tracking-tighter truncate max-w-full">{short}</span>
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

      <WeatherMediaSection station={station} theme={theme} />
    </>
  );
};

export default WeatherRadarSection;