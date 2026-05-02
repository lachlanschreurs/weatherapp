import { useState, useMemo } from 'react';
import { CheckCircle, AlertTriangle, Clock, Droplets, Wind, Thermometer, Sun, Sprout, TrendingUp, Shield, Zap, ChevronDown, Bug } from 'lucide-react';
import type { SprayWindow } from '../utils/sprayWindow';
import { assessDiseaseRisk, type DiseaseRiskLevel } from '../utils/diseaseRisk';

interface TodayAction {
  type: 'do' | 'avoid' | 'next';
  icon: React.ReactNode;
  text: string;
  detail?: string;
}

interface RiskAlert {
  severity: 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  action: string;
}

interface Props {
  tempC: number;
  humidity: number;
  windSpeedKmh: number;
  windGustKmh: number;
  deltaT: number;
  deltaTRating: string;
  todayBestWindow: SprayWindow | null;
  todayRainChance: number;
  todayExpectedRain: number;
  rainfall: number;
  frostRisk: boolean;
  frostWarning: boolean;
  soilMoisture: number | null;
  soilTempC: number | null;
  uvIndex: number;
  daysWithoutRain?: number;
}

type ExpandedPanel = 'spray' | 'farm' | null;

function getTimeUntilWindow(windowStart: string): { hours: number; minutes: number } | null {
  const now = new Date();
  const match = windowStart.match(/(\d+):(\d+)\s*(am|pm)/i);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toLowerCase();

  if (period === 'pm' && hours !== 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;

  const windowDate = new Date(now);
  windowDate.setHours(hours, minutes, 0, 0);

  const diffMs = windowDate.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  return {
    hours: Math.floor(diffMs / (1000 * 60 * 60)),
    minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
  };
}

function generateActions(props: Props): TodayAction[] {
  const actions: TodayAction[] = [];
  const { tempC, windSpeedKmh, windGustKmh, deltaTRating, todayBestWindow, todayRainChance, todayExpectedRain, frostRisk, soilMoisture, uvIndex } = props;

  if (todayBestWindow && (todayBestWindow.rating === 'Good' || todayBestWindow.rating === 'Moderate')) {
    actions.push({
      type: 'do',
      icon: <CheckCircle className="w-4 h-4" />,
      text: `Best spray window: ${todayBestWindow.startTime} – ${todayBestWindow.endTime}`,
      detail: todayBestWindow.rating === 'Good' ? 'Ideal Delta T and wind conditions' : 'Moderate conditions — check drift risk',
    });
  }

  if (soilMoisture !== null && soilMoisture < 25) {
    actions.push({
      type: 'do',
      icon: <Droplets className="w-4 h-4" />,
      text: 'Irrigation recommended within 24–48 hours',
      detail: `Soil moisture at ${soilMoisture.toFixed(0)}% — dropping below optimal range`,
    });
  } else if (soilMoisture !== null && soilMoisture >= 25) {
    actions.push({
      type: 'do',
      icon: <CheckCircle className="w-4 h-4" />,
      text: 'Irrigation not required today',
      detail: 'Soil moisture adequate for current crop stage',
    });
  }

  if (tempC >= 15 && tempC <= 30 && windSpeedKmh < 15 && todayRainChance < 30) {
    actions.push({
      type: 'do',
      icon: <Sprout className="w-4 h-4" />,
      text: 'Good planting/sowing conditions today',
      detail: 'Calm wind, low rain risk, suitable temperatures',
    });
  }

  if (windGustKmh > 25) {
    const gustTime = windGustKmh > 35 ? 'all day' : 'after wind picks up';
    actions.push({
      type: 'avoid',
      icon: <Wind className="w-4 h-4" />,
      text: `Avoid spraying ${gustTime} (gusts ${Math.round(windGustKmh)} km/h)`,
      detail: 'High drift risk and reduced efficacy',
    });
  }

  if (todayRainChance > 60) {
    actions.push({
      type: 'avoid',
      icon: <Droplets className="w-4 h-4" />,
      text: `Avoid foliar applications (${todayRainChance}% rain chance)`,
      detail: 'Products may wash off before absorption',
    });
  }

  if (deltaTRating === 'Too Low') {
    actions.push({
      type: 'avoid',
      icon: <AlertTriangle className="w-4 h-4" />,
      text: 'Avoid spraying — Delta T too low (inversion risk)',
      detail: 'Droplets may remain suspended and drift unpredictably',
    });
  }

  if (frostRisk) {
    actions.push({
      type: 'avoid',
      icon: <Thermometer className="w-4 h-4" />,
      text: 'Protect frost-sensitive crops tonight',
      detail: 'Minimum temperature forecast at or below 2°C',
    });
  }

  if (uvIndex >= 8) {
    actions.push({
      type: 'next',
      icon: <Sun className="w-4 h-4" />,
      text: 'Schedule outdoor work for early/late day (UV extreme)',
      detail: 'Sun protection essential for workers and sensitive crops',
    });
  }

  if (todayExpectedRain > 5 && soilMoisture !== null && soilMoisture < 40) {
    actions.push({
      type: 'next',
      icon: <TrendingUp className="w-4 h-4" />,
      text: 'Expected rain should recharge topsoil moisture',
      detail: `${todayExpectedRain.toFixed(1)} mm forecast — hold off irrigation`,
    });
  }

  return actions;
}

function generateRiskAlerts(props: Props): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const { tempC, humidity, frostRisk, frostWarning, windGustKmh, daysWithoutRain } = props;

  if (humidity > 85 && tempC > 15 && tempC < 28) {
    alerts.push({
      severity: 'warning',
      title: 'High disease pressure risk',
      description: `Humidity ${humidity}% combined with ${tempC.toFixed(0)}°C creates conditions favouring fungal pathogens.`,
      action: 'Scout crops for early symptoms. Consider preventative fungicide if within spray window.',
    });
  }

  if (frostRisk) {
    alerts.push({
      severity: 'danger',
      title: 'Frost risk tonight',
      description: 'Minimum temperature forecast at or below 2°C. Ground frost likely in low-lying areas.',
      action: 'Protect sensitive crops. Delay planting warm-season species. Consider frost-cloth or irrigation.',
    });
  } else if (frostWarning) {
    alerts.push({
      severity: 'warning',
      title: 'Near-frost conditions tonight',
      description: 'Minimum temperature forecast between 2–4°C. Frost possible in sheltered valleys.',
      action: 'Monitor overnight. Be prepared to protect young transplants.',
    });
  }

  if (tempC > 35) {
    alerts.push({
      severity: 'danger',
      title: 'Heat stress alert',
      description: `Current temperature ${tempC.toFixed(0)}°C. Crop and livestock stress likely.`,
      action: 'Increase irrigation frequency. Provide shade for stock. Avoid chemical applications in heat.',
    });
  } else if (tempC > 32) {
    alerts.push({
      severity: 'warning',
      title: 'High temperature advisory',
      description: `Temperature ${tempC.toFixed(0)}°C approaching stress thresholds for many crops.`,
      action: 'Monitor crop water demand. Schedule field work for cooler periods.',
    });
  }

  if (daysWithoutRain && daysWithoutRain >= 10) {
    alerts.push({
      severity: 'warning',
      title: `${daysWithoutRain}+ days without rainfall`,
      description: 'Extended dry period increasing soil moisture deficit and plant stress risk.',
      action: 'Assess irrigation needs. Monitor soil moisture probes. Check crop stress indicators.',
    });
  }

  if (windGustKmh > 50) {
    alerts.push({
      severity: 'danger',
      title: 'Severe wind warning',
      description: `Wind gusts up to ${Math.round(windGustKmh)} km/h. Structural and crop damage possible.`,
      action: 'Secure loose materials. Delay all field operations. Check infrastructure.',
    });
  }

  return alerts;
}

