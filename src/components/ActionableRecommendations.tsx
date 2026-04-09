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

interface Recommendation {
  icon: React.ReactNode;
  category: string;
  status: 'good' | 'caution' | 'risk';
  text: string;
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
    sprayWindowStart,
    sprayWindowEnd,
  } = props;

  const recs: Recommendation[] = [];

  const highGust = windGustKmh && windGustKmh > 40;
  const heavyRain = todayRainChance > 70 || todayExpectedRain >= 15;
  const excellentDeltaT = deltaTRating === 'Excellent' || deltaTRating === 'Good';

  let sprayStatus: 'good' | 'caution' | 'risk' = 'good';
  let sprayText = '';

  if (heavyRain) {
    sprayStatus = 'risk';
    sprayText = `Heavy rain likely (${todayExpectedRain.toFixed(1)} mm) — avoid all spraying today. Products will be washed off before uptake.`;
  } else if (highGust) {
    sprayStatus = 'caution';
    sprayText = `Strong ${windDirection} gusts (${Math.round(windGustKmh!)} km/h) increase drift risk. ${excellentDeltaT ? `Delta T is excellent (${deltaT.toFixed(1)}°). ` : ''}${sprayWindowStart ? `Best window ${sprayWindowStart}–${sprayWindowEnd} if wind drops — use low-drift nozzles.` : 'Delay non-essential applications.'}`;
  } else if (excellentDeltaT) {
    sprayStatus = 'good';
    sprayText = `Excellent Delta T (${deltaT.toFixed(1)}°) for spray uptake. Wind ${Math.round(windSpeedKmh)} km/h ${windDirection}.${sprayWindowStart ? ` Best window ${sprayWindowStart}–${sprayWindowEnd}.` : ''} Ideal conditions — proceed with planned applications.`;
  } else {
    sprayStatus = 'caution';
    sprayText = `Delta T ${deltaT.toFixed(1)}° (${deltaTRating}). Wind ${Math.round(windSpeedKmh)} km/h. ${sprayWindowStart ? `Spray window ${sprayWindowStart}–${sprayWindowEnd}.` : 'Monitor conditions before spraying.'}`;
  }

  recs.push({
    icon: <Wind className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    category: 'Spraying',
    status: sprayStatus,
    text: sprayText,
  });

  let irrigationStatus: 'good' | 'caution' | 'risk' = 'good';
  let irrigationText = '';

  if (todayExpectedRain >= 20) {
    irrigationStatus = 'good';
    irrigationText = `${todayExpectedRain.toFixed(0)} mm rain expected — hold off on all irrigation. Excellent soaking for dairy pasture, vegetables, and grain crops.`;
  } else if (todayExpectedRain >= 5) {
    irrigationStatus = 'caution';
    irrigationText = `${todayExpectedRain.toFixed(1)} mm forecast. Light top-up only if needed. Good for pasture recovery.`;
  } else if (tempC > 28) {
    irrigationStatus = 'caution';
    irrigationText = `Warm day (${Math.round(tempC)}°C) with minimal rain. High ETo — irrigate established crops this evening or early morning to minimise evaporation loss.`;
  } else {
    irrigationStatus = 'good';
    irrigationText = `Moderate conditions. Irrigate based on soil moisture readings. Check tensiometers before applying.`;
  }

  recs.push({
    icon: <Droplets className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    category: 'Irrigation / Pasture',
    status: irrigationStatus,
    text: irrigationText,
  });

  let livestockStatus: 'good' | 'caution' | 'risk' = 'good';
  let livestockText = '';

  if (heavyRain) {
    livestockStatus = 'caution';
    livestockText = `Heavy rain expected. Monitor paddock access and soil poaching — move stock from low-lying or wet paddocks before heavy rain arrives. Check shelter availability.`;
  } else if (tempC > 32) {
    livestockStatus = 'caution';
    livestockText = `Hot day (${Math.round(tempC)}°C) — ensure shade and fresh water access. Dairy cows may show heat stress above 28°C. Avoid mustering in the heat of the day.`;
  } else {
    livestockStatus = 'good';
    livestockText = `Conditions favourable for livestock. Good grazing weather. Routine checks only required.`;
  }

  recs.push({
    icon: <Tractor className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    category: 'Livestock / Dairy',
    status: livestockStatus,
    text: livestockText,
  });

  let croppingStatus: 'good' | 'caution' | 'risk' = 'good';
  let croppingText = '';

  if (heavyRain && highGust) {
    croppingStatus = 'risk';
    croppingText = `Heavy rain and strong gusts forecast — avoid all fieldwork. Check drainage on low-lying vegetable beds and protect any young transplants. Possible thunderstorm activity.`;
  } else if (heavyRain) {
    croppingStatus = 'caution';
    croppingText = `${todayExpectedRain.toFixed(0)} mm rain expected. Delay cultivation and harvesting. Good for winter cereals and establishing pasture. Ensure drainage channels are clear.`;
  } else if (highGust) {
    croppingStatus = 'caution';
    croppingText = `Strong gusts (${Math.round(windGustKmh!)} km/h) — delay fine seedbed preparation. Avoid harvesting in windy conditions. Peak gust risk this afternoon.`;
  } else {
    croppingStatus = 'good';
    croppingText = `Good conditions for field operations. ${tempC > 22 ? 'Warm temperatures aid crop development and plant establishment.' : 'Moderate temperatures — ideal for transplanting and soil preparation.'}`;
  }

  recs.push({
    icon: <Sprout className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    category: 'Cropping / Horticulture',
    status: croppingStatus,
    text: croppingText,
  });

  const uvNote = uvIndex >= 6 ? `UV ${Math.round(uvIndex)} (${uvIndex >= 8 ? 'Very High' : 'High'}) — sun protection essential for outdoor workers.` : uvIndex >= 3 ? `UV ${Math.round(uvIndex)} (Moderate) — some protection recommended if working outdoors.` : `UV ${Math.round(uvIndex)} (Low) today.`;
  const gippslandNote = windSpeedKmh > 20 ? ` Watch for sudden wind shifts — common in Gippsland coastal areas.` : '';

  recs.push({
    icon: <Sun className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    category: 'General',
    status: uvIndex >= 8 ? 'caution' : 'good',
    text: `${uvNote}${gippslandNote}`,
  });

  return recs;
}

