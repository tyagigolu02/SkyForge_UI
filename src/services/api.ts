/**
 * SkyForge Real Backend API Service
 * Production TypeScript implementation connecting to Spring Boot deployed at:
 * https://weather-api-4cv9.onrender.com
 */

import {
  WeatherStation,
  WeatherCondition,
  DailyForecast,
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
  } catch { }
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme Derivation
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

// ─────────────────────────────────────────────────────────────────────────────
// Utility: convert a unix timestamp (seconds) or "HH:MM" string to "HH:MM"
// ─────────────────────────────────────────────────────────────────────────────

function toHHMM(value: any): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number') {
    // Unix timestamp in seconds
    const d = new Date(value * 1000);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  }
  if (typeof value === 'string' && /^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }
  return String(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: derive AQI level label from numeric AQI
// ─────────────────────────────────────────────────────────────────────────────

function deriveAqiLevel(aqi: number | null | undefined): string | undefined {
  if (aqi == null) return undefined;
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: determine iconType from a condition string
// ─────────────────────────────────────────────────────────────────────────────

function iconFromCondition(cond: string): DailyForecast['iconType'] {
  const c = cond.toLowerCase();
  if (c.includes('storm') || c.includes('thunder')) return 'storm';
  if (c.includes('snow') || c.includes('ice') || c.includes('frost') || c.includes('cryo')) return 'snow';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return 'rain';
  if (c.includes('aurora')) return 'aurora';
  if (c.includes('cloud') || c.includes('overcast') || c.includes('mist') || c.includes('fog')) return 'cloud';
  return 'sun';
}

// ─────────────────────────────────────────────────────────────────────────────
// DTO Transformer: Spring Boot → Frontend WeatherStation
//
// Spring Boot DTO field names accepted (graceful fallback chain):
//   temperature | temp | currentTemp | main.temp        → tempC
//   feelsLike   | feels_like | main.feels_like          → feelsLikeC
//   humidity    | main.humidity                         → humidity
//   cityName    | city | name                           → city
//   windSpeed   | wind.speed                            → windSpeed
//   windAngle   | wind.deg                              → windAngle
//   pressureHpa | pressure | main.pressure              → pressureHpa
//   uvIndex     | uv                                    → uvIndex
//   visibilityKm| visibility (meters)                   → visibilityKm
//   high | tempMax | temp_max | main.temp_max           → highC
//   low  | tempMin | temp_min | main.temp_min           → lowC
// ─────────────────────────────────────────────────────────────────────────────

export function mapBackendToFrontend(raw: any, query: string): WeatherStation {
  // Unwrap common Spring Boot wrapper shapes: { data: {...} } or { weather: {...} }
  const data: any = raw?.data ?? raw?.weather ?? raw ?? {};

  // ── Temperature ──────────────────────────────────────────────────────────
  const rawTemp = data.temperature ?? data.temp ?? data.currentTemp ?? data.main?.temp ?? 22;
  const tempC = Math.round(rawTemp > 100 ? rawTemp - 273.15 : Number(rawTemp));

  const rawFeels = data.feelsLike ?? data.feels_like ?? data.main?.feels_like ?? tempC - 2;
  const feelsLikeC = Math.round(rawFeels > 100 ? rawFeels - 273.15 : Number(rawFeels));

  const rawHigh = data.high ?? data.tempMax ?? data.temp_max ?? data.main?.temp_max ?? tempC + 4;
  const highC = Math.round(rawHigh > 100 ? rawHigh - 273.15 : Number(rawHigh));

  const rawLow = data.low ?? data.tempMin ?? data.temp_min ?? data.main?.temp_min ?? tempC - 4;
  const lowC = Math.round(rawLow > 100 ? rawLow - 273.15 : Number(rawLow));

  // ── Location ──────────────────────────────────────────────────────────────
  const city = String(
    data.cityName ?? data.city ?? data.name ?? query ?? 'ORBITAL STATION'
  ).toUpperCase();
  const lat = Number(data.lat ?? data.coord?.lat ?? 35.6762);
  const lon = Number(data.lon ?? data.coord?.lon ?? 139.6503);

  // ── Condition ─────────────────────────────────────────────────────────────
  const condition = String(
    data.condition ??
    data.description ??
    data.weather?.[0]?.description ??
    data.weather?.[0]?.main ??
    'ATMOSPHERIC STREAM // OPTIMAL'
  ).toUpperCase();

  const theme = deriveAtmosphericTheme(tempC, condition);

  // ── Wind ─────────────────────────────────────────────────────────────────
  const windSpeed = Number(data.windSpeed ?? data.wind_speed ?? data.wind?.speed ?? 18.5);
  const windAngle = Math.round(Number(data.windAngle ?? data.wind_deg ?? data.wind?.deg ?? 45));
  const windDirections = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const windDirection = data.windDirection ?? windDirections[Math.floor((windAngle + 11.25) / 22.5) % 16];
  const gusts = Number(data.gusts ?? data.wind?.gust ?? windSpeed * 1.4);

  // ── Humidity ─────────────────────────────────────────────────────────────
  const humidity = Math.round(Number(data.humidity ?? data.main?.humidity ?? 65));
  const vaporStatus =
    humidity > 80 ? 'Supersaturated Vapor' : humidity > 50 ? 'Equilibrium Dewpoint' : 'Arid Atmosphere';

  // ── UV ───────────────────────────────────────────────────────────────────
  const uvIndex = Number(data.uvIndex ?? data.uv ?? data.uvi ?? Math.max(1, tempC / 3));
  const uvDescription = uvIndex > 8 ? 'Extreme (Shield Req.)' : uvIndex > 5 ? 'Elevated Radiation' : 'Nominal Flux';

  // ── Visibility ───────────────────────────────────────────────────────────
  // Spring Boot may return meters (10000) or km (10.0); detect by magnitude
  const rawVis = data.visibilityKm ?? data.visibility_km ?? (
    data.visibility != null
      ? (Number(data.visibility) > 500 ? Number(data.visibility) / 1000 : Number(data.visibility))
      : 42.5
  );
  const visibilityKm = Number(rawVis);
  const visibilityStatus =
    visibilityKm > 30 ? 'Cryo-Transparent' : visibilityKm > 10 ? 'High Optical Clarity' : 'Atmospheric Haze';

  // ── Pressure ─────────────────────────────────────────────────────────────
  const pressureHpa = Math.round(Number(
    data.pressureHpa ?? data.pressure ?? data.main?.pressure ?? 1013
  ));
  const pressureTendency = data.pressureTendency ?? '+1.8 hPa / 3h (Stable)';

  // ── 24-hour Forecast ─────────────────────────────────────────────────────
  let forecast24h: WeatherStation['forecast24h'] = [];
  if (Array.isArray(data.forecast) && data.forecast.length > 0) {
    forecast24h = data.forecast.map((f: any, i: number) => ({
      time: f.time ?? `${String(i * 3).padStart(2, '0')}:00`,
      tempC: Math.round(Number(f.temp ?? f.tempC ?? f.temperature ?? tempC)),
      pop: Math.min(100, Math.max(0, Math.round(Number(f.pop ?? f.precipitation ?? 15)))),
      iconType: (f.iconType ?? (String(f.condition ?? '').toLowerCase().includes('rain') ? 'rain' : 'sun')) as WeatherStation['forecast24h'][0]['iconType'],
    }));
  } else {
    const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
    const tempOffsets = [-4, -5, -2, 2, 5, 4, 1, -2];
    forecast24h = hours.map((hour, idx) => ({
      time: hour,
      tempC: tempC + tempOffsets[idx],
      pop: Math.min(100, Math.max(5, humidity - 30 + tempOffsets[idx] * -2)),
      iconType: (
        condition.includes('RAIN') ? 'rain'
        : condition.includes('SNOW') ? 'snow'
        : idx >= 3 && idx <= 5 ? 'sun'
        : 'cloud'
      ) as WeatherStation['forecast24h'][0]['iconType'],
    }));
  }

  // ── Dew Point ─────────────────────────────────────────────────────────────
  const dewPointC: number = data.dewPoint ?? data.dew_point ?? Math.round(tempC - ((100 - humidity) / 5));

  // ── Cloud Cover ───────────────────────────────────────────────────────────
  const cloudCover: number = data.cloudCover ?? data.clouds?.all ?? 50;

  // ── Air Quality Index ─────────────────────────────────────────────────────
  const aqi: number | null = data.aqi ?? data.airQualityIndex ?? null;
  const aqiLevel: string | undefined = deriveAqiLevel(aqi);
  const aqiDominant: string = data.dominantPollutant ?? data.aqiDominant ?? 'PM2.5';

  // ── Sunrise / Sunset ──────────────────────────────────────────────────────
  const sunrise: string | undefined = toHHMM(data.sunrise ?? data.sys?.sunrise);
  const sunset: string | undefined = toHHMM(data.sunset ?? data.sys?.sunset);

  // ── 7-day Forecast ────────────────────────────────────────────────────────
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let forecast7d: DailyForecast[] = [];

  const rawDaily: any[] | undefined =
    Array.isArray(data.forecast7d) && data.forecast7d.length > 0 ? data.forecast7d
    : Array.isArray(data.daily) && data.daily.length > 0 ? data.daily
    : undefined;

  if (rawDaily) {
    forecast7d = rawDaily.slice(0, 7).map((d: any, i: number) => {
      const rawDayHigh = d.high ?? d.highC ?? d.temp?.max ?? d.tempMax ?? d.temperature ?? tempC + 3;
      const rawDayLow = d.low ?? d.lowC ?? d.temp?.min ?? d.tempMin ?? tempC - 3;
      const dayHighC = Math.round(rawDayHigh > 100 ? rawDayHigh - 273.15 : Number(rawDayHigh));
      const dayLowC = Math.round(rawDayLow > 100 ? rawDayLow - 273.15 : Number(rawDayLow));
      const dayCondition = String(
        d.condition ?? d.description ?? d.weather?.[0]?.description ?? d.weather?.[0]?.main ?? condition
      ).toUpperCase();
      const dayPop = Math.min(100, Math.max(0, Math.round(Number(d.pop ?? d.precipitation ?? d.precipProbability ?? 20))));
      const dateLabel = d.date
        ? (typeof d.date === 'number'
            ? DAY_NAMES[new Date(d.date * 1000).getUTCDay()]
            : (DAY_NAMES[new Date(String(d.date)).getDay()] ?? d.date))
        : DAY_NAMES[(new Date().getDay() + i) % 7];
      return {
        date: dateLabel,
        highC: dayHighC,
        lowC: dayLowC,
        pop: dayPop,
        iconType: (d.iconType ?? iconFromCondition(dayCondition)) as DailyForecast['iconType'],
        condition: dayCondition,
      };
    });
  } else {
    // Synthetic 7-day generation based on current conditions
    const highOffsets = [0, 2, -1, 3, 1, -2, 4];
    const lowOffsets  = [0, 1, -2, 2, -1, -3, 3];
    const popBases    = [15, 20, 45, 10, 30, 60, 5];
    for (let i = 0; i < 7; i++) {
      const dayHighC = highC + highOffsets[i];
      const dayLowC  = lowC  + lowOffsets[i];
      const dayPop   = Math.min(100, Math.max(0, popBases[i] + (humidity - 50)));
      const syntheticCond =
        dayPop > 55 ? (dayHighC <= 0 ? 'SNOW' : 'RAIN')
        : dayHighC >= 28 ? 'CLEAR SKY'
        : 'PARTLY CLOUDY';
      forecast7d.push({
        date: DAY_NAMES[(new Date().getDay() + i) % 7],
        highC: dayHighC,
        lowC: dayLowC,
        pop: dayPop,
        iconType: iconFromCondition(syntheticCond),
        condition: syntheticCond,
      });
    }
  }

  return {
    id: city.toLowerCase().replace(/\s+/g, '-'),
    city,
    code: city.slice(0, 3) + '-0' + (Math.abs(Math.round(lat)) % 99),
    latLong: `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`,
    elevation: data.elevation ?? '+48m ORBITAL TELEMETRY',
    zenithTime: data.zenithTime ?? '12:30 UTC',
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
    uvIndex: Number(uvIndex.toFixed(1)),
    uvDescription,
    visibilityKm: Number(visibilityKm.toFixed(1)),
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
    forecast7d,
  };
}

/**
 * Alias kept for internal use and backward-compatibility.
 */
export const normalizeBackendWeather = mapBackendToFrontend;

// ─────────────────────────────────────────────────────────────────────────────
// fetchWeather — GET /api/weather/{city}?lang={lang}
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchWeather(city = 'tokyo', lang = 'en'): Promise<ApiResponse<WeatherStation>> {
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
    // 25 s timeout — allows Render free-tier cold-start without hanging the UI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(endpoint, { method: 'GET', headers, signal: controller.signal });
    clearTimeout(timeoutId);

    const elapsedMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(errText || `Atmospheric query failed (HTTP ${res.status})`);
    }

    const json = await res.json();
    const station = mapBackendToFrontend(json, city);

    return {
      success: true,
      data: station,
      cache: {
        hit: true,
        latencyMs: Math.max(4, elapsedMs),
        node: 'RENDER-EDGE // SPRING-BOOT',
      },
    };
  } catch (error: any) {
    const elapsedMs = Date.now() - startTime;
    console.warn(`SkyForge Weather API query for "${city}" encountered:`, error.message);

    // Graceful fallback so the UI stays operational during cold-starts
    const fallbackStation = mapBackendToFrontend(
      { cityName: city.toUpperCase(), temperature: 22, condition: 'ATMOSPHERIC MATRIX // CACHED STREAM', humidity: 65 },
      city
    );

    return {
      success: true,
      isFallback: true,
      error: error.name === 'AbortError' ? 'Cold start delay: Server waking up...' : error.message,
      data: fallbackStation,
      cache: { hit: false, latencyMs: elapsedMs, node: 'EDGE-SURFACE-ENCLAVE' },
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchWeatherByCoords — GET /api/weather/coords?lat={lat}&lon={lon}&lang={lang}
// ─────────────────────────────────────────────────────────────────────────────

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
  const coordLabel = `${lat.toFixed(4)},${lon.toFixed(4)}`;

  try {
    // 25 s timeout — allows Render free-tier cold-start without hanging the UI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(endpoint, { method: 'GET', headers, signal: controller.signal });
    clearTimeout(timeoutId);

    const elapsedMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(errText || `Coordinate atmospheric query failed (HTTP ${res.status})`);
    }

    const json = await res.json();
    const station = mapBackendToFrontend(json, coordLabel);

    return {
      success: true,
      data: station,
      cache: {
        hit: true,
        latencyMs: Math.max(4, elapsedMs),
        node: 'RENDER-EDGE // SPRING-BOOT',
      },
    };
  } catch (error: any) {
    const elapsedMs = Date.now() - startTime;
    console.warn(`SkyForge Weather API coord query (${coordLabel}) encountered:`, error.message);

    // Graceful fallback so the UI stays operational during cold-starts
    const fallbackStation = mapBackendToFrontend(
      {
        lat,
        lon,
        temperature: 22,
        condition: 'ATMOSPHERIC MATRIX // CACHED STREAM',
        humidity: 65,
      },
      coordLabel
    );

    return {
      success: true,
      isFallback: true,
      error: error.name === 'AbortError' ? 'Cold start delay: Server waking up...' : error.message,
      data: fallbackStation,
      cache: { hit: false, latencyMs: elapsedMs, node: 'EDGE-SURFACE-ENCLAVE' },
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// loginUser — POST /api/users/login
// Handles: raw JWT string, JSON "token" string, JSON { token: "..." } object
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
      // Spring Boot returned the JWT as a bare JSON string: "eyJ..."
      token = parsed;
    } else if (parsed && typeof parsed === 'object') {
      userData = parsed;
      token = parsed.token ?? parsed.jwt ?? parsed.accessToken ?? parsed.jwtToken ?? '';
    }
  } else {
    // Plain-text response — the entire body is the JWT
    token = await res.text();
  }

  // Strip accidental JSON quotes and whitespace: "eyJ..." → eyJ...
  token = token.replace(/^["'\s]+|["'\s]+$/g, '');

  if (!token) {
    throw new Error('Authentication succeeded but token payload was empty.');
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, token);

  const user: User = {
    id: userData.id ?? userData.userId ?? ('op_' + Math.random().toString(36).substring(2, 8)),
    username: payload.username,
    name: userData.name ?? userData.username ?? payload.username.split('@')[0].toUpperCase(),
    tier: 'PRO_OPERATOR',
    token,
    searchesUnlimited: true,
  };

  return { success: true, data: user };
}

// ─────────────────────────────────────────────────────────────────────────────
// registerUser — POST /api/users/register
// ─────────────────────────────────────────────────────────────────────────────

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
    token = typeof userData === 'string'
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
    id: userData.id ?? userData.userId ?? ('op_' + Math.random().toString(36).substring(2, 6)),
    username: payload.username,
    email: payload.email,
    name: payload.username.toUpperCase(),
    tier: 'PRO_OPERATOR',
    token: token || undefined,
    searchesUnlimited: true,
  };

  return { success: true, data: user };
}

// ─────────────────────────────────────────────────────────────────────────────
// loginWithGoogle — Redirects to Spring Boot OAuth2 endpoint
// The backend will redirect back to the frontend with ?token=JWT in the URL.
// App.tsx captures that token via its OAuth query-param useEffect.
// ─────────────────────────────────────────────────────────────────────────────

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
