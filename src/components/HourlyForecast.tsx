import { Wind, CloudRain, Thermometer, Navigation, Cloud, CloudDrizzle, Sun } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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
  timestamp: number;
}

interface HourlyForecastProps {
  forecastList: any[];
  currentWeather?: {
    temp: number;
    wind_speed: number;
    wind_deg: number;
    weather: Array<{ icon?: string }>;
  };
}

export function HourlyForecast({ forecastList, currentWeather }: HourlyForecastProps) {
  const hourlyData: HourlyData[] = [];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [nowPosition, setNowPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  const [isDraggingNow, setIsDraggingNow] = useState(false);

  const now = Date.now();

  if (currentWeather) {
    const date = new Date(now);
    const windSpeed = currentWeather.wind_speed * 3.6;
    const windDirection = currentWeather.wind_deg || 0;
    const weatherIcon = currentWeather.weather?.[0]?.icon || '01d';

    hourlyData.push({
      time: date.toLocaleString('en-AU', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        hour12: true
      }),
      displayTime: `${date.getHours() % 12 || 12}${date.getHours() >= 12 ? 'pm' : 'am'}`,
      temp: Math.round(currentWeather.temp),
      windSpeed: Math.round(windSpeed),
      windDirection,
      rainChance: 0,
      weatherIcon,
      hour: date.getHours(),
      day: date.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase(),
      timestamp: now,
    });
  }

  for (let i = 0; i < 47 && i < forecastList.length; i++) {
    const item = forecastList[i];
    const itemTimestamp = item.dt * 1000;

    if (currentWeather && itemTimestamp <= now) {
      continue;
    }

    const date = new Date(itemTimestamp);
    const temp = item.temp;
    const windSpeed = item.wind_speed * 3.6;
    const windDirection = item.wind_deg || 0;
    const rainChance = (item.pop || 0) * 100;
    const weatherIcon = item.weather?.[0]?.icon || '01d';

    hourlyData.push({
      time: date.toLocaleString('en-AU', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        hour12: true
      }),
      displayTime: `${date.getHours() % 12 || 12}${date.getHours() >= 12 ? 'pm' : 'am'}`,
      temp: Math.round(temp),
      windSpeed: Math.round(windSpeed),
      windDirection,
      rainChance: Math.round(rainChance),
      weatherIcon,
      hour: date.getHours(),
      day: date.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase(),
      timestamp: itemTimestamp,
    });
  }

  useEffect(() => {
    if (hourlyData.length < 2) return;

    const firstTime = hourlyData[0].timestamp;
    const lastTime = hourlyData[hourlyData.length - 1].timestamp;
    const totalDuration = lastTime - firstTime;
    const nowOffset = now - firstTime;
    const percentage = Math.max(0, Math.min(100, (nowOffset / totalDuration) * 100));

    setNowPosition(percentage);
  }, [hourlyData.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.pageX,
      scrollLeft: scrollContainerRef.current.scrollLeft
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingNow) {
      handleNowBarMouseMove(e);
      return;
    }
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (x - dragStart.x) * 2;
    scrollContainerRef.current.scrollLeft = dragStart.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingNow(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsDraggingNow(false);
  };

  const handleNowBarMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingNow(true);
  };

  const handleNowBarMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingNow || !svgRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const svgRect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const percentage = Math.max(0, Math.min(100, (x / svgRect.width) * 100));
    setNowPosition(percentage);
  };

  const handleNowBarMouseUp = () => {
    setIsDraggingNow(false);
  };

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

  const getCurrentWeatherAtNow = () => {
    if (hourlyData.length < 2) return null;

    const firstTime = hourlyData[0].timestamp;
    const lastTime = hourlyData[hourlyData.length - 1].timestamp;
    const totalDuration = lastTime - firstTime;
    const currentTime = firstTime + (nowPosition / 100) * totalDuration;

    for (let i = 0; i < hourlyData.length - 1; i++) {
      if (currentTime >= hourlyData[i].timestamp && currentTime <= hourlyData[i + 1].timestamp) {
        const ratio = (currentTime - hourlyData[i].timestamp) /
                     (hourlyData[i + 1].timestamp - hourlyData[i].timestamp);

        return {
          temp: Math.round(hourlyData[i].temp + (hourlyData[i + 1].temp - hourlyData[i].temp) * ratio),
          windSpeed: Math.round(hourlyData[i].windSpeed + (hourlyData[i + 1].windSpeed - hourlyData[i].windSpeed) * ratio),
          rainChance: Math.round(hourlyData[i].rainChance + (hourlyData[i + 1].rainChance - hourlyData[i].rainChance) * ratio),
          timestamp: currentTime,
        };
      }
    }
    return { ...hourlyData[0], timestamp: firstTime };
  };

  const getCurrentTimeLabel = () => {
    if (hourlyData.length < 2) return 'NOW';

    const firstTime = hourlyData[0].timestamp;
    const lastTime = hourlyData[hourlyData.length - 1].timestamp;
    const totalDuration = lastTime - firstTime;
    const currentTime = firstTime + (nowPosition / 100) * totalDuration;

    const date = new Date(currentTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${displayHours}:${displayMinutes}${period}`;
  };

  const interpolatedWeather = getCurrentWeatherAtNow();
  const currentTimeLabel = getCurrentTimeLabel();

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
            <CloudRain className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">Rain %</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-white rounded"></div>
            <Wind className="w-4 h-4 text-white" />
            <span className="text-slate-300">Wind Speed</span>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-white" />
            <span className="text-slate-300">Wind Direction</span>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="relative bg-slate-900 rounded-xl p-6 border border-slate-700 overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#475569 #1e293b'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ minWidth: '2000px' }}>
          <div className="flex mb-4 px-2" style={{ width: '100%' }}>
            {hourlyData.map((hour, idx) => {
              const isFirstOfDay = idx === 0 || hour.day !== hourlyData[idx - 1].day;
              return (
                <div key={idx} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: '125px' }}>
                  {isFirstOfDay && (
                    <span className="text-xs font-bold text-slate-300 mb-1">{hour.day}</span>
                  )}
                  <span className="text-xs text-slate-400 font-medium">{hour.displayTime}</span>
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getWeatherIcon(hour.weatherIcon)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <CloudRain className="w-3 h-3 text-cyan-400" />
                    <span className="text-xs text-cyan-300 font-medium">{hour.rainChance}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-orange-400" />
                    <span className="text-xs text-orange-300 font-medium">{hour.temp}°C</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wind className="w-3 h-3 text-white" />
                    <span className="text-xs text-slate-300 font-medium">{hour.windSpeed}km/h</span>
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
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-sm text-orange-400 font-semibold pr-3 w-12 z-10 bg-slate-900">
              <span className="text-right">{maxTemp}°C</span>
              <span className="text-right">{Math.round((maxTemp + minTemp) / 2)}°</span>
              <span className="text-right">{minTemp}°</span>
            </div>

            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-sm text-white font-semibold pl-3 w-16 text-right z-10 bg-slate-900">
              <span>{maxWind}</span>
              <span>{Math.round(maxWind / 2)}</span>
              <span>0 km/h</span>
            </div>

            <div className="mx-14" style={{ width: 'calc(100% - 7rem)' }}>
              <svg ref={svgRef} className="w-full h-full" viewBox="0 0 2000 400" preserveAspectRatio="none">
              <defs>
                <linearGradient id="rainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {hourlyData.map((_, idx) => (
                <line
                  key={`grid-${idx}`}
                  x1={idx * (2000 / (hourlyData.length - 1))}
                  y1="0"
                  x2={idx * (2000 / (hourlyData.length - 1))}
                  y2="400"
                  stroke="#475569"
                  strokeWidth="1"
                  opacity="0.3"
                />
              ))}

              <g
                onMouseDown={handleNowBarMouseDown}
                style={{ cursor: isDraggingNow ? 'grabbing' : 'pointer' }}
              >
                <rect
                  x={nowPosition * 20 - 30}
                  y="0"
                  width="60"
                  height="400"
                  fill="transparent"
                  pointerEvents="all"
                  style={{ cursor: isDraggingNow ? 'grabbing' : 'pointer' }}
                />
                <line
                  x1={nowPosition * 20}
                  y1="0"
                  x2={nowPosition * 20}
                  y2="400"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="8,6"
                  opacity="0.9"
                  pointerEvents="none"
                />
                <rect
                  x={nowPosition * 20 - 32}
                  y="5"
                  width="64"
                  height="20"
                  fill="#22c55e"
                  rx="4"
                  pointerEvents="none"
                />
                <text
                  x={nowPosition * 20}
                  y="20"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {currentTimeLabel}
                </text>
                {interpolatedWeather && (
                  <>
                    <rect
                      x={nowPosition * 20 - 60}
                      y="370"
                      width="120"
                      height="25"
                      fill="#1e293b"
                      stroke="#22c55e"
                      strokeWidth="2"
                      rx="6"
                      pointerEvents="none"
                    />
                    <text
                      x={nowPosition * 20}
                      y="388"
                      fill="#22c55e"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {interpolatedWeather.temp}°C | {interpolatedWeather.windSpeed}km/h | {interpolatedWeather.rainChance}%
                    </text>
                  </>
                )}
              </g>

              {[0, 1, 2, 3, 4].map((idx) => (
                <line
                  key={`hgrid-${idx}`}
                  x1="0"
                  y1={idx * 100}
                  x2="2000"
                  y2={idx * 100}
                  stroke="#475569"
                  strokeWidth="1"
                  opacity="0.3"
                />
              ))}

              <path
                d={
                  hourlyData.map((d, i) => {
                    const x = i * (2000 / (hourlyData.length - 1));
                    const y = 400 - normalize(d.rainChance, maxRain) * 3.6;
                    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                  }).join(' ') + ' L 2000,400 L 0,400 Z'
                }
                fill="url(#rainGradient)"
              />

              <path
                d={hourlyData.map((d, i) => {
                  const x = i * (2000 / (hourlyData.length - 1));
                  const y = 400 - normalize(d.rainChance, maxRain) * 3.6;
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
                  const x = i * (2000 / (hourlyData.length - 1));
                  const y = 400 - normalize(d.temp, maxTemp, minTemp) * 3.6;
                  return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                }).join(' ')}
                stroke="#f59e0b"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d={hourlyData.map((d, i) => {
                  const x = i * (2000 / (hourlyData.length - 1));
                  const y = 400 - normalize(d.windSpeed, maxWind) * 3.6;
                  return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                }).join(' ')}
                stroke="white"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {hourlyData.map((d, i) => {
                const x = i * (2000 / (hourlyData.length - 1));
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
                const x = i * (2000 / (hourlyData.length - 1));
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
    </div>
  );
}
