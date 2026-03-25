import { CloudRain, Droplets } from 'lucide-react';
import { RainProbabilityHour } from '../types/premium';

interface RainProbabilityBreakdownProps {
  hourlyData: RainProbabilityHour[];
  isPremium: boolean;
}

export function RainProbabilityBreakdown({
  hourlyData,
  isPremium,
}: RainProbabilityBreakdownProps) {
  const displayData = isPremium ? hourlyData : hourlyData.slice(0, 8);

  const getIntensityColor = (intensity: number) => {
    if (intensity < 0.1) return 'bg-blue-100';
    if (intensity < 0.3) return 'bg-blue-300';
    if (intensity < 0.5) return 'bg-blue-500';
    return 'bg-blue-700';
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity < 0.1) return 'Light';
    if (intensity < 0.3) return 'Moderate';
    if (intensity < 0.5) return 'Heavy';
    return 'Very Heavy';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CloudRain className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            {isPremium ? '48-Hour Rain Probability' : 'Rain Probability (Limited)'}
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
              Upgrade for 48-Hour Detailed Breakdown
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

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Probability</span>
                <span className="text-sm font-semibold text-blue-600">{hour.probability}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${hour.probability}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <div className="flex flex-col items-end">
                <span className={`text-xs px-2 py-0.5 rounded ${getIntensityColor(hour.intensity)} text-white font-medium`}>
                  {getIntensityLabel(hour.intensity)}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">{hour.intensity.toFixed(2)} in/hr</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
