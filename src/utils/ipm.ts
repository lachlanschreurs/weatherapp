export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export type SpraySuitability = 'suitable' | 'marginal' | 'unsuitable';

export interface IPMWeatherContext {
  tempC: number;
  humidity: number;
  windSpeedKmh: number;
  windGustKmh: number | null;
  windDirection: string;
  deltaT: number;
  deltaTRating: string;
  todayRainChance: number;
  todayExpectedRain: number;
  currentRainfall: number;
  sprayWindowStart?: string;
  sprayWindowEnd?: string;
}

export interface ScoutGuidance {
  where: string;
  symptoms: string;
  checkCount: string;
  recheck: string;
}

export interface SpraySuitabilityResult {
  rating: SpraySuitability;
  bestWindow: string;
  avoidWindow: string;
  driftRisk: string;
  rainfastnessRisk: string;
  details: string;
}

export interface IPMPlan {
  issueType: 'pest' | 'disease' | 'weed' | 'deficiency' | 'general';
  issueName: string;
  riskLevel: RiskLevel;
  riskReason: string;
  nextAction: string;
  scout: ScoutGuidance;
  nonChemicalActions: string[];
  biologicalNotes: string[];
  chemicalDecision: string;
  resistanceNotes: string[];
  spraySuitability: SpraySuitabilityResult | null;
}

export const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; dot: string }> = {
  low:      { label: 'Low Risk',      color: 'text-green-300',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  dot: 'bg-green-400' },
  moderate: { label: 'Monitor',       color: 'text-amber-300',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  dot: 'bg-amber-400' },
  high:     { label: 'Action Needed', color: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dot: 'bg-orange-400' },
  severe:   { label: 'Urgent',        color: 'text-red-300',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    dot: 'bg-red-400' },
};

export const IPM_DISCLAIMER = 'FarmCast Agronomy Advisor and IPM guidance is general decision-support only. Always confirm pest, disease, weed, crop stage, chemical registration, rates, withholding periods, resistance groups, regional restrictions and safety directions using official product labels, APVMA information, and advice from a qualified agronomist. FarmCast does not replace professional agronomic advice.';

function assessSpraySuitability(weather: IPMWeatherContext): SpraySuitabilityResult {
  const { deltaT, deltaTRating, windSpeedKmh, windGustKmh, windDirection, todayRainChance, todayExpectedRain, currentRainfall, sprayWindowStart, sprayWindowEnd } = weather;

  let rating: SpraySuitability = 'suitable';
  const issues: string[] = [];

  if (currentRainfall > 0) {
    rating = 'unsuitable';
    issues.push('currently raining');
  }
  if (windSpeedKmh > 25) {
    rating = 'unsuitable';
    issues.push(`wind ${Math.round(windSpeedKmh)} km/h exceeds safe limit`);
  } else if (windSpeedKmh > 15) {
    if (rating !== 'unsuitable') rating = 'marginal';
    issues.push(`moderate wind ${Math.round(windSpeedKmh)} km/h`);
  }
  if (deltaT < 2 || deltaT > 8) {
    if (rating !== 'unsuitable') rating = 'marginal';
    issues.push(`Delta T ${deltaT.toFixed(1)} (${deltaTRating})`);
  }
  if (todayRainChance > 70) {
    if (rating !== 'unsuitable') rating = 'marginal';
    issues.push(`${todayRainChance}% rain chance`);
  }

  let driftRisk = 'Low';
  if (windSpeedKmh > 20 || (windGustKmh && windGustKmh > 30)) {
    driftRisk = 'High — use low-drift nozzles or delay';
  } else if (windSpeedKmh > 10) {
    driftRisk = 'Moderate — consider buffer zones';
  }

  let rainfastnessRisk = 'Low';
  if (todayRainChance > 60 && todayExpectedRain > 5) {
    rainfastnessRisk = 'High — check product rainfastness period before applying';
  } else if (todayRainChance > 40) {
    rainfastnessRisk = 'Moderate — monitor forecast closely';
  }

  const bestWindow = sprayWindowStart && sprayWindowEnd
    ? `${sprayWindowStart} - ${sprayWindowEnd}`
    : rating === 'suitable' ? 'Current conditions acceptable' : 'No suitable window identified';

  const avoidWindow = currentRainfall > 0
    ? 'Now — active rainfall'
    : windSpeedKmh > 25 ? 'Now — excessive wind' : deltaT < 2 ? 'Now — temperature inversion risk' : 'Check hourly forecast for unsuitable periods';

  return {
    rating,
    bestWindow,
    avoidWindow,
    driftRisk,
    rainfastnessRisk,
    details: issues.length > 0 ? issues.join('; ') : 'Conditions favourable for application',
  };
}

