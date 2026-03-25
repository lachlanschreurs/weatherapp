import { Calendar, CloudRain, Wind, Thermometer } from 'lucide-react';
import { ExtendedForecastDay } from '../types/premium';

interface ExtendedForecastProps {
  forecast: ExtendedForecastDay[];
  isPremium: boolean;
}

export function ExtendedForecast({ forecast, isPremium }: ExtendedForecastProps) {
  const displayData = forecast;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            30-Day Extended Forecast
          </h2>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {displayData.map((day, index) => (
          <div
            key={day.date}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-all"
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
