export type UnitSystem = 'metric' | 'imperial' | 'hybrid';

export interface RegionalUnits {
  system: UnitSystem;
  temp: '°C' | '°F';
  wind: 'km/h' | 'mph' | 'm/s';
  rain: 'mm' | 'in';
  pressure: 'hPa' | 'inHg';
  distance: 'km' | 'mi';
}

const IMPERIAL_COUNTRIES = ['US', 'LR', 'MM'];
const MPH_COUNTRIES = ['US', 'GB', 'LR', 'MM'];
const INHG_COUNTRIES = ['US', 'CA'];

export function getRegionalUnits(countryCode: string): RegionalUnits {
  const cc = (countryCode || '').toUpperCase();

  if (IMPERIAL_COUNTRIES.includes(cc)) {
    return {
      system: 'imperial',
      temp: '°F',
      wind: 'mph',
      rain: 'in',
      pressure: 'inHg',
      distance: 'mi',
    };
  }

  if (MPH_COUNTRIES.includes(cc)) {
    return {
      system: 'hybrid',
      temp: '°C',
      wind: 'mph',
      rain: 'mm',
      pressure: 'hPa',
      distance: 'mi',
    };
  }

  return {
    system: 'metric',
    temp: '°C',
    wind: 'km/h',
    rain: 'mm',
    pressure: 'hPa',
    distance: 'km',
  };
}

export function convertTemp(tempC: number, unit: '°C' | '°F'): number {
  if (unit === '°F') return tempC * 9 / 5 + 32;
  return tempC;
}

export function convertWind(kmh: number, unit: 'km/h' | 'mph' | 'm/s'): number {
  if (unit === 'mph') return kmh * 0.621371;
  if (unit === 'm/s') return kmh / 3.6;
  return kmh;
}

export function convertRain(mm: number, unit: 'mm' | 'in'): number {
  if (unit === 'in') return mm * 0.0393701;
  return mm;
}

export function convertPressure(hPa: number, unit: 'hPa' | 'inHg'): number {
  if (unit === 'inHg') return hPa * 0.02953;
  return hPa;
}

export function convertDistance(km: number, unit: 'km' | 'mi'): number {
  if (unit === 'mi') return km * 0.621371;
  return km;
}

export function fmtTemp(tempC: number, unit: '°C' | '°F', decimals = 0): string {
  const v = convertTemp(tempC, unit);
  return `${decimals > 0 ? v.toFixed(decimals) : Math.round(v)}${unit}`;
}

export function fmtWind(kmh: number, unit: 'km/h' | 'mph' | 'm/s', decimals = 0): string {
  const v = convertWind(kmh, unit);
  return `${decimals > 0 ? v.toFixed(decimals) : Math.round(v)} ${unit}`;
}

export function fmtRain(mm: number, unit: 'mm' | 'in', decimals = 1): string {
  const v = convertRain(mm, unit);
  return `${v.toFixed(decimals)}${unit === 'in' ? '"' : unit}`;
}

export function fmtPressure(hPa: number, unit: 'hPa' | 'inHg'): string {
  const v = convertPressure(hPa, unit);
  return unit === 'inHg' ? `${v.toFixed(2)} ${unit}` : `${Math.round(v)} ${unit}`;
}

export function fmtDistance(km: number, unit: 'km' | 'mi', decimals = 1): string {
  const v = convertDistance(km, unit);
  return `${v.toFixed(decimals)} ${unit}`;
}

export function windThresholdInUnit(kmhThreshold: number, unit: 'km/h' | 'mph' | 'm/s'): number {
  return Math.round(convertWind(kmhThreshold, unit));
}

export function rainThresholdInUnit(mmThreshold: number, unit: 'mm' | 'in'): string {
  if (unit === 'in') return convertRain(mmThreshold, unit).toFixed(2) + '"';
  return mmThreshold.toFixed(0) + 'mm';
}
