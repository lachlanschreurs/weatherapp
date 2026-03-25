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
      </div>

      <div className="relative bg-slate-900 rounded-xl p-4 border border-slate-700">
        <div className="flex justify-between mb-2 px-1">
          {hourlyData.map((hour, idx) => {
            const isFirstOfDay = idx === 0 || hour.day !== hourlyData[idx - 1].day;
            return (
              <div key={idx} className="flex flex-col items-center" style={{ width: '60px' }}>
                {isFirstOfDay && (
                  <span className="text-xs font-bold text-slate-400 mb-1">{hour.day}</span>
                )}
                {getWeatherIcon(hour.weatherIcon)}
                <span className="text-xs text-slate-400 mt-1">{hour.displayTime}</span>
              </div>
            );
          })}
        </div>

        <div className="relative h-80">
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-orange-400 font-semibold pr-2">
            <span>{maxTemp}°C</span>
            <span>{Math.round((maxTemp + minTemp) / 2)}°</span>
            <span>{minTemp}°</span>
          </div>

          <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-xs text-cyan-400 font-semibold pl-2">
            <span>{maxWind}</span>
            <span>{Math.round(maxWind / 2)}</span>
            <span>0 km/h</span>
          </div>

          <div className="mx-8">
            <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
              <defs>
                <linearGradient id="windGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {hourlyData.map((_, idx) => (
                <line
                  key={`grid-${idx}`}
                  x1={idx * (1000 / (hourlyData.length - 1))}
                  y1="0"
                  x2={idx * (1000 / (hourlyData.length - 1))}
                  y2="400"
                  stroke="#334155"
                  strokeWidth="1"
                />
              ))}

              {[0, 1, 2].map((idx) => (
                <line
                  key={`hgrid-${idx}`}
                  x1="0"
                  y1={idx * 200}
                  x2="1000"
                  y2={idx * 200}
                  stroke="#334155"
                  strokeWidth="1"
                />
              ))}

              <path
                d={
                  hourlyData.map((d, i) => {
                    const x = i * (1000 / (hourlyData.length - 1));
                    const y = 400 - normalize(d.windSpeed, maxWind) * 3.8;
                    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                  }).join(' ') + ' L 1000,400 L 0,400 Z'
                }
                fill="url(#windGradient)"
              />

              <path
                d={hourlyData.map((d, i) => {
                  const x = i * (1000 / (hourlyData.length - 1));
                  const y = 400 - normalize(d.windSpeed, maxWind) * 3.8;
                  return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                }).join(' ')}
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d={hourlyData.map((d, i) => {
                  const x = i * (1000 / (hourlyData.length - 1));
                  const y = 400 - normalize(d.temp, maxTemp, minTemp) * 3.8;
                  return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                }).join(' ')}
                stroke="#eab308"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {hourlyData.map((d, i) => {
                const x = i * (1000 / (hourlyData.length - 1));
                const yWind = 400 - normalize(d.windSpeed, maxWind) * 3.8;
                return (
                  <g key={`wind-${i}`}>
                    <Navigation
                      className="w-4 h-4"
                      x={x - 8}
                      y={yWind - 8}
                      width="16"
                      height="16"
                      fill="white"
                      stroke="none"
                      style={{ transform: `rotate(${d.windDirection}deg)`, transformOrigin: `${x}px ${yWind}px` }}
                    />
                  </g>
                );
              })}

              {hourlyData.map((d, i) => {
                const x = i * (1000 / (hourlyData.length - 1));
                const yTemp = 400 - normalize(d.temp, maxTemp, minTemp) * 3.8;
                return (
                  <circle
                    key={`temp-${i}`}
                    cx={x}
                    cy={yTemp}
                    r="4"
                    fill="#eab308"
                    stroke="#1e293b"
                    strokeWidth="2"
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
