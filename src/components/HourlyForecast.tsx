import { Wind, CloudRain, Thermometer } from 'lucide-react';

interface HourlyData {
  time: string;
  temp: number;
  windSpeed: number;
  rainChance: number;
  hour: number;
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
    const rainChance = (item.pop || 0) * 100;

    hourlyData.push({
      time: date.toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true }),
      temp: Math.round(temp),
      windSpeed: Math.round(windSpeed),
      rainChance: Math.round(rainChance),
      hour: date.getHours(),
    });
  }

  const maxTemp = Math.max(...hourlyData.map(d => d.temp));
  const minTemp = Math.min(...hourlyData.map(d => d.temp));
  const maxWind = Math.max(...hourlyData.map(d => d.windSpeed));
  const maxRain = Math.max(...hourlyData.map(d => d.rainChance), 10);

  const getBarHeight = (value: number, max: number, min: number = 0) => {
    const range = max - min;
    if (range === 0) return 0;
    return ((value - min) / range) * 100;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <h2 className="text-2xl font-bold text-green-800 mb-6">48-Hour Forecast</h2>

      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Thermometer className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-800">Temperature (°C)</h3>
          </div>
          <div className="relative h-40 bg-gradient-to-b from-orange-50 to-red-50 rounded-lg p-4 border-2 border-orange-200">
            <div className="flex items-end justify-between h-full gap-1">
              {hourlyData.map((hour, idx) => {
                const height = getBarHeight(hour.temp, maxTemp, minTemp);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {hour.time}: {hour.temp}°C
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t transition-all hover:from-orange-600 hover:to-orange-500"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between mt-2 px-4">
            {hourlyData.filter((_, idx) => idx % 4 === 0).map((hour, idx) => (
              <span key={idx} className="text-xs text-gray-600 font-medium">{hour.time}</span>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wind className="w-5 h-5 text-cyan-600" />
            <h3 className="text-lg font-semibold text-gray-800">Wind Speed (km/h)</h3>
          </div>
          <div className="relative h-40 bg-gradient-to-b from-cyan-50 to-teal-50 rounded-lg p-4 border-2 border-cyan-200">
            <div className="flex items-end justify-between h-full gap-1">
              {hourlyData.map((hour, idx) => {
                const height = getBarHeight(hour.windSpeed, maxWind);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {hour.time}: {hour.windSpeed} km/h
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t transition-all hover:from-cyan-600 hover:to-cyan-500"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between mt-2 px-4">
            {hourlyData.filter((_, idx) => idx % 4 === 0).map((hour, idx) => (
              <span key={idx} className="text-xs text-gray-600 font-medium">{hour.time}</span>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <CloudRain className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Rain Probability (%)</h3>
          </div>
          <div className="relative h-40 bg-gradient-to-b from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="flex items-end justify-between h-full gap-1">
              {hourlyData.map((hour, idx) => {
                const height = getBarHeight(hour.rainChance, maxRain);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {hour.time}: {hour.rainChance}%
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between mt-2 px-4">
            {hourlyData.filter((_, idx) => idx % 4 === 0).map((hour, idx) => (
              <span key={idx} className="text-xs text-gray-600 font-medium">{hour.time}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
