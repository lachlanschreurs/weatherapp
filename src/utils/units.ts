export type TempUnit = 'C' | 'F';
export type WindUnit = 'kmh' | 'mph' | 'ms';
export type RainUnit = 'mm' | 'in';
export type PressureUnit = 'hPa' | 'inHg';
export type DistanceUnit = 'km' | 'mi';

export type UnitPreset = 'metric' | 'imperial' | 'custom';

export interface UnitPreferences {
  preset: UnitPreset | 'location';
  temp: TempUnit;
  wind: WindUnit;
  rain: RainUnit;
  pressure: PressureUnit;
  distance: DistanceUnit;
}

export interface RegionUnits {
  temp: TempUnit;
  wind: WindUnit;
  rain: RainUnit;
  pressure: PressureUnit;
  distance: DistanceUnit;
}

const REGION_DEFAULTS: Record<string, RegionUnits> = {
  AU: { temp: 'C', wind: 'kmh', rain: 'mm', pressure: 'hPa', distance: 'km' },
  NZ: { temp: 'C', wind: 'kmh', rain: 'mm', pressure: 'hPa', distance: 'km' },
  US: { temp: 'F', wind: 'mph', rain: 'in', pressure: 'inHg', distance: 'mi' },
  GB: { temp: 'C', wind: 'mph', rain: 'mm', pressure: 'hPa', distance: 'mi' },
  IE: { temp: 'C', wind: 'kmh', rain: 'mm', pressure: 'hPa', distance: 'km' },
  CA: { temp: 'C', wind: 'kmh', rain: 'mm', pressure: 'hPa', distance: 'km' },
  ZA: { temp: 'C', wind: 'kmh', rain: 'mm', pressure: 'hPa', distance: 'km' },
  IN: { temp: 'C', wind: 'kmh', rain: 'mm', pressure: 'hPa', distance: 'km' },
  DE: { temp: 'C', wind: 'kmh', rain: 'mm', pressure: 'hPa', distance: 'km' },
  FR: { temp: 'C', wind: 'kmh', rain: 'mm', pressure: 'hPa', distance: 'km' },
  IT: { temp: 'C', wind: 'kmh', rain: 'mm', pressure: 'hPa', distance: 'km' },
  ES: { temp: 'C', wind: 'kmh', rain: 'mm', pressure: 'hPa', distance: 'km' },
  BR: { temp: 'C', wind: 'kmh', rain: 'mm', pressure: 'hPa', distance: 'km' },
  AR: { temp: 'C', wind: 'kmh', rain: 'mm', pressure: 'hPa', distance: 'km' },
};

const METRIC: RegionUnits = { temp: 'C', wind: 'kmh', rain: 'mm', pressure: 'hPa', distance: 'km' };
const IMPERIAL: RegionUnits = { temp: 'F', wind: 'mph', rain: 'in', pressure: 'inHg', distance: 'mi' };

export function getRegionDefaults(countryCode: string): RegionUnits {
  return REGION_DEFAULTS[countryCode?.toUpperCase()] || METRIC;
}

export function resolveUnits(prefs: UnitPreferences, countryCode: string): RegionUnits {
  if (prefs.preset === 'location') return getRegionDefaults(countryCode);
  if (prefs.preset === 'metric') return METRIC;
  if (prefs.preset === 'imperial') return IMPERIAL;
  return { temp: prefs.temp, wind: prefs.wind, rain: prefs.rain, pressure: prefs.pressure, distance: prefs.distance };
}

// --- Conversions (all inputs assumed metric/SI) ---

export function convertTemp(celsius: number, unit: TempUnit): number {
  if (unit === 'F') return celsius * 9 / 5 + 32;
  return celsius;
}

export function convertWind(kmh: number, unit: WindUnit): number {
  if (unit === 'mph') return kmh * 0.621371;
  if (unit === 'ms') return kmh / 3.6;
  return kmh;
}

export function convertRain(mm: number, unit: RainUnit): number {
  if (unit === 'in') return mm * 0.0393701;
  return mm;
}

export function convertPressure(hPa: number, unit: PressureUnit): number {
  if (unit === 'inHg') return hPa * 0.02953;
  return hPa;
}

export function convertDistance(km: number, unit: DistanceUnit): number {
  if (unit === 'mi') return km * 0.621371;
  return km;
}

// --- Display formatters ---

export function tempLabel(unit: TempUnit): string {
  return unit === 'F' ? '°F' : '°C';
}

export function windLabel(unit: WindUnit): string {
  if (unit === 'mph') return 'mph';
  if (unit === 'ms') return 'm/s';
  return 'km/h';
}

export function rainLabel(unit: RainUnit): string {
  return unit === 'in' ? 'in' : 'mm';
}

export function pressureLabel(unit: PressureUnit): string {
  return unit === 'inHg' ? 'inHg' : 'hPa';
}

export function distanceLabel(unit: DistanceUnit): string {
  return unit === 'mi' ? 'mi' : 'km';
}

export function formatTemp(celsius: number, unit: TempUnit, decimals = 0): string {
  return `${Math.round(convertTemp(celsius, unit) * Math.pow(10, decimals)) / Math.pow(10, decimals)}${tempLabel(unit)}`;
}

export function formatTempValue(celsius: number, unit: TempUnit, decimals = 0): string {
  const v = convertTemp(celsius, unit);
  return decimals > 0 ? v.toFixed(decimals) : String(Math.round(v));
}

export function formatWind(kmh: number, unit: WindUnit): string {
  return `${Math.round(convertWind(kmh, unit))} ${windLabel(unit)}`;
}

export function formatWindValue(kmh: number, unit: WindUnit): string {
  return String(Math.round(convertWind(kmh, unit)));
}

export function formatRain(mm: number, unit: RainUnit, decimals = 1): string {
  const v = convertRain(mm, unit);
  return `${v.toFixed(decimals)} ${rainLabel(unit)}`;
}

export function formatRainValue(mm: number, unit: RainUnit, decimals = 1): string {
  return convertRain(mm, unit).toFixed(decimals);
}

export function formatPressure(hPa: number, unit: PressureUnit): string {
  if (unit === 'inHg') return `${convertPressure(hPa, unit).toFixed(2)} ${pressureLabel(unit)}`;
  return `${Math.round(hPa)} ${pressureLabel(unit)}`;
}

export function formatPressureValue(hPa: number, unit: PressureUnit): string {
  if (unit === 'inHg') return convertPressure(hPa, unit).toFixed(2);
  return String(Math.round(hPa));
}

// --- Persistence ---

const STORAGE_KEY = 'farmcast-unit-prefs';

export function loadUnitPrefs(): UnitPreferences {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { preset: 'location', temp: 'C', wind: 'kmh', rain: 'mm', pressure: 'hPa', distance: 'km' };
}

export function saveUnitPrefs(prefs: UnitPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
