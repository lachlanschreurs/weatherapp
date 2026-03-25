import {
  ExtendedForecastDay,
  RainProbabilityHour,
  WindTimingHour,
  SoilWorkabilityDay,
  OperationAlert,
} from '../types/premium';

export function generateExtendedForecast(weatherData: any): ExtendedForecastDay[] {
  const forecast: ExtendedForecastDay[] = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    const baseTemp = 18 + Math.sin((i / 30) * Math.PI * 2) * 8;
    const tempVariation = Math.random() * 4 - 2;

    forecast.push({
      date: date.toISOString(),
      temp_high: baseTemp + 6 + tempVariation,
      temp_low: baseTemp - 4 + tempVariation,
      precipitation_chance: Math.round(30 + Math.random() * 50),
      precipitation_amount: Math.random() * 15,
      wind_speed: 10 + Math.random() * 15,
      wind_direction: Math.floor(Math.random() * 360),
      conditions: ['Partly Cloudy', 'Sunny', 'Cloudy', 'Light Rain', 'Clear'][Math.floor(Math.random() * 5)],
      icon: ['⛅', '☀️', '☁️', '🌧️', '🌤️'][Math.floor(Math.random() * 5)],
    });
  }

  return forecast;
}

export function generateRainProbabilityData(weatherData: any): RainProbabilityHour[] {
  const data: RainProbabilityHour[] = [];
  const now = new Date();

  for (let i = 0; i < 48; i++) {
    const time = new Date(now);
    time.setHours(time.getHours() + i);

    const probability = Math.round(20 + Math.sin((i / 24) * Math.PI * 2) * 30 + Math.random() * 20);
    const intensity = (probability / 100) * (0.3 + Math.random() * 0.4);

    const baseTemp = 18 + Math.sin((i / 24) * Math.PI * 2) * 6;
    const temperature = baseTemp + Math.random() * 4 - 2;

    const baseSpeed = 8 + Math.sin((i / 12) * Math.PI) * 6;
    const windSpeed = baseSpeed + Math.random() * 5;

    data.push({
      time: time.toISOString(),
      probability: Math.min(100, Math.max(0, probability)),
      intensity: parseFloat(intensity.toFixed(2)),
      temperature: parseFloat(temperature.toFixed(1)),
      windSpeed: parseFloat(windSpeed.toFixed(1)),
    });
  }

  return data;
}

export function generateWindTimingData(weatherData: any): WindTimingHour[] {
  const data: WindTimingHour[] = [];
  const now = new Date();
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  for (let i = 0; i < 48; i++) {
    const time = new Date(now);
    time.setHours(time.getHours() + i);

    const baseSpeed = 8 + Math.sin((i / 12) * Math.PI) * 6;
    const speed = baseSpeed + Math.random() * 5;
    const gust = speed + 3 + Math.random() * 5;
    const direction = Math.floor(Math.random() * 360);

    data.push({
      time: time.toISOString(),
      speed: parseFloat(speed.toFixed(1)),
      gust: parseFloat(gust.toFixed(1)),
      direction,
      directionText: directions[Math.round(direction / 45) % 8],
    });
  }

  return data;
}

export function generateSoilWorkabilityData(weatherData: any, forecastData: ExtendedForecastDay[]): SoilWorkabilityDay[] {
  const data: SoilWorkabilityDay[] = [];

  for (let i = 0; i < 14; i++) {
    const forecast = forecastData[i];
    const moisture_index = Math.round(40 + Math.sin((i / 7) * Math.PI) * 30 + forecast.precipitation_chance / 3);

    let workability: SoilWorkabilityDay['workability'];
    let notes: string;

    if (moisture_index < 30) {
      workability = 'excellent';
      notes = 'Soil conditions are optimal. Low moisture with minimal compaction risk.';
    } else if (moisture_index < 50) {
      workability = 'good';
      notes = 'Good working conditions. Soil moisture is manageable for most operations.';
    } else if (moisture_index < 65) {
      workability = 'fair';
      notes = 'Moderate soil moisture. Monitor conditions closely during operations.';
    } else if (moisture_index < 80) {
      workability = 'poor';
      notes = 'High soil moisture. Risk of compaction and rutting. Delay operations if possible.';
    } else {
      workability = 'unsuitable';
      notes = 'Soil too wet for operations. High risk of severe compaction damage.';
    }

    data.push({
      date: forecast.date,
      workability,
      moisture_index: Math.min(100, Math.max(0, moisture_index)),
      confidence: 95 - i * 3,
      notes,
    });
  }

  return data;
}

export function generateOperationAlerts(weatherData: any, forecastData: ExtendedForecastDay[]): OperationAlert[] {
  const alerts: OperationAlert[] = [];
  const now = new Date();

  const next3Days = forecastData.slice(0, 3);

  next3Days.forEach((day, index) => {
    if (day.wind_speed < 15 && day.precipitation_chance < 30) {
      const start = new Date(day.date);
      start.setHours(8, 0, 0, 0);
      const end = new Date(day.date);
      end.setHours(18, 0, 0, 0);

      alerts.push({
        id: `spray-${index}`,
        type: 'spray',
        severity: 'info',
        title: 'Good Spraying Window',
        message: `Favorable conditions for spraying operations. Wind: ${Math.round(day.wind_speed)} mph, Rain chance: ${day.precipitation_chance}%`,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      });
    }

    if (day.precipitation_amount > 20) {
      alerts.push({
        id: `harvest-${index}`,
        type: 'harvest',
        severity: 'warning',
        title: 'Harvest Delay Recommended',
        message: `Heavy rain expected (${day.precipitation_amount.toFixed(1)}mm). Consider delaying harvest operations.`,
        start_time: new Date(day.date).toISOString(),
      });
    }

    if (day.temp_high > 15 && day.temp_high < 25 && day.precipitation_chance < 40) {
      alerts.push({
        id: `planting-${index}`,
        type: 'planting',
        severity: 'info',
        title: 'Good Planting Conditions',
        message: `Optimal temperature range (${Math.round(day.temp_high)}°C) with moderate moisture levels.`,
        start_time: new Date(day.date).toISOString(),
      });
    }
  });

  if (weatherData?.current?.wind?.speed > 25) {
    alerts.push({
      id: 'wind-warning',
      type: 'general',
      severity: 'critical',
      title: 'High Wind Alert',
      message: 'Strong winds detected. Avoid all spraying and sensitive operations.',
      start_time: now.toISOString(),
    });
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
