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
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <h2 className="text-2xl font-bold text-green-800 mb-6">24-Hour Forecast</h2>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="grid grid-cols-8 gap-4">
            {next24Hours.map((hour, idx) => {
              const sprayCondition = getSprayCondition(hour.windSpeed, hour.rain);

              return (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-100 min-w-[140px]"
                >
                  <div className="text-center mb-3">
                    <div className="font-bold text-green-800">{hour.fullTime}</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Thermometer className="w-4 h-4 text-red-500" />
                      <span className="text-2xl font-bold text-gray-800">{hour.temp}°C</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-gray-700">{hour.humidity}%</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <Wind className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-700">{hour.windSpeed} km/h</span>
                    </div>

                    {hour.rain > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <CloudRain className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-blue-700">{hour.rain.toFixed(1)} mm</span>
                      </div>
                    )}

                    <div className={`mt-3 py-2 px-2 rounded-lg ${sprayCondition.bgColor}`}>
                      <div className="text-xs font-semibold text-gray-600 text-center mb-1">Spray</div>
                      <div className={`font-bold text-center text-sm ${sprayCondition.color}`}>
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
