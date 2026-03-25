import { Wind, Navigation } from 'lucide-react';
import { WindTimingHour } from '../types/premium';

interface WindTimingProps {
  hourlyData: WindTimingHour[];
  isPremium: boolean;
}

export function WindTiming({ hourlyData, isPremium }: WindTimingProps) {
  const displayData = isPremium ? hourlyData : hourlyData.slice(0, 8);

  const getWindSpeedColor = (speed: number) => {
    if (speed < 5) return 'text-green-600';
    if (speed < 10) return 'text-yellow-600';
    if (speed < 15) return 'text-orange-600';
    return 'text-red-600';
  };

  const getWindSpeedLabel = (speed: number) => {
    if (speed < 5) return 'Calm';
    if (speed < 10) return 'Light';
    if (speed < 15) return 'Moderate';
    if (speed < 25) return 'Strong';
    return 'Very Strong';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-cyan-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            {isPremium ? '48-Hour Wind Timing' : 'Wind Timing (Limited)'}
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
              Upgrade for 48-Hour Wind Details
            </p>
            <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all">
              Go Premium
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {displayData.map((hour, index) => (
          <div
            key={hour.time}
            className={`flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-all ${
              index >= 8 && !isPremium ? 'opacity-40 blur-sm' : ''
            }`}
          >
            <div className="w-20 text-sm font-medium text-gray-700">
              {new Date(hour.time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </div>

            <div className="flex items-center gap-2">
              <Navigation
                className="w-5 h-5 text-cyan-600"
                style={{ transform: `rotate(${hour.direction}deg)` }}
              />
              <span className="text-sm text-gray-600 w-8">{hour.directionText}</span>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Speed</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${getWindSpeedColor(hour.speed)}`}>
                    {Math.round(hour.speed)} mph
                  </span>
                  <span className="text-xs text-gray-500">
                    (gusts {Math.round(hour.gust)} mph)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      hour.speed < 5
                        ? 'bg-green-500'
                        : hour.speed < 10
                        ? 'bg-yellow-500'
                        : hour.speed < 15
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((hour.speed / 30) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 w-20 text-right">
                  {getWindSpeedLabel(hour.speed)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>Spraying Conditions:</strong> Ideal wind speeds are 3-10 mph. Avoid spraying above 15 mph.
        </p>
      </div>
    </div>
  );
}
