import { X, Wind, Droplets, AlertTriangle, CheckCircle, Shield, Target, CloudRain } from 'lucide-react';

interface NozzleRecommendationProps {
  isOpen: boolean;
  onClose: () => void;
  windSpeed: number;
  deltaT: number;
  humidity: number;
  rainProbability: number;
  sprayWindowStart?: string;
  sprayWindowEnd?: string;
}

interface NozzleInfo {
  id: string;
  name: string;
  dropletSize: string;
  driftControl: number;
  coverage: number;
  pressureGuide: string;
  bestUse: string;
  pattern: 'wide' | 'narrow' | 'cone' | 'twin';
}

const NOZZLES: NozzleInfo[] = [
  {
    id: 'air-induction',
    name: 'Air Induction Nozzle',
    dropletSize: 'Coarse to Very Coarse',
    driftControl: 5,
    coverage: 3,
    pressureGuide: 'Lower to moderate pressure',
    bestUse: 'Drift reduction in breezy conditions',
    pattern: 'wide',
  },
  {
    id: 'low-drift',
    name: 'Low Drift Nozzle',
    dropletSize: 'Medium to Coarse',
    driftControl: 4,
    coverage: 3,
    pressureGuide: 'Moderate pressure',
    bestUse: 'Balanced drift control with good penetration',
    pattern: 'narrow',
  },
  {
    id: 'standard-flat-fan',
    name: 'Standard Flat Fan Nozzle',
    dropletSize: 'Medium',
    driftControl: 3,
    coverage: 4,
    pressureGuide: 'Moderate to higher pressure',
    bestUse: 'Good coverage in calmer conditions',
    pattern: 'wide',
  },
  {
    id: 'twin-fan',
    name: 'Twin Fan Nozzle',
    dropletSize: 'Medium to Fine',
    driftControl: 2,
    coverage: 5,
    pressureGuide: 'Moderate pressure',
    bestUse: 'Maximum coverage and penetration into canopy',
    pattern: 'twin',
  },
  {
    id: 'hollow-cone',
    name: 'Hollow Cone Nozzle',
    dropletSize: 'Fine to Medium',
    driftControl: 1,
    coverage: 5,
    pressureGuide: 'Higher pressure',
    bestUse: 'Fungicide and insecticide requiring fine coverage',
    pattern: 'cone',
  },
];

function getRecommendation(windSpeed: number) {
  if (windSpeed > 20) {
    return {
      primaryId: 'air-induction',
      reason: 'Wind is currently elevated, so drift reduction is the priority.',
      alternativeIds: ['low-drift', 'standard-flat-fan'],
    };
  } else if (windSpeed >= 10) {
    return {
      primaryId: 'low-drift',
      reason: 'Wind is moderate, so a balanced nozzle gives coverage while limiting drift.',
      alternativeIds: ['standard-flat-fan', 'air-induction'],
    };
  } else {
    return {
      primaryId: 'standard-flat-fan',
      reason: 'Lower wind allows better coverage without needing heavy drift reduction.',
      alternativeIds: ['twin-fan', 'air-induction'],
    };
  }
}

function getDeltaTWarning(deltaT: number): { color: string; text: string } | null {
  if (deltaT < 2) return { color: 'red', text: 'Possible inversion risk — avoid spraying unless confirmed safe.' };
  if (deltaT <= 4) return { color: 'yellow', text: 'Marginal Delta T — monitor conditions closely.' };
  if (deltaT <= 8) return { color: 'green', text: 'Delta T is within a suitable spraying range.' };
  return { color: 'red', text: 'High evaporation risk — avoid fine droplets and consider delaying.' };
}

