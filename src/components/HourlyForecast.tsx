import { Wind, CloudRain, Droplets, Thermometer } from 'lucide-react';
import { getSprayCondition } from '../utils/deltaT';

interface HourlyData {
  time: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  rain: number;
  weather: string;
}

interface HourlyForecastProps {
  forecastList: any[];
}

export function HourlyForecast({ forecastList }: HourlyForecastProps) {
  const hourlyData: HourlyData[] = [];

  for (let i = 0; i < 8 && i < forecastList.length; i++) {
    const item = forecastList[i];
    const baseDate = new Date(item.dt * 1000);
    const temp = item.main.temp;
    const humidity = item.main.humidity;
    const windSpeed = item.wind.speed * 3.6;
    const rainPer3h = item.rain?.['3h'] || 0;
    const weather = item.weather[0]?.main || 'clear';

    for (let hour = 0; hour < 3; hour++) {
      const hourDate = new Date(baseDate.getTime() + (hour * 60 * 60 * 1000));
      hourlyData.push({
        time: hourDate.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }),
        temp: Math.round(temp),
        humidity: humidity,
        windSpeed: Math.round(windSpeed),
        rain: rainPer3h / 3,
        weather: weather,
      });
    }
  }

  const next24Hours = hourlyData.slice(0, 24);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 mb-6">
      <h2 className="text-xl font-bold text-green-800 mb-3">24-Hour Forecast</h2>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2">
          {next24Hours.map((hour, idx) => {
            const sprayCondition = getSprayCondition(hour.windSpeed, hour.rain);

            return (
              <div
                key={idx}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 border border-green-200 flex-shrink-0 w-[90px]"
              >
                <div className="text-center mb-1">
                  <div className="font-semibold text-xs text-green-800">{hour.time}</div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <Thermometer className="w-3 h-3 text-red-500 flex-shrink-0" />
                    <span className="text-base font-bold text-gray-800">{hour.temp}°</span>
                  </div>

                  <div className="flex items-center justify-between gap-1 text-xs">
                    <Droplets className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span className="font-medium text-gray-700">{hour.humidity}%</span>
                  </div>

                  <div className="flex items-center justify-between gap-1 text-xs">
                    <Wind className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-gray-700">{hour.windSpeed}</span>
                  </div>

                  {hour.rain > 0 && (
                    <div className="flex items-center justify-between gap-1 text-xs">
                      <CloudRain className="w-3 h-3 text-blue-500 flex-shrink-0" />
                      <span className="font-medium text-blue-700">{hour.rain.toFixed(1)}</span>
                    </div>
                  )}

                  <div className={`mt-1 py-0.5 px-1 rounded ${sprayCondition.bgColor}`}>
                    <div className={`font-bold text-center text-xs ${sprayCondition.color}`}>
                      {sprayCondition.rating}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
