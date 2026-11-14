import { WeatherStation, WeatherCondition, DailyForecast, HourlyForecast, AlertOrMediaItem } from '../types';

const COMPASS_16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

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
  if (/cloud|overcast|mist|fog|haze/.test(c)) return 'cloud';
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

function buildFallbackHours(baseTemp: number, baseCond: string, basePop = 15, baseWind = 12): HourlyForecast[] {
  return Array.from({ length: 24 }, (_, h) => {
    const t = baseTemp + Math.round(Math.sin(((h - 6) / 24) * Math.PI * 2) * 4);
    const cond = h >= 6 && h <= 18 ? baseCond : baseCond.replace('SUNNY', 'CLEAR');
    return {
      time: `${String(h).padStart(2, '0')}:00`,
      tempC: t,
      feelsLikeC: t - 1,
      pop: Math.min(100, Math.max(5, basePop + ((h * 3) % 20) - 8)),
      precipMm: 0,
      windKph: Math.round(baseWind + (h % 5) - 2),
      windDir: 'NE',
      humidity: 55 + (h % 15),
      pressureHpa: 1013,
      uvIndex: h >= 7 && h <= 17 ? Math.max(1, 7 - Math.abs(12 - h)) : 0,
      visibilityKm: 10,
      condition: cond,
      iconType: iconFromCondition(cond),
    };
  });
}