function NozzleSVG({ pattern, isBest }: { pattern: NozzleInfo['pattern']; isBest: boolean }) {
  const accentColor = isBest ? '#4ade80' : '#94a3b8';
  const sprayColor = isBest ? 'rgba(74,222,128,0.15)' : 'rgba(148,163,184,0.12)';

  return (
    <svg viewBox="0 0 80 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Nozzle body */}
      <rect x="33" y="8" width="14" height="22" rx="3" fill="#334155" stroke={accentColor} strokeWidth="1.2" />
      <rect x="30" y="26" width="20" height="8" rx="2" fill="#475569" stroke={accentColor} strokeWidth="1" />
      <circle cx="40" cy="38" r="3" fill={accentColor} opacity="0.7" />

      {/* Spray pattern */}
      {pattern === 'wide' && (
        <>
          <path d="M40 41 L15 90 L65 90 Z" fill={sprayColor} stroke={accentColor} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.6" />
          <ellipse cx="40" cy="88" rx="24" ry="4" fill={accentColor} opacity="0.15" />
        </>
      )}
      {pattern === 'narrow' && (
        <>
          <path d="M40 41 L25 90 L55 90 Z" fill={sprayColor} stroke={accentColor} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.6" />
          <ellipse cx="40" cy="88" rx="14" ry="3" fill={accentColor} opacity="0.15" />
        </>
      )}
      {pattern === 'cone' && (
        <>
          <path d="M40 41 L20 85 L25 90 L55 90 L60 85 Z" fill="none" stroke={accentColor} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.6" />
          <ellipse cx="40" cy="88" rx="18" ry="4" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.4" />
          <ellipse cx="40" cy="88" rx="10" ry="2" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.3" />
        </>
      )}
      {pattern === 'twin' && (
        <>
          <path d="M38 41 L18 90 L42 90 Z" fill={sprayColor} stroke={accentColor} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
          <path d="M42 41 L38 90 L62 90 Z" fill={sprayColor} stroke={accentColor} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
          <ellipse cx="30" cy="88" rx="12" ry="3" fill={accentColor} opacity="0.1" />
          <ellipse cx="50" cy="88" rx="12" ry="3" fill={accentColor} opacity="0.1" />
        </>
      )}

      {/* Droplet indicators */}
      {pattern === 'wide' || pattern === 'narrow' ? (
        <>
          <circle cx="35" cy="60" r="2.5" fill={accentColor} opacity="0.3" />
          <circle cx="45" cy="55" r="3" fill={accentColor} opacity="0.25" />
          <circle cx="40" cy="70" r="2" fill={accentColor} opacity="0.3" />
          <circle cx="32" cy="75" r="2.8" fill={accentColor} opacity="0.2" />
          <circle cx="48" cy="68" r="2.2" fill={accentColor} opacity="0.25" />
        </>
      ) : (
        <>
          <circle cx="35" cy="60" r="1.5" fill={accentColor} opacity="0.4" />
          <circle cx="45" cy="55" r="1.2" fill={accentColor} opacity="0.35" />
          <circle cx="40" cy="70" r="1" fill={accentColor} opacity="0.4" />
          <circle cx="30" cy="72" r="1.3" fill={accentColor} opacity="0.3" />
          <circle cx="50" cy="65" r="1.1" fill={accentColor} opacity="0.35" />
          <circle cx="38" cy="80" r="1" fill={accentColor} opacity="0.3" />
          <circle cx="43" cy="78" r="0.8" fill={accentColor} opacity="0.35" />
        </>
      )}
    </svg>
  );
}

function RatingBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 w-3 rounded-full ${i < value ? color : 'bg-slate-700'}`}
        />
      ))}
    </div>
  );
}

export default function NozzleRecommendation({
  isOpen,
  onClose,
  windSpeed,
  deltaT,
  humidity,
  rainProbability,
  sprayWindowStart,
  sprayWindowEnd,
}: NozzleRecommendationProps) {
  if (!isOpen) return null;

  const recommendation = getRecommendation(windSpeed);
  const deltaTWarning = getDeltaTWarning(deltaT);
  const primaryNozzle = NOZZLES.find(n => n.id === recommendation.primaryId)!;
  const alternatives = NOZZLES.filter(n => recommendation.alternativeIds.includes(n.id));
  const otherNozzles = NOZZLES.filter(n => n.id !== recommendation.primaryId && !recommendation.alternativeIds.includes(n.id));

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/40 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Recommended Spray Nozzles</h2>
              <p className="text-xs text-slate-400 mt-0.5">Based on current conditions at your location</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current conditions strip */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/50 text-slate-300">
              <Wind className="w-3 h-3" /> {windSpeed.toFixed(0)} km/h wind
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/50 text-slate-300">
              <Droplets className="w-3 h-3" /> {humidity}% humidity
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/50 text-slate-300">
              <CloudRain className="w-3 h-3" /> {rainProbability}% rain chance
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/50 text-slate-300">
              Delta T: {deltaT.toFixed(1)}
            </span>
            {sprayWindowStart && sprayWindowEnd && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-300">
                Window: {sprayWindowStart} – {sprayWindowEnd}
              </span>
            )}
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Warnings */}
          <div className="space-y-2">
            {deltaTWarning && (
              <div className={`flex items-start gap-2.5 p-3 rounded-lg border ${
                deltaTWarning.color === 'red' ? 'bg-red-500/8 border-red-500/20' :
                deltaTWarning.color === 'yellow' ? 'bg-yellow-500/8 border-yellow-500/20' :
                'bg-green-500/8 border-green-500/20'
              }`}>
                {deltaTWarning.color === 'green' ? (
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${deltaTWarning.color === 'red' ? 'text-red-400' : 'text-yellow-400'}`} />
                )}
                <p className={`text-xs leading-relaxed ${
                  deltaTWarning.color === 'red' ? 'text-red-300' :
                  deltaTWarning.color === 'yellow' ? 'text-yellow-300' :
                  'text-green-300'
                }`}>{deltaTWarning.text}</p>
              </div>
            )}
            {rainProbability > 70 && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg border bg-red-500/8 border-red-500/20">
                <CloudRain className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 leading-relaxed">Rain likely — check chemical rainfast period before spraying and consider delaying.</p>
              </div>
            )}
          </div>

          {/* Primary recommendation */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">Best Match Today</p>
            <div className="relative p-4 rounded-xl bg-green-500/[0.04] border border-green-500/20">
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-300">
                  <CheckCircle className="w-3 h-3" /> Best Match
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-24 h-28 flex-shrink-0 mx-auto sm:mx-0">
                  <NozzleSVG pattern={primaryNozzle.pattern} isBest={true} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white mb-1">{primaryNozzle.name}</h3>
                  <p className="text-xs text-green-300/80 mb-3">{recommendation.reason}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Droplet Size</p>
                      <p className="text-xs text-slate-300 font-medium">{primaryNozzle.dropletSize}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Pressure</p>
                      <p className="text-xs text-slate-300 font-medium">{primaryNozzle.pressureGuide}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Drift Control</p>
                      <RatingBar value={primaryNozzle.driftControl} color="bg-green-400" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Coverage</p>
                      <RatingBar value={primaryNozzle.coverage} color="bg-blue-400" />
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-700/30">
                    <p className="text-[10px] text-slate-400"><span className="text-slate-500 font-medium">Best for:</span> {primaryNozzle.bestUse}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alternative recommendations */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">Alternative Options</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {alternatives.map(nozzle => (
                <div key={nozzle.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                  <div className="flex gap-3">
                    <div className="w-16 h-20 flex-shrink-0">
                      <NozzleSVG pattern={nozzle.pattern} isBest={false} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white mb-1">{nozzle.name}</h4>
                      <p className="text-[10px] text-slate-400 mb-2">{nozzle.dropletSize}</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-500">Drift</span>
                          <RatingBar value={nozzle.driftControl} color="bg-slate-400" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-500">Coverage</span>
                          <RatingBar value={nozzle.coverage} color="bg-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-700/30">{nozzle.bestUse}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Other nozzles reference */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">Other Nozzle Types</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {otherNozzles.map(nozzle => (
                <div key={nozzle.id} className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/20">
                  <div className="flex gap-3">
                    <div className="w-12 h-16 flex-shrink-0 opacity-60">
                      <NozzleSVG pattern={nozzle.pattern} isBest={false} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-slate-300">{nozzle.name}</h4>
                      <p className="text-[10px] text-slate-500">{nozzle.dropletSize}</p>
                      <div className="flex gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5 text-slate-600" />
                          <span className="text-[9px] text-slate-500">{nozzle.driftControl}/5</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-2.5 h-2.5 text-slate-600" />
                          <span className="text-[9px] text-slate-500">{nozzle.coverage}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Droplet size guide */}
          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-medium mb-2">Droplet Size Guide</p>
            <div className="flex items-center gap-1 justify-between">
              {['Fine', 'Medium', 'Coarse', 'Very Coarse'].map((size, i) => (
                <div key={size} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div
                        key={j}
                        className="rounded-full bg-slate-500"
                        style={{ width: `${4 + i * 3}px`, height: `${4 + i * 3}px`, opacity: 0.4 + i * 0.15 }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] text-slate-400">{size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="pt-3 border-t border-slate-700/30">
            <p className="text-[9px] text-slate-600 leading-relaxed text-center">
              FarmCast provides general spray setup guidance based on current weather conditions. Always follow chemical label directions, nozzle manufacturer guidance, and advice from a qualified agronomist.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