export function generatePestIPM(
  pestName: string,
  affectedCrops: string[],
  damageInfo: string,
  sprayThreshold: string,
  monitoringNotes: string,
  hasChemicals: boolean,
  weather?: IPMWeatherContext,
): IPMPlan {
  const riskLevel = resolveRisk(weather, 'pest');
  const scout = buildScoutGuidance('pest', pestName, affectedCrops, monitoringNotes);

  return {
    issueType: 'pest',
    issueName: pestName,
    riskLevel,
    riskReason: buildRiskReason(riskLevel, 'pest', weather),
    nextAction: buildNextAction(riskLevel, 'pest', sprayThreshold, weather),
    scout,
    nonChemicalActions: [
      'Remove heavily infested plant material where practical',
      'Improve crop hygiene between seasons',
      'Crop rotation to break pest lifecycle',
      'Reduce harbourage sites near crop borders',
      'Increase monitoring frequency in warm, humid conditions',
    ],
    biologicalNotes: [
      'Protect beneficial insects — avoid unnecessary broad-spectrum sprays',
      'Monitor predator-to-pest balance before intervening',
      'Consider biological controls where commercially available',
      'Avoid disrupting natural enemy populations with early chemical applications',
    ],
    chemicalDecision: hasChemicals
      ? 'Chemical control may be required if action thresholds are exceeded. Check APVMA registration, crop label, rates, withholding periods, resistance group, regional restrictions and local agronomist advice before spraying.'
      : 'No registered chemical options listed. Consult your agronomist for current treatment recommendations.',
    resistanceNotes: [
      'Rotate chemical groups between applications',
      'Avoid repeated use of the same mode of action',
      'Combine chemical and non-chemical controls',
      'Follow label resistance management strategy',
    ],
    spraySuitability: weather ? assessSpraySuitability(weather) : null,
  };
}

export function generateDiseaseIPM(
  diseaseName: string,
  affectedCrops: string[],
  symptoms: string,
  conditions: string,
  hasChemicals: boolean,
  weather?: IPMWeatherContext,
): IPMPlan {
  const riskLevel = resolveRisk(weather, 'disease');
  const scout = buildScoutGuidance('disease', diseaseName, affectedCrops, symptoms);

  return {
    issueType: 'disease',
    issueName: diseaseName,
    riskLevel,
    riskReason: buildRiskReason(riskLevel, 'disease', weather),
    nextAction: buildNextAction(riskLevel, 'disease', '', weather),
    scout,
    nonChemicalActions: [
      'Remove and destroy affected plant material',
      'Improve airflow through canopy management or spacing',
      'Adjust irrigation timing to reduce leaf wetness duration',
      'Manage crop residue between seasons',
      'Practise crop rotation with non-host species',
      'Increase monitoring frequency during favourable disease conditions',
    ],
    biologicalNotes: [
      'Consider biological fungicides where registered and available',
      'Maintain beneficial soil microbiome through organic matter management',
      'Avoid overapplication of fertiliser that promotes susceptible new growth',
    ],
    chemicalDecision: hasChemicals
      ? 'Chemical control may be required if disease pressure increases beyond economic threshold. Check APVMA registration, crop label, rates, withholding periods, resistance group, regional restrictions and local agronomist advice before spraying.'
      : 'No registered chemical options listed. Consult your agronomist for current treatment recommendations.',
    resistanceNotes: [
      'Rotate fungicide groups between applications',
      'Avoid repeated use of the same mode of action within a season',
      'Use tank mixtures with different modes of action where label permits',
      'Follow label resistance management strategy',
    ],
    spraySuitability: weather ? assessSpraySuitability(weather) : null,
  };
}

