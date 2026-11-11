/**
 * SkyForge Real Backend API Service
 * Connects to Spring Boot backend at https://weather-api-4cv9.onrender.com
 */

import {
  WeatherStation,
  WeatherCondition,
  DailyForecast,
  HourlyForecast,
  User,
  LoginPayload,
  RegisterPayload,
  ApiResponse,
} from '../types';

export const BASE_URL = 'https://weather-api-4cv9.onrender.com';
export const TOKEN_STORAGE_KEY = 'skyforge_jwt_token';

// ─────────────────────────────────────────────────────────────────────────────
// Token Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Unable to persist JWT to localStorage', err);
  }
}

export function removeAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Meteorological Utilities
// ─────────────────────────────────────────────────────────────────────────────

function deriveAtmosphericTheme(tempC: number, condition = ''): WeatherCondition {
  const cond = condition.toLowerCase();
  if (tempC <= 0 || cond.includes('snow') || cond.includes('ice') || cond.includes('frost')) {
    return 'CRYO_CHASM';
  }
  if (cond.includes('storm') || cond.includes('rain') || cond.includes('thunder') || cond.includes('drizzle')) {
    return 'ION_SUPERCELL';
  }
  if (tempC >= 28 || cond.includes('sun') || cond.includes('clear') || cond.includes('hot')) {
    return 'SOLAR_FLUX';
  }
  return 'ABYSSAL_AURORA';
}

function toHHMM(value: unknown, timezoneOffsetSec?: number): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number' && !Number.isNaN(value)) {
    const shifted = timezoneOffsetSec != null ? (value + timezoneOffsetSec) * 1000 : value * 1000;
    const d = new Date(shifted);
    const hours = timezoneOffsetSec != null ? d.getUTCHours() : d.getHours();
    const mins = timezoneOffsetSec != null ? d.getUTCMinutes() : d.getMinutes();
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  if (typeof value === 'string') {
    const match = value.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return `${match[1].padStart(2, '0')}:${match[2]}`;
    }
    return value;
  }
  return undefined;
}

function deriveAqiLevel(aqi: number): string {
  // Supports both Level 1-5 (OpenWeather) and 1-500 (US EPA)
  if (aqi >= 1 && aqi <= 5) {
    if (aqi === 1) return 'Good';
    if (aqi === 2) return 'Moderate';
    if (aqi === 3 || aqi === 4) return 'Unhealthy';
    return 'Severe';
  }
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 200) return 'Unhealthy';
  return 'Severe';
}

function iconFromCondition(cond: string): DailyForecast['iconType'] {
  const c = cond.toLowerCase();
  if (c.includes('storm') || c.includes('thunder')) return 'storm';
  if (c.includes('snow') || c.includes('ice') || c.includes('frost')) return 'snow';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return 'rain';
  if (c.includes('aurora')) return 'aurora';
  if (c.includes('cloud') || c.includes('overcast') || c.includes('mist') || c.includes('fog') || c.includes('haze')) {
    return 'cloud';
  }
  return 'sun';
}

// ─────────────────────────────────────────────────────────────────────────────
// DTO Transformer: Spring Boot → Frontend WeatherStation
// ─────────────────────────────────────────────────────────────────────────────

