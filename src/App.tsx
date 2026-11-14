import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WeatherStation, WeatherCondition, ThemeConfig, User } from './types';
import WeatherDashboard from './components/WeatherDashboard';
import AuthScreen from './components/AuthScreen';
import CommandHeader from './components/CommandHeader';
import { useSearchLimit } from './utils/useSearchLimit';
import { getMostRecentSearch } from './utils/useRecentSearches';
import { fetchWeather, fetchWeatherByCoords, getAuthToken, removeAuthToken, TOKEN_STORAGE_KEY } from './services/api';

const USER_NAME_KEY = 'skyforge_operator_name';

const THEME_STYLES: Record<WeatherCondition, ThemeConfig> = {
  ION_SUPERCELL: {
    ambientGlowPrimary: 'rgba(0, 242, 254, 0.16)',
    ambientGlowSecondary: 'rgba(121, 40, 202, 0.22)',
    accentHex: '#00f2fe',
    underglow: 'shadow-[0_20px_60px_-15px_rgba(0,242,254,0.3),0_0_30px_rgba(121,40,202,0.2)]',
  },
  ABYSSAL_AURORA: {
    ambientGlowPrimary: 'rgba(0, 255, 194, 0.18)',
    ambientGlowSecondary: 'rgba(13, 148, 136, 0.25)',
    accentHex: '#00ffc2',
    underglow: 'shadow-[0_20px_60px_-15px_rgba(0,255,194,0.35),0_0_35px_rgba(13,148,136,0.25)]',
  },
  SOLAR_FLUX: {
    ambientGlowPrimary: 'rgba(255, 170, 0, 0.22)',
    ambientGlowSecondary: 'rgba(236, 72, 153, 0.25)',
    accentHex: '#ffaa00',
    underglow: 'shadow-[0_20px_60px_-15px_rgba(255,170,0,0.35),0_0_35px_rgba(236,72,153,0.25)]',
  },
  CRYO_CHASM: {
    ambientGlowPrimary: 'rgba(56, 189, 248, 0.18)',
    ambientGlowSecondary: 'rgba(148, 163, 184, 0.22)',
    accentHex: '#38bdf8',
    underglow: 'shadow-[0_20px_60px_-15px_rgba(56,189,248,0.35),0_0_30px_rgba(255,255,255,0.15)]',
  },
};

