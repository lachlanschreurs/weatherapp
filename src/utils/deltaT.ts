export function calculateDeltaT(
  temperature: number,
  humidity: number
): number {
  const es = 6.112 * Math.exp((17.67 * temperature) / (temperature + 243.5));
  const ea = (humidity / 100) * es;
  const dewPoint = (243.5 * Math.log(ea / 6.112)) / (17.67 - Math.log(ea / 6.112));

  const deltaT = temperature - dewPoint;

  return Math.round(deltaT * 10) / 10;
}

export function getSprayCondition(deltaT: number): {
  rating: 'Good' | 'Moderate' | 'Poor';
  color: string;
  bgColor: string;
} {
  if (deltaT >= 2 && deltaT <= 8) {
    return {
      rating: 'Good',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
    };
  } else if (deltaT > 8 && deltaT <= 10) {
    return {
      rating: 'Moderate',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
    };
  } else {
    return {
      rating: 'Poor',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
    };
  }
}