export function generateWeedIPM(
  weedName: string,
  environments: string[],
  controlMethods: string,
  resistanceGroup: string,
  hasChemicals: boolean,
  weather?: IPMWeatherContext,
): IPMPlan {
  const riskLevel = resolveRisk(weather, 'weed');
  const scout = buildScoutGuidance('weed', weedName, environments, controlMethods);

  return {
    issueType: 'weed',
    issueName: weedName,
    riskLevel,
    riskReason: buildRiskReason(riskLevel, 'weed', weather),
    nextAction: buildNextAction(riskLevel, 'weed', '', weather),
    scout,
    nonChemicalActions: [
      'Hand-remove or cultivate small infestations before seed set',
      'Maintain competitive crop canopy to suppress weed establishment',
      'Manage field edges and borders to reduce seed ingress',
      'Clean equipment between paddocks to prevent seed spread',
      'Consider cover crops or mulching in fallow periods',
    ],
    biologicalNotes: [
      'Avoid broad-spectrum herbicides that eliminate competitive beneficial vegetation',
      'Consider integrated approaches combining cultural and mechanical control',
    ],
    chemicalDecision: hasChemicals
      ? `Chemical control may be required for established populations.${resistanceGroup ? ` Resistance group: ${resistanceGroup}.` : ''} Check APVMA registration, crop label, rates, withholding periods, resistance group, regional restrictions and local agronomist advice before spraying.`
      : 'No registered chemical options listed. Consult your agronomist for current treatment recommendations.',
    resistanceNotes: [
      'Rotate herbicide groups between applications and seasons',
      resistanceGroup ? `Current resistance group: ${resistanceGroup} — rotate with different modes of action` : 'Check herbicide resistance group before each application',
      'Avoid repeated use of the same herbicide group in consecutive applications',
      'Combine chemical control with cultural and mechanical methods',
    ],
    spraySuitability: weather ? assessSpraySuitability(weather) : null,
  };
}

export function generateGenericIPM(
  issueName: string,
  issueType: 'deficiency' | 'general',
  weather?: IPMWeatherContext,
): IPMPlan {
  const riskLevel = resolveRisk(weather, 'general');

  return {
    issueType,
    issueName,
    riskLevel,
    riskReason: buildRiskReason(riskLevel, 'general', weather),
    nextAction: `Scout crop and assess ${issueName.toLowerCase()} severity before taking action`,
    scout: {
      where: 'Inspect representative areas across the paddock including edges, midfield and stressed patches',
      symptoms: `Look for visual indicators consistent with ${issueName.toLowerCase()}`,
      checkCount: 'Assess at least 10 plants or a minimum of 5 locations',
      recheck: 'Re-inspect within 48 hours if conditions remain favourable',
    },
    nonChemicalActions: [
      'Address underlying crop nutrition or stress factors',
      'Review irrigation scheduling and drainage',
      'Improve soil health through organic matter management',
      'Increase monitoring frequency',
    ],
    biologicalNotes: [
      'Consider soil biology testing where nutrient uptake is impaired',
      'Maintain balanced nutrition to support plant resilience',
    ],
    chemicalDecision: 'Consult your agronomist for specific treatment recommendations based on confirmed diagnosis.',
    resistanceNotes: [],
    spraySuitability: weather ? assessSpraySuitability(weather) : null,
  };
}

function resolveRisk(weather: IPMWeatherContext | undefined, type: string): RiskLevel {
  if (!weather) return 'moderate';

  const { tempC, humidity, todayRainChance, todayExpectedRain, windSpeedKmh } = weather;

  let score = 0;

  if (type === 'disease') {
    if (humidity > 85) score += 3;
    else if (humidity > 70) score += 2;
    if (tempC > 15 && tempC < 28 && humidity > 75) score += 2;
    if (todayRainChance > 70) score += 2;
    if (todayExpectedRain > 5) score += 1;
  } else if (type === 'pest') {
    if (tempC > 20 && tempC < 35) score += 2;
    if (humidity > 60) score += 1;
    if (windSpeedKmh < 10) score += 1;
  } else if (type === 'weed') {
    if (todayExpectedRain > 5) score += 2;
    if (tempC > 15 && tempC < 30) score += 1;
    if (humidity > 50) score += 1;
  } else {
    if (tempC > 30 || tempC < 5) score += 2;
    if (humidity < 30 || humidity > 90) score += 1;
  }

  if (score >= 6) return 'severe';
  if (score >= 4) return 'high';
  if (score >= 2) return 'moderate';
  return 'low';
}

