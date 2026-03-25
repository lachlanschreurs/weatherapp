import { Wind, CloudRain, Thermometer, Navigation } from 'lucide-react';

interface HourlyData {
  time: string;
  displayTime: string;
  temp: number;
  windSpeed: number;
  windDirection: number;
  rainChance: number;
}

interface HourlyForecastProps {
  forecastList: any[];
}

export function HourlyForecast({ forecastList }: HourlyForecastProps) {
  const hourlyData: HourlyData[] = [];

  for (let i = 0; i < 16 && i < forecastList.length; i++) {
    const item = forecastList[i];
    const date = new Date(item.dt * 1000);
    const temp = item.main.temp;
    const windSpeed = item.wind.speed * 3.6;
    const windDirection = item.wind.deg || 0;
    const rainChance = (item.pop || 0) * 100;

    hourlyData.push({
      time: date.toLocaleString('en-AU', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        hour12: true
      }),
      displayTime: date.toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true }),
      temp: Math.round(temp),
      windSpeed: Math.round(windSpeed),
      windDirection,
      rainChance: Math.round(rainChance),
    });
  }

  const maxTemp = Math.max(...hourlyData.map(d => d.temp));
  const minTemp = Math.min(...hourlyData.map(d => d.temp));
  const tempRange = maxTemp - minTemp || 1;
  const maxWind = Math.max(...hourlyData.map(d => d.windSpeed), 1);
  const maxRain = Math.max(...hourlyData.map(d => d.rainChance), 1);

  const normalize = (value: number, max: number, min: number = 0) => {
    const range = max - min;
    if (range === 0) return 0;
    return ((value - min) / range) * 100;
  };

  const getWindDirectionLabel = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-800">48-Hour Forecast</h2>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-gray-700">Temp (°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-cyan-500 rounded"></div>
            <span className="text-gray-700">Wind (km/h)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-700">Rain (%)</span>
          </div>
        </div>
      </div>

      <div className="relative bg-gradient-to-b from-slate-50 to-slate-100 rounded-xl p-6 border-2 border-slate-200">
        <div className="h-80">
          <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
            <defs>
              <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {hourlyData.map((_, idx) => (
              <line
                key={`grid-${idx}`}
                x1={idx * (1000 / (hourlyData.length - 1))}
                y1="0"
                x2={idx * (1000 / (hourlyData.length - 1))}
                y2="400"
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            <path
              d={hourlyData.map((d, i) => {
                const x = i * (1000 / (hourlyData.length - 1));
                const y = 400 - normalize(d.temp, maxTemp, minTemp) * 3.5 - 50;
                return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
              }).join(' ')}
              stroke="#f97316"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d={hourlyData.map((d, i) => {
                const x = i * (1000 / (hourlyData.length - 1));
                const y = 400 - normalize(d.windSpeed, maxWind) * 3.5 - 50;
                return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
              }).join(' ')}
              stroke="#06b6d4"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {hourlyData.map((d, i) => {
              const x = i * (1000 / (hourlyData.length - 1));
              const barHeight = normalize(d.rainChance, maxRain) * 3.5;
              const y = 400 - barHeight - 50;
              return (
                <rect
                  key={`rain-${i}`}
                  x={x - 15}
                  y={y}
                  width="30"
                  height={barHeight}
                  fill="#3b82f6"
                  opacity="0.4"
                  rx="2"
                />
              );
            })}

            {hourlyData.map((d, i) => {
              const x = i * (1000 / (hourlyData.length - 1));
              const yTemp = 400 - normalize(d.temp, maxTemp, minTemp) * 3.5 - 50;
              return (
                <g key={`temp-${i}`}>
                  <circle
                    cx={x}
                    cy={yTemp}
                    r="5"
                    fill="#f97316"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={yTemp - 12}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="#f97316"
                  >
                    {d.temp}°
                  </text>
                </g>
              );
            })}

            {hourlyData.map((d, i) => {
              const x = i * (1000 / (hourlyData.length - 1));
              const yWind = 400 - normalize(d.windSpeed, maxWind) * 3.5 - 50;
              return (
                <g key={`wind-${i}`}>
                  <circle
                    cx={x}
                    cy={yWind}
                    r="5"
                    fill="#06b6d4"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={yWind - 12}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="#06b6d4"
                  >
                    {d.windSpeed}
                  </text>
                </g>
              );
            })}

            {hourlyData.map((d, i) => {
              if (d.rainChance === 0) return null;
              const x = i * (1000 / (hourlyData.length - 1));
              const barHeight = normalize(d.rainChance, maxRain) * 3.5;
              const y = 400 - barHeight - 50;
              return (
                <text
                  key={`rain-label-${i}`}
                  x={x}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#3b82f6"
                >
                  {d.rainChance}%
                </text>
              );
            })}
          </svg>
        </div>

        <div className="flex justify-between mt-4 px-2">
          {hourlyData.map((hour, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1" style={{ width: '60px' }}>
              <span className="text-xs font-semibold text-gray-700">{hour.displayTime}</span>
              <div className="flex flex-col items-center gap-0.5 text-xs">
                <span className="text-orange-600 font-bold">{hour.temp}°</span>
                <div className="flex items-center gap-1">
                  <Navigation
                    className="w-3 h-3 text-gray-600"
                    style={{ transform: `rotate(${hour.windDirection}deg)` }}
                  />
                  <span className="text-cyan-600 font-semibold">{hour.windSpeed}</span>
                </div>
                {hour.rainChance > 0 && (
                  <span className="text-blue-600 font-medium">{hour.rainChance}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-orange-600" />
          <span>Temp Range: {minTemp}° - {maxTemp}°C</span>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-cyan-600" />
          <span>Max Wind: {maxWind} km/h</span>
        </div>
        <div className="flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-blue-600" />
          <span>Max Rain: {maxRain}%</span>
        </div>
      </div>
    </div>
  );
}