function mapHours(rawHours: any[] | undefined, baseTemp: number, baseCond: string, baseWind = 12): HourlyForecast[] {
  if (!Array.isArray(rawHours) || !rawHours.length) return buildFallbackHours(baseTemp, baseCond, 15, baseWind);
  return rawHours.map((h: any, i: number) => {
    const rawTime = String(h.time ?? '');
    const time = rawTime.includes(' ') ? rawTime.split(' ')[1] : rawTime.includes('T') ? rawTime.split('T')[1].slice(0, 5) : rawTime || `${String(i % 24).padStart(2, '0')}:00`;
    const cond = String(h.condition ?? baseCond).toUpperCase();
    return {
      time,
      rawTime,
      tempC: Math.round(Number(h.temp ?? h.tempC ?? baseTemp)),
      feelsLikeC: Math.round(Number(h.feelsLike ?? h.temp ?? baseTemp)),
      pop: Math.min(100, Math.max(0, Math.round(Number(h.chanceOfRain ?? h.pop ?? 10)))),
      precipMm: Number(h.precipMm ?? 0),
      windKph: Number(h.windKph ?? baseWind),
      windDir: String(h.windDir ?? 'NE'),
      humidity: Number(h.humidity ?? 55),
      pressureHpa: Number(h.pressureMb ?? 1013),
      uvIndex: Number(h.uv ?? 4),
      visibilityKm: Number(h.visKm ?? 10),
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
    const pop = Math.min(100, Math.max(0, Math.round(Number(d.chanceOfRain ?? d.pop ?? 12))));
    return {
      date: formatDateLabel(d.date, false) || String(d.date ?? ''),
      fullDate: formatDateLabel(d.date, true) || String(d.date ?? ''),
      highC,
      lowC,
      avgTempC: Math.round((highC + lowC) / 2),
      pop,
      totalPrecipMm: Number(d.totalPrecipMm ?? 0),
      maxWindKph: Number(d.maxWindKph ?? baseWind),
      uvIndex: Number(d.uv ?? 4),
      humidity: Math.round(Number(d.avgHumidity ?? d.humidity ?? baseHum)),
      iconUrl: d.icon,
      iconType: iconFromCondition(cond),
      condition: cond,
      sunrise: d.sunrise ?? '06:20 AM',
      sunset: d.sunset ?? '05:45 PM',
      moonrise: d.moonrise ?? '06:45 PM',
      moonset: d.moonset ?? '06:12 AM',
      moonPhase: d.moonPhase ?? 'Waxing Gibbous',
      moonIllumination: d.moonIllumination ?? 72,
      hours: mapHours(d.hours, highC, cond, baseWind),
    };
  });
}

function buildLiveTelemetryMedia(city: string, tempC: number, cond: string, windSpeed: number, aqi: number, uv: number, hum: number) {
  const hazards: AlertOrMediaItem[] = [
    {
      title: aqi > 100 ? `Air Quality Alert · AQI ${aqi}` : windSpeed > 20 ? `High Wind Advisory · ${windSpeed} km/h` : `Atmospheric Stability · ${city}`,
      description: `Current surface winds at ${windSpeed} km/h with ${hum}% relative humidity, AQI ${aqi}, and ${cond.toLowerCase()} conditions in ${city}.`,
      source: 'SKYFORGE DOPPLER',
    },
    {
      title: uv >= 6 ? `Solar UV Radiation Warning · Index ${uv}` : `Thermal & Barometric Watch · ${tempC}°C`,
      description: `Thermal sensors report ${tempC}°C across ${city} sector with UV Index ${uv} and ${hum}% atmospheric moisture.`,
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
      description: `Extended range models indicate fluctuating diurnal temperatures and ${hum}% moisture levels across the ${city} metropolitan zone.`,
      source: 'CLIMATE DESK',
    },
  ];
  return { hazards, weatherVideos, weatherNews };
}

export function mapBackendToFrontend(raw: any, query: string): WeatherStation {
  const data = raw?.data ?? raw ?? {};
  const tempC = Math.round(Number(data.temperature ?? data.temp ?? 24));
  const feelsLikeC = Math.round(Number(data.feelsLike ?? tempC));
  const today = Array.isArray(data.forecast) && data.forecast[0] ? data.forecast[0] : {};
  const highC = Math.round(Number(today.maxTemp ?? data.high ?? tempC + 4));
  const lowC = Math.round(Number(today.minTemp ?? data.low ?? tempC - 4));

  const city = String(data.city ?? data.cityName ?? (query || 'New Delhi')).toUpperCase();
  const region = String(data.region ?? '').trim();
  const country = String(data.country ?? '').trim();
  const lat = Number(data.lat ?? 28.6139);
  const lon = Number(data.lon ?? 77.209);
  const condition = String(data.condition ?? 'CLEAR SKY').toUpperCase();
  const humidity = Math.min(100, Math.max(0, Math.round(Number(data.humidity ?? 55))));
  const windSpeed = Number(Number(data.windSpeed ?? 12).toFixed(1));
  const windAngle = Math.round(Number(data.windDegree ?? 0)) % 360;
  const computedDir = COMPASS_16[Math.round(windAngle / 22.5) % 16];
  const uvIndex = Number(Number(data.uvIndex ?? today.uv ?? 3).toFixed(1));
  const visibilityKm = Number(Number(data.visibility ?? 12).toFixed(1));
  const pressureHpa = Math.round(Number(data.pressure ?? 1013));
  const aqi = Math.round(Number(data.aqi ?? 48));
  const dewPointC = Math.round(Number(data.dewPoint ?? (tempC - (100 - humidity) / 5)));

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
    gusts: Number(Number(data.windGust ?? windSpeed * 1.35).toFixed(1)),
    humidity,
    vaporStatus: humidity > 78 ? 'High Humidity' : humidity > 40 ? 'Comfortable' : 'Dry Air',
    uvIndex,
    uvDescription: data.uvStatus ?? (uvIndex >= 8 ? 'Very High UV' : uvIndex >= 6 ? 'High UV' : uvIndex >= 3 ? 'Moderate UV' : 'Low UV'),
    visibilityKm,
    visibilityStatus: data.visibilityStatus ?? (visibilityKm >= 10 ? 'Clear Visibility' : visibilityKm >= 5 ? 'Moderate Clarity' : 'Low Visibility'),
    pressureHpa,
    pressureTendency: data.pressureTrend ?? (pressureHpa >= 1016 ? 'High · Steady' : pressureHpa <= 1007 ? 'Low · Falling' : 'Normal · Stable'),
    precipitationMm: Number(data.precipitationMm ?? 0),
    forecast24h,
    dewPointC,
    cloudCover: Number(data.cloudCover ?? 20),
    aqi,
    aqiLevel: data.aqiStatus ?? (aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : aqi <= 150 ? 'Unhealthy (Sensitive)' : 'Unhealthy'),
    aqiDominant: String(data.dominantPollutant ?? 'PM2.5'),
    pm2_5: Math.round(Number(data.pm2_5 ?? aqi * 0.42)),
    pm10: Math.round(Number(data.pm10 ?? aqi * 0.78)),
    no2: Math.round(Number(data.no2 ?? 14)),
    o3: Math.round(Number(data.o3 ?? 44)),
    so2: data.so2,
    co: data.co,
    sunrise: data.sunrise ?? '06:20 AM',
    sunset: data.sunset ?? '05:45 PM',
    moonrise: data.moonrise ?? '06:45 PM',
    moonset: data.moonset ?? '06:12 AM',
    moonPhase: data.moonPhase ?? 'Waxing Gibbous',
    moonIllumination: data.moonIllumination ?? 72,
    forecast7d,
    history3d,
    hazards: Array.isArray(data.hazards) && data.hazards.length > 0 ? data.hazards : fallbackMedia.hazards,
    weatherVideos: Array.isArray(data.weatherVideos) && data.weatherVideos.length > 0 ? data.weatherVideos : fallbackMedia.weatherVideos,
    weatherNews: Array.isArray(data.weatherNews) && data.weatherNews.length > 0 ? data.weatherNews : fallbackMedia.weatherNews,
  };
}