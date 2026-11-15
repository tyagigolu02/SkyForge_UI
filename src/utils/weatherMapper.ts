import { WeatherStation, WeatherCondition, DailyForecast, HourlyForecast, AlertOrMediaItem } from '../types';

const COMPASS_16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

function computeRealMoonPhase(date = new Date()): { phase: string; illumination: number } {
  const synodicMonth = 29.53058867;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const daysSince = (date.getTime() - knownNewMoon) / 86400000;
  const cyclePos = ((daysSince % synodicMonth) + synodicMonth) % synodicMonth;
  const illumination = Math.round((1 - Math.cos((cyclePos / synodicMonth) * 2 * Math.PI)) * 50);

  if (cyclePos < 1.84) return { phase: 'New Moon', illumination };
  if (cyclePos < 5.53) return { phase: 'Waxing Crescent', illumination };
  if (cyclePos < 9.22) return { phase: 'First Quarter', illumination };
  if (cyclePos < 12.91) return { phase: 'Waxing Gibbous', illumination };
  if (cyclePos < 16.61) return { phase: 'Full Moon', illumination };
  if (cyclePos < 20.30) return { phase: 'Waning Gibbous', illumination };
  if (cyclePos < 23.99) return { phase: 'Last Quarter', illumination };
  return { phase: 'Waning Crescent', illumination };
}

