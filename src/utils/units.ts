export type UnitSystem = 'metric' | 'imperial' | 'hybrid';

export interface RegionUnits {
  system: UnitSystem;
  temp: '°C' | '°F';
  wind: 'km/h' | 'mph' | 'm/s';
  rain: 'mm' | 'in';
  pressure: 'hPa' | 'inHg';
  distance: 'km' | 'mi';
}

// Legacy alias
export type RegionalUnits = RegionUnits;

export interface UnitPreferences {
  mode: 'location' | 'metric' | 'imperial' | 'custom';
  temp?: '°C' | '°F';
  wind?: 'km/h' | 'mph' | 'm/s';
  rain?: 'mm' | 'in';
  pressure?: 'hPa' | 'inHg';
}

const IMPERIAL_COUNTRIES = ['US', 'LR', 'MM'];
const MPH_COUNTRIES = ['US', 'GB', 'LR', 'MM'];
const INHG_COUNTRIES = ['US', 'CA'];

export function getRegionalUnits(countryCode: string): RegionUnits {
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

export function loadUnitPrefs(): UnitPreferences {
  try {
    const stored = localStorage.getItem('farmcast_unit_prefs');
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return { mode: 'location' };
}

export function saveUnitPrefs(prefs: UnitPreferences): void {
  try {
    localStorage.setItem('farmcast_unit_prefs', JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function resolveUnits(
  location: { country?: string } | null,
  prefs: UnitPreferences
): RegionUnits {
  if (prefs.mode === 'metric') {
    return { system: 'metric', temp: '°C', wind: 'km/h', rain: 'mm', pressure: 'hPa', distance: 'km' };
  }
  if (prefs.mode === 'imperial') {
    return { system: 'imperial', temp: '°F', wind: 'mph', rain: 'in', pressure: 'inHg', distance: 'mi' };
  }

  const base = getRegionalUnits(location?.country || '');

  if (prefs.mode === 'custom') {
    return {
      ...base,
      ...(prefs.temp ? { temp: prefs.temp } : {}),
      ...(prefs.wind ? { wind: prefs.wind } : {}),
      ...(prefs.rain ? { rain: prefs.rain } : {}),
      ...(prefs.pressure ? { pressure: prefs.pressure } : {}),
    };
  }

  return base;
}

// Converters
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

// Label helpers
export function tempLabel(unit: '°C' | '°F'): string {
  return unit;
}

export function windLabel(unit: 'km/h' | 'mph' | 'm/s'): string {
  return unit;
}

export function rainLabel(unit: 'mm' | 'in'): string {
  return unit === 'in' ? '"' : 'mm';
}

export function pressureLabel(unit: 'hPa' | 'inHg'): string {
  return unit;
}

// Value-only formatters (number as string, no unit suffix)
export function formatTempValue(tempC: number, unit: '°C' | '°F', decimals = 0): string {
  const v = convertTemp(tempC, unit);
  return decimals > 0 ? v.toFixed(decimals) : String(Math.round(v));
}

export function formatWindValue(kmh: number, unit: 'km/h' | 'mph' | 'm/s', decimals = 0): string {
  const v = convertWind(kmh, unit);
  return decimals > 0 ? v.toFixed(decimals) : String(Math.round(v));
}

export function formatRainValue(mm: number, unit: 'mm' | 'in', decimals = 1): string {
  const v = convertRain(mm, unit);
  return v.toFixed(decimals);
}

export function formatPressureValue(hPa: number, unit: 'hPa' | 'inHg'): string {
  const v = convertPressure(hPa, unit);
  return unit === 'inHg' ? v.toFixed(2) : String(Math.round(v));
}

// Full formatters (value + unit suffix)
export function formatTemp(tempC: number, unit: '°C' | '°F', decimals = 0): string {
  return `${formatTempValue(tempC, unit, decimals)}${unit}`;
}

export function formatWind(kmh: number, unit: 'km/h' | 'mph' | 'm/s', decimals = 0): string {
  return `${formatWindValue(kmh, unit, decimals)} ${unit}`;
}

export function formatRain(mm: number, unit: 'mm' | 'in', decimals = 1): string {
  const v = convertRain(mm, unit);
  return `${v.toFixed(decimals)}${unit === 'in' ? '"' : unit}`;
}

export function formatPressure(hPa: number, unit: 'hPa' | 'inHg'): string {
  const v = convertPressure(hPa, unit);
  return unit === 'inHg' ? `${v.toFixed(2)} ${unit}` : `${Math.round(v)} ${unit}`;
}

export function formatDistance(km: number, unit: 'km' | 'mi', decimals = 1): string {
  const v = convertDistance(km, unit);
  return `${v.toFixed(decimals)} ${unit}`;
}

// Threshold helpers for legend/key displays
export function windThresholdInUnit(kmhThreshold: number, unit: 'km/h' | 'mph' | 'm/s'): number {
  return Math.round(convertWind(kmhThreshold, unit));
}

export function rainThresholdInUnit(mmThreshold: number, unit: 'mm' | 'in'): string {
  if (unit === 'in') return convertRain(mmThreshold, unit).toFixed(2) + '"';
  return mmThreshold.toFixed(0) + 'mm';
}

// Legacy aliases for files still using old names
export const fmtTemp = formatTemp;
export const fmtWind = formatWind;
export const fmtRain = formatRain;
export const fmtPressure = formatPressure;
