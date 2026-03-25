import { Leaf, TrendingUp } from 'lucide-react';
import { SoilWorkabilityDay } from '../types/premium';

interface SoilWorkabilityProps {
  predictions: SoilWorkabilityDay[];
  isPremium: boolean;
}

const workabilityConfig = {
  excellent: {
    color: 'bg-green-100 border-green-300 text-green-800',
    icon: '✓',
    label: 'Excellent',
  },
  good: {
    color: 'bg-lime-100 border-lime-300 text-lime-800',
    icon: '✓',
    label: 'Good',
  },
  fair: {
    color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    icon: '~',
    label: 'Fair',
  },
  poor: {
    color: 'bg-orange-100 border-orange-300 text-orange-800',
    icon: '!',
    label: 'Poor',
  },
  unsuitable: {
    color: 'bg-red-100 border-red-300 text-red-800',
    icon: '✗',
    label: 'Unsuitable',
  },
};

export function SoilWorkability({ predictions, isPremium }: SoilWorkabilityProps) {
  const displayData = predictions;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-700" />
          <h2 className="text-xl font-semibold text-gray-800">
            14-Day Soil Workability
          </h2>
        </div>
      </div>

      <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-xs text-amber-800">
          <strong>About Soil Workability:</strong> Predictions based on precipitation, temperature, and soil moisture models. Higher confidence means more reliable forecasts.
        </p>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {displayData.map((day, index) => {
          const config = workabilityConfig[day.workability];
          return (
            <div
              key={day.date}
              className={`p-4 rounded-lg border-2 transition-all ${config.color}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <div className="font-semibold">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                    </div>
                    <div className="text-sm font-medium">{config.label} Conditions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">{day.confidence}%</span>
                  </div>
                  <div className="text-xs">Confidence</div>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Soil Moisture Index</span>
                  <span className="font-medium">{day.moisture_index}/100</span>
                </div>
                <div className="w-full bg-white/50 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      day.moisture_index < 30
                        ? 'bg-yellow-500'
                        : day.moisture_index < 60
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${day.moisture_index}%` }}
                  />
                </div>
              </div>

              {day.notes && (
                <p className="text-xs mt-2 leading-relaxed">{day.notes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
