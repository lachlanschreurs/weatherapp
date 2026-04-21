export function calculateDeltaT(tempC: number, humidity: number): number {
  const wetBulb = tempC * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) +
                  Math.atan(tempC + humidity) -
                  Math.atan(humidity - 1.676331) +
                  0.00391838 * Math.pow(humidity, 1.5) * Math.atan(0.023101 * humidity) -
                  4.686035;

  const deltaT = tempC - wetBulb;
  return Math.max(0, deltaT);
}

export type DeltaTRating = 'Excellent' | 'Okay' | 'Poor';

export function getDeltaTCondition(deltaT: number): {
  rating: DeltaTRating;
  color: string;
  bgColor: string;
  reason: string;
} {
  if (deltaT < 2) {
    return {
      rating: 'Poor',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      reason: 'Temperature inversion — avoid spraying',
    };
  }

  if (deltaT >= 2 && deltaT < 4) {
    return {
      rating: 'Okay',
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
      reason: 'Monitor conditions before spraying',
    };
  }

  if (deltaT >= 4 && deltaT <= 6) {
    return {
      rating: 'Excellent',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      reason: 'Ideal for spraying',
    };
  }

  if (deltaT > 6 && deltaT <= 8) {
    return {
      rating: 'Okay',
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
      reason: 'Monitor conditions — rising evaporation',
    };
  }

  return {
    rating: 'Poor',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    reason: 'Too dry — avoid spraying',
  };
}

export function getDeltaTColor(deltaT: number): string {
  if (deltaT < 2) return '#ef4444';
  if (deltaT < 4) return '#f59e0b';
  if (deltaT <= 6) return '#22c55e';
  if (deltaT <= 8) return '#f59e0b';
  return '#ef4444';
}

export function getDeltaTCardColors(rating: DeltaTRating) {
  if (rating === 'Excellent') return { border: 'border-green-500/40', bg: 'bg-green-500/10', badge: 'bg-green-500/20 text-green-300 border-green-500/40' };
  if (rating === 'Okay') return { border: 'border-amber-500/40', bg: 'bg-amber-500/10', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
  return { border: 'border-red-500/40', bg: 'bg-red-500/10', badge: 'bg-red-500/20 text-red-300 border-red-500/40' };
}

export function getDeltaTIconColor(rating: DeltaTRating): string {
  if (rating === 'Excellent') return 'text-green-400';
  if (rating === 'Okay') return 'text-amber-400';
  return 'text-red-400';
}

export function getDeltaTValueColor(rating: DeltaTRating): string {
  if (rating === 'Excellent') return 'text-green-400';
  if (rating === 'Okay') return 'text-amber-400';
  return 'text-red-400';
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
