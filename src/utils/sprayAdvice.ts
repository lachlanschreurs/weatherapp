interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  rain?: {
    '3h'?: number;
  };
  weather: Array<{
    main: string;
  }>;
}

export interface SprayAdvice {
  message: string;
  color: string;
  bgColor: string;
  icon: 'success' | 'warning' | 'danger';
}

export function getSprayAdvice(
  currentWindSpeed: number,
  currentRainfall: number,
  forecastList: ForecastItem[]
): SprayAdvice {
  const next24Hours = forecastList.slice(0, 8);

  const hasRainTonight = next24Hours.some(item => {
    const hour = new Date(item.dt * 1000).getHours();
    const isNight = hour >= 18 || hour <= 6;
    const hasRain = item.weather[0]?.main === 'Rain' || (item.rain?.['3h'] || 0) > 0;
    return isNight && hasRain;
  });

  const hasRainSoon = next24Hours.slice(0, 4).some(item =>
    item.weather[0]?.main === 'Rain' || (item.rain?.['3h'] || 0) > 0
  );

  if (currentRainfall > 0) {
    return {
      message: 'Currently raining – delay spraying',
      color: 'text-red-800',
      bgColor: 'bg-red-100',
      icon: 'danger',
    };
  }

  if (currentWindSpeed > 25) {
    return {
      message: 'Wind too strong – spraying not recommended',
      color: 'text-red-800',
      bgColor: 'bg-red-100',
      icon: 'danger',
    };
  }

  if (hasRainTonight) {
    return {
      message: 'Rain expected tonight – delay spraying',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      icon: 'warning',
    };
  }

  if (hasRainSoon) {
    return {
      message: 'Rain expected soon – delay spraying',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      icon: 'warning',
    };
  }

  const bestWindows = next24Hours
    .map((item, index) => ({
      item,
      index,
      windSpeed: item.wind.speed * 3.6,
      rainfall: item.rain?.['3h'] || 0,
    }))
    .filter(({ windSpeed, rainfall }) => windSpeed < 15 && rainfall === 0);

  if (bestWindows.length > 0) {
    const firstWindow = bestWindows[0];
    const windowTime = new Date(firstWindow.item.dt * 1000);
    const timeStr = windowTime.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const endWindow = bestWindows[bestWindows.length - 1];
    const endTime = new Date(endWindow.item.dt * 1000);
    const endTimeStr = endTime.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (firstWindow.index === 0 && currentWindSpeed < 15) {
      return {
        message: `Good conditions now – spray window until ${endTimeStr}`,
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        icon: 'success',
      };
    }

    return {
      message: `Best spraying window: ${timeStr}–${endTimeStr}`,
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      icon: 'success',
    };
  }

  if (currentWindSpeed >= 15 && currentWindSpeed <= 25) {
    return {
      message: 'Moderate wind – spray with caution',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      icon: 'warning',
    };
  }

  return {
    message: 'No ideal spray windows in next 24 hours',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    icon: 'danger',
  };
}
