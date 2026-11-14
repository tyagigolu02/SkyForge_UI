import { WeatherStation, WeatherCondition, DailyForecast, HourlyForecast, AlertOrMediaItem } from '../types';

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

function buildFallbackHours(baseTemp: number, baseCond: string, basePop = 15): HourlyForecast[] {
  return Array.from({ length: 24 }, (_, h) => {
    const t = baseTemp + Math.round(Math.sin(((h - 6) / 24) * Math.PI * 2) * 4);
    const cond = h >= 6 && h <= 18 ? baseCond : baseCond.replace('SUNNY', 'CLEAR');
    return {
      time: `${String(h).padStart(2, '0')}:00`,
      tempC: t,
      feelsLikeC: t - 1,
      pop: Math.min(100, Math.max(5, basePop + ((h * 3) % 20) - 8)),
      precipMm: 0,
      windKph: 10 + (h % 7),
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

function mapHours(rawHours: any[] | undefined, baseTemp: number, baseCond: string): HourlyForecast[] {
  if (!Array.isArray(rawHours) || !rawHours.length) return buildFallbackHours(baseTemp, baseCond);
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
      windKph: Number(h.windKph ?? 12),
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

function mapDailyList(rawList: any[] | undefined, baseTemp: number, baseCond: string, baseHum: number, count: number, isHistory: boolean): DailyForecast[] {
  if (Array.isArray(rawList) && rawList.length > 0) {
    return rawList.map((d: any) => {
      const highC = Math.round(Number(d.maxTemp ?? d.highC ?? baseTemp + 3));
      const lowC = Math.round(Number(d.minTemp ?? d.lowC ?? baseTemp - 4));
      const cond = String(d.condition ?? baseCond).toUpperCase();
      return {
        date: formatDateLabel(d.date, false) || String(d.date ?? ''),
        fullDate: formatDateLabel(d.date, true) || String(d.date ?? ''),
        highC,
        lowC,
        avgTempC: Math.round((highC + lowC) / 2),
        pop: Math.min(100, Math.max(0, Math.round(Number(d.chanceOfRain ?? d.pop ?? 12)))),
        totalPrecipMm: Number(d.totalPrecipMm ?? 0),
        maxWindKph: Number(d.maxWindKph ?? 14),
        uvIndex: Number(d.uv ?? 5),
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
        hours: mapHours(d.hours, highC, cond),
      };
    });
  }
  return Array.from({ length: count }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + (isHistory ? -(idx + 1) : idx));
    const iso = d.toISOString().split('T')[0];
    const wave = ((idx * 3) % 5) - 2;
    const highC = Math.round(baseTemp + 4 + wave);
    const lowC = Math.round(baseTemp - 4 + wave);
    const pop = Math.min(85, Math.max(10, 15 + ((idx * 11) % 45)));
    const cond = pop > 45 ? 'SCATTERED SHOWERS' : idx % 3 === 0 ? 'CLEAR SKY' : 'PARTLY CLOUDY';
    return {
      date: formatDateLabel(iso, false),
      fullDate: formatDateLabel(iso, true),
      highC,
      lowC,
      avgTempC: Math.round((highC + lowC) / 2),
      pop,
      totalPrecipMm: pop > 45 ? 3.2 : 0,
      maxWindKph: 12 + (idx % 8),
      uvIndex: 5,
      humidity: Math.min(95, Math.max(30, baseHum + wave * 3)),
      iconType: iconFromCondition(cond),
      condition: cond,
      sunrise: '06:22 AM',
      sunset: '05:42 PM',
      hours: buildFallbackHours(highC - 2, cond, pop),
    };
  });
}

function buildLiveTelemetryMedia(city: string, tempC: number, cond: string, windSpeed: number, aqi: number, uv: number, hum: number) {
  const hazards: AlertOrMediaItem[] = [
    {
      title: aqi > 100 ? `Air Quality Alert · AQI ${aqi}` : windSpeed > 20 ? `High Wind Advisory · ${windSpeed} km/h` : `Atmospheric Stability · ${city}`,
      description: aqi > 100 ? `Elevated particulate concentration detected over ${city}. Sensitive groups should limit prolonged outdoor exposure.` : `Current surface winds at ${windSpeed} km/h with ${hum}% relative humidity and ${cond.toLowerCase()} conditions.`,
      source: 'SKYFORGE DOPPLER',
    },
    {
      title: uv >= 6 ? `Solar UV Radiation Warning · Index ${uv}` : `Thermal & Barometric Watch · ${tempC}°C`,
      description: uv >= 6 ? `High UV index (${uv}) active over ${city}. Direct midday solar exposure requires UV protection.` : `Thermal sensors report ${tempC}°C across ${city} sector with ${hum}% atmospheric moisture.`,
      source: 'METEOROLOGICAL CORE',
    },
  ];
  const weatherVideos: AlertOrMediaItem[] = [
    {
      title: `${city} Live Satellite & Doppler Radar Stream`,
      description: `Real-time红外 (IR) cloud cover, wind vector streamlines, and precipitation radar tracking over ${city} (${tempC}°C, ${cond}).`,
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
  const lat = Number(data.lat ?? 28.9845);
  const lon = Number(data.lon ?? 77.7064);
  const condition = String(data.condition ?? 'CLEAR SKY').toUpperCase();
  const humidity = Math.min(100, Math.max(0, Math.round(Number(data.humidity ?? 58))));
  const windSpeed = Number(Number(data.windSpeed ?? 12).toFixed(1));
  const windAngle = Math.round(Number(data.windDegree ?? 45)) % 360;
  const uvIndex = Number(Number(data.uvIndex ?? 4).toFixed(1));
  const visibilityKm = Number(Number(data.visibility ?? 10).toFixed(1));
  const pressureHpa = Math.round(Number(data.pressure ?? 1013));
  const aqi = Number(data.aqi ?? 80);

  const forecast7d = mapDailyList(data.forecast, tempC, condition, humidity, 16, false).slice(0, 16);
  const rawHist = Array.isArray(data.history) && data.history.length ? [...data.history].slice(-7).reverse() : undefined;
  const history3d = mapDailyList(rawHist, tempC, condition, humidity, 7, true).slice(0, 7);
  const forecast24h = mapHours(data.hourlyChart ?? today.hours, tempC, condition);
  const fallbackMedia = buildLiveTelemetryMedia(city, tempC, condition, windSpeed, aqi, uvIndex, humidity);

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
    hazards: Array.isArray(data.hazards) && data.hazards.length > 0 ? data.hazards : fallbackMedia.hazards,
    weatherVideos: Array.isArray(data.weatherVideos) && data.weatherVideos.length > 0 ? data.weatherVideos : fallbackMedia.weatherVideos,
    weatherNews: Array.isArray(data.weatherNews) && data.weatherNews.length > 0 ? data.weatherNews : fallbackMedia.weatherNews,
  };
}