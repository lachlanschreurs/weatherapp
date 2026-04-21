import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, CloudRain, Wind, Droplet } from 'lucide-react';
import { getSprayCondition } from '../utils/deltaT';
import { getRegionalUnits, convertTemp, convertWind, fmtWind, windThresholdInUnit } from '../utils/units';

interface ExtendedForecastProps {
  location: {
    lat: number;
    lon: number;
    name: string;
    country?: string;
  };
}

export function ExtendedForecast({ location }: ExtendedForecastProps) {
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const units = getRegionalUnits(location.country || '');

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

        const confidence = day.isReal === false
          ? i < 10 ? 'Medium' : i < 20 ? 'Low' : 'Very Low'
          : 'High';

        return {
          date: date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', weekday: 'short' }),
          tempHigh: Math.round(day.temp.max),
          tempLow: Math.round(day.temp.min),
          rainChance,
          windSpeed: windSpeedKmh,
          confidence,
          sprayRating: sprayCondition.rating,
          sprayColor: sprayCondition.color,
          sprayBg: sprayCondition.bgColor,
          isReal: day.isReal !== false,
        };
      });

      setForecastData(realForecast);
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
      <div className="bg-slate-900/70 rounded-2xl shadow-xl p-8 border border-slate-700/60">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-200 mb-3">30-Day Extended Forecast</h3>
          <p className="text-slate-400 mb-6">
            View weather predictions for {location.name} (5 days real data + 25 days AI-estimated)
          </p>
          {error && (
            <p className="text-red-400 mb-4">{error}</p>
          )}
          <button
            onClick={generate30DayForecast}
            disabled={loading}
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load 30-Day Forecast'}
          </button>
          <p className="text-xs text-slate-500 mt-3">
            Days 1-5: Real data from OpenWeather API • Days 6-30: AI-estimated based on trends
          </p>
        </div>
      </div>
    );
  }

  const getTrend = (current: number, next: number) => {
    if (next > current + 2) return <TrendingUp className="w-4 h-4 text-red-400" />;
    if (next < current - 2) return <TrendingDown className="w-4 h-4 text-blue-400" />;
    return <Minus className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="bg-slate-900/70 rounded-2xl shadow-xl p-6 border border-slate-700/60">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-green-400" />
          <h3 className="text-2xl font-bold text-slate-200">30-Day Extended Forecast</h3>
        </div>
        <button
          onClick={generate30DayForecast}
          disabled={loading}
          className="text-sm bg-slate-800/60 text-green-400 border border-slate-700/50 px-4 py-2 rounded-lg hover:bg-slate-700/60 transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="mb-6 p-4 bg-slate-800/60 rounded-lg border border-slate-700/50">
        <div className="flex items-start gap-3">
          <Droplet className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-slate-200 mb-3">Spray Conditions Key</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-600 flex-shrink-0"></div>
                <span className="text-slate-300"><strong>Good:</strong> Wind &lt;{windThresholdInUnit(15, units.wind)} {units.wind}, no rain</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-600 flex-shrink-0"></div>
                <span className="text-slate-300"><strong>Moderate:</strong> Wind {windThresholdInUnit(15, units.wind)}-{windThresholdInUnit(25, units.wind)} {units.wind}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-600 flex-shrink-0"></div>
                <span className="text-slate-300"><strong>Poor:</strong> Wind &gt;{windThresholdInUnit(25, units.wind)} {units.wind} or rain</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-500 flex-shrink-0"></div>
                <span className="text-slate-300"><strong>Monitor:</strong> Check closer to date</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 mb-4">
        {forecastData.map((day, index) => {
          return (
            <div
              key={index}
              className={`rounded-xl p-3 border hover:shadow-md transition-shadow ${
                day.isReal
                  ? 'bg-slate-800/70 border-green-700/40'
                  : 'bg-slate-800/50 border-slate-700/40'
              }`}
            >
              <div className="text-center">
                <div className="text-xs font-bold text-slate-200 mb-1">{day.date}</div>
                {!day.isReal && (
                  <div className="text-xs text-slate-500 mb-1">Est.</div>
                )}
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-xl font-bold text-slate-200">{Math.round(convertTemp(day.tempHigh, units.temp))}°</span>
                  {index < forecastData.length - 1 && getTrend(day.tempHigh, forecastData[index + 1].tempHigh)}
                </div>
                <div className="text-xs text-slate-400 mb-2">{Math.round(convertTemp(day.tempLow, units.temp))}°</div>
                <div className="flex items-center justify-center gap-1 text-xs mb-1">
                  <CloudRain className="w-3 h-3 text-blue-400" />
                  <span className="text-slate-300">{day.rainChance}%</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-xs mb-2">
                  <Wind className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-300">{fmtWind(day.windSpeed, units.wind)}</span>
                </div>
                <div className={`text-xs font-semibold px-2 py-1 rounded flex items-center justify-center gap-1 ${day.sprayBg} ${day.sprayColor}`}>
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