const statusConfig = {
  good: {
    dot: 'bg-green-400',
    border: 'border-green-500/20',
    bg: 'bg-green-500/5',
    category: 'text-green-300',
    icon: 'text-green-400',
  },
  caution: {
    dot: 'bg-amber-400',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    category: 'text-amber-300',
    icon: 'text-amber-400',
  },
  risk: {
    dot: 'bg-red-400',
    border: 'border-red-500/20',
    bg: 'bg-red-500/5',
    category: 'text-red-300',
    icon: 'text-red-400',
  },
};

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const cfg = statusConfig[rec.status];
  return (
    <div
      className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg group`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex-shrink-0 ${cfg.icon}`}>
          {rec.icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs font-bold uppercase tracking-wider ${cfg.category}`}>{rec.category}</span>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${rec.status === 'risk' ? 'animate-pulse' : ''}`} />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{rec.text}</p>
        </div>
      </div>
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
            <RecommendationCard key={i} rec={rec} index={i} />
          ))}
        </div>

        {!isAuthenticated && lockedRecs.length > 0 && (
          <div className="relative mt-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 select-none pointer-events-none" aria-hidden="true">
              {lockedRecs.map((rec, i) => (
                <div key={i} className="rounded-xl border border-slate-700/30 bg-slate-800/20 p-4 blur-[3px]">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0 text-slate-500">{rec.icon}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{rec.category}</span>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-500" />
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">{rec.text}</p>
                    </div>
                  </div>
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
