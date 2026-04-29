import { useState } from 'react';
import { Shield, Eye, Leaf, Bug, FlaskConical, Wind, RotateCcw, ChevronDown, ChevronUp, AlertTriangle, Crosshair, ArrowRight } from 'lucide-react';
import type { IPMPlan, RiskLevel, SpraySuitability } from '../../utils/ipm';
import { RISK_CONFIG, IPM_DISCLAIMER } from '../../utils/ipm';

interface Props {
  plan: IPMPlan;
  defaultExpanded?: boolean;
}

const SPRAY_RATING_CONFIG: Record<SpraySuitability, { label: string; color: string; bg: string; border: string }> = {
  suitable:   { label: 'Suitable',   color: 'text-green-300',  bg: 'bg-green-500/10',  border: 'border-green-500/30' },
  marginal:   { label: 'Marginal',   color: 'text-amber-300',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
  unsuitable: { label: 'Unsuitable', color: 'text-red-300',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
};

function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg = RISK_CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function SectionHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-700/30">
      {icon}
      <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
    </div>
  );
}

function CollapsibleSection({ icon, label, color, children, defaultOpen = false }: {
  icon: React.ReactNode;
  label: string;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-1.5 mb-1 pb-1 border-b border-slate-700/30"
      >
        <div className="flex items-center gap-1.5">
          {icon}
          <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </button>
      {open && <div className="space-y-2 mt-2">{children}</div>}
    </div>
  );
}

export function IPMPlanCard({ plan, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const riskCfg = RISK_CONFIG[plan.riskLevel];

  return (
    <div className={`rounded-xl border ${riskCfg.border} ${riskCfg.bg} overflow-hidden transition-all duration-200`}>
      {/* Next Action - Always visible and prominent */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center`}>
              <Shield className={`w-3.5 h-3.5 ${riskCfg.color}`} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">IPM Management</span>
            </div>
          </div>
          <RiskBadge level={plan.riskLevel} />
        </div>

        {/* Next Action Card - Most visible element */}
        <div className={`rounded-lg ${riskCfg.bg} border ${riskCfg.border} p-3 mb-2`}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowRight className={`w-3.5 h-3.5 ${riskCfg.color}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${riskCfg.color}`}>Next Action</span>
          </div>
          <p className={`text-sm font-semibold ${riskCfg.color} leading-relaxed`}>{plan.nextAction}</p>
          {plan.riskReason && (
            <p className="text-xs text-slate-500 mt-1">{plan.riskReason}</p>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expanded ? 'Hide full IPM plan' : 'View full IPM plan'}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-700/30 pt-3">
          {/* Scout First */}
          <div>
            <SectionHeader icon={<Crosshair className="w-3.5 h-3.5 text-blue-400" />} label="Scout First" color="text-blue-400" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ScoutItem label="Where to inspect" value={plan.scout.where} />
              <ScoutItem label="What to look for" value={plan.scout.symptoms} />
              <ScoutItem label="How many to check" value={plan.scout.checkCount} />
              <ScoutItem label="When to re-check" value={plan.scout.recheck} />
            </div>
          </div>

          {/* Non-Chemical Actions */}
          <CollapsibleSection
            icon={<Leaf className="w-3.5 h-3.5 text-green-400" />}
            label="Non-Chemical Actions"
            color="text-green-400"
            defaultOpen
          >
            <ul className="space-y-1">
              {plan.nonChemicalActions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* Biological / Beneficial */}
          {plan.biologicalNotes.length > 0 && (
            <CollapsibleSection
              icon={<Bug className="w-3.5 h-3.5 text-emerald-400" />}
              label="Biological / Beneficial Protection"
              color="text-emerald-400"
            >
              <ul className="space-y-1">
                {plan.biologicalNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    {note}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Chemical Decision Support */}
          <CollapsibleSection
            icon={<FlaskConical className="w-3.5 h-3.5 text-amber-400" />}
            label="Chemical Decision Support"
            color="text-amber-400"
          >
            <div className="rounded-lg bg-amber-950/30 border border-amber-500/20 p-3">
              <p className="text-xs text-amber-200/80 leading-relaxed">{plan.chemicalDecision}</p>
            </div>
          </CollapsibleSection>

          {/* Spray Suitability */}
          {plan.spraySuitability && (
            <div>
              <SectionHeader icon={<Wind className="w-3.5 h-3.5 text-sky-400" />} label="Weather-Based Spray Suitability" color="text-sky-400" />
              <SpraySuitabilityCard spray={plan.spraySuitability} />
            </div>
          )}

          {/* Resistance Management */}
          {plan.resistanceNotes.length > 0 && (
            <CollapsibleSection
              icon={<RotateCcw className="w-3.5 h-3.5 text-orange-400" />}
              label="Resistance Management"
              color="text-orange-400"
            >
              <ul className="space-y-1">
                {plan.resistanceNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                    <span className="w-1 h-1 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                    {note}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* IPM Disclaimer */}
          <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-slate-500 leading-relaxed">{IPM_DISCLAIMER}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoutItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-2.5">
      <div className="text-[10px] font-bold text-blue-400/70 uppercase tracking-wider mb-0.5">{label}</div>
      <p className="text-xs text-slate-300 leading-relaxed">{value}</p>
    </div>
  );
}

function SpraySuitabilityCard({ spray }: { spray: NonNullable<IPMPlan['spraySuitability']> }) {
  const cfg = SPRAY_RATING_CONFIG[spray.rating];

  return (
    <div className="space-y-2">
      <div className={`rounded-lg ${cfg.bg} border ${cfg.border} p-3`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Spray Suitability</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
        </div>
        <p className="text-xs text-slate-400">{spray.details}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SprayDetail label="Best Window" value={spray.bestWindow} />
        <SprayDetail label="Avoid" value={spray.avoidWindow} />
        <SprayDetail label="Drift Risk" value={spray.driftRisk} />
        <SprayDetail label="Rainfastness" value={spray.rainfastnessRisk} />
      </div>
    </div>
  );
}

function SprayDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-2">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{label}</div>
      <p className="text-xs text-slate-300 leading-relaxed">{value}</p>
    </div>
  );
}

export function IPMPhotoResultCard({ plan }: { plan: IPMPlan }) {
  return <IPMPlanCard plan={plan} defaultExpanded />;
}
