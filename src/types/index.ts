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
  rawTime?: string;      // Full "YYYY-MM-DD HH:mm" from backend
  tempC: number;
  feelsLikeC?: number;
  pop: number;           // Probability of precipitation (0-100%)
  precipMm?: number;
  windKph?: number;
  windDir?: string;
  humidity?: number;
  pressureHpa?: number;
  uvIndex?: number;
  visibilityKm?: number;
  condition?: string;
  iconUrl?: string;
  iconType: 'sun' | 'rain' | 'cloud' | 'storm' | 'aurora' | 'snow';
}

export interface DailyForecast {
  date: string;          // "Mon", "Tue", "Yesterday", "Today", etc.
  fullDate?: string;     // "2026-11-14" or "Sat, 14 Nov 2026" for Full-Screen Day View
  highC: number;
  lowC: number;
  avgTempC?: number;
  pop: number;           // 0-100%
  totalPrecipMm?: number;
  maxWindKph?: number;
  uvIndex?: number;
  iconType: 'sun' | 'rain' | 'cloud' | 'storm' | 'aurora' | 'snow';
  iconUrl?: string;
  condition: string;
  humidity?: number;
  // Astro telemetry per day (for Full-Screen Day Modal)
  sunrise?: string;
  sunset?: string;
  moonrise?: string;
  moonset?: string;
  moonPhase?: string;
  moonIllumination?: number;
  // 24-Hour breakdown for this specific day
  hours?: HourlyForecast[];
}

export interface AlertOrMediaItem {
  title: string;
  description: string;
  source: string;
}

export interface FavoriteCityItem {
  id: number;
  cityName: string;
}

export interface WeatherStation {
  id: string;
  city: string;
  country?: string;
  region?: string;
  code: string;
  latLong: string;
  lat?: number;
  lon?: number;
  elevation: string;
  zenithTime: string;
  localtime?: string;
  tempC: number;
  feelsLikeC: number;
  feelsLikeDescription?: string;
  highC: number;
  lowC: number;
  condition: string;
  conditionIcon?: string;
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
  precipitationMm?: number;
  forecast24h: HourlyForecast[];
  dewPointC?: number;
  cloudCover?: number;
  // Air Quality & Pollutants
  aqi?: number | null;
  aqiLevel?: string;
  aqiDominant?: string;
  pm2_5?: number;
  pm10?: number;
  no2?: number;
  o3?: number;
  so2?: number;
  co?: number;
  // Sun & Moon Astro
  sunrise?: string;
  sunset?: string;
  moonrise?: string;
  moonset?: string;
  moonPhase?: string;
  moonIllumination?: number;
  sunriseUnix?: number;
  sunsetUnix?: number;
  timezoneOffsetSec?: number;
  // Timelines (Supports both existing 7d/3d prop names & full 16d/7d arrays)
  forecast7d?: DailyForecast[];
  history3d?: DailyForecast[];
  // Extra Sections (Hazards, Videos, News)
  hazards?: AlertOrMediaItem[];
  weatherVideos?: AlertOrMediaItem[];
  weatherNews?: AlertOrMediaItem[];
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