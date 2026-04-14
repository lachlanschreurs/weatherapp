import { getSprayCondition } from './deltaT';

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
  rain?: {
    '3h'?: number;
    '1h'?: number;
  };
}

export interface SprayWindow {
  startTime: string;
  endTime: string;
  duration: number;
  conditions: string;
  rating: 'Good' | 'Moderate' | 'Poor';
}

export function findBestSprayWindow(forecastItems: ForecastItem[]): SprayWindow | null {
  if (!forecastItems || forecastItems.length === 0) {
    return null;
  }

  let bestWindow: SprayWindow | null = null;
  let currentWindowStart: number | null = null;
  let currentWindowEnd: number | null = null;
  let currentRating: 'Good' | 'Moderate' | 'Poor' | null = null;

  for (let i = 0; i < forecastItems.length; i++) {
    const item = forecastItems[i];
    const windSpeedKmh = item.wind_speed * 3.6;
    const rainfall = item.rain?.['3h'] || item.rain?.['1h'] || 0;
    const rainLikelyByPop = item.pop > 0.4;
    const effectiveRainfall = rainLikelyByPop ? Math.max(rainfall, 1) : rainfall;
    const sprayCondition = getSprayCondition(windSpeedKmh, effectiveRainfall);

    if (sprayCondition.rating === 'Good' || sprayCondition.rating === 'Moderate') {
      if (currentWindowStart === null) {
        currentWindowStart = item.dt;
        currentWindowEnd = item.dt + 3 * 60 * 60;
        currentRating = sprayCondition.rating;
      } else if (sprayCondition.rating === currentRating) {
        currentWindowEnd = item.dt + 3 * 60 * 60;
      } else {
        if (currentWindowStart && currentWindowEnd && currentRating) {
          const window = createWindow(currentWindowStart, currentWindowEnd, currentRating);
          if (!bestWindow || isWindowBetter(window, bestWindow)) {
            bestWindow = window;
          }
        }
        currentWindowStart = item.dt;
        currentWindowEnd = item.dt + 3 * 60 * 60;
        currentRating = sprayCondition.rating;
      }
    } else {
      if (currentWindowStart && currentWindowEnd && currentRating) {
        const window = createWindow(currentWindowStart, currentWindowEnd, currentRating);
        if (!bestWindow || isWindowBetter(window, bestWindow)) {
          bestWindow = window;
        }
      }
      currentWindowStart = null;
      currentWindowEnd = null;
      currentRating = null;
    }
  }

  if (currentWindowStart && currentWindowEnd && currentRating) {
    const window = createWindow(currentWindowStart, currentWindowEnd, currentRating);
    if (!bestWindow || isWindowBetter(window, bestWindow)) {
      bestWindow = window;
    }
  }

  return bestWindow;
}

function createWindow(startTimestamp: number, endTimestamp: number, rating: 'Good' | 'Moderate' | 'Poor'): SprayWindow {
  const startDate = new Date(startTimestamp * 1000);
  const endDate = new Date(endTimestamp * 1000);
  const durationHours = (endTimestamp - startTimestamp) / 3600;

  return {
    startTime: startDate.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }),
    endTime: endDate.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }),
    duration: durationHours,
    conditions: rating === 'Good' ? 'Ideal conditions' : 'Moderate conditions',
    rating,
  };
}

function isWindowBetter(newWindow: SprayWindow, bestWindow: SprayWindow): boolean {
  if (newWindow.rating === 'Good' && bestWindow.rating !== 'Good') {
    return true;
  }

  if (newWindow.rating === bestWindow.rating && newWindow.duration > bestWindow.duration) {
    return true;
  }

  return false;
}
