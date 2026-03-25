import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Droplets, Wind, Gauge, Sun, CloudDrizzle, Zap, Clock } from 'lucide-react';
import { getSprayCondition } from './utils/deltaT';
import { generateWeatherAlerts } from './utils/weatherAlerts';
import { findBestSprayWindow } from './utils/sprayWindow';
import { AlertBanner } from './components/AlertBanner';
import { LocationSearch, Location } from './components/LocationSearch';
import { HourlyForecast } from './components/HourlyForecast';

interface WeatherData {
  current: {
    main: {
      temp: number;
      humidity: number;
      pressure: number;
    };
    weather: Array<{
      main: string;
      description: string;
    }>;
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    rain?: {
      '1h'?: number;
    };
  };
  forecast: {
    list: Array<{
      dt: number;
      main: {
        temp: number;
        temp_min: number;
        temp_max: number;
        humidity: number;
      };
      weather: Array<{
        main: string;
        description: string;
      }>;
      wind: {
        speed: number;
        gust?: number;
      };
      rain?: {
        '3h'?: number;
      };
      dt_txt: string;
    }>;
  };
}

function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location>({
    name: 'Middle Tarwin',
    lat: -38.699,
    lon: 146.463,
    country: 'AU',
    state: 'Victoria',
  });

  useEffect(() => {
    fetchWeather();
  }, [location]);

  async function fetchWeather() {
    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const timestamp = Date.now();
      const apiUrl = `${supabaseUrl}/functions/v1/weather?lat=${location.lat}&lon=${location.lon}&t=${timestamp}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function getWeatherIcon(weatherCode: string, size: string = 'w-16 h-16') {
    const code = weatherCode?.toLowerCase() || '';

    if (code.includes('thunder') || code.includes('storm')) {
      return <Zap className={`${size} text-yellow-500`} />;
    }
    if (code.includes('rain') || code.includes('shower')) {
      return <CloudRain className={`${size} text-blue-500`} />;
    }
    if (code.includes('drizzle')) {
      return <CloudDrizzle className={`${size} text-blue-400`} />;
    }
    if (code.includes('cloud') || code.includes('overcast')) {
      return <Cloud className={`${size} text-gray-500`} />;
    }
    return <Sun className={`${size} text-yellow-400`} />;
  }

  function getBackgroundGradient(weatherCode: string) {
    const code = weatherCode?.toLowerCase() || '';

    if (code.includes('thunder') || code.includes('storm')) {
      return 'from-gray-800 via-slate-700 to-gray-900';
    }
    if (code.includes('rain') || code.includes('shower') || code.includes('drizzle')) {
      return 'from-slate-600 via-gray-500 to-slate-600';
    }
    if (code.includes('cloud') || code.includes('overcast')) {
      return 'from-gray-400 via-gray-300 to-gray-500';
    }
    return 'from-amber-300 via-yellow-200 to-sky-400';
  }

  function getTextColor(weatherCode: string) {
    const code = weatherCode?.toLowerCase() || '';

    if (code.includes('thunder') || code.includes('storm')) {
      return 'text-white';
    }
    if (code.includes('rain')) {
      return 'text-white';
    }
    return 'text-gray-800';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading FarmCast...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={fetchWeather}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const current = weather?.current;
  const forecastList = weather?.forecast?.list || [];

  if (!current) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 text-lg">No weather data available</p>
        </div>
      </div>
    );
  }

  const tempC = current.main.temp;
  const humidity = current.main.humidity;
  const weatherCode = current.weather[0]?.main || 'clear';
  const weatherDescription = current.weather[0]?.description || 'clear';
  const bgGradient = getBackgroundGradient(weatherCode);
  const textColor = getTextColor(weatherCode);

  const windSpeedKmh = current.wind.speed * 3.6;
  const windGustKmh = current.wind.gust ? current.wind.gust * 3.6 : null;
  const windDegrees = current.wind.deg;
  const getWindDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };
  const windDirection = getWindDirection(windDegrees);

  const handleLocationSelect = (newLocation: Location) => {
    setLocation(newLocation);
  };

  const rainfall = current.rain?.['1h'] || 0;
  const sprayCondition = getSprayCondition(windSpeedKmh, rainfall);

  const dewpointC = tempC - ((100 - humidity) / 5);

  const next3Hours = forecastList.slice(0, 3).map((item: any) => ({
    time: new Date(item.dt * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }),
    temp: Math.round(item.main.temp),
    windSpeed: Math.round(item.wind.speed * 3.6),
    rain: item.rain?.['3h'] || 0,
    weather: item.weather[0]?.main || 'clear',
  }));

  const dailyForecasts = forecastList.reduce((acc: any[], item: any) => {
    const date = new Date(item.dt * 1000).toLocaleDateString('en-AU');
    const existing = acc.find(f => f.date === date);

    if (!existing) {
      acc.push({
        date,
        dt: item.dt,
        temps: [item.main.temp],
        tempMin: item.main.temp_min,
        tempMax: item.main.temp_max,
        humidity: item.main.humidity,
        weather: item.weather[0]?.main || 'clear',
        windSpeed: item.wind.speed * 3.6,
        rain: item.rain?.['3h'] || 0,
        rainCount: item.rain?.['3h'] ? 1 : 0,
        totalForecasts: 1,
        forecastItems: [item],
      });
    } else {
      existing.temps.push(item.main.temp);
      existing.tempMin = Math.min(existing.tempMin, item.main.temp_min);
      existing.tempMax = Math.max(existing.tempMax, item.main.temp_max);
      existing.rain += item.rain?.['3h'] || 0;
      existing.rainCount += item.rain?.['3h'] ? 1 : 0;
      existing.totalForecasts += 1;
      existing.forecastItems.push(item);
    }

    return acc;
  }, []).slice(0, 5);

  const todayForecast = dailyForecasts[0];
  const todayRainChance = todayForecast ? Math.round((todayForecast.rainCount / todayForecast.totalForecasts) * 100) : 0;
  const todayExpectedRain = todayForecast ? todayForecast.rain : 0;

  const alerts = generateWeatherAlerts(
    tempC,
    humidity,
    current.wind.speed,
    rainfall,
    weatherCode,
    forecastList
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-bold text-green-800 mb-2">FarmCast</h1>
                <p className="text-xl text-green-700">
                  {location.name}
                  {location.state && `, ${location.state}`}
                  {location.country && `, ${location.country}`}
                </p>
              </div>
              <button
                onClick={fetchWeather}
                className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium shadow-md"
              >
                Refresh
              </button>
            </div>

            <LocationSearch
              onLocationSelect={handleLocationSelect}
              currentLocation={location.name}
            />
          </div>
        </header>

        <AlertBanner alerts={alerts} />

        <div className={`relative overflow-hidden bg-gradient-to-br ${bgGradient} rounded-2xl shadow-2xl p-8 mb-6 ${textColor}`}>
          {weatherCode.toLowerCase().includes('rain') && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-rain opacity-40"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-${Math.random() * 20}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                  }}
                >
                  <div className="w-0.5 h-4 bg-blue-200 rounded-full"></div>
                </div>
              ))}
            </div>
          )}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              {getWeatherIcon(weatherCode, 'w-24 h-24')}
              <div>
                <div className="text-7xl font-bold mb-2">
                  {Math.round(tempC)}°C
                </div>
                <div className="text-2xl capitalize opacity-90">
                  {weatherDescription}
                </div>
              </div>
            </div>

            <div className={`px-8 py-6 ${sprayCondition.bgColor} rounded-xl border-2 border-opacity-20 shadow-lg`}>
              <div className="text-center">
                <div className="text-sm font-semibold uppercase tracking-wider opacity-70 mb-1">
                  Spray Conditions
                </div>
                <div className={`text-4xl font-bold ${sprayCondition.color} mb-2`}>
                  {sprayCondition.rating}
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {sprayCondition.reason}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/30">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Wind className="w-6 h-6" />
                <span className="font-semibold">Wind Speed</span>
              </div>
              <div className="text-3xl font-bold">
                {Math.round(windSpeedKmh)} km/h
              </div>
              <div className="text-sm opacity-80 mt-1">
                {windDirection}
                {windGustKmh && ` • Gusts: ${Math.round(windGustKmh)} km/h`}
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CloudRain className="w-6 h-6" />
                <span className="font-semibold">Rain Today</span>
              </div>
              <div className="text-3xl font-bold">
                {todayRainChance}%
              </div>
              <div className="text-sm opacity-80 mt-1">
                Expected: {todayExpectedRain.toFixed(1)} mm
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Droplets className="w-6 h-6" />
                <span className="font-semibold">Humidity</span>
              </div>
              <div className="text-3xl font-bold">{humidity}%</div>
              <div className="text-sm opacity-80 mt-1">
                Dew Point: {Math.round(dewpointC)}°C
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Sun className="w-6 h-6" />
                <span className="font-semibold">Next 3 Hours</span>
              </div>
              <div className="space-y-2">
                {next3Hours.map((hour, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-white/20 pb-1 last:border-0">
                    <span className="font-medium">{hour.time}</span>
                    <div className="flex gap-3 items-center">
                      <span>{hour.temp}°</span>
                      <span className="flex items-center gap-1">
                        <Wind className="w-3 h-3" />
                        {hour.windSpeed}
                      </span>
                      {hour.rain > 0 && (
                        <span className="flex items-center gap-1 text-blue-200">
                          <CloudRain className="w-3 h-3" />
                          {hour.rain.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <HourlyForecast forecastList={forecastList} />

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-green-800 mb-6">5-Day Forecast</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {dailyForecasts.map((day: any, index: number) => {
              const date = new Date(day.dt * 1000);
              const dayName = date.toLocaleDateString('en-AU', { weekday: 'short' });
              const dayDate = date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
              const forecastSpray = getSprayCondition(day.windSpeed, day.rain);
              const bestWindow = findBestSprayWindow(day.forecastItems);

              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-100 hover:shadow-lg transition-shadow"
                >
                  <div className="text-center">
                    <div className="font-bold text-lg text-green-800">{dayName}</div>
                    <div className="text-sm text-green-600 mb-3">{dayDate}</div>

                    <div className="flex justify-center mb-3">
                      {getWeatherIcon(day.weather || 'clear', 'w-12 h-12')}
                    </div>

                    <div className="text-3xl font-bold text-gray-800 mb-1">
                      {Math.round(day.tempMax)}°
                    </div>
                    <div className="text-lg text-gray-600 mb-3">
                      {Math.round(day.tempMin)}°
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Wind:</span>
                        <span className="font-semibold">{Math.round(day.windSpeed)} km/h</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Rain:</span>
                        <span className="font-semibold">{day.rain.toFixed(1)} mm</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Humidity:</span>
                        <span className="font-semibold">{day.humidity}%</span>
                      </div>
                    </div>

                    {bestWindow ? (
                      <div className={`mt-4 py-3 px-3 rounded-lg ${bestWindow.rating === 'Good' ? 'bg-green-100' : 'bg-yellow-100'} border-2 ${bestWindow.rating === 'Good' ? 'border-green-300' : 'border-yellow-300'}`}>
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <div className="text-xs font-semibold text-gray-600">Best Spray Window</div>
                        </div>
                        <div className={`font-bold text-sm mb-1 ${bestWindow.rating === 'Good' ? 'text-green-700' : 'text-yellow-700'}`}>
                          {bestWindow.startTime} - {bestWindow.endTime}
                        </div>
                        <div className="text-xs text-gray-600">
                          {bestWindow.duration.toFixed(0)}h window
                        </div>
                      </div>
                    ) : (
                      <div className={`mt-4 py-2 px-3 rounded-lg bg-red-100 border-2 border-red-300`}>
                        <div className="text-xs font-semibold text-gray-600 mb-1">Spray</div>
                        <div className="font-bold text-red-700 text-sm">
                          Not Recommended
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 bg-green-50 rounded-xl p-6 border-2 border-green-200">
          <h3 className="text-lg font-bold text-green-800 mb-3">Spray Conditions Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <div>
                <span className="font-semibold text-green-800">Good:</span>
                <span className="text-gray-700"> Wind &lt;15 km/h, no rain</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <div>
                <span className="font-semibold text-yellow-800">Moderate:</span>
                <span className="text-gray-700"> Wind 15-25 km/h</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <div>
                <span className="font-semibold text-red-800">Poor:</span>
                <span className="text-gray-700"> Wind &gt;25 km/h or rain</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
