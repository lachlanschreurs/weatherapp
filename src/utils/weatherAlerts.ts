export type AlertSeverity = 'safe' | 'caution' | 'warning' | 'info';

export interface WeatherAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  icon: string;
}

interface ForecastItem {
  dt: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: Array<{
    main: string;
    description: string;
  }>;
  pop: number;
  rain?: { '3h'?: number };
}

export function generateWeatherAlerts(
  currentTemp: number,
  currentHumidity: number,
  currentWindSpeed: number,
  currentRain: number,
  currentWeather: string,
  forecast: ForecastItem[]
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  const next24Hours = forecast.filter(item => {
    const time = new Date(item.dt * 1000);
    const now = new Date();
    const hoursDiff = (time.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24 && hoursDiff >= 0;
  });

  const next10Days = forecast.filter(item => {
    const time = new Date(item.dt * 1000);
    const now = new Date();
    const hoursDiff = (time.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 240 && hoursDiff >= 0;
  });

  const totalRain24h = next24Hours.reduce((sum, item) => sum + (item.rain?.['3h'] || item.pop * 3 || 0), 0);
  const rainForecast = next24Hours.find(item => (item.pop || 0) > 0.3);

  const next30Min = forecast.find(item => {
    const time = new Date(item.dt * 1000);
    const now = new Date();
    const minutesDiff = (time.getTime() - now.getTime()) / (1000 * 60);
    return minutesDiff <= 30 && minutesDiff >= 0 && (item.pop || 0) > 0.3;
  });

  if (next30Min) {
    alerts.push({
      id: 'rain-imminent',
      severity: 'warning',
      title: 'Rain Starting Soon',
      message: 'Rain expected to start within 30 minutes. Delay spraying and secure equipment.',
      icon: 'cloud-rain'
    });
  }

  if (rainForecast) {
    const rainTime = new Date(rainForecast.dt * 1000).toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit'
    });

    if (totalRain24h > 25) {
      alerts.push({
        id: 'heavy-rain',
        severity: 'warning',
        title: 'Heavy Rain Alert',
        message: `Heavy rainfall expected: ${totalRain24h.toFixed(1)}mm forecast within 24 hours. Starting around ${rainTime}.`,
        icon: 'cloud-rain'
      });
    } else if (totalRain24h > 10 && !next30Min) {
      alerts.push({
        id: 'rain',
        severity: 'caution',
        title: 'Rain Alert',
        message: `Rain forecast within 24 hours: ${totalRain24h.toFixed(1)}mm expected. Starting around ${rainTime}.`,
        icon: 'cloud-rain'
      });
    }
  }

  const windSpeedKmh = currentWindSpeed * 3.6;
  if (windSpeedKmh > 25) {
    alerts.push({
      id: 'strong-wind',
      severity: 'warning',
      title: 'Strong Wind Alert',
      message: `Strong winds detected: ${Math.round(windSpeedKmh)} km/h. Spraying and field work not recommended.`,
      icon: 'wind'
    });
  } else if (windSpeedKmh >= 20) {
    alerts.push({
      id: 'wind',
      severity: 'caution',
      title: 'Wind Alert',
      message: `Moderate winds: ${Math.round(windSpeedKmh)} km/h. Exercise caution with spraying operations.`,
      icon: 'wind'
    });
  }

  if (currentWeather.toLowerCase().includes('hail')) {
    alerts.push({
      id: 'hail',
      severity: 'warning',
      title: 'Hail Alert',
      message: 'Hail detected or forecast. Severe crop damage risk. Secure equipment and take protective measures immediately.',
      icon: 'cloud-hail'
    });
  }

  if (currentWeather.toLowerCase().includes('thunder') || currentWeather.toLowerCase().includes('storm')) {
    alerts.push({
      id: 'storm',
      severity: 'warning',
      title: 'Storm Alert',
      message: 'Thunderstorm activity detected. Lightning risk present. Potential hail risk. Seek shelter and avoid field work.',
      icon: 'zap'
    });
  }

  const hasHailForecast = next24Hours.some(item =>
    item.weather[0]?.main.toLowerCase().includes('hail') ||
    item.weather[0]?.description.toLowerCase().includes('hail')
  );

  if (hasHailForecast && !alerts.find(a => a.id === 'hail')) {
    const hailTime = next24Hours.find(item =>
      item.weather[0]?.main.toLowerCase().includes('hail') ||
      item.weather[0]?.description.toLowerCase().includes('hail')
    );
    const timeStr = hailTime ? new Date(hailTime.dt * 1000).toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit'
    }) : '';

    alerts.push({
      id: 'hail-forecast',
      severity: 'warning',
      title: 'Hail Forecast',
      message: `Hail forecast within 24 hours${timeStr ? ` around ${timeStr}` : ''}. Prepare protective measures for crops and equipment.`,
      icon: 'cloud-hail'
    });
  }

  const hasStormForecast = next24Hours.some(item =>
    item.weather[0]?.main.toLowerCase().includes('thunder') ||
    item.weather[0]?.main.toLowerCase().includes('storm')
  );

  if (hasStormForecast && !alerts.find(a => a.id === 'storm')) {
    alerts.push({
      id: 'storm-forecast',
      severity: 'warning',
      title: 'Severe Weather Forecast',
      message: 'Thunderstorms forecast within 24 hours. Possible hail risk. Monitor conditions closely.',
      icon: 'zap'
    });
  }

  const minTemp24h = next24Hours.length > 0 ? Math.min(...next24Hours.map(item => item.temp)) : currentTemp;
  if (minTemp24h < 2) {
    alerts.push({
      id: 'frost',
      severity: 'warning',
      title: 'Frost Alert',
      message: `Frost risk: Temperature forecast to drop to ${Math.round(minTemp24h)}°C. Protect sensitive crops and livestock.`,
      icon: 'thermometer'
    });
  } else if (minTemp24h < 5) {
    const morningForecasts = next24Hours.filter(item => {
      const hour = new Date(item.dt * 1000).getHours();
      return hour >= 4 && hour <= 8;
    });

    const coldMorning = morningForecasts.some(item => item.temp < 5);
    if (coldMorning) {
      alerts.push({
        id: 'cold-morning',
        severity: 'caution',
        title: 'Cold Morning Warning',
        message: `Cold morning expected: Temperature near ${Math.round(minTemp24h)}°C before sunrise.`,
        icon: 'thermometer'
      });
    }
  }

  const maxTemp24h = next24Hours.length > 0 ? Math.max(...next24Hours.map(item => item.temp)) : currentTemp;
  if (maxTemp24h > 33) {
    alerts.push({
      id: 'heat-wave',
      severity: 'warning',
      title: 'Heat Wave Alert',
      message: `Extreme heat expected: ${Math.round(maxTemp24h)}°C forecast. Ensure livestock have adequate water and shade. Monitor heat stress.`,
      icon: 'sun'
    });
  } else if (maxTemp24h > 30) {
    alerts.push({
      id: 'heat',
      severity: 'caution',
      title: 'Heat Alert',
      message: `High temperatures expected: ${Math.round(maxTemp24h)}°C forecast. Monitor livestock and irrigation needs.`,
      icon: 'sun'
    });
  }

  const avgHumidity = next24Hours.length > 0
    ? next24Hours.reduce((sum, item) => sum + item.humidity, 0) / next24Hours.length
    : currentHumidity;

  const dampDays = [];
  let consecutiveDampDays = 0;
  for (let i = 0; i < Math.min(10, next10Days.length / 8); i++) {
    const dayStart = i * 8;
    const dayEnd = Math.min((i + 1) * 8, next10Days.length);
    const dayForecasts = next10Days.slice(dayStart, dayEnd);

    const avgDayHumidity = dayForecasts.reduce((sum, item) => sum + item.humidity, 0) / dayForecasts.length;
    const hasRain = dayForecasts.some(item => (item.pop || 0) > 0.3);
    const avgDayTemp = dayForecasts.reduce((sum, item) => sum + item.temp, 0) / dayForecasts.length;

    if (avgDayHumidity > 75 || hasRain) {
      dampDays.push({ day: i, humidity: avgDayHumidity, temp: avgDayTemp });
      consecutiveDampDays++;
    } else {
      consecutiveDampDays = 0;
    }
  }

  const highHumidityPeriods = next24Hours.filter(item => item.humidity > 85);
  const tempInDiseaseRange = next24Hours.filter(item => item.temp >= 15 && item.temp <= 25);

  if (consecutiveDampDays >= 3 && tempInDiseaseRange.length > 4 && highHumidityPeriods.length > 4) {
    alerts.push({
      id: 'disease-pressure',
      severity: 'warning',
      title: 'High Disease Pressure Alert',
      message: `Disease risk elevated: ${consecutiveDampDays} consecutive damp days, prolonged leaf wetness, high humidity (${Math.round(avgHumidity)}%), and ideal temperatures (15-25°C). Monitor crops closely for disease symptoms.`,
      icon: 'alert-triangle'
    });
  }

  const minTempNext10Days = next10Days.length > 0 ? Math.min(...next10Days.map(item => item.temp)) : currentTemp;
  if (minTempNext10Days >= 15) {
    alerts.push({
      id: 'sheep-graziers',
      severity: 'caution',
      title: 'Sheep Graziers Alert',
      message: '10+ days forecast without temperatures dropping below 15°C. Ideal conditions for internal parasite development. Consider strategic drenching programs.',
      icon: 'alert-circle'
    });
  }

  if (windSpeedKmh >= 20 && (currentRain > 0 || rainForecast)) {
    alerts.push({
      id: 'wind-rain-combo',
      severity: 'warning',
      title: 'Combined Wind & Rain Warning',
      message: 'Strong winds combined with rain. Spraying and field work not recommended.',
      icon: 'alert-triangle'
    });
  }

  const goodSprayWindows = next24Hours.filter(item => {
    const windKmh = item.wind_speed * 3.6;
    const hasRain = (item.pop || 0) > 0.3;
    return windKmh < 15 && !hasRain && item.temp >= 8 && item.temp <= 28;
  });

  if (goodSprayWindows.length >= 3) {
    const firstWindow = goodSprayWindows[0];
    const lastWindow = goodSprayWindows[goodSprayWindows.length - 1];
    const startTime = new Date(firstWindow.dt * 1000).toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit'
    });
    const endTime = new Date(lastWindow.dt * 1000 + 3 * 60 * 60 * 1000).toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit'
    });
    const durationHours = ((lastWindow.dt - firstWindow.dt) / 3600) + 3;

    alerts.push({
      id: 'best-spray-window',
      severity: 'info',
      title: 'Ideal Spray Window Available',
      message: `Excellent spraying conditions forecast: ${startTime} - ${endTime} (${durationHours.toFixed(0)}h window). Low wind, no rain, optimal temperatures.`,
      icon: 'check-circle'
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'all-clear',
      severity: 'safe',
      title: 'Conditions Favorable',
      message: 'No weather warnings. Conditions are suitable for normal farm operations.',
      icon: 'check-circle'
    });
  }

  return alerts;
}
