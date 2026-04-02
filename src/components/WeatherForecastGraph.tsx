import { CloudRain, Wind, Thermometer, Navigation, Calendar } from 'lucide-react';
import { RainProbabilityHour } from '../types/premium';

interface DailyForecastData {
  date: string;
  dayName: string;
  tempHigh: number;
  tempLow: number;
  rainChance: number;
  windSpeed: number;
  windDirection: string;
}

interface WeatherForecastGraphProps {
  rainData: RainProbabilityHour[];
  isPremium: boolean;
  dailyForecast?: DailyForecastData[];
}

export function WeatherForecastGraph({ rainData, isPremium, dailyForecast = [] }: WeatherForecastGraphProps) {
  const displayData = rainData;
  const now = new Date();

  const actualMaxWind = Math.max(...displayData.map(d => d.windSpeed || 0));
  const maxWind = Math.max(actualMaxWind, 10);
  const maxTemp = Math.max(...displayData.map(d => d.temperature || 0));
  const minTemp = Math.min(...displayData.map(d => d.temperature || 0));
  const tempRange = maxTemp - minTemp || 10;

  const nowIndex = displayData.findIndex(d => new Date(d.time) >= now);
  const barWidth = 1200 / displayData.length;
  const nowPosition = nowIndex >= 0 ? nowIndex * barWidth : -1;

  const getWindDirectionRotation = (direction?: string) => {
    // Wind direction indicates where wind is coming FROM
    // Arrow points DOWN (180 degrees) by default, so we rotate based on direction
    const directions: { [key: string]: number } = {
      'N': 180, 'NNE': 202.5, 'NE': 225, 'ENE': 247.5,
      'E': 270, 'ESE': 292.5, 'SE': 315, 'SSE': 337.5,
      'S': 0, 'SSW': 22.5, 'SW': 45, 'WSW': 67.5,
      'W': 90, 'WNW': 112.5, 'NW': 135, 'NNW': 157.5
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
  const maxDisplayTemp = Math.max(...displayData.map(d => d.temperature || 0));
  const minDisplayTemp = Math.min(...displayData.map(d => d.temperature || 0));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CloudRain className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            24-Hour Weather & Wind Forecast
          </h2>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-600" />
            Temperature by Hour (°C)
          </h3>
          <div className="relative overflow-x-auto">
            <div className="min-w-[1200px]">
              <div className="relative h-48 bg-gradient-to-b from-orange-50 to-gray-50 rounded-lg p-4">
                <div className="absolute inset-4 flex items-end justify-start gap-1">
                  {displayData.map((hour, index) => {
                    const temp = hour.temperature || 0;
                    const tempHeight = ((temp - minDisplayTemp) / (maxDisplayTemp - minDisplayTemp)) * 100;

                    return (
                      <div
                        key={hour.time}
                        className="relative group flex-1"
                        style={{ maxWidth: `${barWidth}px` }}
                      >
                        <div
                          className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t hover:from-orange-600 hover:to-orange-500 transition-all cursor-pointer"
                          style={{ height: `${Math.max(tempHeight, 5)}%` }}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                            {Math.round(temp)}°C
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {nowPosition >= 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-30"
                    style={{ left: `${16 + nowPosition}px` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap font-semibold">
                      NOW
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-300"></div>
                <div className="absolute left-2 top-4 text-xs text-gray-600 font-medium">{Math.round(maxDisplayTemp)}°C</div>
                <div className="absolute left-2 bottom-4 text-xs text-gray-600 font-medium">{Math.round(minDisplayTemp)}°C</div>
              </div>

              <div className="flex justify-between mt-3 px-4">
                {displayData.map((hour, index) => {
                  const time = new Date(hour.time);
                  const showLabel = index % 3 === 0;

                  return (
                    <div
                      key={hour.time}
                      className="flex-1 text-center"
                      style={{ maxWidth: `${barWidth}px` }}
                    >
                      {showLabel && (
                        <div className="flex flex-col items-center">
                          <div className="text-xs text-gray-600 font-medium">
                            {time.getHours() % 12 || 12}{time.getHours() >= 12 ? 'pm' : 'am'}
                          </div>
                          <div className="text-xs text-gray-800 font-semibold">
                            {time.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Wind className="w-5 h-5 text-cyan-600" />
            Wind Speed by Hour (km/h)
          </h3>
          <div className="relative overflow-x-auto">
            <div className="min-w-[1200px]">
              <div className="relative h-48 bg-gradient-to-b from-cyan-50 to-gray-50 rounded-lg p-4">
                <div className="absolute inset-4 flex items-end justify-start gap-1">
                  {displayData.map((hour, index) => {
                    const wind = hour.windSpeed || 0;
                    const windHeight = (wind / maxWind) * 100;

                    return (
                      <div
                        key={hour.time}
                        className="relative group flex-1"
                        style={{ maxWidth: `${barWidth}px` }}
                      >
                        <div
                          className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t hover:from-cyan-600 hover:to-cyan-500 transition-all cursor-pointer"
                          style={{ height: `${Math.max(windHeight, 5)}%` }}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                            {Math.round(wind)} km/h {hour.windDirection || ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {nowPosition >= 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-30"
                    style={{ left: `${16 + nowPosition}px` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap font-semibold">
                      NOW
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-300"></div>
                <div className="absolute left-2 top-4 text-xs text-gray-600 font-medium">{Math.round(maxWind)} km/h</div>
                <div className="absolute left-2 bottom-4 text-xs text-gray-600 font-medium">0 km/h</div>
              </div>

              <div className="flex justify-between mt-3 px-4">
                {displayData.map((hour, index) => {
                  const time = new Date(hour.time);
                  const showLabel = index % 3 === 0;

                  return (
                    <div
                      key={hour.time}
                      className="flex-1 text-center"
                      style={{ maxWidth: `${barWidth}px` }}
                    >
                      {showLabel && (
                        <div className="flex flex-col items-center">
                          <div className="text-xs text-gray-600 font-medium">
                            {time.getHours() % 12 || 12}{time.getHours() >= 12 ? 'pm' : 'am'}
                          </div>
                          <div className="text-xs text-gray-800 font-semibold">
                            {time.toLocaleDateString('en-US', { weekday: 'short' })}
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
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-blue-600" />
            Rain Probability by Hour (%)
          </h3>
          <div className="relative overflow-x-auto">
            <div className="min-w-[1200px]">
              <div className="relative h-48 bg-gradient-to-b from-blue-50 to-gray-50 rounded-lg p-4">
                <div className="absolute inset-4 flex items-end justify-start gap-1">
                  {displayData.map((hour, index) => {
                    const rain = hour.probability;
                    const rainHeight = rain;

                    return (
                      <div
                        key={hour.time}
                        className="relative group flex-1"
                        style={{ maxWidth: `${barWidth}px` }}
                      >
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer"
                          style={{ height: `${Math.max(rainHeight, 3)}%` }}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                            {rain}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {nowPosition >= 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-30"
                    style={{ left: `${16 + nowPosition}px` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap font-semibold">
                      NOW
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-300"></div>
                <div className="absolute left-2 top-4 text-xs text-gray-600 font-medium">100%</div>
                <div className="absolute left-2 bottom-4 text-xs text-gray-600 font-medium">0%</div>
              </div>

              <div className="flex justify-between mt-3 px-4">
                {displayData.map((hour, index) => {
                  const time = new Date(hour.time);
                  const showLabel = index % 3 === 0;

                  return (
                    <div
                      key={hour.time}
                      className="flex-1 text-center"
                      style={{ maxWidth: `${barWidth}px` }}
                    >
                      {showLabel && (
                        <div className="flex flex-col items-center">
                          <div className="text-xs text-gray-600 font-medium">
                            {time.getHours() % 12 || 12}{time.getHours() >= 12 ? 'pm' : 'am'}
                          </div>
                          <div className="text-xs text-gray-800 font-semibold">
                            {time.toLocaleDateString('en-US', { weekday: 'short' })}
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
        </div>
      </div>

      {dailyForecast.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            5-Day Outlook
          </h3>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-600" />
                Daily High/Low Temperature (°C)
              </h4>
              <div className="relative overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="relative h-32 bg-gradient-to-b from-orange-50 to-gray-50 rounded-lg p-4">
                    <div className="absolute inset-4 flex items-end justify-between gap-2">
                      {dailyForecast.slice(0, 5).map((day) => {
                        const maxDailyTemp = Math.max(...dailyForecast.slice(0, 5).map(d => d.tempHigh));
                        const minDailyTemp = Math.min(...dailyForecast.slice(0, 5).map(d => d.tempLow));
                        const dailyTempRange = maxDailyTemp - minDailyTemp || 10;

                        const highTempHeight = ((day.tempHigh - minDailyTemp) / dailyTempRange) * 100;
                        const lowTempHeight = ((day.tempLow - minDailyTemp) / dailyTempRange) * 100;

                        return (
                          <div key={day.date} className="flex-1 flex items-end justify-center relative group">
                            <div className="relative w-full max-w-[60px]">
                              <div
                                className="absolute bottom-0 w-full bg-orange-500 rounded-t transition-all hover:bg-orange-600"
                                style={{ height: `${highTempHeight}%` }}
                              >
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                  High: {Math.round(day.tempHigh)}°C
                                </div>
                              </div>
                              <div
                                className="absolute bottom-0 w-full bg-orange-300 rounded-t"
                                style={{ height: `${lowTempHeight}%` }}
                              >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                  Low: {Math.round(day.tempLow)}°C
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
                    {dailyForecast.slice(0, 5).map((day) => (
                      <div key={day.date} className="flex-1 text-center max-w-[60px]">
                        <div className="text-xs font-semibold text-gray-800">{day.dayName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{day.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-600" />
                Daily Wind Speed (km/h)
              </h4>
              <div className="relative overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="relative h-32 bg-gradient-to-b from-cyan-50 to-gray-50 rounded-lg p-4">
                    <div className="absolute inset-4 flex items-end justify-between gap-2">
                      {dailyForecast.slice(0, 5).map((day) => {
                        const actualMaxDailyWind = Math.max(...dailyForecast.slice(0, 5).map(d => d.windSpeed));
                        const maxDailyWind = Math.max(actualMaxDailyWind, 10);
                        const windHeight = (day.windSpeed / maxDailyWind) * 100;

                        return (
                          <div key={day.date} className="flex-1 flex items-end justify-center relative group">
                            <div
                              className="w-full max-w-[60px] bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t transition-all hover:from-cyan-600 hover:to-cyan-500"
                              style={{ height: `${Math.max(windHeight, 10)}%` }}
                            >
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                {Math.round(day.windSpeed)} km/h {day.windDirection}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-300"></div>
                  </div>

                  <div className="flex justify-between mt-2 px-4">
                    {dailyForecast.slice(0, 5).map((day) => (
                      <div key={day.date} className="flex-1 text-center max-w-[60px]">
                        {day.windDirection && (
                          <div className="flex justify-center">
                            <Navigation
                              className="w-4 h-4 text-cyan-600"
                              style={{ transform: `rotate(${getWindDirectionRotation(day.windDirection)}deg)` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-blue-600" />
                Rain Chance (%)
              </h4>
              <div className="relative overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="relative h-32 bg-gradient-to-b from-blue-50 to-gray-50 rounded-lg p-4">
                    <div className="absolute inset-4 flex items-end justify-between gap-2">
                      {dailyForecast.slice(0, 5).map((day) => {
                        const rainHeight = day.rainChance;

                        return (
                          <div key={day.date} className="flex-1 flex items-end justify-center relative group">
                            <div
                              className="w-full max-w-[60px] bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
                              style={{ height: `${Math.max(rainHeight, 5)}%` }}
                            >
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                {day.rainChance}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