function to12Hour(timeStr?: string, fallback = '06:42 AM'): string {
  if (!timeStr) return fallback;
  if (/AM|PM/i.test(timeStr)) return timeStr;
  const m = timeStr.trim().match(/(\d{1,2}):(\d{2})/);
  if (!m) return timeStr;
  let h = parseInt(m[1], 10);
  const mer = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m[2]} ${mer}`;
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

// 4 Real Actionable Suggestions (Respiratory/AQI, Driving/Visibility, Outdoor/UV, Clothing/Comfort)
function buildSmartSuggestionsAndMedia(city: string, tempC: number, cond: string, windSpeed: number, aqi: number, uv: number, visKm: number) {
  const hazards: AlertOrMediaItem[] = [
    {
      source: 'RESPIRATORY CARE',
      title: aqi >= 300 ? `N95 Mask Advised (AQI ${aqi})` : aqi > 150 ? `Limit Cardio Outdoors (AQI ${aqi})` : `Clean Air Window (AQI ${aqi})`,
      description: aqi >= 300 ? `Severe smog in ${city}. Avoid morning/late-evening jogging, keep indoor air purifiers active, and wear an N95 mask outside.` : aqi > 150 ? `Elevated PM2.5 levels. Asthma and sensitive individuals should reduce heavy outdoor exercise.` : `Air quality is favorable for outdoor sports and ventilation.`,
    },
    {
      source: 'HIGHWAY & VISIBILITY',
      title: visKm <= 3.5 ? `Smog/Mist Caution (${visKm} km)` : `Clear Road Visibility (${visKm} km)`,
      description: visKm <= 3.5 ? `Reduced visibility due to winter haze/smog around ${city}. Use low-beam fog lights during early morning and night drives.` : `Optical visibility is clear across major highways and transit corridors.`,
    },
    {
      source: 'OUTDOOR & UV GUIDE',
      title: uv >= 5 ? `SPF 30+ & Sunglasses (UV ${uv})` : `Comfortable Solar Index (UV ${uv})`,
      description: uv >= 5 ? `Moderate-to-high midday UV radiation between 11 AM – 3 PM. Apply sunscreen and stay hydrated.` : `Safe UV levels for outdoor work, farming, and daytime travel.`,
    },
    {
      source: 'THERMAL CLOTHING',
      title: tempC <= 18 ? `Layer Up Tonight (${tempC}°C)` : `Light Cotton & Evening Layer (${tempC}°C)`,
      description: `Daytime feels pleasant at ${tempC}°C, but nocturnal temperatures drop quickly after sunset—carry a light jacket for evening commute.`,
    },
  ];
  const weatherVideos: AlertOrMediaItem[] = [
    {
      title: `${city} & Regional Live Satellite Weather Stream`,
      description: `Watch 24x7 live international and regional meteorological satellite radar, jetstream winds (${windSpeed} km/h), and storm tracking.`,
      source: 'LIVE SATELLITE TV',
    },
    {
      title: `Air Quality (AQI ${aqi}) & 16-Day Climate Forecast Briefing`,
      description: `Live meteorological analysis covering PM2.5 smog dispersion, temperature trends (${tempC}°C), and upcoming weather systems.`,
      source: 'WEATHER DESK LIVE',
    },
  ];
  return { hazards, weatherVideos };
}

export function mapBackendToFrontend(raw: any, query: string): WeatherStation {
  const data = raw?.data ?? raw ?? {};
  const tempC = Math.round(Number(data.temperature ?? data.temp ?? 25));
  const feelsLikeC = Math.round(Number(data.feelsLike ?? tempC));
  const today = Array.isArray(data.forecast) && data.forecast[0] ? data.forecast[0] : {};
  const highC = Math.round(Number(today.maxTemp ?? data.high ?? tempC + 3));
  const lowC = Math.round(Number(today.minTemp ?? data.low ?? tempC - 7));

  const city = String(data.city ?? data.cityName ?? (query || 'New Delhi')).toUpperCase();
  const region = String(data.region ?? '').trim();
  const country = String(data.country ?? '').trim();
  const lat = Number(data.lat ?? 29.1455);
  const lon = Number(data.lon ?? 77.6143);
  const condition = String(data.condition ?? 'MOSTLY CLEAR').toUpperCase();
  const humidity = Math.min(100, Math.max(0, Math.round(Number(data.humidity ?? 58))));
  const windSpeed = Number(Number(data.windSpeed ?? 6.5).toFixed(1));
  const windAngle = Math.round(Number(data.windDegree ?? 330)) % 360;
  const computedDir = COMPASS_16[Math.round(windAngle / 22.5) % 16];
  const uvIndex = Number(Number(data.uvIndex ?? today.uv ?? 4).toFixed(1));
  const visibilityKm = Number(Number(data.visibility ?? 2.5).toFixed(1));
  const pressureHpa = Math.round(Number(data.pressure ?? 1015));
  const aqi = Math.round(Number(data.aqi ?? 348));
  const dewPointC = Math.round(Number(data.dewPoint ?? (tempC - (100 - humidity) / 5)));
  const lunar = computeRealMoonPhase(new Date());

  const forecast7d = mapDailyList(data.forecast, tempC, condition, humidity, windSpeed).slice(0, 16);
  const rawHist = Array.isArray(data.history) && data.history.length ? [...data.history].slice(-7).reverse() : [];
  const history3d = mapDailyList(rawHist, tempC, condition, humidity, windSpeed).slice(0, 7);
  const forecast24h = mapHours(data.hourlyChart ?? today.hours, tempC, condition, windSpeed);
  const smartMedia = buildSmartSuggestionsAndMedia(city, tempC, condition, windSpeed, aqi, uvIndex, visibilityKm);

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
    visibilityStatus: data.visibilityStatus ?? (visibilityKm >= 8 ? 'Clear Visibility' : visibilityKm >= 4 ? 'Moderate Clarity' : 'Smog / Haze'),
    pressureHpa,
    pressureTendency: data.pressureTrend ?? (pressureHpa >= 1014 ? 'Rising Slowly' : pressureHpa <= 1007 ? 'Low · Falling' : 'Normal · Stable'),
    precipitationMm: Number(data.precipitationMm ?? 0),
    forecast24h,
    dewPointC,
    cloudCover: Number(data.cloudCover ?? 10),
    aqi,
    aqiLevel: aqi > 300 ? 'Severe' : aqi > 200 ? 'Very Poor' : aqi > 100 ? 'Poor' : aqi > 50 ? 'Moderate' : 'Good',
    aqiDominant: String(data.dominantPollutant ?? 'PM2.5'),
    pm2_5: Math.round(Number(data.pm2_5 ?? 185)),
    pm10: Math.round(Number(data.pm10 ?? 295)),
    no2: Math.round(Number(data.no2 ?? 22)),
    o3: Math.round(Number(data.o3 ?? 88)),
    so2: data.so2,
    co: data.co,
    sunrise: to12Hour(data.sunrise, '06:42 AM'),
    sunset: to12Hour(data.sunset, '05:25 PM'),
    moonrise: data.moonrise ?? '11:01 AM',
    moonset: data.moonset ?? '09:19 PM',
    moonPhase: lunar.phase,
    moonIllumination: lunar.illumination,
    forecast7d,
    history3d,
    hazards: smartMedia.hazards,
    weatherVideos: smartMedia.weatherVideos,
    weatherNews: data.weatherNews ?? [],
  };
}