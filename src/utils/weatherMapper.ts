import { WeatherStation, WeatherCondition, DailyForecast, HourlyForecast } from '../types';

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
  if (full) {
    return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

function mapHours(rawHours: any[] | undefined, baseTemp: number, baseCond: string): HourlyForecast[] {
  if (!Array.isArray(rawHours) || !rawHours.length) return [];
  return rawHours.map((h: any, i: number) => {
    const rawTime = String(h.time ?? '');
    const time = rawTime.includes(' ') ? rawTime.split(' ')[1] : rawTime || `${String(i % 24).padStart(2, '0')}:00`;
    const cond = String(h.condition ?? baseCond).toUpperCase();
    return {
      time,
      rawTime,
      tempC: Math.round(Number(h.temp ?? h.tempC ?? baseTemp)),
      feelsLikeC: Math.round(Number(h.feelsLike ?? h.temp ?? baseTemp)),
      pop: Math.min(100, Math.max(0, Math.round(Number(h.chanceOfRain ?? h.pop ?? 0)))),
      precipMm: Number(h.precipMm ?? 0),
      windKph: Number(h.windKph ?? 0),
      windDir: String(h.windDir ?? 'N'),
      humidity: Number(h.humidity ?? 55),
      pressureHpa: Number(h.pressureMb ?? 1013),
      uvIndex: Number(h.uv ?? 0),
      visibilityKm: Number(h.visKm ?? 10),
      condition: cond,
      iconUrl: h.icon,
      iconType: iconFromCondition(cond),
    };
  });
}

function mapDailyList(rawList: any[] | undefined, baseTemp: number, baseCond: string, baseHum: number): DailyForecast[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((d: any) => {
    const highC = Math.round(Number(d.maxTemp ?? d.highC ?? baseTemp + 3));
    const lowC = Math.round(Number(d.minTemp ?? d.lowC ?? baseTemp - 3));
    const cond = String(d.condition ?? baseCond).toUpperCase();
    return {
      date: formatDateLabel(d.date, false) || String(d.date ?? ''),
      fullDate: formatDateLabel(d.date, true) || String(d.date ?? ''),
      highC,
      lowC,
      avgTempC: d.avgTemp != null ? Math.round(Number(d.avgTemp)) : Math.round((highC + lowC) / 2),
      pop: Math.min(100, Math.max(0, Math.round(Number(d.chanceOfRain ?? d.pop ?? 10)))),
      totalPrecipMm: Number(d.totalPrecipMm ?? 0),
      maxWindKph: Number(d.maxWindKph ?? 10),
      uvIndex: Number(d.uv ?? 4),
      humidity: Math.round(Number(d.avgHumidity ?? d.humidity ?? baseHum)),
      iconUrl: d.icon,
      iconType: iconFromCondition(cond),
      condition: cond,
      sunrise: d.sunrise,
      sunset: d.sunset,
      moonrise: d.moonrise,
      moonset: d.moonset,
      moonPhase: d.moonPhase,
      moonIllumination: d.moonIllumination,
      hours: mapHours(d.hours, highC, cond),
    };
  });
}

export function mapBackendToFrontend(raw: any, query: string): WeatherStation {
  const data = raw?.data ?? raw ?? {};
  const tempC = Math.round(Number(data.temperature ?? data.temp ?? 24));
  const feelsLikeC = Math.round(Number(data.feelsLike ?? tempC));
  const today = Array.isArray(data.forecast) && data.forecast[0] ? data.forecast[0] : {};
  const highC = Math.round(Number(today.maxTemp ?? data.high ?? tempC + 4));
  const lowC = Math.round(Number(today.minTemp ?? data.low ?? tempC - 4));

  const city = String(data.city ?? data.cityName ?? (query || 'New Delhi')).toUpperCase();
  const lat = Number(data.lat ?? 28.6139);
  const lon = Number(data.lon ?? 77.209);
  const condition = String(data.condition ?? 'CLEAR SKY').toUpperCase();
  const humidity = Math.min(100, Math.max(0, Math.round(Number(data.humidity ?? 60))));
  const windSpeed = Number(Number(data.windSpeed ?? 12).toFixed(1));
  const windAngle = Math.round(Number(data.windDegree ?? 45)) % 360;
  const uvIndex = Number(Number(data.uvIndex ?? 4).toFixed(1));
  const visibilityKm = Number(Number(data.visibility ?? 10).toFixed(1));
  const pressureHpa = Math.round(Number(data.pressure ?? 1013));
  const aqi = Number(data.aqi ?? 80);

  const forecast7d = mapDailyList(data.forecast, tempC, condition, humidity).slice(0, 16);
  const history3d = mapDailyList(data.history, tempC, condition, humidity).slice(-7).reverse();
  const forecast24h = mapHours(data.hourlyChart ?? today.hours, tempC, condition);

  return {
    id: city.toLowerCase().replace(/\s+/g, '-'),
    city,
    country: data.country ?? 'India',
    region: data.region ?? city,
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
    windDirection: data.windDirection ?? 'NE',
    windAngle,
    gusts: Number(Number(data.windGust ?? windSpeed * 1.3).toFixed(1)),
    humidity,
    vaporStatus: humidity > 78 ? 'High Humidity' : humidity > 40 ? 'Comfortable' : 'Dry Air',
    uvIndex,
    uvDescription: data.uvStatus ?? (uvIndex >= 6 ? 'High UV' : 'Moderate UV'),
    visibilityKm,
    visibilityStatus: data.visibilityStatus ?? (visibilityKm >= 10 ? 'Clear Visibility' : 'Moderate Clarity'),
    pressureHpa,
    pressureTendency: data.pressureTrend ?? 'Normal · Stable',
    precipitationMm: Number(data.precipitationMm ?? 0),
    forecast24h,
    dewPointC: Math.round(Number(data.dewPoint ?? tempC - 4)),
    cloudCover: Number(data.cloudCover ?? 20),
    aqi,
    aqiLevel: data.aqiStatus ?? (aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : 'Unhealthy'),
    aqiDominant: String(data.dominantPollutant ?? 'PM2.5'),
    pm2_5: data.pm2_5,
    pm10: data.pm10,
    no2: data.no2,
    o3: data.o3,
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
    hazards: data.hazards ?? [],
    weatherVideos: data.weatherVideos ?? [],
    weatherNews: data.weatherNews ?? [],
  };
}