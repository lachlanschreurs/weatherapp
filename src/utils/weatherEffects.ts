export function isNightTime(timezone_offset?: number): boolean {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const localTime = new Date(utc + ((timezone_offset || 0) * 1000));
  const hour = localTime.getHours();
  return hour < 6 || hour >= 20;
}

export function getWeatherBackground(weatherCode: string, isNight: boolean) {
  const code = weatherCode?.toLowerCase() || '';

  if (code.includes('thunder') || code.includes('storm')) {
    return isNight
      ? 'from-gray-900 via-slate-800 to-gray-950'
      : 'from-gray-800 via-slate-700 to-gray-900';
  }

  if (code.includes('rain') || code.includes('shower') || code.includes('drizzle')) {
    return isNight
      ? 'from-slate-800 via-gray-700 to-slate-900'
      : 'from-slate-600 via-gray-500 to-slate-600';
  }

  if (code.includes('mist') || code.includes('fog') || code.includes('haze')) {
    return isNight
      ? 'from-gray-700 via-slate-600 to-gray-800'
      : 'from-gray-400 via-slate-300 to-gray-400';
  }

  if (code.includes('cloud') || code.includes('overcast')) {
    return isNight
      ? 'from-slate-700 via-gray-600 to-slate-800'
      : 'from-gray-400 via-gray-300 to-gray-500';
  }

  if (isNight) {
    return 'from-blue-950 via-indigo-900 to-slate-900';
  }

  return 'from-amber-300 via-yellow-200 to-sky-400';
}

export function getTextColor(weatherCode: string, isNight: boolean) {
  const code = weatherCode?.toLowerCase() || '';

  if (isNight || code.includes('thunder') || code.includes('storm') || code.includes('rain')) {
    return 'text-white';
  }

  if (code.includes('mist') || code.includes('fog')) {
    return isNight ? 'text-white' : 'text-gray-800';
  }

  return 'text-gray-800';
}
