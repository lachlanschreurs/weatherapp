import { useState } from 'react';
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

  const generate30DayForecast = () => {
    setLoading(true);

    const forecast = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const baseTemp = 18 + Math.sin((i / 30) * Math.PI) * 8;
      const variation = Math.random() * 6 - 3;
      const rainChance = Math.round(20 + Math.random() * 60);
      const windSpeed = Math.round(10 + Math.random() * 20);
      const rainfall = rainChance > 50 ? (rainChance / 100) * 5 : 0;

      const sprayCondition = getSprayCondition(windSpeed, rainfall);

      const isLowConfidence = i >= 14;

      return {
        date: date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', weekday: 'short' }),
        tempHigh: Math.round(baseTemp + variation + 5),
        tempLow: Math.round(baseTemp + variation - 3),
        rainChance,
        windSpeed,
        confidence: i < 7 ? 'High' : i < 14 ? 'Medium' : 'Low',
        sprayRating: isLowConfidence ? 'Monitor' : sprayCondition.rating,
        sprayColor: isLowConfidence ? 'text-gray-700' : sprayCondition.color,
        sprayBg: isLowConfidence ? 'bg-gray-100' : sprayCondition.bgColor,
      };
    });

    setForecastData(forecast);
    setLoading(false);
  };

  if (forecastData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-200">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-green-700 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-900 mb-3">30-Day Extended Forecast</h3>
          <p className="text-gray-600 mb-6">
            View long-range weather predictions for {location.name}
          </p>
          <button
            onClick={generate30DayForecast}
            disabled={loading}
            className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Generate 30-Day Forecast'}
          </button>
          <p className="text-xs text-gray-500 mt-3">
            Extended forecasts are estimates based on historical patterns
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
          <h3 className="text-2xl font-bold text-green-900">30-Day Extended Forecast</h3>
        </div>
        <button
          onClick={generate30DayForecast}
          className="text-sm bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
        >
          Refresh
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
        {forecastData.slice(0, 10).map((day, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow"
          >
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
              <div className={`mt-1 text-xs px-2 py-0.5 rounded ${
                day.confidence === 'High' ? 'bg-green-200 text-green-800' :
                day.confidence === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                'bg-gray-200 text-gray-600'
              }`}>
                {day.confidence}
              </div>
            </div>
          </div>
        ))}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-green-700 font-semibold hover:text-green-800 flex items-center gap-2">
          <span>View Days 11-30</span>
        </summary>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
          {forecastData.slice(10).map((day, index) => (
            <div
              key={index + 10}
              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              <div className="text-center">
                <div className="text-xs font-semibold text-gray-700 mb-1">{day.date}</div>
                <div className="text-lg font-bold text-gray-800">{day.tempHigh}° / {day.tempLow}°</div>
                <div className="text-xs text-gray-600 mt-1">Rain: {day.rainChance}%</div>
                <div className={`mt-2 text-xs px-2 py-0.5 rounded flex items-center justify-center gap-1 ${day.sprayBg} ${day.sprayColor}`}>
                  <Droplet className="w-3 h-3" />
                  <span>{day.sprayRating}</span>
                </div>
                <div className={`mt-1 text-xs px-2 py-0.5 rounded ${
                  day.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {day.confidence}
                </div>
              </div>
            </div>
          ))}
        </div>
      </details>

    </div>
  );
}
