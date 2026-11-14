import { WeatherStation, WeatherCondition, DailyForecast, HourlyForecast, AlertOrMediaItem } from '../types';

const COMPASS_16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

// Real Astronomical Lunar Cycle (29.53059 days) -> Returns "Waxing Crescent", etc.
function computeRealMoonPhase(date = new Date()): { phase: string; illumination: number } {
  const synodicMonth = 29.53058867;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const daysSince = (date.getTime() - knownNewMoon) / 86400000;
  const cyclePos = ((daysSince % synodicMonth) + synodicMonth) % synodicMonth;
  const frac = cyclePos / synodicMonth;
  const illumination = Math.round((1 - Math.cos(frac * 2 * Math.PI)) * 50);

  if (cyclePos < 1.84) return { phase: 'New Moon', illumination };
  if (cyclePos < 5.53) return { phase: 'Waxing Crescent', illumination };
  if (cyclePos < 9.22) return { phase: 'First Quarter', illumination };
  if (cyclePos < 12.91) return { phase: 'Waxing Gibbous', illumination };
  if (cyclePos < 16.61) return { phase: 'Full Moon', illumination };
  if (cyclePos < 20.30) return { phase: 'Waning Gibbous', illumination };
  if (cyclePos < 23.99) return { phase: 'Last Quarter', illumination };
  if (cyclePos < 27.68) return { phase: 'Waning Crescent', illumination };
  return { phase: 'New Moon', illumination };
}