function buildRiskReason(level: RiskLevel, type: string, weather?: IPMWeatherContext): string {
  if (!weather) return 'Risk level based on general conditions. Check local observations.';

  const parts: string[] = [];

  if (type === 'disease') {
    if (weather.humidity > 85) parts.push(`high humidity (${weather.humidity}%)`);
    if (weather.todayRainChance > 70) parts.push(`rain likely (${weather.todayRainChance}%)`);
    if (weather.tempC > 15 && weather.tempC < 28) parts.push(`temperature ${Math.round(weather.tempC)}C favours development`);
  } else if (type === 'pest') {
    if (weather.tempC > 20) parts.push(`warm conditions (${Math.round(weather.tempC)}C) favour activity`);
    if (weather.humidity > 60) parts.push(`humid (${weather.humidity}%)`);
  } else if (type === 'weed') {
    if (weather.todayExpectedRain > 5) parts.push(`rainfall expected (${weather.todayExpectedRain.toFixed(1)}mm) promotes growth`);
    if (weather.tempC > 15 && weather.tempC < 30) parts.push(`growth conditions favourable`);
  }

  if (parts.length === 0) parts.push('Current conditions assessed');
  return parts.join('; ');
}

function buildNextAction(level: RiskLevel, type: string, threshold: string, weather?: IPMWeatherContext): string {
  if (level === 'severe') {
    if (type === 'disease') return 'Conditions strongly favour disease development — scout immediately and consider preventative action';
    if (type === 'pest') return 'High pest pressure conditions — inspect crop today before making spray decisions';
    return 'Urgent attention required — assess crop condition today';
  }

  if (level === 'high') {
    if (threshold) return `Monitor against threshold: ${threshold}`;
    if (weather?.todayRainChance && weather.todayRainChance > 70) return 'Conditions favour outbreak overnight — scout early tomorrow morning';
    return 'Scout crop today and reassess within 24-48 hours';
  }

  if (level === 'moderate') {
    if (weather?.sprayWindowStart) return `Monitor crop. If thresholds are reached, spray window available ${weather.sprayWindowStart} - ${weather.sprayWindowEnd}`;
    return 'Monitor again in 24-48 hours';
  }

  return 'Routine monitoring — re-check in 3-5 days';
}

function buildScoutGuidance(type: string, name: string, cropsOrEnvs: string[], extraInfo: string): ScoutGuidance {
  const cropList = cropsOrEnvs.slice(0, 3).join(', ');

  if (type === 'pest') {
    return {
      where: `Inspect ${cropList ? cropList + ' paddocks' : 'affected crops'} — focus on field edges, sheltered areas and recently emerged growth`,
      symptoms: extraInfo || `Look for feeding damage, frass, and live individuals of ${name}`,
      checkCount: 'Check at least 10 plants across 5 locations in each paddock',
      recheck: 'Re-inspect in 24-48 hours if pest numbers are near threshold',
    };
  }

  if (type === 'disease') {
    return {
      where: `Inspect lower canopy and areas of poor airflow in ${cropList ? cropList : 'affected crops'}`,
      symptoms: extraInfo || `Look for lesions, discolouration, wilting or fruiting bodies consistent with ${name}`,
      checkCount: 'Assess at least 20 leaves or plants across 5 representative locations',
      recheck: 'Re-inspect in 24-48 hours — disease can progress rapidly in favourable conditions',
    };
  }

  if (type === 'weed') {
    return {
      where: `Scout ${cropList ? cropList + ' fields' : 'affected areas'} — check field edges, headlands and thin crop areas`,
      symptoms: `Identify growth stage of ${name} — timing affects control options`,
      checkCount: 'Walk a W-pattern across the paddock, recording density at 5-10 locations',
      recheck: 'Re-assess before seed set — control is most effective at early growth stages',
    };
  }

  return {
    where: 'Inspect representative areas across the paddock',
    symptoms: `Look for visual indicators consistent with ${name}`,
    checkCount: 'Assess at least 10 plants across 5 locations',
    recheck: 'Re-inspect within 48 hours',
  };
}
