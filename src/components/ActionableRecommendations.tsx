import { Sprout, Droplets, Wind, AlertTriangle, Sun, Tractor, Lock } from 'lucide-react';

interface RecommendationProps {
  locationName: string;
  windSpeedKmh: number;
  windGustKmh: number | null;
  windDirection: string;
  deltaT: number;
  deltaTRating: string;
  todayRainChance: number;
  todayExpectedRain: number;
  tempC: number;
  uvIndex: number;
  humidity: number;
  sprayWindowStart?: string;
  sprayWindowEnd?: string;
  isAuthenticated?: boolean;
  onSignUpClick?: () => void;
}

function heatIndex(tempC: number, humidity: number): number {
  if (tempC < 27) return tempC;
  const T = tempC, R = humidity;
  return -8.78469 + 1.61139 * T + 2.33855 * R - 0.14612 * T * R
    - 0.01231 * T * T - 0.01642 * R * R + 0.00221 * T * T * R
    + 0.00073 * T * R * R - 0.00000358 * T * T * R * R;
}

interface Recommendation {
  icon: React.ReactNode;
  category: string;
  status: 'good' | 'caution' | 'risk';
  statusLabel: string;
  reason: string;
}

function getRecommendations(props: RecommendationProps): Recommendation[] {
  const {
    windSpeedKmh,
    windGustKmh,
    windDirection,
    deltaT,
    deltaTRating,
    todayRainChance,
    todayExpectedRain,
    tempC,
    uvIndex,
    humidity,
    sprayWindowStart,
    sprayWindowEnd,
  } = props;

  const recs: Recommendation[] = [];

  const dangerousGust = windGustKmh !== null && windGustKmh > 40;
  const moderateGust = windGustKmh !== null && windGustKmh > 25 && windGustKmh <= 40;
  const heavyRain = todayRainChance > 70 && todayExpectedRain >= 10;
  const rainLikely = todayRainChance > 70 || todayExpectedRain >= 15;
  const excellentDeltaT = deltaTRating === 'Excellent' || deltaTRating === 'Good';
  const apparentTemp = heatIndex(tempC, humidity);

  let sprayStatus: 'good' | 'caution' | 'risk' = 'good';
  let sprayStatusLabel = '';
  let sprayReason = '';

  if (rainLikely) {
    sprayStatus = 'risk';
    sprayStatusLabel = todayRainChance > 70 ? 'Avoid spraying — rain likely' : 'High washoff risk today';
    sprayReason = `${todayRainChance}% rain chance, ${todayExpectedRain.toFixed(1)}mm forecast`;
  } else if (dangerousGust) {
    sprayStatus = 'risk';
    sprayStatusLabel = 'Do not spray — dangerous gusts';
    sprayReason = `${windDirection} gusts ${Math.round(windGustKmh!)} km/h — unacceptable drift risk`;
  } else if (moderateGust) {
    sprayStatus = 'caution';
    sprayStatusLabel = sprayWindowStart ? `Best window ${sprayWindowStart}–${sprayWindowEnd}` : 'Delay — gusts elevated';
    sprayReason = `${windDirection} gusts ${Math.round(windGustKmh!)} km/h — use low-drift nozzles`;
  } else if (excellentDeltaT) {
    sprayStatus = 'good';
    sprayStatusLabel = sprayWindowStart ? `Go ${sprayWindowStart}–${sprayWindowEnd}` : 'Conditions clear — proceed';
    sprayReason = `Delta T ${deltaT.toFixed(1)}° — ideal spray uptake`;
  } else {
    sprayStatus = 'caution';
    sprayStatusLabel = sprayWindowStart ? `Window ${sprayWindowStart}–${sprayWindowEnd}` : 'Monitor before spraying';
    sprayReason = `Delta T ${deltaT.toFixed(1)}° (${deltaTRating}), wind ${Math.round(windSpeedKmh)} km/h`;
  }

  recs.push({
    icon: <Wind className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    category: 'Spraying',
    status: sprayStatus,
    statusLabel: sprayStatusLabel,
    reason: sprayReason,
  });

  let irrigationStatus: 'good' | 'caution' | 'risk' = 'good';
  let irrigationStatusLabel = '';
  let irrigationReason = '';

  if (todayExpectedRain >= 20) {
    irrigationStatus = 'good';
    irrigationStatusLabel = 'Hold off — rain covers it';
    irrigationReason = `${todayExpectedRain.toFixed(0)}mm rainfall forecast today`;
  } else if (todayExpectedRain >= 5) {
    irrigationStatus = 'caution';
    irrigationStatusLabel = 'Minimal required today';
    irrigationReason = `${todayExpectedRain.toFixed(1)}mm rainfall forecast`;
  } else if (tempC > 28) {
    irrigationStatus = 'caution';
    irrigationStatusLabel = 'Irrigate this evening';
    irrigationReason = `Warm day ${Math.round(tempC)}°C — high evaporation loss`;
  } else {
    irrigationStatus = 'good';
    irrigationStatusLabel = 'Check soil moisture first';
    irrigationReason = 'Moderate conditions — irrigate as needed';
  }

  recs.push({
    icon: <Droplets className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    category: 'Irrigation',
    status: irrigationStatus,
    statusLabel: irrigationStatusLabel,
    reason: irrigationReason,
  });

  let livestockStatus: 'good' | 'caution' | 'risk' = 'good';
  let livestockStatusLabel = '';
  let livestockReason = '';

  if (heavyRain) {
    livestockStatus = 'caution';
    livestockStatusLabel = 'Shelter advised tonight';
    livestockReason = 'Heavy rain and wet paddocks expected';
  } else if (apparentTemp > 32 || (tempC > 28 && humidity > 70)) {
    livestockStatus = 'caution';
    livestockStatusLabel = 'Shade and water essential';
    livestockReason = apparentTemp > 32
      ? `Apparent temp ${Math.round(apparentTemp)}°C — heat stress risk for cattle`
      : `${Math.round(tempC)}°C at ${humidity}% humidity — heat stress conditions`;
  } else {
    livestockStatus = 'good';
    livestockStatusLabel = 'Good grazing conditions';
    livestockReason = 'Routine checks only required';
  }

  recs.push({
    icon: <Tractor className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    category: 'Livestock',
    status: livestockStatus,
    statusLabel: livestockStatusLabel,
    reason: livestockReason,
  });

  let croppingStatus: 'good' | 'caution' | 'risk' = 'good';
  let croppingStatusLabel = '';
  let croppingReason = '';

  if (heavyRain && dangerousGust) {
    croppingStatus = 'risk';
    croppingStatusLabel = 'Avoid all fieldwork today';
    croppingReason = 'Heavy rain and dangerous gusts — check drainage channels';
  } else if (heavyRain) {
    croppingStatus = 'caution';
    croppingStatusLabel = 'Delay cultivation and harvest';
    croppingReason = `${todayExpectedRain.toFixed(0)}mm expected — good for winter cereals`;
  } else if (dangerousGust || moderateGust) {
    croppingStatus = 'caution';
    croppingStatusLabel = 'Delay seedbed preparation';
    croppingReason = `Gusts ${Math.round(windGustKmh!)} km/h — peak risk this afternoon`;
  } else {
    croppingStatus = 'good';
    croppingStatusLabel = 'Good field conditions';
    croppingReason = tempC > 22 ? 'Warm temps aid crop development' : 'Ideal for transplanting and soil prep';
  }

  recs.push({
    icon: <Sprout className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    category: 'Cropping',
    status: croppingStatus,
    statusLabel: croppingStatusLabel,
    reason: croppingReason,
  });

  const generalStatus: 'good' | 'caution' | 'risk' = uvIndex >= 11 ? 'risk' : uvIndex >= 6 ? 'caution' : 'good';
  const generalStatusLabel = uvIndex >= 11 ? 'Extreme UV — limit outdoor exposure'
    : uvIndex >= 8 ? 'Sun protection essential'
    : uvIndex >= 3 ? 'Some protection advised'
    : 'Low UV — no concerns';
  const generalReason = uvIndex >= 11
    ? `UV ${Math.round(uvIndex)} (Extreme) — cover up, limit midday work`
    : uvIndex >= 6
    ? `UV ${Math.round(uvIndex)} (${uvIndex >= 8 ? 'Very High' : 'High'}) for outdoor workers`
    : windSpeedKmh > 20 ? `UV ${Math.round(uvIndex)} — watch for wind shifts` : `UV ${Math.round(uvIndex)} — routine conditions`;

  recs.push({
    icon: <Sun className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    category: 'General',
    status: generalStatus,
    statusLabel: generalStatusLabel,
    reason: generalReason,
  });

  return recs;
}

