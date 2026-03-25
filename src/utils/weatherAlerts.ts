export type AlertSeverity = 'safe' | 'caution' | 'warning';

export interface WeatherAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  icon: string;
}

interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
    gust?: number;
  };
  rain?: {
    '3h'?: number;
  };
  dt_txt: string;
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

  const totalRain24h = next24Hours.reduce((sum, item) => sum + (item.rain?.['3h'] || 0), 0);
  const rainForecast = next24Hours.find(item => (item.rain?.['3h'] || 0) > 0);

  if (rainForecast) {
    const rainTime = new Date(rainForecast.dt * 1000).toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit'
    });

    if (totalRain24h > 10) {
      alerts.push({
        id: 'heavy-rain',
        severity: 'warning',
        title: 'Heavy Rain Warning',
        message: `Heavy rainfall expected: ${totalRain24h.toFixed(1)}mm forecast within 24 hours. Starting around ${rainTime}.`,
        icon: 'cloud-rain'
      });
    } else {
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
  if (windSpeedKmh >= 25) {
    alerts.push({
      id: 'high-wind',
      severity: 'warning',
      title: 'High Wind Warning',
      message: `Strong winds: ${Math.round(windSpeedKmh)} km/h. Field work and spraying not recommended.`,
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

  const minTemp24h = Math.min(...next24Hours.map(item => item.main.temp_min));
  if (minTemp24h < 2) {
    alerts.push({
      id: 'frost',
      severity: 'warning',
      title: 'Frost Alert',
      message: `Frost risk: Temperature forecast to drop to ${Math.round(minTemp24h)}°C overnight. Protect sensitive crops.`,
      icon: 'thermometer'
    });
  } else if (minTemp24h < 5) {
    const morningForecasts = next24Hours.filter(item => {
      const hour = new Date(item.dt * 1000).getHours();
      return hour >= 4 && hour <= 8;
    });

    const coldMorning = morningForecasts.some(item => item.main.temp < 5);
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

  const maxTemp24h = Math.max(...next24Hours.map(item => item.main.temp_max));
  if (maxTemp24h > 35) {
    alerts.push({
      id: 'severe-heat',
      severity: 'warning',
      title: 'Severe Heat Warning',
      message: `Extreme heat expected: ${Math.round(maxTemp24h)}°C forecast. Ensure livestock have adequate water and shade.`,
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

  const avgHumidity = next24Hours.reduce((sum, item) => sum + item.main.humidity, 0) / next24Hours.length;
  if (avgHumidity > 85) {
    alerts.push({
      id: 'humidity',
      severity: 'caution',
      title: 'High Humidity Alert',
      message: `Very high humidity forecast (${Math.round(avgHumidity)}%). May affect field conditions and increase disease risk.`,
      icon: 'droplets'
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
