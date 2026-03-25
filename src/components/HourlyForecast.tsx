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
  const next24Hours = forecastList.slice(0, 8).map((item: any) => {
    const date = new Date(item.dt * 1000);
    return {
      time: date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }),
      fullTime: date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }),
      temp: Math.round(item.main.temp),
      humidity: item.main.humidity,
      windSpeed: Math.round(item.wind.speed * 3.6),
      rain: item.rain?.['3h'] || 0,
      weather: item.weather[0]?.main || 'clear',
    };
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 mb-6">
      <h2 className="text-xl font-bold text-green-800 mb-4">24-Hour Forecast</h2>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="grid grid-cols-8 gap-2">
            {next24Hours.map((hour, idx) => {
              const sprayCondition = getSprayCondition(hour.windSpeed, hour.rain);

              return (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200 min-w-[100px]"
                >
                  <div className="text-center mb-2">
                    <div className="font-semibold text-sm text-green-800">{hour.fullTime}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <Thermometer className="w-3 h-3 text-red-500 flex-shrink-0" />
                      <span className="text-lg font-bold text-gray-800">{hour.temp}°</span>
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

                    <div className={`mt-2 py-1 px-1 rounded ${sprayCondition.bgColor}`}>
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
    </div>
  );
}
