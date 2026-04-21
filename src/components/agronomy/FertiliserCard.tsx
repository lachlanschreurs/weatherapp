import { useState } from 'react';
import { ChevronDown, ChevronUp, Sprout, Droplets, Tag } from 'lucide-react';
import type { Fertiliser } from './types';
import { AgronomyDisclaimer } from '../AgronomyDisclaimer';

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  granular:  { bg: 'bg-amber-900/40',   text: 'text-amber-300',   border: 'border-amber-500/30' },
  liquid:    { bg: 'bg-blue-900/40',    text: 'text-blue-300',    border: 'border-blue-500/30' },
  powder:    { bg: 'bg-slate-800/40',   text: 'text-slate-300',   border: 'border-slate-500/30' },
  foliar:    { bg: 'bg-teal-900/40',    text: 'text-teal-300',    border: 'border-teal-500/30' },
  controlled_release: { bg: 'bg-orange-900/40', text: 'text-orange-300', border: 'border-orange-500/30' },
};

const fallbackStyle = { bg: 'bg-slate-800/40', text: 'text-slate-300', border: 'border-slate-500/30' };

interface NutrientBadgeProps {
  label: string;
  value: string;
  color: string;
}

function NutrientBadge({ label, value, color }: NutrientBadgeProps) {
  const num = parseFloat(value);
  if (!num || num === 0) return null;
  return (
    <div className={`flex flex-col items-center px-2.5 py-1.5 rounded-lg border ${color} min-w-[48px]`}>
      <span className="text-[10px] font-black uppercase tracking-wider opacity-70">{label}</span>
      <span className="text-sm font-black">{num}%</span>
    </div>
  );
}

interface Props {
  fertiliser: Fertiliser;
}

export function FertiliserCard({ fertiliser }: Props) {
  const [expanded, setExpanded] = useState(false);
  const style = TYPE_STYLES[fertiliser.fertiliser_type] || fallbackStyle;

  const macros = [
    { label: 'N', value: fertiliser.n_percent, color: 'bg-green-900/40 text-green-300 border-green-500/30' },
    { label: 'P', value: fertiliser.p_percent, color: 'bg-orange-900/40 text-orange-300 border-orange-500/30' },
    { label: 'K', value: fertiliser.k_percent, color: 'bg-blue-900/40 text-blue-300 border-blue-500/30' },
    { label: 'S', value: fertiliser.s_percent, color: 'bg-yellow-900/40 text-yellow-300 border-yellow-500/30' },
    { label: 'Ca', value: fertiliser.ca_percent, color: 'bg-slate-800 text-slate-300 border-slate-600/50' },
    { label: 'Mg', value: fertiliser.mg_percent, color: 'bg-slate-800 text-slate-300 border-slate-600/50' },
  ];

  const micros = [
    { label: 'Zn', value: fertiliser.zn_percent },
    { label: 'Mn', value: fertiliser.mn_percent },
    { label: 'Cu', value: fertiliser.cu_percent },
    { label: 'B', value: fertiliser.b_percent },
    { label: 'Mo', value: fertiliser.mo_percent },
    { label: 'Fe', value: fertiliser.fe_percent },
  ].filter(m => parseFloat(m.value) > 0);

  return (
    <div className={`rounded-xl border ${style.border} bg-slate-900/60 overflow-hidden transition-all duration-200 hover:bg-slate-900/80`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start gap-4"
      >
        <div className={`mt-0.5 w-8 h-8 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center flex-shrink-0`}>
          <Sprout className={`w-4 h-4 ${style.text}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div>
              <h3 className="font-bold text-white text-base leading-tight">{fertiliser.product_name}</h3>
              {fertiliser.brand && fertiliser.brand !== 'Various' && (
                <p className="text-sm text-slate-400 mt-0.5">{fertiliser.brand}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.bg} ${style.text} border ${style.border} capitalize`}>
                {fertiliser.fertiliser_type.replace('_', ' ')}
              </span>
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2.5">
            {macros.map(m => (
              <NutrientBadge key={m.label} label={m.label} value={m.value} color={m.color} />
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {fertiliser.suitable_crops.slice(0, 4).map(crop => (
              <span key={crop} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-400">
                {crop}
              </span>
            ))}
            {fertiliser.suitable_crops.length > 4 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-500">
                +{fertiliser.suitable_crops.length - 4} more
              </span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-700/40 pt-4 space-y-4">
          {micros.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Micronutrients</div>
              <div className="flex flex-wrap gap-2">
                {micros.map(m => (
                  <div key={m.label} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/50 text-xs">
                    <span className="text-slate-500 font-bold">{m.label}</span>
                    <span className="text-slate-300 font-semibold">{parseFloat(m.value)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fertiliser.application_rate && (
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" />
                  Application Rate
                </div>
                <p className="text-sm text-slate-300">{fertiliser.application_rate}</p>
              </div>
            )}
            {fertiliser.application_timing && (
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Timing</div>
                <p className="text-sm text-slate-300">{fertiliser.application_timing}</p>
              </div>
            )}
            {fertiliser.application_method && (
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Method</div>
                <p className="text-sm text-slate-300">{fertiliser.application_method}</p>
              </div>
            )}
          </div>

          {fertiliser.suitable_soil_types.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Suitable Soil Types</div>
              <div className="flex flex-wrap gap-1.5">
                {fertiliser.suitable_soil_types.map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-800/30 text-amber-300/80">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {fertiliser.suitable_crops.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Suitable Crops</div>
              <div className="flex flex-wrap gap-1.5">
                {fertiliser.suitable_crops.map(c => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {fertiliser.notes && (
            <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3.5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes</div>
              <p className="text-sm text-slate-300 leading-relaxed">{fertiliser.notes}</p>
            </div>
          )}

          {fertiliser.compatibility_notes && (
            <div className="rounded-lg bg-amber-950/30 border border-amber-500/20 p-3.5">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">Compatibility Notes</div>
              <p className="text-sm text-amber-200/80 leading-relaxed">{fertiliser.compatibility_notes}</p>
            </div>
          )}

          {fertiliser.registration_number && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Tag className="w-3 h-3" />
              <span>{fertiliser.registration_number}</span>
            </div>
          )}

          <AgronomyDisclaimer variant="short" />
        </div>
      )}
    </div>
  );
}
