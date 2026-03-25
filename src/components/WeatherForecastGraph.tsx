import { CloudRain, Wind, Thermometer } from 'lucide-react';
import { RainProbabilityHour } from '../types/premium';

interface WeatherForecastGraphProps {
  rainData: RainProbabilityHour[];
  isPremium: boolean;
}

export function WeatherForecastGraph({ rainData, isPremium }: WeatherForecastGraphProps) {
  const displayData = isPremium ? rainData : rainData.slice(0, 8);

  const maxRain = Math.max(...displayData.map(d => d.probability), 100);
  const maxWind = Math.max(...displayData.map(d => d.windSpeed || 0), 30);
  const maxTemp = Math.max(...displayData.map(d => d.temperature || 0));
  const minTemp = Math.min(...displayData.map(d => d.temperature || 0));
  const tempRange = maxTemp - minTemp || 10;

  const normalizeValue = (value: number, max: number) => (value / max) * 100;

  const normalizeTemp = (temp: number) => {
    return ((temp - minTemp) / tempRange) * 100;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CloudRain className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            {isPremium ? '48-Hour Weather Forecast' : 'Weather Forecast (Limited)'}
          </h2>
        </div>
        {isPremium && (
          <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
            PREMIUM
          </span>
        )}
      </div>

      {!isPremium && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white/95 flex items-end justify-center pb-8 rounded-lg pointer-events-none z-10">
          <div className="text-center pointer-events-auto">
            <p className="text-sm font-semibold text-gray-800 mb-2">
              Upgrade for 48-Hour Detailed Forecast
            </p>
            <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all">
              Go Premium
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-blue-500 rounded"></div>
          <CloudRain className="w-4 h-4 text-blue-600" />
          <span className="text-gray-700">Rain Probability (%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-cyan-500 rounded"></div>
          <Wind className="w-4 h-4 text-cyan-600" />
          <span className="text-gray-700">Wind Speed (km/h)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-orange-500 rounded"></div>
          <Thermometer className="w-4 h-4 text-orange-600" />
          <span className="text-gray-700">Temperature (°C)</span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="relative h-64 bg-gray-50 rounded-lg p-4">
            <div className="absolute inset-4 flex items-end justify-between">
              {displayData.map((hour, index) => {
                const isBlurred = index >= 8 && !isPremium;
                const rainHeight = normalizeValue(hour.probability, maxRain);
                const windHeight = normalizeValue(hour.windSpeed || 0, maxWind);
                const tempHeight = normalizeTemp(hour.temperature || 0);

                return (
                  <div
                    key={hour.time}
                    className={`relative flex-1 flex items-end justify-center gap-1 ${
                      isBlurred ? 'opacity-40 blur-sm' : ''
                    }`}
                    style={{ maxWidth: '40px' }}
                  >
                    <div className="relative flex items-end gap-0.5 w-full justify-center">
                      <div
                        className="w-2 bg-blue-500 rounded-t transition-all hover:bg-blue-600 relative group"
                        style={{ height: `${rainHeight}%` }}
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          Rain: {hour.probability}%
                        </div>
                      </div>

                      <div
                        className="w-2 bg-cyan-500 rounded-t transition-all hover:bg-cyan-600 relative group"
                        style={{ height: `${windHeight}%` }}
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          Wind: {Math.round(hour.windSpeed || 0)} km/h
                        </div>
                      </div>

                      <div
                        className="w-2 bg-orange-500 rounded-t transition-all hover:bg-orange-600 relative group"
                        style={{ height: `${tempHeight}%` }}
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          Temp: {Math.round(hour.temperature || 0)}°C
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-300"></div>
          </div>

          <div className="flex justify-between mt-2 px-4">
            {displayData.map((hour, index) => {
              const isBlurred = index >= 8 && !isPremium;
              const time = new Date(hour.time);
              const showLabel = index % 4 === 0;

              return (
                <div
                  key={hour.time}
                  className={`flex-1 text-center ${
                    isBlurred ? 'opacity-40 blur-sm' : ''
                  }`}
                  style={{ maxWidth: '40px' }}
                >
                  {showLabel && (
                    <div className="text-xs text-gray-600 font-medium">
                      {time.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        hour12: true,
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <CloudRain className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Rain Conditions</span>
          </div>
          <p className="text-xs text-gray-600">
            Higher bars indicate greater chance of rain. Avoid spraying when probability exceeds 30%.
          </p>
        </div>

        <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-5 h-5 text-cyan-600" />
            <span className="text-sm font-semibold text-gray-700">Wind Conditions</span>
          </div>
          <p className="text-xs text-gray-600">
            Ideal spraying: 5-15 km/h. Avoid when wind exceeds 25 km/h.
          </p>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-semibold text-gray-700">Temperature</span>
          </div>
          <p className="text-xs text-gray-600">
            Temperature trends help plan optimal timing for field operations.
          </p>
        </div>
      </div>
    </div>
  );
}
