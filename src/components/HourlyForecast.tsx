import { Wind, CloudRain, Thermometer, Navigation, Cloud, CloudDrizzle, Sun } from 'lucide-react';

interface HourlyData {
  time: string;
  displayTime: string;
  temp: number;
  windSpeed: number;
  windDirection: number;
  rainChance: number;
  weatherIcon: string;
  hour: number;
  day: string;
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
    const weatherIcon = item.weather?.[0]?.icon || '01d';

    hourlyData.push({
      time: date.toLocaleString('en-AU', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        hour12: true
      }),
      displayTime: date.toLocaleTimeString('en-AU', { hour: 'numeric', hour12: false }).replace(':00', ''),
      temp: Math.round(temp),
      windSpeed: Math.round(windSpeed),
      windDirection,
      rainChance: Math.round(rainChance),
      weatherIcon,
      hour: date.getHours(),
      day: date.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase(),
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

  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.includes('09') || iconCode.includes('10')) {
      return <CloudRain className="w-5 h-5 text-slate-300" />;
    } else if (iconCode.includes('13')) {
      return <CloudDrizzle className="w-5 h-5 text-slate-300" />;
    } else if (iconCode.includes('01')) {
      return <Sun className="w-5 h-5 text-slate-300" />;
    } else {
      return <Cloud className="w-5 h-5 text-slate-300" />;
    }
  };

  const gridYValues = [maxTemp, Math.round((maxTemp + minTemp) / 2), minTemp];
  const windGridValues = [maxWind, Math.round(maxWind / 2), 0];

  return (
    <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">48-Hour Forecast</h2>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-orange-500 rounded"></div>
            <Thermometer className="w-4 h-4 text-orange-400" />
            <span className="text-slate-300">Temperature</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-500 rounded"></div>
            <Wind className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300">Wind Speed</span>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-white" />
            <span className="text-slate-300">Wind Direction</span>
          </div>
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">Rain %</span>
          </div>
        </div>
      </div>

      <div className="relative bg-slate-900 rounded-xl p-6 border border-slate-700">
        <div className="flex justify-between mb-4 px-2">
          {hourlyData.map((hour, idx) => {
            const isFirstOfDay = idx === 0 || hour.day !== hourlyData[idx - 1].day;
            return (
              <div key={idx} className="flex flex-col items-center gap-1" style={{ width: `${100 / hourlyData.length}%` }}>
                {isFirstOfDay && (
                  <span className="text-xs font-bold text-slate-300 mb-1">{hour.day}</span>
                )}
                <div className="w-8 h-8 flex items-center justify-center">
                  {getWeatherIcon(hour.weatherIcon)}
                </div>
                <span className="text-sm text-slate-300 font-medium">{hour.displayTime}</span>
                <div className="flex items-center gap-1 mt-1">
                  <CloudRain className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs text-cyan-300 font-medium">{hour.rainChance}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-white" style={{ transform: `rotate(${hour.windDirection}deg)` }} />
                  <span className="text-xs text-slate-300 font-medium">{getWindDirectionLabel(hour.windDirection)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative h-96">
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-sm text-orange-400 font-semibold pr-3 w-12">
            <span className="text-right">{maxTemp}°C</span>
            <span className="text-right">{Math.round((maxTemp + minTemp) / 2)}°</span>
            <span className="text-right">{minTemp}°</span>
          </div>

          <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-sm text-cyan-400 font-semibold pl-3 w-16 text-right">
            <span>{maxWind}</span>
            <span>{Math.round(maxWind / 2)}</span>
            <span>0 km/h</span>
          </div>

          <div className="mx-14">
            <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
              <defs>
                <linearGradient id="windGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {hourlyData.map((_, idx) => (
                <line
                  key={`grid-${idx}`}
                  x1={idx * (1000 / (hourlyData.length - 1))}
                  y1="0"
                  x2={idx * (1000 / (hourlyData.length - 1))}
                  y2="400"
                  stroke="#475569"
                  strokeWidth="1"
                  opacity="0.3"
                />
              ))}

              {[0, 1, 2, 3, 4].map((idx) => (
                <line
                  key={`hgrid-${idx}`}
                  x1="0"
                  y1={idx * 100}
                  x2="1000"
                  y2={idx * 100}
                  stroke="#475569"
                  strokeWidth="1"
                  opacity="0.3"
                />
              ))}

              <path
                d={
                  hourlyData.map((d, i) => {
                    const x = i * (1000 / (hourlyData.length - 1));
                    const y = 400 - normalize(d.windSpeed, maxWind) * 3.6;
                    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                  }).join(' ') + ' L 1000,400 L 0,400 Z'
                }
                fill="url(#windGradient)"
              />

              <path
                d={hourlyData.map((d, i) => {
                  const x = i * (1000 / (hourlyData.length - 1));
                  const y = 400 - normalize(d.windSpeed, maxWind) * 3.6;
                  return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                }).join(' ')}
                stroke="#3b82f6"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d={hourlyData.map((d, i) => {
                  const x = i * (1000 / (hourlyData.length - 1));
                  const y = 400 - normalize(d.temp, maxTemp, minTemp) * 3.6;
                  return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                }).join(' ')}
                stroke="#f59e0b"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {hourlyData.map((d, i) => {
                const x = i * (1000 / (hourlyData.length - 1));
                const yWind = 400 - normalize(d.windSpeed, maxWind) * 3.6;
                const rotation = d.windDirection + 180;
                return (
                  <g key={`wind-${i}`} transform={`translate(${x}, ${yWind})`}>
                    <path
                      d="M 0,-6 L 4,6 L 0,3 L -4,6 Z"
                      fill="white"
                      stroke="white"
                      strokeWidth="1"
                      transform={`rotate(${rotation})`}
                    />
                  </g>
                );
              })}

              {hourlyData.map((d, i) => {
                const x = i * (1000 / (hourlyData.length - 1));
                const yTemp = 400 - normalize(d.temp, maxTemp, minTemp) * 3.6;
                return (
                  <circle
                    key={`temp-${i}`}
                    cx={x}
                    cy={yTemp}
                    r="5"
                    fill="#f59e0b"
                    stroke="#1e293b"
                    strokeWidth="2.5"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
