export interface WhiteLabelConfig {
  platformName: string;
  tagline: string;
  poweredBy: string;
  poweredByUrl: string;
  primaryColor: string;
  partnerName: string;
  partnerLogos: Array<{ name: string; opacity?: number }>;
  agronomistContact: {
    label: string;
    description: string;
    buttonText: string;
    url?: string;
  };
  productRecommendation: {
    enabled: boolean;
    title: string;
    description: string;
    buttonText: string;
    url?: string;
  };
}

export const defaultConfig: WhiteLabelConfig = {
  platformName: 'FarmCast',
  tagline: 'Built by farmers, for real farm decisions',
  poweredBy: 'FarmCast',
  poweredByUrl: '',
  primaryColor: 'green',
  partnerName: '',
  partnerLogos: [],
  agronomistContact: {
    label: 'Connect with an Agronomist',
    description: 'Get tailored advice from your local agronomy partner.',
    buttonText: 'Contact Agronomist',
    url: undefined,
  },
  productRecommendation: {
    enabled: true,
    title: 'Recommended Product',
    description: 'Based on current conditions, consider using a drift-reducing nozzle or compatible spray solution.',
    buttonText: 'View Recommended Products',
    url: undefined,
  },
};

export function getConfig(): WhiteLabelConfig {
  return defaultConfig;
}

export function getActivityRecommendation(
  windSpeedKmh: number,
  humidity: number,
  rainChance: number,
  deltaT: number,
  tempC: number
): string {
  const sprayable = deltaT >= 2 && deltaT <= 8 && windSpeedKmh <= 25 && rainChance <= 40;
  const plantable = tempC >= 10 && tempC <= 35 && humidity >= 30 && rainChance <= 60;
  const irrigable = rainChance <= 20 && humidity <= 70;

  const activities: string[] = [];
  if (sprayable) activities.push('Spraying');
  if (plantable) activities.push('Planting');
  if (irrigable) activities.push('Irrigation');

  if (activities.length === 0) return 'Monitor conditions before field operations';
  return `Conditions ideal for: ${activities.join(' / ')}`;
}
