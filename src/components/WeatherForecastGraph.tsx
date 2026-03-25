import { CloudRain, Wind, Thermometer, Navigation } from 'lucide-react';
import { RainProbabilityHour } from '../types/premium';

interface WeatherForecastGraphProps {
  rainData: RainProbabilityHour[];
  isPremium: boolean;
}

export function WeatherForecastGraph({ rainData, isPremium }: WeatherForecastGraphProps) {
  const displayData = rainData;

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

  const graphHeight = 400;
  const graphPadding = { top: 30, bottom: 60, left: 60, right: 30 };
  const innerHeight = graphHeight - graphPadding.top - graphPadding.bottom;
  const totalWidth = 1200;
  const innerWidth = totalWidth - graphPadding.left - graphPadding.right;
  const pointWidth = innerWidth / (displayData.length - 1);

  const createPath = (data: number[], min: number, max: number) => {
    const points = data.map((value, index) => {
      const x = index * pointWidth;
      const y = graphPadding.top + innerHeight - scaleValue(value, min, max, innerHeight);
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const rainPath = createPath(displayData.map(d => d.probability), 0, 100);
  const windPath = createPath(displayData.map(d => d.windSpeed || 0), 0, maxWind);
  const tempPath = createPath(displayData.map(d => d.temperature || 0), minTemp, maxTemp);

  const yAxisLabels = [
    { value: 100, label: '100%' },
    { value: 75, label: '75%' },
    { value: 50, label: '50%' },
    { value: 25, label: '25%' },
    { value: 0, label: '0%' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CloudRain className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            48-Hour Weather Forecast
          </h2>
        </div>
      </div>

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
        <div className="min-w-[1200px]">
          <svg width={totalWidth} height={graphHeight} className="bg-gradient-to-b from-blue-50 to-gray-50 rounded-lg">
            <g>
              {yAxisLabels.map((tick) => {
                const y = graphPadding.top + innerHeight - scaleValue(tick.value, 0, 100, innerHeight);
                return (
                  <g key={`grid-${tick.value}`}>
                    <line
                      x1={graphPadding.left}
                      y1={y}
                      x2={totalWidth - graphPadding.right}
                      y2={y}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                    <text
                      x={graphPadding.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fill="#475569"
                      fontWeight="500"
                    >
                      {tick.label}
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
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d={windPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d={tempPath}
                fill="none"
                stroke="#f97316"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {displayData.map((hour, index) => {
                const x = index * pointWidth;
                const rainY = graphPadding.top + innerHeight - scaleValue(hour.probability, 0, 100, innerHeight);
                const windY = graphPadding.top + innerHeight - scaleValue(hour.windSpeed || 0, 0, maxWind, innerHeight);
                const tempY = graphPadding.top + innerHeight - scaleValue(hour.temperature || 0, minTemp, maxTemp, innerHeight);

                return (
                  <g key={hour.time}>
                    <circle cx={x} cy={rainY} r="5" fill="#3b82f6" stroke="white" strokeWidth="2" className="cursor-pointer hover:r-7 transition-all">
                      <title>Rain: {hour.probability}%</title>
                    </circle>
                    <circle cx={x} cy={windY} r="5" fill="#06b6d4" stroke="white" strokeWidth="2" className="cursor-pointer hover:r-7 transition-all">
                      <title>Wind: {Math.round(hour.windSpeed || 0)} km/h {hour.windDirection || ''}</title>
                    </circle>
                    <circle cx={x} cy={tempY} r="5" fill="#f97316" stroke="white" strokeWidth="2" className="cursor-pointer hover:r-7 transition-all">
                      <title>Temp: {Math.round(hour.temperature || 0)}°C</title>
                    </circle>
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="flex justify-between mt-4" style={{ paddingLeft: `${graphPadding.left}px`, paddingRight: `${graphPadding.right}px` }}>
            {displayData.map((hour, index) => {
              const time = new Date(hour.time);
              const showLabel = index % 4 === 0;

              return (
                <div
                  key={hour.time}
                  className="flex-1 text-center relative"
                  style={{ maxWidth: `${pointWidth}px` }}
                >
                  {showLabel && (
                    <div className="flex flex-col items-center">
                      <div className="text-sm text-gray-800 font-semibold">
                        {time.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          hour12: true,
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {time.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      {hour.windDirection && (
                        <Navigation
                          className="w-5 h-5 text-cyan-600 mt-1"
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