export const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [user, setUser] = useState<User | null>(() => {
    const token = getAuthToken();
    const savedName = localStorage.getItem(USER_NAME_KEY) || 'OPERATOR';
    return token ? { id: 'stored_op', username: savedName, name: savedName, tier: 'PRO_OPERATOR', token } : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTriggerReason, setAuthTriggerReason] = useState<'LIMIT_EXCEEDED' | 'MANUAL'>('LIMIT_EXCEEDED');

  const [station, setStation] = useState<WeatherStation | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>(() => getMostRecentSearch() || 'New Delhi');
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isCelsius, setIsCelsius] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isColdStarting, setIsColdStarting] = useState(false);

  const [geoStatus, setGeoStatus] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [geoPillDismissed, setGeoPillDismissed] = useState(false);
  const geoResolvedRef = useRef(false);

  const [cacheLatencyMs, setCacheLatencyMs] = useState(12);
  const [isCachePurging, setIsCachePurging] = useState(false);
  const [cacheHits, setCacheHits] = useState(99.84);

  const { searchesUsed, searchesRemaining, maxLimit, recordSearch } = useSearchLimit(3);

  // OAuth 2.0 Token Auto-Capture & Session Restoration
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('token');
    const oauthUsername = params.get('username') || params.get('name');

    if (oauthToken) {
      const cleanToken = oauthToken.replace(/^["'\s]+|["'\s]+$/g, '');
      if (cleanToken) {
        const displayUsername = oauthUsername ? decodeURIComponent(oauthUsername).toUpperCase() : 'GOOGLE USER';
        localStorage.setItem(TOKEN_STORAGE_KEY, cleanToken);
        localStorage.setItem(USER_NAME_KEY, displayUsername);
        setUser({
          id: 'google_op_' + Math.random().toString(36).slice(2, 7),
          username: displayUsername,
          name: displayUsername,
          tier: 'PRO_OPERATOR',
          token: cleanToken,
          searchesUnlimited: true,
        });
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      }
    }
  }, []);

  // Browser Geolocation Request on Mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus('unsupported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        geoResolvedRef.current = true;
        setGeoStatus('granted');
        const { latitude, longitude } = pos.coords;
        setActiveCoords({ lat: latitude, lon: longitude });
        const coldTimer = setTimeout(() => setIsColdStarting(true), 4000);
        try {
          const res = await fetchWeatherByCoords(latitude, longitude, i18n.language || 'en');
          if (res.success && res.data) {
            setStation(res.data);
            setCurrentQuery(res.data.city);
            if (res.cache) setCacheLatencyMs(res.cache.latencyMs);
          }
        } finally {
          clearTimeout(coldTimer);
          setIsColdStarting(false);
        }
      },
      () => setGeoStatus('denied'),
      { timeout: 8000, maximumAge: 300000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial & Language-Reactive Weather Load
  useEffect(() => {
    let cancelled = false;
    async function loadWeather() {
      const lang = i18n.language || 'en';
      const coldTimer = setTimeout(() => setIsColdStarting(true), 4000);
      const res = activeCoords
        ? await fetchWeatherByCoords(activeCoords.lat, activeCoords.lon, lang)
        : await fetchWeather(currentQuery, lang);
      clearTimeout(coldTimer);
      setIsColdStarting(false);
      if (cancelled || (!activeCoords && geoResolvedRef.current && !station)) return;
      if (res.success && res.data) {
        setStation(res.data);
        if (res.cache) setCacheLatencyMs(res.cache.latencyMs);
      }
    }
    loadWeather();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const theme = THEME_STYLES[station?.theme || 'ION_SUPERCELL'] || THEME_STYLES.ION_SUPERCELL;

  // Ambient Background Parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useTransform(useSpring(mouseX, { stiffness: 45, damping: 25 }), [-0.5, 0.5], [-18, 18]);
  const parallaxY = useTransform(useSpring(mouseY, { stiffness: 45, damping: 25 }), [-0.5, 0.5], [-18, 18]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    mouseX.set(e.clientX / window.innerWidth - 0.5);
    mouseY.set(e.clientY / window.innerHeight - 0.5);
  };

  // Search Handler with Strict Non-Resettable 3-Attempt Guest Rule
  const handleExecuteSearch = useCallback(
    async (query: string) => {
      if (!recordSearch(Boolean(user))) {
        setAuthTriggerReason('LIMIT_EXCEEDED');
        setIsAuthModalOpen(true);
        return;
      }
      setIsSearching(true);
      setActiveCoords(null);
      setCurrentQuery(query);
      const coldTimer = setTimeout(() => setIsColdStarting(true), 4000);
      try {
        const res = await fetchWeather(query, i18n.language || 'en');
        if (res.success && res.data) {
          setStation(res.data);
          if (res.cache) setCacheLatencyMs(res.cache.latencyMs);
        }
      } finally {
        clearTimeout(coldTimer);
        setIsColdStarting(false);
        setIsSearching(false);
      }
    },
    [user, recordSearch, i18n.language]
  );

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full bg-[#030712] text-slate-100 overflow-x-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200"
    >
      {/* Dynamic Atmospheric Glow Backdrop */}
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-[20%] -left-[10%] w-[65vw] h-[65vw] rounded-full filter blur-[140px] opacity-45 transition-colors duration-1000"
          style={{ background: theme.ambientGlowPrimary }}
        />
        <div
          className="absolute top-[35%] -right-[15%] w-[60vw] h-[60vw] rounded-full filter blur-[160px] opacity-40 transition-colors duration-1000"
          style={{ background: theme.ambientGlowSecondary }}
        />
        <div className="absolute inset-0 noise-overlay opacity-30 mix-blend-overlay" />
      </motion.div>

      {/* Geolocation Notice Pill */}
      <AnimatePresence>
        {!geoPillDismissed && (geoStatus === 'denied' || geoStatus === 'unsupported') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 left-4 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl abyssal-glass shadow-abyssal font-mono text-[10px] text-slate-300"
          >
            <span>{geoStatus === 'denied' ? t('header.geoDenied') : t('header.geoUnsupported')}</span>
            <button type="button" onClick={() => setGeoPillDismissed(true)} className="ml-1 text-slate-500 hover:text-white">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <CommandHeader
        user={user}
        isCelsius={isCelsius}
        onToggleUnit={() => setIsCelsius(!isCelsius)}
        onToggleLanguage={() => i18n.changeLanguage(i18n.language === 'hi' ? 'en' : 'hi')}
        cacheLatencyMs={cacheLatencyMs}
        isCachePurging={isCachePurging}
        cacheHits={cacheHits}
        onPurgeCache={() => {
          setIsCachePurging(true);
          setTimeout(() => { setCacheLatencyMs(4); setCacheHits(99.98); setIsCachePurging(false); }, 800);
        }}
        searchesRemaining={searchesRemaining}
        onOpenAuth={() => { setAuthTriggerReason('MANUAL'); setIsAuthModalOpen(true); }}
        onSignOut={() => { removeAuthToken(); localStorage.removeItem(USER_NAME_KEY); setUser(null); }}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 md:px-12 pt-2 pb-24">
        {station ? (
          <WeatherDashboard
            station={station}
            theme={theme}
            isCelsius={isCelsius}
            onToggleUnit={() => setIsCelsius(!isCelsius)}
            onSearch={handleExecuteSearch}
            onSelectStation={handleExecuteSearch}
            searchesRemaining={searchesRemaining}
            searchesUsed={searchesUsed}
            maxLimit={maxLimit}
            isAuthenticated={Boolean(user)}
            isSearching={isSearching}
            isColdStarting={isColdStarting}
            cacheLatencyMs={cacheLatencyMs}
            isCachePurging={isCachePurging}
            onPurgeCache={() => {}}
            cacheHits={cacheHits}
          />
        ) : (
          <div className="py-24 text-center font-mono text-cyan-300 text-sm animate-pulse">{t('hud.loading')}</div>
        )}
      </main>

      <AuthScreen
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(authUser) => {
          localStorage.setItem(USER_NAME_KEY, authUser.name || authUser.username);
          setUser(authUser);
        }}
        triggerReason={authTriggerReason}
      />
    </div>
  );
};

export default App;