function getChipSummaries(actions: TodayAction[], props: Props): string[] {
  const chips: string[] = [];

  if (props.todayBestWindow) {
    chips.push(`Spray after ${props.todayBestWindow.startTime}`);
  }

  if (props.soilMoisture !== null && props.soilMoisture < 25) {
    chips.push('Irrigation may be needed');
  }

  if (props.todayRainChance < 20) {
    chips.push('Dry day forecast');
  } else if (props.todayRainChance > 60) {
    chips.push(`${props.todayRainChance}% rain risk`);
  }

  if (props.windSpeedKmh < 15) {
    chips.push(`Light winds ${Math.round(props.windSpeedKmh)} km/h`);
  } else if (props.windGustKmh > 30) {
    chips.push(`Gusts ${Math.round(props.windGustKmh)} km/h`);
  }

  if (props.frostRisk) {
    chips.push('Frost risk tonight');
  }

  return chips.slice(0, 4);
}

export function TodayOnYourFarm(props: Props) {
  const [expanded, setExpanded] = useState<ExpandedPanel>(null);

  const actions = useMemo(() => generateActions(props), [props.tempC, props.humidity, props.windSpeedKmh, props.windGustKmh, props.deltaT, props.deltaTRating, props.todayBestWindow, props.todayRainChance, props.todayExpectedRain, props.rainfall, props.frostRisk, props.soilMoisture, props.uvIndex]);
  const alerts = useMemo(() => generateRiskAlerts(props), [props.tempC, props.humidity, props.frostRisk, props.frostWarning, props.windGustKmh, props.daysWithoutRain]);
  const chips = useMemo(() => getChipSummaries(actions, props), [actions, props]);

  const timeUntil = props.todayBestWindow ? getTimeUntilWindow(props.todayBestWindow.startTime) : null;

  const toggle = (panel: ExpandedPanel) => {
    setExpanded(prev => prev === panel ? null : panel);
  };

  return (
    <div className="mb-5 space-y-3">
      {/* Spray Window Card */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/70 backdrop-blur-sm shadow-lg overflow-hidden transition-all duration-200 hover:border-slate-600/60">
        <button
          onClick={() => toggle('spray')}
          className="w-full px-4 py-3.5 flex items-center justify-between cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              props.todayBestWindow?.rating === 'Good' ? 'bg-green-600/15 border border-green-500/30' :
              props.todayBestWindow?.rating === 'Moderate' ? 'bg-amber-600/15 border border-amber-500/30' :
              'bg-slate-800 border border-slate-700/50'
            }`}>
              <Clock className={`w-4 h-4 ${
                props.todayBestWindow?.rating === 'Good' ? 'text-green-400' :
                props.todayBestWindow?.rating === 'Moderate' ? 'text-amber-400' :
                'text-slate-500'
              }`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white">Best Spray Window</h3>
                {props.todayBestWindow && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    props.todayBestWindow.rating === 'Good' ? 'text-green-400 bg-green-500/10 border-green-500/30' :
                    'text-amber-400 bg-amber-500/10 border-amber-500/30'
                  }`}>
                    {props.todayBestWindow.rating === 'Good' ? 'Ideal' : props.todayBestWindow.rating}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {props.todayBestWindow
                  ? `${props.todayBestWindow.startTime} – ${props.todayBestWindow.endTime} (${props.todayBestWindow.duration.toFixed(0)}h window)`
                  : 'No safe window today'
                }
                {timeUntil && <span className="text-green-400 font-medium ml-2">Starts in {timeUntil.hours > 0 ? `${timeUntil.hours}h ${timeUntil.minutes}m` : `${timeUntil.minutes}m`}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <span className="text-[10px] text-slate-600 hidden sm:block">Click for full spray analysis</span>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${expanded === 'spray' ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Expanded spray content */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded === 'spray' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 pb-4 pt-1 border-t border-slate-700/30">
            <SprayExpandedContent props={props} timeUntil={timeUntil} />
          </div>
        </div>
      </div>

      {/* Farm Summary Card */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/70 backdrop-blur-sm shadow-lg overflow-hidden transition-all duration-200 hover:border-slate-600/60">
        <button
          onClick={() => toggle('farm')}
          className="w-full px-4 py-3.5 cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-600/15 border border-green-500/25 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-green-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Today's Farm Summary</h3>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <span className="text-[10px] text-slate-600 hidden sm:block">Click for full recommendations</span>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${expanded === 'farm' ? 'rotate-180' : ''}`} />
            </div>
          </div>
          {/* Action chips strip */}
          <div className="flex items-center gap-2 mt-2.5 ml-11 flex-wrap">
            {chips.map((chip, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/40 text-slate-300">
                {chip}
              </span>
            ))}
          </div>
        </button>

        {/* Expanded farm content */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded === 'farm' ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 pb-4 pt-1 border-t border-slate-700/30">
            <FarmExpandedContent actions={actions} alerts={alerts} props={props} />
          </div>
        </div>
      </div>

      {/* Critical alerts always visible */}
      {alerts.filter(a => a.severity === 'danger').length > 0 && (
        <div className="space-y-2">
          {alerts.filter(a => a.severity === 'danger').map((alert, i) => (
            <RiskAlertCard key={i} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

function SprayExpandedContent({ props, timeUntil }: { props: Props; timeUntil: { hours: number; minutes: number } | null }) {
  const confidence = props.todayBestWindow?.rating === 'Good' ? 'High' : 'Moderate';

  return (
    <div className="space-y-4 pt-3">
      {props.todayBestWindow ? (
        <>
          {timeUntil && (
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-white tabular-nums">
                {timeUntil.hours > 0 ? `${timeUntil.hours}h ` : ''}{timeUntil.minutes}m
              </span>
              <span className="text-sm text-slate-500">until window opens</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5">
            <ReasonChip
              icon={<Wind className="w-3 h-3" />}
              label="Wind"
              value={`${Math.round(props.windSpeedKmh)} km/h`}
              good={props.windSpeedKmh < 15}
            />
            <ReasonChip
              icon={<Droplets className="w-3 h-3" />}
              label="Rain risk"
              value={`${props.todayRainChance}%`}
              good={props.todayRainChance < 30}
            />
            <ReasonChip
              icon={<Thermometer className="w-3 h-3" />}
              label="Delta T"
              value={props.deltaTRating}
              good={props.deltaTRating === 'Ideal' || props.deltaTRating === 'Good'}
            />
          </div>

          <div className="rounded-lg bg-slate-800/50 border border-slate-700/30 px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Analysis</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {confidence === 'High'
                ? `Conditions are ideal for spraying between ${props.todayBestWindow.startTime} – ${props.todayBestWindow.endTime}. Wind below threshold, low rain probability, and Delta T in optimal range for droplet performance.`
                : `Moderate spray conditions between ${props.todayBestWindow.startTime} – ${props.todayBestWindow.endTime}. Some factors are marginal — monitor wind gusts and consider drift-reducing nozzles.`
              }
            </p>
          </div>

          <p className="text-[10px] text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-500">Why this matters:</span> Timing applications to optimal windows reduces drift, improves coverage, and maximises product efficacy.
          </p>
        </>
      ) : (
        <div className="py-3">
          <p className="text-sm text-slate-400">No safe spray window available today.</p>
          <p className="text-xs text-slate-600 mt-1">Wind speeds or rain risk are too high for effective application. Check tomorrow's forecast.</p>
        </div>
      )}
    </div>
  );
}

function FarmExpandedContent({ actions, alerts, props }: { actions: TodayAction[]; alerts: RiskAlert[]; props: Props }) {
  const doActions = actions.filter(a => a.type === 'do');
  const avoidActions = actions.filter(a => a.type === 'avoid');
  const nextActions = actions.filter(a => a.type === 'next');

  const diseaseRisk = useMemo(() => assessDiseaseRisk({
    tempC: props.tempC,
    humidity: props.humidity,
    rainChance: props.todayRainChance,
    todayExpectedRain: props.todayExpectedRain,
    windSpeedKmh: props.windSpeedKmh,
    soilMoisture: props.soilMoisture,
  }), [props.tempC, props.humidity, props.todayRainChance, props.todayExpectedRain, props.windSpeedKmh, props.soilMoisture]);

  return (
    <div className="space-y-4 pt-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ActionColumn title="Best actions today" items={doActions} emptyText="No specific actions recommended" accentColor="green" />
        <ActionColumn title="Avoid today" items={avoidActions} emptyText="No restrictions — all clear" accentColor="amber" />
        <ActionColumn title="Next opportunity" items={nextActions} emptyText="Check back tomorrow" accentColor="blue" />
      </div>

      {alerts.filter(a => a.severity !== 'danger').length > 0 && (
        <div className="space-y-2">
          {alerts.filter(a => a.severity !== 'danger').map((alert, i) => (
            <RiskAlertCard key={i} alert={alert} />
          ))}
        </div>
      )}

      <DiseaseRiskSection assessment={diseaseRisk} />

      {props.soilMoisture !== null && (
        <IrrigationSection soilMoisture={props.soilMoisture} soilTempC={props.soilTempC} todayExpectedRain={props.todayExpectedRain} />
      )}

      <p className="text-[10px] text-slate-600 leading-relaxed pt-2 border-t border-slate-700/30">
        <span className="font-semibold text-slate-500">Why this matters:</span> Spraying outside optimal conditions reduces product effectiveness by up to 50% and increases drift risk. Timing decisions to weather windows maximises ROI on chemical inputs.
      </p>
    </div>
  );
}

function ActionColumn({ title, items, emptyText, accentColor }: { title: string; items: TodayAction[]; emptyText: string; accentColor: 'green' | 'amber' | 'blue' }) {
  const colorMap = {
    green: { dot: 'bg-green-400', text: 'text-green-400', border: 'border-green-500/20', bg: 'bg-green-950/20' },
    amber: { dot: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-950/20' },
    blue: { dot: 'bg-blue-400', text: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-950/20' },
  };
  const c = colorMap[accentColor];

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-3`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        <span className={`text-[10px] font-bold ${c.text} uppercase tracking-wider`}>{title}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-[11px] text-slate-600 italic">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`mt-0.5 flex-shrink-0 ${c.text}`}>{item.icon}</span>
              <div className="min-w-0">
                <p className="text-xs text-slate-200 font-medium leading-snug">{item.text}</p>
                {item.detail && <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{item.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReasonChip({ icon, label, value, good }: { icon: React.ReactNode; label: string; value: string; good: boolean }) {
  return (
    <div className={`rounded-lg px-3 py-2 border ${good ? 'border-green-500/20 bg-green-950/20' : 'border-amber-500/20 bg-amber-950/20'}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={good ? 'text-green-500' : 'text-amber-500'}>{icon}</span>
        <span className="text-[10px] text-slate-500 font-medium uppercase">{label}</span>
      </div>
      <span className={`text-xs font-bold ${good ? 'text-green-300' : 'text-amber-300'}`}>{value}</span>
    </div>
  );
}

function RiskAlertCard({ alert }: { alert: RiskAlert }) {
  const styles = {
    warning: { border: 'border-amber-500/30', bg: 'bg-amber-950/20', icon: 'text-amber-400', title: 'text-amber-300' },
    danger: { border: 'border-red-500/30', bg: 'bg-red-950/20', icon: 'text-red-400', title: 'text-red-300' },
    info: { border: 'border-blue-500/30', bg: 'bg-blue-950/20', icon: 'text-blue-400', title: 'text-blue-300' },
  };
  const s = styles[alert.severity];

  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-3`}>
      <div className="flex items-start gap-2.5">
        <div className={`mt-0.5 ${s.icon}`}>
          {alert.severity === 'danger' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-xs font-bold ${s.title}`}>{alert.title}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{alert.description}</p>
          <div className="mt-1.5 flex items-start gap-1.5">
            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">{alert.action}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiseaseRiskSection({ assessment }: { assessment: { level: DiseaseRiskLevel; warnings: string[]; guidance: string[]; factors: { label: string; contributing: boolean }[] } }) {
  const levelStyles: Record<DiseaseRiskLevel, { border: string; bg: string; badge: string; badgeText: string; icon: string; glow: string }> = {
    LOW: { border: 'border-green-500/20', bg: 'bg-green-950/10', badge: 'bg-green-500/15 border-green-500/30', badgeText: 'text-green-300', icon: 'text-green-400', glow: '' },
    MODERATE: { border: 'border-amber-500/25', bg: 'bg-amber-950/10', badge: 'bg-amber-500/15 border-amber-500/30', badgeText: 'text-amber-300', icon: 'text-amber-400', glow: '' },
    HIGH: { border: 'border-red-500/25', bg: 'bg-red-950/10', badge: 'bg-red-500/15 border-red-500/30', badgeText: 'text-red-300', icon: 'text-red-400', glow: 'shadow-[0_0_12px_-4px_rgba(239,68,68,0.15)]' },
  };
  const s = levelStyles[assessment.level];

  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} ${s.glow} p-3.5`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bug className={`w-4 h-4 ${s.icon}`} />
          <span className="text-xs font-bold text-white">Disease Risk &amp; Control Warnings</span>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${s.badge} ${s.badgeText} tracking-wider`}>
          {assessment.level} RISK
        </span>
      </div>

      {/* Contributing factors */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {assessment.factors.map((f, i) => (
          <span
            key={i}
            className={`text-[10px] px-2 py-0.5 rounded-full border ${
              f.contributing ? `${s.badge} ${s.badgeText}` : 'bg-white/[0.03] border-white/[0.06] text-white/40'
            }`}
          >
            {f.label}
          </span>
        ))}
      </div>

      {/* Warnings */}
      <div className="space-y-1.5 mb-3">
        {assessment.warnings.map((w, i) => (
          <div key={i} className="flex items-start gap-2">
            <AlertTriangle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${s.icon}`} />
            <p className="text-[11px] text-white/70 leading-relaxed">{w}</p>
          </div>
        ))}
      </div>

      {/* Guidance */}
      <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2.5 mb-3">
        <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Practical Guidance</span>
        <div className="mt-1.5 space-y-1">
          {assessment.guidance.map((g, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-white/30" />
              <p className="text-[11px] text-white/60 leading-relaxed">{g}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[9px] text-white/30 leading-relaxed">
        FarmCast disease warnings are a guide only. Always check product labels, local regulations and speak with a qualified agronomist before making spray decisions.
      </p>
    </div>
  );
}

function IrrigationSection({ soilMoisture, soilTempC, todayExpectedRain }: { soilMoisture: number; soilTempC: number | null; todayExpectedRain: number }) {
  const needsIrrigation = soilMoisture < 25;
  const adequate = soilMoisture >= 40;
  const rainWillHelp = todayExpectedRain > 3 && soilMoisture < 40;

  return (
    <div className={`rounded-xl border ${needsIrrigation ? 'border-amber-500/25 bg-amber-950/10' : 'border-green-500/20 bg-green-950/10'} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Droplets className={`w-3.5 h-3.5 ${needsIrrigation ? 'text-amber-400' : 'text-green-400'}`} />
          <span className="text-xs font-bold text-white">Irrigation</span>
        </div>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
          needsIrrigation ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' :
          adequate ? 'text-green-300 bg-green-500/10 border-green-500/30' :
          'text-slate-300 bg-slate-800 border-slate-600/40'
        }`}>
          {needsIrrigation ? 'Action needed' : adequate ? 'Adequate' : 'Monitor'}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black text-white tabular-nums">{soilMoisture.toFixed(0)}%</span>
          <span className="text-[10px] text-slate-500">moisture</span>
        </div>
        {soilTempC !== null && (
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-white tabular-nums">{soilTempC.toFixed(1)}°</span>
            <span className="text-[10px] text-slate-500">soil</span>
          </div>
        )}
      </div>
      {needsIrrigation && <p className="text-[11px] text-amber-200/80 mt-1.5">Irrigation recommended within 24–48 hours.</p>}
      {rainWillHelp && <p className="text-[10px] text-blue-400 mt-1">{todayExpectedRain.toFixed(1)} mm rain forecast — may reduce need.</p>}
    </div>
  );
}
