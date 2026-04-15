import { useState } from 'react';
import { ChevronDown, ChevronUp, FlaskConical, Clock, AlertTriangle, Shield } from 'lucide-react';
import type { Chemical } from './types';

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  fungicide: { bg: 'bg-emerald-900/40', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  insecticide: { bg: 'bg-amber-900/40', text: 'text-amber-300', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  herbicide: { bg: 'bg-orange-900/40', text: 'text-orange-300', border: 'border-orange-500/30', dot: 'bg-orange-400' },
  miticide: { bg: 'bg-rose-900/40', text: 'text-rose-300', border: 'border-rose-500/30', dot: 'bg-rose-400' },
  nematicide: { bg: 'bg-purple-900/40', text: 'text-purple-300', border: 'border-purple-500/30', dot: 'bg-purple-400' },
  other: { bg: 'bg-slate-800/40', text: 'text-slate-300', border: 'border-slate-500/30', dot: 'bg-slate-400' },
};

interface Props {
  chemical: Chemical;
}

export function ChemicalCard({ chemical }: Props) {
  const [expanded, setExpanded] = useState(false);
  const style = CATEGORY_STYLES[chemical.category] || CATEGORY_STYLES.other;

  return (
    <div className={`rounded-xl border ${style.border} bg-slate-900/60 overflow-hidden transition-all duration-200 hover:bg-slate-900/80`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start gap-4"
      >
        <div className={`mt-0.5 w-8 h-8 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center flex-shrink-0`}>
          <FlaskConical className={`w-4 h-4 ${style.text}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div>
              <h3 className="font-bold text-white text-base leading-tight">{chemical.product_name}</h3>
              <p className="text-sm text-slate-400 mt-0.5">{chemical.active_ingredient}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.bg} ${style.text} border ${style.border} capitalize`}>
                {chemical.category}
              </span>
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {chemical.chemical_group && <span>{chemical.chemical_group}</span>}
            {chemical.manufacturer && <span>by {chemical.manufacturer}</span>}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {chemical.registered_crops.slice(0, 4).map(crop => (
              <span key={crop} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-400">
                {crop}
              </span>
            ))}
            {chemical.registered_crops.length > 4 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-500">
                +{chemical.registered_crops.length - 4} more
              </span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-700/40 pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DetailBlock icon={<FlaskConical className="w-3.5 h-3.5" />} label="Mode of Action" value={chemical.mode_of_action} />
            <DetailBlock icon={<FlaskConical className="w-3.5 h-3.5" />} label="Formulation" value={chemical.formulation_type} />
            <DetailBlock icon={<Clock className="w-3.5 h-3.5 text-amber-400" />} label="Withholding Period" value={chemical.withholding_period} highlight />
            <DetailBlock icon={<Clock className="w-3.5 h-3.5 text-blue-400" />} label="Re-entry Period" value={chemical.reentry_period} />
          </div>

          {chemical.application_rate && (
            <DetailBlock icon={null} label="Application Rate" value={chemical.application_rate} />
          )}

          {chemical.target_issues.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Issues</div>
              <div className="flex flex-wrap gap-1.5">
                {chemical.target_issues.map(issue => (
                  <span key={issue} className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          )}

          {chemical.registered_crops.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Registered Crops</div>
              <div className="flex flex-wrap gap-1.5">
                {chemical.registered_crops.map(crop => (
                  <span key={crop} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300">
                    {crop}
                  </span>
                ))}
              </div>
            </div>
          )}

          {chemical.label_notes && (
            <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">Label Notes</div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{chemical.label_notes}</p>
            </div>
          )}

          {chemical.resistance_notes && (
            <div className="rounded-lg bg-amber-950/30 border border-amber-500/20 p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Resistance Notes</div>
              </div>
              <p className="text-sm text-amber-200/80 leading-relaxed">{chemical.resistance_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailBlock({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <p className={`text-sm ${highlight ? 'text-amber-300 font-semibold' : 'text-slate-300'}`}>{value}</p>
    </div>
  );
}
