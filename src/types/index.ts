/**
 * SkyForge Core Type Definitions
 * Strict interfaces for meteorological telemetry, user authentication,
 * API contracts, and spatial theme configurations.
 */

export type WeatherCondition =
  | 'ION_SUPERCELL'
  | 'ABYSSAL_AURORA'
  | 'SOLAR_FLUX'
  | 'CRYO_CHASM';

export interface ThemeConfig {
  ambientGlowPrimary: string;
  ambientGlowSecondary: string;
  accentHex: string;
  underglow: string;
  badgeBorder?: string;
  textGlow?: string;
}

export interface HourlyForecast {
  time: string;
  tempC: number;
  pop: number; // Probability of precipitation (0-100%)
  iconType: 'sun' | 'rain' | 'cloud' | 'storm' | 'aurora' | 'snow';
}

export interface DailyForecast {
  date: string;      // "Mon", "Tue", etc.
  highC: number;
  lowC: number;
  pop: number;       // 0-100
  iconType: 'sun' | 'rain' | 'cloud' | 'storm' | 'aurora' | 'snow';
  condition: string;
}

export interface WeatherStation {
  id: string;
  city: string;
  code: string;
  latLong: string;
  elevation: string;
  zenithTime: string;
  tempC: number;
  feelsLikeC: number;
  highC: number;
  lowC: number;
  condition: string;
  theme: WeatherCondition;
  windSpeed: number;
  windDirection: string;
  windAngle: number;
  gusts: number;
  humidity: number;
  vaporStatus: string;
  uvIndex: number;
  uvDescription: string;
  visibilityKm: number;
  visibilityStatus: string;
  pressureHpa: number;
  pressureTendency: string;
  forecast24h: HourlyForecast[];
  // ── Extended fields ──────────────────────────────────────────────────────────
  dewPointC?: number;
  cloudCover?: number;
  aqi?: number | null;
  aqiLevel?: string;
  aqiDominant?: string;
  sunrise?: string;
  sunset?: string;
  forecast7d?: DailyForecast[];
}

export interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  tier: 'GUEST' | 'PRO_OPERATOR';
  token?: string;
  searchesUnlimited?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface CacheTelemetry {
  hit: boolean;
  latencyMs: number;
  node: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  cache?: CacheTelemetry;
  isFallback?: boolean;
  error?: string;
}

export interface SearchLimitState {
  searchesUsed: number;
  searchesRemaining: number;
  maxLimit: number;
  hasExceededLimit: boolean;
  recordSearch: (isAuthenticated?: boolean) => boolean;
  resetSearches: () => void;
}
