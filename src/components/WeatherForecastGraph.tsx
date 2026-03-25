import { CloudRain, Wind, Thermometer, Navigation } from 'lucide-react';
import { RainProbabilityHour } from '../types/premium';

interface WeatherForecastGraphProps {
  rainData: RainProbabilityHour[];
  isPremium: boolean;
}

export function WeatherForecastGraph({ rainData, isPremium }: WeatherForecastGraphProps) {
  const displayData = isPremium ? rainData : rainData.slice(0, 12);

  const maxWind = Math.max(...displayData.map(d => d.windSpeed || 0), 30);
  const maxTemp = Math.max(...displayData.map(d => d.temperature || 0));
  const minTemp = Math.min(...displayData.map(d => d.temperature || 0));
  const tempRange = maxTemp - minTemp || 10;

  const getWindDirectionRotation = (direction?: string) => {
    const directions: { [key: string]: number } = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };
    return directions[direction || 'N'] || 0;
  };

  const scaleValue = (value: number, min: number, max: number, height: number): number => {
    if (max === min) return height / 2;
    return ((value - min) / (max - min)) * height;
  };

  const graphHeight = 320;
  const graphPadding = { top: 20, bottom: 40, left: 50, right: 20 };
  const innerHeight = graphHeight - graphPadding.top - graphPadding.bottom;
  const pointWidth = isPremium ? 800 / 48 : 800 / 12;

  const createPath = (data: number[], min: number, max: number) => {
    const points = data.map((value, index) => {
      const x = index * pointWidth + pointWidth / 2;
      const y = graphPadding.top + innerHeight - scaleValue(value, min, max, innerHeight);
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const rainPath = createPath(displayData.map(d => d.probability), 0, 100);
  const windPath = createPath(displayData.map(d => d.windSpeed || 0), 0, maxWind);
  const tempPath = createPath(displayData.map(d => d.temperature || 0), minTemp, maxTemp);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CloudRain className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            {isPremium ? '48-Hour Weather Forecast' : '12-Hour Weather Forecast'}
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

      <div className="mb-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-blue-500 rounded"></div>
          <CloudRain className="w-4 h-4 text-blue-600" />
          <span className="text-gray-700">Rain %</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-cyan-500 rounded"></div>
          <Wind className="w-4 h-4 text-cyan-600" />
          <span className="text-gray-700">Wind (km/h)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-orange-500 rounded"></div>
          <Thermometer className="w-4 h-4 text-orange-600" />
          <span className="text-gray-700">Temp (°C)</span>
        </div>
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-600" />
          <span className="text-gray-700">Wind Direction</span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="min-w-[800px]">
          <svg width="100%" height={graphHeight} className="bg-gray-50 rounded-lg">
            <g>
              {[0, 25, 50, 75, 100].map((tick) => {
                const y = graphPadding.top + innerHeight - scaleValue(tick, 0, 100, innerHeight);
                return (
                  <g key={`rain-tick-${tick}`}>
                    <line
                      x1={graphPadding.left}
                      y1={y}
                      x2={800 - graphPadding.right}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                    <text
                      x={graphPadding.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#6b7280"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}
            </g>

            <g transform={`translate(${graphPadding.left}, 0)`}>
              <path
                d={rainPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d={windPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d={tempPath}
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {displayData.map((hour, index) => {
                const x = index * pointWidth + pointWidth / 2;
                const rainY = graphPadding.top + innerHeight - scaleValue(hour.probability, 0, 100, innerHeight);
                const windY = graphPadding.top + innerHeight - scaleValue(hour.windSpeed || 0, 0, maxWind, innerHeight);
                const tempY = graphPadding.top + innerHeight - scaleValue(hour.temperature || 0, minTemp, maxTemp, innerHeight);

                return (
                  <g key={hour.time}>
                    <circle cx={x} cy={rainY} r="4" fill="#3b82f6" className="hover:r-6 transition-all cursor-pointer">
                      <title>Rain: {hour.probability}%</title>
                    </circle>
                    <circle cx={x} cy={windY} r="4" fill="#06b6d4" className="hover:r-6 transition-all cursor-pointer">
                      <title>Wind: {Math.round(hour.windSpeed || 0)} km/h {hour.windDirection || ''}</title>
                    </circle>
                    <circle cx={x} cy={tempY} r="4" fill="#f97316" className="hover:r-6 transition-all cursor-pointer">
                      <title>Temp: {Math.round(hour.temperature || 0)}°C</title>
                    </circle>
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="flex justify-between mt-3 px-12">
            {displayData.map((hour, index) => {
              const time = new Date(hour.time);
              const showLabel = index % (isPremium ? 6 : 2) === 0;

              return (
                <div
                  key={hour.time}
                  className="flex-1 text-center"
                  style={{ maxWidth: `${pointWidth}px` }}
                >
                  {showLabel && (
                    <div className="flex flex-col items-center">
                      <div className="text-xs text-gray-700 font-medium">
                        {time.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          hour12: true,
                        })}
                      </div>
                      {hour.windDirection && (
                        <Navigation
                          className="w-4 h-4 text-cyan-600 mt-1"
                          style={{ transform: `rotate(${getWindDirectionRotation(hour.windDirection)}deg)` }}
                        />
                      )}
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
            <span className="text-sm font-semibold text-gray-700">Rain Probability</span>
          </div>
          <p className="text-xs text-gray-600">
            Shows hourly chance of rain. Avoid spraying when probability exceeds 30%.
          </p>
        </div>

        <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-5 h-5 text-cyan-600" />
            <span className="text-sm font-semibold text-gray-700">Wind Speed & Direction</span>
          </div>
          <p className="text-xs text-gray-600">
            Ideal spraying: 5-15 km/h. Arrows show wind direction. Avoid when wind exceeds 25 km/h.
          </p>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-semibold text-gray-700">Temperature</span>
          </div>
          <p className="text-xs text-gray-600">
            Hour-by-hour temperature trends to plan optimal timing for operations.
          </p>
        </div>
      </div>
    </div>
  );
}
