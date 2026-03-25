import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Droplets, Wind, Gauge, Sun, CloudDrizzle, Zap } from 'lucide-react';
import { calculateDeltaT, getSprayCondition } from './utils/deltaT';

interface WeatherData {
  forecast: any;
  observations: any;
}

function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather();
  }, []);

  async function fetchWeather() {
    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const timestamp = Date.now();
      const apiUrl = `${supabaseUrl}/functions/v1/weather?lat=-38.6341&lon=146.0489&t=${timestamp}`;

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
      return 'from-gray-700 via-gray-600 to-gray-800';
    }
    if (code.includes('rain') || code.includes('shower')) {
      return 'from-blue-400 via-blue-300 to-gray-400';
    }
    if (code.includes('cloud') || code.includes('overcast')) {
      return 'from-gray-300 via-gray-200 to-gray-400';
    }
    return 'from-sky-300 via-blue-200 to-yellow-100';
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

  const current = weather?.observations?.response?.[0]?.ob;
  const forecasts = weather?.forecast?.response?.[0]?.periods || [];

  if (!current) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 text-lg">No weather data available</p>
        </div>
      </div>
    );
  }

  const deltaT = calculateDeltaT(current.tempC, current.humidity);
  const sprayCondition = getSprayCondition(deltaT);
  const weatherCode = current.weather || 'clear';
  const bgGradient = getBackgroundGradient(weatherCode);
  const textColor = getTextColor(weatherCode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold text-green-800 mb-2">FarmCast</h1>
              <p className="text-xl text-green-700">Middle Tarwin, Victoria</p>
            </div>
            <button
              onClick={fetchWeather}
              className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium shadow-md"
            >
              Refresh
            </button>
          </div>
        </header>

        <div className={`bg-gradient-to-br ${bgGradient} rounded-2xl shadow-2xl p-8 mb-6 ${textColor}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              {getWeatherIcon(weatherCode, 'w-24 h-24')}
              <div>
                <div className="text-7xl font-bold mb-2">
                  {Math.round(current.tempC)}°C
                </div>
                <div className="text-2xl capitalize opacity-90">
                  {current.weatherPrimary || current.weather}
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
                <div className="text-lg font-medium text-gray-700">
                  Delta T: {deltaT}°F
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/30">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Wind className="w-6 h-6" />
                <span className="font-semibold">Wind Speed</span>
              </div>
              <div className="text-3xl font-bold">
                {Math.round(current.windKPH)} km/h
              </div>
              <div className="text-sm opacity-80 mt-1">
                {current.windDir || 'N/A'}
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CloudRain className="w-6 h-6" />
                <span className="font-semibold">Rainfall</span>
              </div>
              <div className="text-3xl font-bold">
                {current.precipMM || 0} mm
              </div>
              <div className="text-sm opacity-80 mt-1">Last hour</div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Droplets className="w-6 h-6" />
                <span className="font-semibold">Humidity</span>
              </div>
              <div className="text-3xl font-bold">{current.humidity}%</div>
              <div className="text-sm opacity-80 mt-1">
                Dew Point: {Math.round(current.dewpointC)}°C
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Gauge className="w-6 h-6" />
                <span className="font-semibold">Pressure</span>
              </div>
              <div className="text-3xl font-bold">
                {Math.round(current.pressureMB)} hPa
              </div>
              <div className="text-sm opacity-80 mt-1">
                {current.pressureTendency || 'Steady'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-green-800 mb-6">5-Day Forecast</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {forecasts.slice(0, 5).map((day: any, index: number) => {
              const date = new Date(day.timestamp * 1000);
              const dayName = date.toLocaleDateString('en-AU', { weekday: 'short' });
              const dayDate = date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
              const forecastDeltaT = calculateDeltaT(day.avgTempC, day.humidity || 50);
              const forecastSpray = getSprayCondition(forecastDeltaT);

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
                      {Math.round(day.maxTempC)}°
                    </div>
                    <div className="text-lg text-gray-600 mb-3">
                      {Math.round(day.minTempC)}°
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Wind:</span>
                        <span className="font-semibold">{Math.round(day.windSpeedMaxKPH || 0)} km/h</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Rain:</span>
                        <span className="font-semibold">{day.precipMM || 0} mm</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Humidity:</span>
                        <span className="font-semibold">{day.humidity || 'N/A'}%</span>
                      </div>
                    </div>

                    <div className={`mt-4 py-2 px-3 rounded-lg ${forecastSpray.bgColor}`}>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Spray</div>
                      <div className={`font-bold ${forecastSpray.color}`}>
                        {forecastSpray.rating}
                      </div>
                    </div>
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
                <span className="font-semibold text-green-800">Good (2-8):</span>
                <span className="text-gray-700"> Ideal spraying conditions</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <div>
                <span className="font-semibold text-yellow-800">Moderate (8-10):</span>
                <span className="text-gray-700"> Acceptable conditions</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <div>
                <span className="font-semibold text-red-800">Poor (&lt;2 or &gt;10):</span>
                <span className="text-gray-700"> Avoid spraying</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
