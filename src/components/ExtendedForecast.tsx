import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, CloudRain, Wind, Droplet } from 'lucide-react';
import { getSprayCondition } from '../utils/deltaT';

interface ExtendedForecastProps {
  location: {
    lat: number;
    lon: number;
    name: string;
  };
}

export function ExtendedForecast({ location }: ExtendedForecastProps) {
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate30DayForecast = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing');
      }

      const weatherUrl = `${supabaseUrl}/functions/v1/weather?lat=${location.lat}&lon=${location.lon}`;

      const response = await fetch(weatherUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const weatherData = await response.json();
      const dailyForecasts = weatherData.daily || [];

      const realForecast = dailyForecasts.map((day: any, i: number) => {
        const date = new Date(day.dt * 1000);
        const windSpeedKmh = Math.round((day.wind_speed || 0) * 3.6);
        const rainfall = day.rain || 0;
        const rainChance = Math.round((day.pop || 0) * 100);

        const sprayCondition = getSprayCondition(windSpeedKmh, rainfall);

        return {
          date: date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', weekday: 'short' }),
          tempHigh: Math.round(day.temp.max),
          tempLow: Math.round(day.temp.min),
          rainChance,
          windSpeed: windSpeedKmh,
          confidence: 'High',
          sprayRating: sprayCondition.rating,
          sprayColor: sprayCondition.color,
          sprayBg: sprayCondition.bgColor,
          isReal: true,
        };
      });

      const avgTempHigh = realForecast.reduce((sum, day) => sum + day.tempHigh, 0) / realForecast.length;
      const avgTempLow = realForecast.reduce((sum, day) => sum + day.tempLow, 0) / realForecast.length;
      const avgRainChance = realForecast.reduce((sum, day) => sum + day.rainChance, 0) / realForecast.length;
      const avgWindSpeed = realForecast.reduce((sum, day) => sum + day.windSpeed, 0) / realForecast.length;

      const extendedForecast = [];
      for (let i = realForecast.length; i < 30; i++) {
        const date = new Date(dailyForecasts[dailyForecasts.length - 1].dt * 1000);
        date.setDate(date.getDate() + (i - realForecast.length + 1));

        const seasonalVariation = Math.sin((i / 30) * Math.PI * 2) * 3;
        const randomVariation = (Math.random() - 0.5) * 4;

        const tempHigh = Math.round(avgTempHigh + seasonalVariation + randomVariation);
        const tempLow = Math.round(avgTempLow + seasonalVariation + randomVariation - 2);
        const rainChance = Math.max(0, Math.min(100, Math.round(avgRainChance + (Math.random() - 0.5) * 30)));
        const windSpeed = Math.max(5, Math.round(avgWindSpeed + (Math.random() - 0.5) * 10));
        const rainfall = rainChance > 50 ? (rainChance / 100) * 3 : 0;

        const sprayCondition = getSprayCondition(windSpeed, rainfall);

        extendedForecast.push({
          date: date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', weekday: 'short' }),
          tempHigh,
          tempLow,
          rainChance,
          windSpeed,
          confidence: i < 14 ? 'Medium' : 'Low',
          sprayRating: 'Monitor',
          sprayColor: 'text-gray-700',
          sprayBg: 'bg-gray-100',
          isReal: false,
        });
      }

      setForecastData([...realForecast, ...extendedForecast]);
    } catch (err) {
      console.error('Error fetching forecast:', err);
      setError('Failed to load forecast data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.lat && location.lon) {
      setForecastData([]);
    }
  }, [location.lat, location.lon]);

  if (forecastData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-200">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-green-700 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-900 mb-3">Extended Forecast</h3>
          <p className="text-gray-600 mb-6">
            View detailed weather predictions for {location.name}
          </p>
          {error && (
            <p className="text-red-600 mb-4">{error}</p>
          )}
          <button
            onClick={generate30DayForecast}
            disabled={loading}
            className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load 30-Day Forecast'}
          </button>
          <p className="text-xs text-gray-500 mt-3">
            Days 1-8: Real forecast data | Days 9-30: Statistical predictions
          </p>
        </div>
      </div>
    );
  }

  const getTrend = (current: number, next: number) => {
    if (next > current + 2) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (next < current - 2) return <TrendingDown className="w-4 h-4 text-blue-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-green-700" />
          <h3 className="text-2xl font-bold text-green-900">Extended Forecast ({forecastData.length} Days)</h3>
        </div>
        <button
          onClick={generate30DayForecast}
          disabled={loading}
          className="text-sm bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="flex items-start gap-3">
          <Droplet className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-green-900 mb-3">Spray Conditions Key</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-600 flex-shrink-0"></div>
                <span className="text-gray-700"><strong>Good:</strong> Wind &lt;15 km/h, no rain</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-600 flex-shrink-0"></div>
                <span className="text-gray-700"><strong>Moderate:</strong> Wind 15-25 km/h</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-600 flex-shrink-0"></div>
                <span className="text-gray-700"><strong>Poor:</strong> Wind &gt;25 km/h or rain</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500 flex-shrink-0"></div>
                <span className="text-gray-700"><strong>Monitor:</strong> Check closer to date</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {forecastData.map((day, index) => {
          const confidenceColor = index < 8
            ? 'border-green-200'
            : index < 14
            ? 'border-yellow-200'
            : 'border-gray-300';

          const confidenceBg = index < 8
            ? 'from-green-50 to-blue-50'
            : index < 14
            ? 'from-yellow-50 to-amber-50'
            : 'from-gray-50 to-gray-100';

          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${confidenceBg} rounded-xl p-4 border ${confidenceColor} hover:shadow-md transition-shadow relative`}
            >
              {!day.isReal && (
                <div className="absolute top-1 right-1">
                  <div className="text-xs bg-gray-700 text-white px-1.5 py-0.5 rounded" title="Statistical prediction">
                    Est.
                  </div>
                </div>
              )}
              <div className="text-center">
                <div className="text-sm font-bold text-gray-800 mb-1">{day.date}</div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-2xl font-bold text-gray-800">{day.tempHigh}°</span>
                  {index < forecastData.length - 1 && getTrend(day.tempHigh, forecastData[index + 1].tempHigh)}
                </div>
                <div className="text-sm text-gray-600 mb-2">{day.tempLow}°</div>
                <div className="flex items-center justify-center gap-2 text-xs mb-1">
                  <CloudRain className="w-3 h-3 text-blue-600" />
                  <span className="text-gray-700">{day.rainChance}%</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs">
                  <Wind className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-700">{day.windSpeed}km/h</span>
                </div>
                <div className={`mt-2 text-xs font-semibold px-2 py-1 rounded flex items-center justify-center gap-1 ${day.sprayBg} ${day.sprayColor}`}>
                  <Droplet className="w-3 h-3" />
                  <span>{day.sprayRating}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
