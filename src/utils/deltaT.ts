export function calculateDeltaT(tempC: number, humidity: number): number {
  const dewpoint = tempC - ((100 - humidity) / 5);
  const wetBulb = tempC * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) +
                  Math.atan(tempC + humidity) -
                  Math.atan(humidity - 1.676331) +
                  0.00391838 * Math.pow(humidity, 1.5) * Math.atan(0.023101 * humidity) -
                  4.686035;

  const deltaT = tempC - wetBulb;
  return Math.max(0, deltaT);
}

export function getDeltaTCondition(deltaT: number): {
  rating: 'Excellent' | 'Good' | 'Marginal' | 'Poor';
  color: string;
  bgColor: string;
  reason: string;
} {
  if (deltaT < 2) {
    return {
      rating: 'Poor',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      reason: 'High inversion risk',
    };
  }

  if (deltaT >= 2 && deltaT <= 8) {
    return {
      rating: 'Excellent',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      reason: 'Ideal for spraying',
    };
  }

  if (deltaT > 8 && deltaT <= 10) {
    return {
      rating: 'Good',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100',
      reason: 'Good conditions',
    };
  }

  if (deltaT > 10 && deltaT <= 14) {
    return {
      rating: 'Marginal',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      reason: 'Caution - evaporation',
    };
  }

  return {
    rating: 'Poor',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    reason: 'Too dry - high evaporation',
  };
}

export function getSprayCondition(windSpeedKmh: number, rainfallMm: number): {
  rating: 'Good' | 'Moderate' | 'Poor';
  color: string;
  bgColor: string;
  reason: string;
} {
  if (rainfallMm > 0.5) {
    return {
      rating: 'Poor',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      reason: 'Rain present',
    };
  }

  if (windSpeedKmh > 25) {
    return {
      rating: 'Poor',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      reason: 'Wind too strong',
    };
  }

  if (windSpeedKmh > 15) {
    return {
      rating: 'Moderate',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      reason: 'Moderate wind',
    };
  }

  return {
    rating: 'Good',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    reason: 'Ideal conditions',
  };
}
