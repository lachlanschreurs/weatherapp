export interface SavedLocation {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  is_primary: boolean;
  created_at: string;
}

export interface ExtendedForecastDay {
  date: string;
  temp_high: number;
  temp_low: number;
  precipitation_chance: number;
  precipitation_amount: number;
  wind_speed: number;
  wind_direction: number;
  conditions: string;
  icon: string;
}

export interface RainProbabilityHour {
  time: string;
  probability: number;
  intensity: number;
  windSpeed?: number;
  temperature?: number;
  windDirection?: string;
}

export interface WindTimingHour {
  time: string;
  speed: number;
  gust: number;
  direction: number;
  directionText: string;
}

export interface SoilWorkabilityDay {
  date: string;
  workability: 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable';
  moisture_index: number;
  confidence: number;
  notes: string;
}

export interface OperationAlert {
  id: string;
  type: 'spray' | 'harvest' | 'planting' | 'general';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  start_time: string;
  end_time?: string;
}
