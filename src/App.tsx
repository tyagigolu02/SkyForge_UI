import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WeatherStation, WeatherCondition, ThemeConfig, User } from './types';
import WeatherDashboard from './components/WeatherDashboard';
import AuthScreen from './components/AuthScreen';
import { useSearchLimit } from './utils/useSearchLimit';
import { getMostRecentSearch } from './utils/useRecentSearches';
import { fetchWeather, fetchWeatherByCoords, getAuthToken, removeAuthToken, TOKEN_STORAGE_KEY } from './services/api';

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

  // Authentication & Guest State
  const [user, setUser] = useState<User | null>(() => {
    const token = getAuthToken();
    return token
      ? { id: 'stored_op', username: 'OPERATOR', tier: 'PRO_OPERATOR', token }
      : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authTriggerReason, setAuthTriggerReason] = useState<'LIMIT_EXCEEDED' | 'MANUAL'>('LIMIT_EXCEEDED');

  // Meteorological State (fallback initializes from most recent searched city or New Delhi)
  const [station, setStation] = useState<WeatherStation | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>(() => getMostRecentSearch() || 'New Delhi');
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isCelsius, setIsCelsius] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isColdStarting, setIsColdStarting] = useState<boolean>(false);

  // Geolocation State
  const [geoStatus, setGeoStatus] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [geoPillDismissed, setGeoPillDismissed] = useState<boolean>(false);
  const geoResolvedRef = useRef<boolean>(false);

  // Redis Cache Telemetry
  const [cacheLatencyMs, setCacheLatencyMs] = useState<number>(12);
  const [isCachePurging, setIsCachePurging] = useState<boolean>(false);
  const [cacheHits, setCacheHits] = useState<number>(99.84);

  // Guest Search Limit Hook (3-Attempt Rule)
  const {
    searchesUsed,
    searchesRemaining,
    maxLimit,
    recordSearch,
    resetSearches,
  } = useSearchLimit(3);

  // OAuth 2.0 Token Auto-Capture & Session Restoration
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('token');
    const oauthUsername = params.get('username') || params.get('name');

    if (oauthToken) {
      const cleanToken = oauthToken.replace(/^["'\s]+|["'\s]+$/g, '');
      if (cleanToken) {
        localStorage.setItem(TOKEN_STORAGE_KEY, cleanToken);
        const displayUsername = oauthUsername
          ? decodeURIComponent(oauthUsername).toUpperCase()
          : 'GOOGLE USER';

        setUser({
          id: 'google_op_' + Math.random().toString(36).substring(2, 7),
          username: displayUsername,
          name: displayUsername,
          tier: 'PRO_OPERATOR',
          token: cleanToken,
          searchesUnlimited: true,
        });

        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } else {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (savedToken) {
        const cleanSavedToken = savedToken.replace(/^["'\s]+|["'\s]+$/g, '');
        setUser({
          id: 'restored_op',
          username: 'PRO ACCOUNT',
          name: 'PRO ACCOUNT',
          tier: 'PRO_OPERATOR',
          token: cleanSavedToken,
          searchesUnlimited: true,
        });
      }
    }
  }, []);

  // Automatic Browser Geolocation Request on Mount
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

        const lang = i18n.language || 'en';
        const coldTimer = setTimeout(() => setIsColdStarting(true), 4000);
        try {
          const res = await fetchWeatherByCoords(latitude, longitude, lang);
          clearTimeout(coldTimer);
          setIsColdStarting(false);
          if (res.success && res.data) {
            setStation(res.data);
            setCurrentQuery(res.data.city);
            if (res.cache) setCacheLatencyMs(res.cache.latencyMs);
          }
        } catch {
          clearTimeout(coldTimer);
          setIsColdStarting(false);
        }
      },
      () => {
        setGeoStatus('denied');
      },
      { timeout: 8000, maximumAge: 300000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial / Language-reactive Weather Fetch
  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      const lang = i18n.language || 'en';
      const coldStartTimer = setTimeout(() => setIsColdStarting(true), 4000);

      const res = activeCoords
        ? await fetchWeatherByCoords(activeCoords.lat, activeCoords.lon, lang)
        : await fetchWeather(currentQuery, lang);

      clearTimeout(coldStartTimer);
      setIsColdStarting(false);

      if (cancelled) return;

      // Avoid overwriting coordinates result if initial mount fallback resolved later
      if (!activeCoords && geoResolvedRef.current && !station) return;

      if (res.success && res.data) {
        setStation(res.data);
        if (res.cache) setCacheLatencyMs(res.cache.latencyMs);
      }
    }

    loadWeather();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const currentThemeKey: WeatherCondition = station?.theme || 'ION_SUPERCELL';
  const theme: ThemeConfig = THEME_STYLES[currentThemeKey] || THEME_STYLES.ION_SUPERCELL;

  // Anti-Gravity 3D Mouse Parallax Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 45, damping: 25 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 45, damping: 25 });

  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-5, 5]);
  const parallaxX = useTransform(smoothMouseX, [-0.5, 0.5], [-14, 14]);
  const parallaxY = useTransform(smoothMouseY, [-0.5, 0.5], [-14, 14]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) {
      mouseX.set(0);
      mouseY.set(0);
      return;
    }
    mouseX.set(e.clientX / window.innerWidth - 0.5);
    mouseY.set(e.clientY / window.innerHeight - 0.5);
  };

  // Search Handler with 3-Attempt Rule
  const handleExecuteSearch = useCallback(
    async (query: string) => {
      const isAllowed = recordSearch(Boolean(user));

      if (!isAllowed) {
        setAuthTriggerReason('LIMIT_EXCEEDED');
        setIsAuthModalOpen(true);
        return;
      }

      setIsSearching(true);
      setActiveCoords(null);
      setCurrentQuery(query);

      const coldTimer = setTimeout(() => setIsColdStarting(true), 4000);

      try {
        const lang = i18n.language || 'en';
        const res = await fetchWeather(query, lang);
        clearTimeout(coldTimer);
        setIsColdStarting(false);

        if (res.success && res.data) {
          setStation(res.data);
          if (res.cache) setCacheLatencyMs(res.cache.latencyMs);
        }
      } catch (err) {
        console.error('Weather query error:', err);
      } finally {
        clearTimeout(coldTimer);
        setIsColdStarting(false);
        setIsSearching(false);
      }
    },
    [user, recordSearch, i18n.language]
  );

  const handleSelectStation = (city: string) => handleExecuteSearch(city);

  const handlePurgeCache = () => {
    if (isCachePurging) return;
    setIsCachePurging(true);
    setCacheLatencyMs(2);
    setTimeout(() => {
      setCacheLatencyMs(4);
      setCacheHits(99.98);
      setIsCachePurging(false);
    }, 900);
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const handleSignOut = () => {
    removeAuthToken();
    setUser(null);
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full bg-[#030712] text-slate-100 overflow-x-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200"
      style={{ perspective: '1400px' }}
    >
      {/* Dynamic Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.25, 1], x: [0, 60, -40, 0], y: [0, -50, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[20%] -left-[10%] w-[65vw] h-[65vw] rounded-full filter blur-[140px] opacity-45 transition-colors duration-1000"
          style={{ background: theme.ambientGlowPrimary }}
        />
        <motion.div
          animate={{ scale: [1.2, 0.95, 1.2], x: [0, -80, 50, 0], y: [0, 60, -50, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-[35%] -right-[15%] w-[60vw] h-[60vw] rounded-full filter blur-[160px] opacity-40 transition-colors duration-1000"
          style={{ background: theme.ambientGlowSecondary }}
        />
        <motion.div
          animate={{ opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-[20%] left-[20%] w-[70vw] h-[50vw] rounded-full filter blur-[180px] transition-colors duration-1000"
          style={{ background: theme.ambientGlowPrimary }}
        />
        <div className="absolute inset-0 noise-overlay opacity-30 mix-blend-overlay" />
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="spatial-grid-app" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 7" className="text-cyan-400" />
              <circle cx="0" cy="0" r="1" fill="#00f2fe" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#spatial-grid-app)" />
        </svg>
      </div>

      {/* Non-Intrusive Floating Geolocation Permission Pill */}
      <AnimatePresence>
        {!geoPillDismissed && (geoStatus === 'denied' || geoStatus === 'unsupported') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 left-4 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl abyssal-glass shadow-abyssal font-mono text-[10px] text-slate-300"
          >
            <svg
              className={`w-3.5 h-3.5 flex-shrink-0 ${geoStatus === 'denied' ? 'text-amber-400' : 'text-slate-400'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" />
              <circle cx="12" cy="11" r="2.5" />
              <line x1="2" y1="2" x2="22" y2="22" />
            </svg>
            <span>
              {geoStatus === 'denied' ? t('header.geoDenied') : t('header.geoUnsupported')}
            </span>
            <button
              type="button"
              onClick={() => setGeoPillDismissed(true)}
              className="ml-1 text-slate-500 hover:text-white transition-colors"
              aria-label="Dismiss location notice"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Command Header */}
      <header className="relative z-30 w-full px-4 sm:px-8 md:px-12 pt-6 pb-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.05 }}
              transition={{ duration: 0.6 }}
              className="relative w-10 h-10 rounded-2xl flex items-center justify-center abyssal-glass shadow-abyssal"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 blur-sm" />
              <svg className="w-5 h-5 text-cyan-300 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black tracking-widest text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                  {t('brand.title')}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300">
                  {t('brand.badge')}
                </span>
              </div>
              <p className="font-mono text-[10px] text-slate-400 tracking-wider">
                {t('brand.subtitle')}
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-center">
            {/* EN / HI Language Toggle */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleLanguage}
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
              onClick={handlePurgeCache}
              title="Click to refresh Redis edge cache status"
              className="cursor-pointer group flex items-center gap-2.5 px-3 py-1.5 rounded-2xl abyssal-glass shadow-abyssal"
            >
              <div className="relative flex items-center justify-center">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isCachePurging ? 'bg-amber-400' : 'bg-cyan-400'} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isCachePurging ? 'bg-amber-400' : 'bg-cyan-300'}`} />
                </span>
              </div>
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

            {/* Unit Switcher */}
            <button
              type="button"
              onClick={() => setIsCelsius(!isCelsius)}
              className="px-2.5 py-1.5 rounded-xl font-mono text-[11px] abyssal-glass text-slate-300 hover:text-white transition-all shadow-abyssal"
            >
              <span className={isCelsius ? 'text-cyan-400 font-bold' : 'opacity-40'}>°C</span>
              <span className="opacity-30 mx-1">/</span>
              <span className={!isCelsius ? 'text-cyan-400 font-bold' : 'opacity-40'}>°F</span>
            </button>

            {/* Account Status / Sign In */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="px-3.5 py-1.5 rounded-2xl abyssal-glass shadow-underglow-cyan flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div className="flex flex-col text-left">
                    <span className="font-mono text-[10px] text-white tracking-wider font-semibold">
                      {user.name || user.username}
                    </span>
                    <span className="font-mono text-[8px] text-cyan-300">
                      {t('header.operatorPro')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
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
                onClick={() => {
                  setAuthTriggerReason('MANUAL');
                  setIsAuthModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-2xl abyssal-glass shadow-abyssal hover:shadow-underglow-cyan transition-all flex items-center gap-2 text-left"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] tracking-wider text-slate-200">
                    {t('header.signInOperator')}
                  </span>
                  <span className="font-mono text-[8px] text-slate-500">
                    {searchesRemaining} {t('header.searchesLeft')}
                  </span>
                </div>
              </motion.button>
            )}

            {!user && searchesUsed > 0 && (
              <button
                type="button"
                onClick={resetSearches}
                title="Reset guest search quota back to 3"
                className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-500 hover:text-cyan-300 text-[9px] font-mono transition-all"
              >
                {t('header.resetQuota')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Spatial Dashboard */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 md:px-12 pt-2 pb-24">
        <motion.div
          style={{ rotateX, rotateY, x: parallaxX, y: parallaxY, transformStyle: 'preserve-3d' }}
          className="transition-transform duration-200 ease-out"
        >
          {station ? (
            <WeatherDashboard
              station={station}
              theme={theme}
              isCelsius={isCelsius}
              onToggleUnit={() => setIsCelsius(!isCelsius)}
              onSearch={handleExecuteSearch}
              onSelectStation={handleSelectStation}
              searchesRemaining={searchesRemaining}
              searchesUsed={searchesUsed}
              maxLimit={maxLimit}
              isAuthenticated={Boolean(user)}
              isSearching={isSearching}
              isColdStarting={isColdStarting}
              cacheLatencyMs={cacheLatencyMs}
              isCachePurging={isCachePurging}
              onPurgeCache={handlePurgeCache}
              cacheHits={cacheHits}
            />
          ) : (
            <div className="py-24 text-center font-mono text-cyan-300 text-sm animate-pulse">
              {t('hud.loading')}
            </div>
          )}
        </motion.div>
      </main>

      {/* Authentication Modal */}
      <AuthScreen
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        triggerReason={authTriggerReason}
      />
    </div>
  );
};

export default App;