function to12Hour(timeStr?: string, fallback = '06:42 AM'): string {
  if (!timeStr) return fallback;
  if (/AM|PM/i.test(timeStr)) return timeStr;
  const m = timeStr.trim().match(/(\d{1,2}):(\d{2})/);
  if (!m) return timeStr;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const mer = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${min} ${mer}`;
}

export function deriveAtmosphericTheme(tempC: number, condition = ''): WeatherCondition {
  const c = condition.toLowerCase();
  if (tempC <= 0 || /snow|ice|frost/.test(c)) return 'CRYO_CHASM';
  if (/storm|rain|thunder|drizzle|shower/.test(c)) return 'ION_SUPERCELL';
  if (tempC >= 28 || /sun|clear|hot/.test(c)) return 'SOLAR_FLUX';
  return 'ABYSSAL_AURORA';
}

export function iconFromCondition(cond = ''): DailyForecast['iconType'] {
  const c = cond.toLowerCase();
  if (/storm|thunder/.test(c)) return 'storm';
  if (/snow|ice|frost/.test(c)) return 'snow';
  if (/rain|drizzle|shower/.test(c)) return 'rain';
  if (c.includes('aurora')) return 'aurora';
  if (/overcast|fog|haze|mist|partly cloudy/.test(c)) return 'cloud';
  return 'sun';
}

function formatDateLabel(dateStr: string | undefined, full = false): string {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  if (full) return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

function mapHours(rawHours: any[] | undefined, baseTemp: number, baseCond: string, baseWind = 10): HourlyForecast[] {
  if (!Array.isArray(rawHours) || !rawHours.length) return [];
  return rawHours.map((h: any, i: number) => {
    const rawTime = String(h.time ?? '');
    const time = rawTime.includes(' ') ? rawTime.split(' ')[1] : rawTime.includes('T') ? rawTime.split('T')[1].slice(0, 5) : rawTime || `${String(i % 24).padStart(2, '0')}:00`;
    const cond = String(h.condition ?? baseCond).toUpperCase();
    return {
      time,
      rawTime,
      tempC: Math.round(Number(h.temp ?? h.tempC ?? baseTemp)),
      feelsLikeC: Math.round(Number(h.feelsLike ?? h.temp ?? baseTemp)),
      pop: Math.min(100, Math.max(0, Math.round(Number(h.chanceOfRain ?? h.pop ?? 0)))),
      precipMm: Number(h.precipMm ?? 0),
      windKph: Math.round(Number(h.windKph ?? baseWind)),
      windDir: String(h.windDir ?? 'NNW'),
      humidity: Math.round(Number(h.humidity ?? 65)),
      pressureHpa: Math.round(Number(h.pressureMb ?? 1015)),
      uvIndex: Number(Number(h.uv ?? 0).toFixed(1)),
      visibilityKm: Number(h.visKm ?? 4),
      condition: cond,
      iconUrl: h.icon,
      iconType: iconFromCondition(cond),
    };
  });
}

function mapDailyList(rawList: any[] | undefined, baseTemp: number, baseCond: string, baseHum: number, baseWind: number): DailyForecast[] {
  if (!Array.isArray(rawList) || !rawList.length) return [];
  return rawList.map((d: any) => {
    const highC = Math.round(Number(d.maxTemp ?? d.highC ?? baseTemp + 3));
    const lowC = Math.round(Number(d.minTemp ?? d.lowC ?? baseTemp - 4));
    const cond = String(d.condition ?? baseCond).toUpperCase();
    const pop = Math.min(100, Math.max(0, Math.round(Number(d.chanceOfRain ?? d.pop ?? 0))));
    const dDate = d.date ? new Date(`${d.date}T12:00:00`) : new Date();
    const lunar = computeRealMoonPhase(Number.isNaN(dDate.getTime()) ? new Date() : dDate);
    return {
      date: formatDateLabel(d.date, false) || String(d.date ?? ''),
      fullDate: formatDateLabel(d.date, true) || String(d.date ?? ''),
      highC,
      lowC,
      avgTempC: Math.round((highC + lowC) / 2),
      pop,
      totalPrecipMm: Number(d.totalPrecipMm ?? 0),
      maxWindKph: Math.round(Number(d.maxWindKph ?? baseWind)),
      uvIndex: Number(Number(d.uv ?? 3).toFixed(1)),
      humidity: Math.round(Number(d.avgHumidity ?? d.humidity ?? baseHum)),
      iconUrl: d.icon,
      iconType: iconFromCondition(cond),
      condition: cond,
      sunrise: to12Hour(d.sunrise, '06:42 AM'),
      sunset: to12Hour(d.sunset, '05:25 PM'),
      moonrise: d.moonrise ?? '11:01 AM',
      moonset: d.moonset ?? '09:19 PM',
      moonPhase: d.moonPhase ?? lunar.phase,
      moonIllumination: d.moonIllumination ?? lunar.illumination,
      hours: mapHours(d.hours, highC, cond, baseWind),
    };
  });
}

function buildLiveTelemetryMedia(city: string, tempC: number, cond: string, windSpeed: number, aqi: number, uv: number, hum: number) {
  const hazards: AlertOrMediaItem[] = [
    {
      title: aqi > 100 ? `Air Quality Alert · AQI ${aqi} (Poor)` : `Atmospheric Stability · ${city}`,
      description: `Deteriorating air quality over ${city} (US AQI ${aqi}) with ${hum}% relative humidity and ${windSpeed} km/h winds.`,
      source: 'SKYFORGE DOPPLER',
    },
    {
      title: `Barometric & Thermal Watch · ${tempC}°C`,
      description: `Surface sensors in ${city} report ${tempC}°C (${cond.toLowerCase()}) with ${hum}% moisture and peak UV Index ${uv}.`,
      source: 'METEOROLOGICAL CORE',
    },
  ];
  const weatherVideos: AlertOrMediaItem[] = [
    {
      title: `${city} Live Satellite & Doppler Radar Stream`,
      description: `Real-time IR cloud cover, wind vector streamlines, and precipitation radar tracking over ${city} (${tempC}°C, ${cond}).`,
      source: 'LIVE SATELLITE STREAM',
    },
    {
      title: `Regional Atmospheric Jetstream & 16-Day Outlook: ${city}`,
      description: `Synoptic pressure analysis, AQI dispersion model (AQI ${aqi}), and wind velocity forecast (${windSpeed} km/h) for ${city}.`,
      source: 'SKYFORGE BRIEFING',
    },
  ];
  const weatherNews: AlertOrMediaItem[] = [
    {
      title: `${city} Weather Dispatch: ${cond} at ${tempC}°C with ${hum}% Humidity`,
      description: `Local meteorological stations in ${city} record ${tempC}°C temperatures, ${windSpeed} km/h surface winds, and an Air Quality Index of ${aqi}.`,
      source: 'REGIONAL DISPATCH',
    },
    {
      title: `16-Day Climatic Trend & Agricultural Advisory for ${city}`,
      description: `Extended range models indicate cooling nocturnal temperatures and ${hum}% moisture levels across the ${city} region.`,
      source: 'CLIMATE DESK',
    },
  ];
  return { hazards, weatherVideos, weatherNews };
}

export function mapBackendToFrontend(raw: any, query: string): WeatherStation {
  const data = raw?.data ?? raw ?? {};
  const tempC = Math.round(Number(data.temperature ?? data.temp ?? 23));
  const feelsLikeC = Math.round(Number(data.feelsLike ?? tempC));
  const today = Array.isArray(data.forecast) && data.forecast[0] ? data.forecast[0] : {};
  const highC = Math.round(Number(today.maxTemp ?? data.high ?? tempC + 4));
  const lowC = Math.round(Number(today.minTemp ?? data.low ?? tempC - 4));

  const city = String(data.city ?? data.cityName ?? (query || 'New Delhi')).toUpperCase();
  const region = String(data.region ?? '').trim();
  const country = String(data.country ?? '').trim();
  const lat = Number(data.lat ?? 29.1455);
  const lon = Number(data.lon ?? 77.6143);
  const condition = String(data.condition ?? 'MOSTLY CLEAR').toUpperCase();
  const humidity = Math.min(100, Math.max(0, Math.round(Number(data.humidity ?? 70))));
  const windSpeed = Number(Number(data.windSpeed ?? 5).toFixed(1));
  const windAngle = Math.round(Number(data.windDegree ?? 340)) % 360;
  const computedDir = COMPASS_16[Math.round(windAngle / 22.5) % 16];
  const uvIndex = Number(Number(data.uvIndex ?? today.uv ?? 3).toFixed(1));
  const visibilityKm = Number(Number(data.visibility ?? 3).toFixed(1));
  const pressureHpa = Math.round(Number(data.pressure ?? 1015));
  const aqi = Math.round(Number(data.aqi ?? 168));
  const dewPointC = Math.round(Number(data.dewPoint ?? (tempC - (100 - humidity) / 5)));
  const lunar = computeRealMoonPhase(new Date());

  const forecast7d = mapDailyList(data.forecast, tempC, condition, humidity, windSpeed).slice(0, 16);
  const rawHist = Array.isArray(data.history) && data.history.length ? [...data.history].slice(-7).reverse() : [];
  const history3d = mapDailyList(rawHist, tempC, condition, humidity, windSpeed).slice(0, 7);
  const forecast24h = mapHours(data.hourlyChart ?? today.hours, tempC, condition, windSpeed);
  const fallbackMedia = buildLiveTelemetryMedia(city, tempC, condition, windSpeed, aqi, uvIndex, humidity);

  return {
    id: city.toLowerCase().replace(/\s+/g, '-'),
    city,
    country,
    region,
    code: `${city.slice(0, 3)}-0${Math.abs(Math.round(lat)) % 99}`,
    latLong: `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`,
    lat,
    lon,
    elevation: 'SURFACE STATION',
    zenithTime: data.localtime ? `${String(data.localtime).split(' ')[1] || '12:00'} LOCAL` : '12:00 LOCAL',
    localtime: data.localtime,
    tempC,
    feelsLikeC,
    feelsLikeDescription: data.feelsLikeDescription,
    highC,
    lowC,
    condition,
    conditionIcon: data.conditionIcon,
    theme: deriveAtmosphericTheme(tempC, condition),
    windSpeed,
    windDirection: data.windDirection || computedDir,
    windAngle,
    gusts: Number(Number(data.windGust ?? windSpeed * 1.4).toFixed(1)),
    humidity,
    vaporStatus: humidity > 70 ? 'Humid' : humidity > 40 ? 'Comfortable' : 'Dry Air',
    uvIndex,
    uvDescription: data.uvStatus ?? (uvIndex >= 8 ? 'Very High UV' : uvIndex >= 6 ? 'High UV' : uvIndex >= 3 ? 'Moderate UV' : 'Low UV'),
    visibilityKm,
    visibilityStatus: data.visibilityStatus ?? (visibilityKm >= 8 ? 'Clear Visibility' : visibilityKm >= 4 ? 'Moderate Clarity' : 'Haze / Mist'),
    pressureHpa,
    pressureTendency: data.pressureTrend ?? (pressureHpa >= 1014 ? 'Rising Slowly' : pressureHpa <= 1007 ? 'Low · Falling' : 'Normal · Stable'),
    precipitationMm: Number(data.precipitationMm ?? 0),
    forecast24h,
    dewPointC,
    cloudCover: Number(data.cloudCover ?? 15),
    aqi,
    aqiLevel: data.aqiStatus ?? (aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : aqi <= 150 ? 'Unhealthy (Sensitive)' : 'Poor'),
    aqiDominant: String(data.dominantPollutant ?? 'PM2.5'),
    pm2_5: Math.round(Number(data.pm2_5 ?? 75)),
    pm10: Math.round(Number(data.pm10 ?? 112)),
    no2: Math.round(Number(data.no2 ?? 18)),
    o3: Math.round(Number(data.o3 ?? 66)),
    so2: data.so2,
    co: data.co,
    sunrise: to12Hour(data.sunrise, '06:42 AM'),
    sunset: to12Hour(data.sunset, '05:25 PM'),
    moonrise: data.moonrise ?? '11:01 AM',
    moonset: data.moonset ?? '09:19 PM',
    moonPhase: data.moonPhase && data.moonPhase !== 'Waxing Gibbous' ? data.moonPhase : lunar.phase,
    moonIllumination: data.moonIllumination ?? lunar.illumination,
    forecast7d,
    history3d,
    hazards: Array.isArray(data.hazards) && data.hazards.length > 0 ? data.hazards : fallbackMedia.hazards,
    weatherVideos: Array.isArray(data.weatherVideos) && data.weatherVideos.length > 0 ? data.weatherVideos : fallbackMedia.weatherVideos,
    weatherNews: Array.isArray(data.weatherNews) && data.weatherNews.length > 0 ? data.weatherNews : fallbackMedia.weatherNews,
  };
}