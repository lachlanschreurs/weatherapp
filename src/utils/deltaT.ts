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
