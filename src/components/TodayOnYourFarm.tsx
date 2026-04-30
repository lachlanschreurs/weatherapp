import { useMemo } from 'react';
import { CheckCircle, AlertTriangle, Clock, Droplets, Wind, Thermometer, Sun, Sprout, TrendingUp, Shield, Zap } from 'lucide-react';
import type { SprayWindow } from '../utils/sprayWindow';

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
  const { tempC, windSpeedKmh, windGustKmh, deltaT, deltaTRating, todayBestWindow, todayRainChance, todayExpectedRain, rainfall, frostRisk, soilMoisture, uvIndex } = props;

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

export function TodayOnYourFarm(props: Props) {
  const actions = useMemo(() => generateActions(props), [props.tempC, props.humidity, props.windSpeedKmh, props.windGustKmh, props.deltaT, props.deltaTRating, props.todayBestWindow, props.todayRainChance, props.todayExpectedRain, props.rainfall, props.frostRisk, props.soilMoisture, props.uvIndex]);
  const alerts = useMemo(() => generateRiskAlerts(props), [props.tempC, props.humidity, props.frostRisk, props.frostWarning, props.windGustKmh, props.daysWithoutRain]);

  const doActions = actions.filter(a => a.type === 'do');
  const avoidActions = actions.filter(a => a.type === 'avoid');
  const nextActions = actions.filter(a => a.type === 'next');

  const timeUntil = props.todayBestWindow ? getTimeUntilWindow(props.todayBestWindow.startTime) : null;

  return (
    <div className="mb-5 space-y-4">
      {/* Daily Decision Engine Header */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/40 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-600/20 border border-green-500/30 flex items-center justify-center">
                <Zap className="w-4.5 h-4.5 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Today on Your Farm</h2>
                <p className="text-[11px] text-slate-500 font-medium">Your daily farm decision engine</p>
              </div>
            </div>
            {timeUntil && (
              <SprayCountdownBadge hours={timeUntil.hours} minutes={timeUntil.minutes} window={props.todayBestWindow!} />
            )}
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Best actions */}
            <ActionColumn
              title="Best actions today"
              items={doActions}
              emptyText="No specific actions recommended"
              accentColor="green"
            />

            {/* Avoid today */}
            <ActionColumn
              title="Avoid today"
              items={avoidActions}
              emptyText="No restrictions — clear for all activities"
              accentColor="amber"
            />

            {/* Next opportunity */}
            <ActionColumn
              title="Next key opportunity"
              items={nextActions}
              emptyText="Check back tomorrow for updates"
              accentColor="blue"
            />
          </div>

          {/* Why it matters */}
          <div className="mt-4 pt-3 border-t border-slate-700/30">
            <p className="text-[10px] text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-500">Why this matters:</span> Spraying outside optimal conditions reduces product effectiveness by up to 50% and increases drift risk. Timing decisions to weather windows maximises ROI on chemical inputs.
            </p>
          </div>
        </div>
      </div>

      {/* Spray Window Countdown (only if upcoming) */}
      {timeUntil && props.todayBestWindow && (
        <SprayCountdownCard hours={timeUntil.hours} minutes={timeUntil.minutes} window={props.todayBestWindow} deltaTRating={props.deltaTRating} windSpeedKmh={props.windSpeedKmh} todayRainChance={props.todayRainChance} />
      )}

      {/* Risk Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <RiskAlertCard key={i} alert={alert} />
          ))}
        </div>
      )}

      {/* Irrigation Recommendation */}
      {props.soilMoisture !== null && (
        <IrrigationCard soilMoisture={props.soilMoisture} soilTempC={props.soilTempC} todayExpectedRain={props.todayExpectedRain} />
      )}
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
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${c.dot}`} />
        <span className={`text-xs font-bold ${c.text} uppercase tracking-wider`}>{title}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-600 italic">{emptyText}</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`mt-0.5 flex-shrink-0 ${c.text}`}>{item.icon}</span>
              <div className="min-w-0">
                <p className="text-sm text-slate-200 font-medium leading-snug">{item.text}</p>
                {item.detail && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SprayCountdownBadge({ hours, minutes, window }: { hours: number; minutes: number; window: SprayWindow }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-950/40 border border-green-500/30">
      <Clock className="w-3.5 h-3.5 text-green-400" />
      <div className="text-right">
        <div className="text-xs font-bold text-green-300">
          {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
        </div>
        <div className="text-[9px] text-green-500/70 font-medium">until spray window</div>
      </div>
    </div>
  );
}

function SprayCountdownCard({ hours, minutes, window, deltaTRating, windSpeedKmh, todayRainChance }: { hours: number; minutes: number; window: SprayWindow; deltaTRating: string; windSpeedKmh: number; todayRainChance: number }) {
  const confidence = window.rating === 'Good' ? 'High' : 'Moderate';
  const confidenceColor = confidence === 'High' ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

  return (
    <div className="rounded-2xl border border-green-500/20 bg-green-950/15 backdrop-blur-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-400" />
            <span className="text-sm font-bold text-green-300">Next Safe Spray Window</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${confidenceColor}`}>
            {confidence} confidence
          </span>
        </div>

        <div className="flex items-baseline gap-3 mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white tabular-nums">{hours > 0 ? `${hours}h` : ''}</span>
            <span className="text-4xl font-black text-white tabular-nums">{minutes}m</span>
          </div>
          <span className="text-sm text-slate-500">
            {window.startTime} – {window.endTime}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ReasonChip
            icon={<Wind className="w-3 h-3" />}
            label="Wind"
            value={`${Math.round(windSpeedKmh)} km/h`}
            good={windSpeedKmh < 15}
          />
          <ReasonChip
            icon={<Droplets className="w-3 h-3" />}
            label="Rain risk"
            value={`${todayRainChance}%`}
            good={todayRainChance < 30}
          />
          <ReasonChip
            icon={<Thermometer className="w-3 h-3" />}
            label="Delta T"
            value={deltaTRating}
            good={deltaTRating === 'Ideal' || deltaTRating === 'Good'}
          />
        </div>

        <p className="text-[10px] text-slate-600 mt-3 leading-relaxed">
          <span className="font-semibold text-slate-500">Why this matters:</span> Timing applications to optimal spray windows reduces drift, improves coverage, and ensures maximum product efficacy.
        </p>
      </div>
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
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${s.icon}`}>
          {alert.severity === 'danger' ? <AlertTriangle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-bold ${s.title}`}>{alert.title}</h4>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{alert.description}</p>
          <div className="mt-2 flex items-start gap-1.5">
            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-300 font-medium leading-relaxed">{alert.action}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function IrrigationCard({ soilMoisture, soilTempC, todayExpectedRain }: { soilMoisture: number; soilTempC: number | null; todayExpectedRain: number }) {
  const needsIrrigation = soilMoisture < 25;
  const adequate = soilMoisture >= 40;
  const marginal = !needsIrrigation && !adequate;

  const rainWillHelp = todayExpectedRain > 3 && soilMoisture < 40;

  return (
    <div className={`rounded-2xl border ${needsIrrigation ? 'border-amber-500/25 bg-amber-950/10' : 'border-green-500/20 bg-green-950/10'} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className={`w-4 h-4 ${needsIrrigation ? 'text-amber-400' : 'text-green-400'}`} />
          <span className="text-sm font-bold text-white">Irrigation Recommendation</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          needsIrrigation ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' :
          adequate ? 'text-green-300 bg-green-500/10 border-green-500/30' :
          'text-slate-300 bg-slate-800 border-slate-600/40'
        }`}>
          {needsIrrigation ? 'Action needed' : adequate ? 'Adequate' : 'Monitor'}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div>
          <div className="text-2xl font-black text-white tabular-nums">{soilMoisture.toFixed(0)}%</div>
          <div className="text-[10px] text-slate-500 font-medium uppercase">Soil moisture</div>
        </div>
        {soilTempC !== null && (
          <div>
            <div className="text-2xl font-black text-white tabular-nums">{soilTempC.toFixed(1)}°</div>
            <div className="text-[10px] text-slate-500 font-medium uppercase">Soil temp</div>
          </div>
        )}
      </div>

      {needsIrrigation && (
        <div className="rounded-lg bg-amber-950/30 border border-amber-500/20 px-3 py-2 mb-2">
          <p className="text-xs text-amber-200 font-medium">
            Soil moisture dropping below optimal range. Irrigation recommended within 24–48 hours.
          </p>
        </div>
      )}

      {adequate && (
        <div className="rounded-lg bg-green-950/30 border border-green-500/20 px-3 py-2 mb-2">
          <p className="text-xs text-green-200 font-medium">
            Soil profile adequate — no irrigation required today.
          </p>
        </div>
      )}

      {marginal && (
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/30 px-3 py-2 mb-2">
          <p className="text-xs text-slate-300 font-medium">
            Moisture levels marginal. Monitor over next 24 hours and assess crop demand.
          </p>
        </div>
      )}

      {rainWillHelp && (
        <p className="text-[11px] text-blue-400 mt-1">
          {todayExpectedRain.toFixed(1)} mm rain forecast — may reduce irrigation need.
        </p>
      )}

      <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
        <span className="font-semibold text-slate-500">Why this matters:</span> Timely irrigation prevents yield loss from water stress while avoiding over-watering that increases disease pressure and input costs.
      </p>
    </div>
  );
}
