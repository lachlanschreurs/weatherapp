import { Calendar, CloudRain, Wind, Thermometer } from 'lucide-react';
import { ExtendedForecastDay } from '../types/premium';

interface ExtendedForecastProps {
  forecast: ExtendedForecastDay[];
  isPremium: boolean;
}

export function ExtendedForecast({ forecast, isPremium }: ExtendedForecastProps) {
  const displayData = isPremium ? forecast : forecast.slice(0, 7);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            {isPremium ? '30-Day Extended Forecast' : '7-Day Forecast'}
          </h2>
        </div>
        {isPremium && (
          <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
            PREMIUM
          </span>
        )}
      </div>

      {!isPremium && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white/95 flex items-end justify-center pb-8 rounded-lg pointer-events-none">
          <div className="text-center pointer-events-auto">
            <p className="text-sm font-semibold text-gray-800 mb-2">
              Upgrade for 30-Day Forecast
            </p>
            <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all">
              Go Premium
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {displayData.map((day, index) => (
          <div
            key={day.date}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              index >= 7 && !isPremium ? 'opacity-40 blur-sm' : 'hover:bg-gray-50'
            } transition-all`}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="text-sm font-medium text-gray-700 w-24">
                {new Date(day.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="text-2xl">{day.icon}</div>
              <div className="text-sm text-gray-600 flex-1">{day.conditions}</div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <Thermometer className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700">
                  {Math.round(day.temp_high)}°
                </span>
                <span className="text-sm text-gray-500">/ {Math.round(day.temp_low)}°</span>
              </div>

              <div className="flex items-center gap-1">
                <CloudRain className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">{day.precipitation_chance}%</span>
              </div>

              <div className="flex items-center gap-1">
                <Wind className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{Math.round(day.wind_speed)} km/h</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