const statusConfig = {
  good: {
    dot: 'bg-green-400',
    border: 'border-green-500/20',
    bg: 'bg-green-500/5',
    category: 'text-slate-400',
    statusLabel: 'text-green-300',
    icon: 'text-green-400',
    statusIcon: '✅',
  },
  caution: {
    dot: 'bg-amber-400',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    category: 'text-slate-400',
    statusLabel: 'text-amber-200',
    icon: 'text-amber-400',
    statusIcon: '⚠',
  },
  risk: {
    dot: 'bg-red-400',
    border: 'border-red-500/20',
    bg: 'bg-red-500/5',
    category: 'text-slate-400',
    statusLabel: 'text-red-200',
    icon: 'text-red-400',
    statusIcon: '❌',
  },
};

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const cfg = statusConfig[rec.status];
  return (
    <div
      className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex-shrink-0 ${cfg.icon}`}>
          {rec.icon}
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider ${cfg.category}`}>{rec.category}</span>
      </div>
      <div className={`text-sm font-semibold mb-1 leading-snug ${cfg.statusLabel}`}>
        {cfg.statusIcon} {rec.statusLabel}
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{rec.reason}</p>
    </div>
  );
}

export function ActionableRecommendations(props: RecommendationProps) {
  const { isAuthenticated = false, onSignUpClick } = props;
  const recommendations = getRecommendations(props);
  const hasRisk = recommendations.some(r => r.status === 'risk');
  const hasCaution = recommendations.some(r => r.status === 'caution');

  const headerStatus = hasRisk ? 'risk' : hasCaution ? 'caution' : 'good';
  const headerColors = {
    good: 'text-green-400 border-green-500/30',
    caution: 'text-amber-400 border-amber-500/30',
    risk: 'text-red-400 border-red-500/30',
  };

  const visibleRecs = isAuthenticated ? recommendations : recommendations.slice(0, 1);
  const lockedRecs = isAuthenticated ? [] : recommendations.slice(1);

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm shadow-2xl overflow-hidden farmcast-card-glow">
      <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <AlertTriangle className={`w-5 h-5 ${headerColors[headerStatus].split(' ')[0]}`} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Today's Farm Recommendations</h2>
            <p className="text-xs text-slate-500 mt-0.5">{props.locationName} — decision guide based on current conditions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasRisk && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">Action Required</span>}
          {!hasRisk && hasCaution && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">Caution Advised</span>}
          {!hasRisk && !hasCaution && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/15 text-green-300 border border-green-500/30">All Clear</span>}
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {visibleRecs.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} />
          ))}
        </div>

        {!isAuthenticated && lockedRecs.length > 0 && (
          <div className="relative mt-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 select-none pointer-events-none" aria-hidden="true">
              {lockedRecs.map((rec, i) => (
                <div key={i} className="rounded-xl border border-slate-700/30 bg-slate-800/20 p-4 blur-[3px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-shrink-0 text-slate-500">{rec.icon}</div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{rec.category}</span>
                  </div>
                  <div className="text-sm font-semibold mb-1 text-slate-400">{rec.statusLabel}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{rec.reason}</p>
                </div>
              ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative z-10 bg-slate-900/95 border border-slate-600/60 rounded-2xl p-6 shadow-2xl backdrop-blur-sm max-w-sm w-full mx-4 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <h3 className="text-white font-bold text-base mb-1">Unlock All Recommendations</h3>
                <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                  Sign up free to access irrigation, livestock, cropping, and general farm recommendations tailored to your conditions.
                </p>
                <button
                  onClick={onSignUpClick}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-green-900/30 hover:shadow-green-900/50"
                >
                  Sign Up Free
                </button>
                <p className="text-slate-600 text-xs mt-2">No credit card required</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