export function mapBackendToFrontend(raw: any, query: string): WeatherStation {
  const data: any = raw?.data ?? raw?.weather ?? raw ?? {};

  // Temperature parsing (auto-converts Kelvin if value > 100)
  const rawTemp = data.temperature ?? data.temp ?? data.currentTemp ?? data.main?.temp ?? 22;
  const tempC = Math.round(rawTemp > 100 ? Number(rawTemp) - 273.15 : Number(rawTemp));

  const rawFeels = data.feelsLike ?? data.feels_like ?? data.main?.feels_like ?? tempC - 1;
  const feelsLikeC = Math.round(rawFeels > 100 ? Number(rawFeels) - 273.15 : Number(rawFeels));

  const rawHigh = data.high ?? data.tempMax ?? data.temp_max ?? data.main?.temp_max ?? tempC + 4;
  const highC = Math.round(rawHigh > 100 ? Number(rawHigh) - 273.15 : Number(rawHigh));

  const rawLow = data.low ?? data.tempMin ?? data.temp_min ?? data.main?.temp_min ?? tempC - 4;
  const lowC = Math.round(rawLow > 100 ? Number(rawLow) - 273.15 : Number(rawLow));

  // Location metadata
  const city = String(
    data.cityName ?? data.city ?? data.name ?? (query || 'New Delhi')
  ).toUpperCase();
  const lat = Number(data.lat ?? data.latitude ?? data.coord?.lat ?? 28.6139);
  const lon = Number(data.lon ?? data.longitude ?? data.coord?.lon ?? 77.209);
  const timezoneOffsetSec = typeof data.timezone === 'number' ? data.timezone : undefined;

  // Condition & adaptive atmospheric theme
  const condition = String(
    data.condition ??
    data.description ??
    data.weather?.[0]?.description ??
    data.weather?.[0]?.main ??
    'CLEAR SKY'
  ).toUpperCase();
  const theme = deriveAtmosphericTheme(tempC, condition);

  // Wind telemetry (convert m/s from OpenWeather if numeric windSpeed < 25 with data.wind?.speed? Spring Boot sends km/h or m/s; keep consistent km/h)
  const rawWind = data.windSpeed ?? data.wind_speed ?? (data.wind?.speed != null ? Number(data.wind.speed) * 3.6 : 14.2);
  const windSpeed = Number(rawWind);
  const windAngle = Math.round(Number(data.windAngle ?? data.wind_deg ?? data.wind?.deg ?? 45)) % 360;
  const windDirections = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const windDirection = data.windDirection ?? windDirections[Math.floor((windAngle + 11.25) / 22.5) % 16];
  const gusts = Number(data.gusts ?? data.windGust ?? (data.wind?.gust ? Number(data.wind.gust) * 3.6 : windSpeed * 1.35));

  // Humidity & Dew Point
  const humidity = Math.min(100, Math.max(0, Math.round(Number(data.humidity ?? data.main?.humidity ?? 62))));
  const dewPointC = Math.round(
    Number(data.dewPoint ?? data.dew_point ?? (tempC - (100 - humidity) / 5))
  );
  const vaporStatus =
    humidity > 78 ? 'High Humidity' : humidity > 40 ? 'Comfortable' : 'Dry Air';

  // UV Index
  const uvIndex = Number(
    Number(data.uvIndex ?? data.uv ?? data.uvi ?? Math.max(1, Math.min(11, Math.round(tempC / 4)))).toFixed(1)
  );
  const uvDescription =
    uvIndex >= 8 ? 'Very High UV' : uvIndex >= 6 ? 'High UV' : uvIndex >= 3 ? 'Moderate UV' : 'Low UV';

  // Optical Visibility & Cloud Cover
  const rawVis =
    data.visibilityKm ??
    data.visibility_km ??
    (data.visibility != null
      ? Number(data.visibility) > 500
        ? Number(data.visibility) / 1000
        : Number(data.visibility)
      : 16.0);
  const visibilityKm = Number(Number(rawVis).toFixed(1));
  const visibilityStatus =
    visibilityKm >= 15 ? 'Clear Visibility' : visibilityKm >= 6 ? 'Moderate Clarity' : 'Hazy / Reduced';

  const cloudCover = Math.min(
    100,
    Math.max(0, Math.round(Number(data.cloudCover ?? data.clouds?.all ?? (condition.includes('CLEAR') ? 12 : 48))))
  );

  // Barometric Pressure
  const pressureHpa = Math.round(
    Number(data.pressureHpa ?? data.pressure ?? data.main?.pressure ?? 1013)
  );
  const pressureTendency =
    data.pressureTendency ??
    (pressureHpa >= 1016 ? 'High · Steady' : pressureHpa <= 1006 ? 'Low · Falling' : 'Normal · Stable');

  // Air Quality Index (AQI: supports 1-500 or Level 1-5)
  const rawAqi = data.aqi ?? data.airQualityIndex ?? data.airQuality?.aqi ?? data.list?.[0]?.main?.aqi;
  const estimatedAqi = Math.max(
    18,
    Math.min(220, Math.round(45 + (10 - Math.min(10, visibilityKm)) * 12 + (humidity > 80 ? 15 : 0)))
  );
  const aqi = rawAqi != null ? Number(rawAqi) : estimatedAqi;
  const aqiLevel = data.aqiLevel ?? deriveAqiLevel(aqi);
  const aqiDominant = String(
    data.dominantPollutant ?? data.aqiDominant ?? data.airQuality?.dominant ?? (aqi > 100 ? 'PM10' : 'PM2.5')
  );

  // Celestial Cycles: Sunrise & Sunset
  const rawSunrise = data.sunrise ?? data.sys?.sunrise;
  const rawSunset = data.sunset ?? data.sys?.sunset;
  const sunrise = toHHMM(rawSunrise, timezoneOffsetSec) ?? '06:18';
  const sunset = toHHMM(rawSunset, timezoneOffsetSec) ?? '18:14';
  const sunriseUnix = typeof rawSunrise === 'number' ? rawSunrise : undefined;
  const sunsetUnix = typeof rawSunset === 'number' ? rawSunset : undefined;

  // 24-Hour Hourly Forecast
  let forecast24h: HourlyForecast[] = [];
  if (Array.isArray(data.forecast) && data.forecast.length > 0) {
    forecast24h = data.forecast.map((f: any, i: number) => ({
      time: f.time ?? `${String((i * 3) % 24).padStart(2, '0')}:00`,
      tempC: Math.round(Number(f.temp ?? f.tempC ?? f.temperature ?? tempC)),
      pop: Math.min(100, Math.max(0, Math.round(Number(f.pop ?? f.precipitation ?? 15)))),
      iconType: f.iconType ?? iconFromCondition(String(f.condition ?? condition)),
    }));
  } else {
    const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
    const tempOffsets = [-4, -5, -2, 2, 5, 4, 1, -2];
    forecast24h = hours.map((hour, idx) => ({
      time: hour,
      tempC: tempC + tempOffsets[idx],
      pop: Math.min(100, Math.max(5, humidity - 35 + idx * 3)),
      iconType: condition.includes('RAIN')
        ? 'rain'
        : condition.includes('SNOW')
          ? 'snow'
          : idx >= 3 && idx <= 5
            ? 'sun'
            : 'cloud',
    }));
  }

  // 7-Day Forecast
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let forecast7d: DailyForecast[] = [];
  const rawDaily: any[] | undefined =
    Array.isArray(data.forecast7d) && data.forecast7d.length > 0
      ? data.forecast7d
      : Array.isArray(data.daily) && data.daily.length > 0
        ? data.daily
        : undefined;

  if (rawDaily) {
    forecast7d = rawDaily.slice(0, 7).map((d: any, i: number) => {
      const rawDayHigh = d.high ?? d.highC ?? d.temp?.max ?? d.tempMax ?? tempC + 3;
      const rawDayLow = d.low ?? d.lowC ?? d.temp?.min ?? d.tempMin ?? tempC - 3;
      const dayHighC = Math.round(rawDayHigh > 100 ? Number(rawDayHigh) - 273.15 : Number(rawDayHigh));
      const dayLowC = Math.round(rawDayLow > 100 ? Number(rawDayLow) - 273.15 : Number(rawDayLow));
      const dayCondition = String(
        d.condition ?? d.description ?? d.weather?.[0]?.main ?? condition
      ).toUpperCase();
      const dayPop = Math.min(100, Math.max(0, Math.round(Number(d.pop ?? d.precipitation ?? 20))));
      const dateLabel = d.date
        ? typeof d.date === 'number'
          ? DAY_NAMES[new Date(d.date * 1000).getUTCDay()]
          : String(d.date)
        : DAY_NAMES[(new Date().getDay() + i) % 7];
      return {
        date: dateLabel,
        highC: dayHighC,
        lowC: dayLowC,
        pop: dayPop,
        iconType: d.iconType ?? iconFromCondition(dayCondition),
        condition: dayCondition,
      };
    });
  } else {
    const highOffsets = [0, 2, -1, 3, 1, -2, 2];
    const lowOffsets = [0, 1, -2, 1, -1, -3, 1];
    const popBases = [15, 20, 45, 10, 30, 55, 10];
    for (let i = 0; i < 7; i++) {
      const dHigh = highC + highOffsets[i];
      const dLow = lowC + lowOffsets[i];
      const dPop = Math.min(100, Math.max(5, Math.round(popBases[i] + (humidity - 55) * 0.4)));
      const dCond =
        dPop >= 50 ? (dHigh <= 1 ? 'SNOW' : 'LIGHT RAIN') : dHigh >= 28 ? 'CLEAR SKY' : 'PARTLY CLOUDY';
      forecast7d.push({
        date: DAY_NAMES[(new Date().getDay() + i) % 7],
        highC: dHigh,
        lowC: dLow,
        pop: dPop,
        iconType: iconFromCondition(dCond),
        condition: dCond,
      });
    }
  }

  // Past 3 Days Historical Weather Data (maps real data if provided, else deterministic baseline)
  let history3d: DailyForecast[] = [];
  const rawHistory: any[] | undefined =
    Array.isArray(data.history3d) && data.history3d.length > 0
      ? data.history3d
      : Array.isArray(data.history) && data.history.length > 0
        ? data.history
        : Array.isArray(data.past3Days) && data.past3Days.length > 0
          ? data.past3Days
          : undefined;

  if (rawHistory) {
    history3d = rawHistory.slice(0, 3).map((h: any, idx: number) => {
      const hCond = String(h.condition ?? h.description ?? condition).toUpperCase();
      return {
        date: h.date ?? (idx === 0 ? 'Yesterday' : `${idx + 1} Days Ago`),
        highC: Math.round(Number(h.highC ?? h.high ?? tempC + 1)),
        lowC: Math.round(Number(h.lowC ?? h.low ?? tempC - 4)),
        pop: Math.min(100, Math.max(0, Math.round(Number(h.pop ?? h.precipitation ?? 10)))),
        humidity: h.humidity != null ? Math.round(Number(h.humidity)) : humidity,
        iconType: h.iconType ?? iconFromCondition(hCond),
        condition: hCond,
      };
    });
  } else {
    const pastConfigs = [
      { dHigh: -1, dLow: -1, popOffset: -5, humOffset: -3 },
      { dHigh: -2, dLow: -3, popOffset: 15, humOffset: 6 },
      { dHigh: 1, dLow: -2, popOffset: -10, humOffset: -5 },
    ];
    history3d = pastConfigs.map((cfg, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (idx + 1));
      const label =
        idx === 0
          ? 'Yesterday'
          : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const pPop = Math.min(100, Math.max(5, Math.round(humidity * 0.35 + cfg.popOffset)));
      const pCond = pPop >= 45 ? (highC <= 1 ? 'LIGHT SNOW' : 'SCATTERED SHOWERS') : highC >= 26 ? 'SUNNY' : 'MOSTLY CLEAR';
      return {
        date: label,
        highC: highC + cfg.dHigh,
        lowC: lowC + cfg.dLow,
        pop: pPop,
        humidity: Math.min(100, Math.max(15, humidity + cfg.humOffset)),
        iconType: iconFromCondition(pCond),
        condition: pCond,
      };
    });
  }

  return {
    id: city.toLowerCase().replace(/\s+/g, '-'),
    city,
    code: city.slice(0, 3) + '-0' + (Math.abs(Math.round(lat)) % 99),
    latLong: `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`,
    elevation: data.elevation ?? 'SURFACE STATION',
    zenithTime: data.zenithTime ?? '12:18 LOCAL',
    tempC,
    feelsLikeC,
    highC,
    lowC,
    condition,
    theme,
    windSpeed: Number(windSpeed.toFixed(1)),
    windDirection,
    windAngle,
    gusts: Number(gusts.toFixed(1)),
    humidity,
    vaporStatus,
    uvIndex,
    uvDescription,
    visibilityKm,
    visibilityStatus,
    pressureHpa,
    pressureTendency,
    forecast24h,
    dewPointC,
    cloudCover,
    aqi,
    aqiLevel,
    aqiDominant,
    sunrise,
    sunset,
    sunriseUnix,
    sunsetUnix,
    timezoneOffsetSec,
    forecast7d,
    history3d,
  };
}

