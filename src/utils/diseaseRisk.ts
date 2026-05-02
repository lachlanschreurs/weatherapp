export type DiseaseRiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface DiseaseRiskAssessment {
  level: DiseaseRiskLevel;
  score: number;
  warnings: string[];
  guidance: string[];
  factors: { label: string; contributing: boolean }[];
}

interface DiseaseRiskInput {
  tempC: number;
  humidity: number;
  rainChance: number;
  todayExpectedRain: number;
  windSpeedKmh: number;
  soilMoisture: number | null;
}

export function assessDiseaseRisk(input: DiseaseRiskInput): DiseaseRiskAssessment {
  const { tempC, humidity, rainChance, todayExpectedRain, windSpeedKmh, soilMoisture } = input;

  let score = 0;
  const warnings: string[] = [];
  const guidance: string[] = [];
  const factors: { label: string; contributing: boolean }[] = [];

  const humidityHigh = humidity > 80;
  const humidityVeryHigh = humidity > 90;
  factors.push({ label: `Humidity ${Math.round(humidity)}%`, contributing: humidityHigh });
  if (humidityVeryHigh) {
    score += 3;
    warnings.push('Very high humidity increases risk of fungal spore germination and disease spread.');
  } else if (humidityHigh) {
    score += 2;
    warnings.push('High humidity may increase fungal disease pressure today.');
  }

  const tempFavourable = tempC >= 15 && tempC <= 28;
  const tempOptimal = tempC >= 18 && tempC <= 25;
  factors.push({ label: `Temperature ${Math.round(tempC)}\u00B0C`, contributing: tempFavourable });
  if (tempOptimal && humidityHigh) {
    score += 2;
    warnings.push('Mild temperatures combined with high humidity create favourable conditions for disease development.');
  } else if (tempFavourable) {
    score += 1;
  }

  const rainLikely = rainChance > 50;
  const rainHeavy = todayExpectedRain > 5;
  factors.push({ label: `Rain chance ${rainChance}%`, contributing: rainLikely });
  if (rainHeavy) {
    score += 2;
    warnings.push('Rain and extended leaf wetness may create favourable conditions for disease development.');
  } else if (rainLikely) {
    score += 1;
    warnings.push('Rainfall today may extend leaf wetness duration and increase infection risk.');
  }

  const lowWind = windSpeedKmh < 10;
  factors.push({ label: `Wind ${Math.round(windSpeedKmh)} km/h`, contributing: lowWind && humidityHigh });
  if (lowWind && humidityHigh) {
    score += 1;
    warnings.push('Low wind speeds may reduce leaf drying and extend moisture on crop canopy.');
  }

  const soilWet = soilMoisture !== null && soilMoisture > 70;
  if (soilMoisture !== null) {
    factors.push({ label: `Soil moisture ${Math.round(soilMoisture)}%`, contributing: soilWet });
    if (soilWet) {
      score += 1;
    }
  }

  let level: DiseaseRiskLevel;
  if (score >= 5) {
    level = 'HIGH';
  } else if (score >= 3) {
    level = 'MODERATE';
  } else {
    level = 'LOW';
  }

  if (level === 'LOW') {
    warnings.length = 0;
    warnings.push('Conditions are currently low risk for disease spread.');
  }

  if (level === 'HIGH') {
    guidance.push('Monitor susceptible crops closely.');
    guidance.push('Check paddocks for early disease symptoms.');
    guidance.push('Review product labels and consult your agronomist before applying fungicides.');
  } else if (level === 'MODERATE') {
    guidance.push('Monitor susceptible crops closely.');
    guidance.push('Check paddocks for early disease symptoms.');
    guidance.push('Avoid unnecessary spraying if conditions are poor.');
  } else {
    guidance.push('Continue routine monitoring of crop health.');
    guidance.push('Avoid unnecessary spraying if conditions are poor.');
  }

  return { level, score, warnings, guidance, factors };
}