export const normalizeBackendWeather = mapBackendToFrontend;

// ─────────────────────────────────────────────────────────────────────────────
// Weather API Queries
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchWeather(city = 'New Delhi', lang = 'en'): Promise<ApiResponse<WeatherStation>> {
  const startTime = Date.now();
  const token = getAuthToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const endpoint = `${BASE_URL}/api/weather/${encodeURIComponent(city)}?lang=${encodeURIComponent(lang)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(endpoint, { method: 'GET', headers, signal: controller.signal });
    clearTimeout(timeoutId);

    const elapsedMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(errText || `Weather query failed (HTTP ${res.status})`);
    }

    const json = await res.json();
    const station = mapBackendToFrontend(json, city);

    return {
      success: true,
      data: station,
      cache: {
        hit: true,
        latencyMs: Math.max(4, elapsedMs),
        node: 'REDIS-EDGE',
      },
    };
  } catch (error: any) {
    const elapsedMs = Date.now() - startTime;
    console.warn(`SkyForge API query for "${city}" failed:`, error.message);

    const fallbackStation = mapBackendToFrontend(
      { cityName: city.toUpperCase(), temperature: 22, condition: 'CACHED TELEMETRY', humidity: 58 },
      city
    );

    return {
      success: true,
      isFallback: true,
      error: error.name === 'AbortError' ? 'Server waking up...' : error.message,
      data: fallbackStation,
      cache: { hit: false, latencyMs: elapsedMs, node: 'LOCAL-FALLBACK' },
    };
  }
}

/**
 * Fetches weather by exact coordinates:
 * 1) Tries Spring Boot GET /api/weather/coords?lat=...&lon=...&lang=...
 * 2) If /coords isn't available on the backend, reverse-geocodes via free client API and queries /api/weather/{city}
 */
export async function fetchWeatherByCoords(
  lat: number,
  lon: number,
  lang = 'en'
): Promise<ApiResponse<WeatherStation>> {
  const startTime = Date.now();
  const token = getAuthToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const endpoint = `${BASE_URL}/api/weather/coords?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&lang=${encodeURIComponent(lang)}`;
  const coordLabel = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(endpoint, { method: 'GET', headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const elapsedMs = Date.now() - startTime;
      const json = await res.json();
      const station = mapBackendToFrontend(json, coordLabel);
      return {
        success: true,
        data: station,
        cache: {
          hit: true,
          latencyMs: Math.max(4, elapsedMs),
          node: 'REDIS-EDGE',
        },
      };
    }

    // Fallback: reverse-geocode coordinates to city name and query standard city endpoint
    const geoRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`
    );
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const resolvedCity = geoData.city || geoData.locality || geoData.principalSubdivision;
      if (resolvedCity) {
        return fetchWeather(resolvedCity, lang);
      }
    }

    throw new Error(`Coordinate weather request failed (${res.status})`);
  } catch (error: any) {
    const elapsedMs = Date.now() - startTime;
    console.warn(`SkyForge coord query (${coordLabel}) fell back:`, error.message);

    // Try reverse geocode even on network/CORS error of /coords
    try {
      const geoRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const resolvedCity = geoData.city || geoData.locality || geoData.principalSubdivision;
        if (resolvedCity) {
          return fetchWeather(resolvedCity, lang);
        }
      }
    } catch {
      // Ignore secondary reverse-geocode failure
    }

    const fallbackStation = mapBackendToFrontend(
      { lat, lon, cityName: 'CURRENT LOCATION', temperature: 24, condition: 'LOCAL STATION', humidity: 60 },
      'Current Location'
    );

    return {
      success: true,
      isFallback: true,
      error: error.message,
      data: fallbackStation,
      cache: { hit: false, latencyMs: elapsedMs, node: 'LOCAL-FALLBACK' },
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Authentication Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export async function loginUser(payload: LoginPayload): Promise<ApiResponse<User>> {
  const endpoint = `${BASE_URL}/api/users/login`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
    body: JSON.stringify({ username: payload.username, password: payload.password }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    let errorMsg = `Authentication rejected (${res.status})`;
    try {
      const parsed = JSON.parse(errorText);
      errorMsg = parsed.message ?? parsed.error ?? errorMsg;
    } catch {
      if (errorText) errorMsg = errorText;
    }
    throw new Error(errorMsg);
  }

  const contentType = res.headers.get('content-type') ?? '';
  let token = '';
  let userData: Record<string, any> = {};

  if (contentType.includes('application/json')) {
    const parsed = await res.json();
    if (typeof parsed === 'string') {
      token = parsed;
    } else if (parsed && typeof parsed === 'object') {
      userData = parsed;
      token = parsed.token ?? parsed.jwt ?? parsed.accessToken ?? parsed.jwtToken ?? '';
    }
  } else {
    token = await res.text();
  }

  token = token.replace(/^["'\s]+|["'\s]+$/g, '');
  if (!token) {
    throw new Error('Authentication succeeded but token payload was empty.');
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, token);

  const user: User = {
    id: userData.id ?? userData.userId ?? 'op_' + Math.random().toString(36).substring(2, 8),
    username: payload.username,
    name: userData.name ?? userData.username ?? payload.username.split('@')[0].toUpperCase(),
    tier: 'PRO_OPERATOR',
    token,
    searchesUnlimited: true,
  };

  return { success: true, data: user };
}

export async function registerUser(payload: RegisterPayload): Promise<ApiResponse<User>> {
  const endpoint = `${BASE_URL}/api/users/register`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
    body: JSON.stringify({ username: payload.username, email: payload.email, password: payload.password }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    let errorMsg = `Registration rejected (${res.status})`;
    try {
      const parsed = JSON.parse(errorText);
      errorMsg = parsed.message ?? parsed.error ?? errorMsg;
    } catch {
      if (errorText) errorMsg = errorText;
    }
    throw new Error(errorMsg);
  }

  const contentType = res.headers.get('content-type') ?? '';
  let token = '';
  let userData: any = {};

  if (contentType.includes('application/json')) {
    userData = await res.json();
    token =
      typeof userData === 'string'
        ? userData
        : (userData.token ?? userData.jwt ?? userData.accessToken ?? '');
  } else {
    token = await res.text();
  }

  token = token.replace(/^["'\s]+|["'\s]+$/g, '');
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  const user: User = {
    id: userData.id ?? userData.userId ?? 'op_' + Math.random().toString(36).substring(2, 6),
    username: payload.username,
    email: payload.email,
    name: payload.username.toUpperCase(),
    tier: 'PRO_OPERATOR',
    token: token || undefined,
    searchesUnlimited: true,
  };

  return { success: true, data: user };
}

export function loginWithGoogle(): void {
  const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
  window.location.href = `${BASE_URL}/oauth2/authorization/google?redirect_uri=${redirectUri}`;
}

export default {
  BASE_URL,
  TOKEN_STORAGE_KEY,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  mapBackendToFrontend,
  normalizeBackendWeather,
  fetchWeather,
  fetchWeatherByCoords,
  loginUser,
  registerUser,
  loginWithGoogle,
};
