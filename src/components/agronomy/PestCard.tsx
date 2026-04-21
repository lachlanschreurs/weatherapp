import { useState } from 'react';
import { ChevronDown, ChevronUp, Bug, Eye, AlertTriangle, FlaskConical, Activity, Shield } from 'lucide-react';
import type { Pest } from './types';
import { AgronomyDisclaimer } from '../AgronomyDisclaimer';

const PEST_TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  insect:     { bg: 'bg-amber-900/40',  text: 'text-amber-300',  border: 'border-amber-500/30' },
  mite:       { bg: 'bg-rose-900/40',   text: 'text-rose-300',   border: 'border-rose-500/30' },
  nematode:   { bg: 'bg-orange-900/40', text: 'text-orange-300', border: 'border-orange-500/30' },
  vertebrate: { bg: 'bg-slate-800/60',  text: 'text-slate-300',  border: 'border-slate-500/30' },
  mollusc:    { bg: 'bg-blue-900/40',   text: 'text-blue-300',   border: 'border-blue-500/30' },
  other:      { bg: 'bg-slate-800/60',  text: 'text-slate-300',  border: 'border-slate-500/30' },
  '':         { bg: 'bg-slate-800/60',  text: 'text-slate-300',  border: 'border-slate-500/30' },
};

const EFFICACY_COLORS = {
  high:     'bg-green-900/40 text-green-300 border-green-500/30',
  moderate: 'bg-amber-900/40 text-amber-300 border-amber-500/30',
  low:      'bg-red-900/40 text-red-300 border-red-500/30',
  '':       'bg-slate-800 text-slate-400 border-slate-600/40',
};

interface Props {
  pest: Pest;
}

export function PestCard({ pest }: Props) {
  const [expanded, setExpanded] = useState(false);
  const style = PEST_TYPE_STYLES[pest.pest_type] || PEST_TYPE_STYLES[''];

  return (
    <div className={`rounded-xl border ${style.border} bg-slate-900/60 overflow-hidden transition-all duration-200 hover:bg-slate-900/80`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start gap-4"
      >
        <div className={`mt-0.5 w-8 h-8 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center flex-shrink-0`}>
          <Bug className={`w-4 h-4 ${style.text}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div>
              <h3 className="font-bold text-white text-base leading-tight">{pest.common_name || pest.pest_name}</h3>
              {pest.common_name && <p className="text-xs text-slate-500 mt-0.5 italic">{pest.pest_name}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {pest.pest_type && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.bg} ${style.text} border ${style.border} capitalize`}>
                  {pest.pest_type}
                </span>
              )}
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {pest.affected_crops.slice(0, 5).map(crop => (
              <span key={crop} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-400">
                {crop}
              </span>
            ))}
            {pest.affected_crops.length > 5 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-500">
                +{pest.affected_crops.length - 5} more
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{pest.damage_caused}</p>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-700/40 pt-4 space-y-4">

          {/* 1. Detected Issue */}
          <Section icon={<Bug className="w-3.5 h-3.5 text-red-400" />} label="Detected Issue" color="text-red-400">
            <InfoBlock icon={<Eye className="w-3.5 h-3.5 text-blue-400" />} label="Identification" value={pest.identification_details} />
            <InfoBlock icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400" />} label="Damage Caused" value={pest.damage_caused} />
            {pest.damage_symptoms && (
              <InfoBlock icon={<AlertTriangle className="w-3.5 h-3.5 text-orange-400" />} label="Damage Symptoms" value={pest.damage_symptoms} />
            )}
            <InfoBlock icon={<Activity className="w-3.5 h-3.5 text-amber-400" />} label="Lifecycle & Behaviour" value={pest.lifecycle_notes} />
          </Section>

          {/* 2. Common Treatment Options */}
          {(pest.treatment_options || (pest.chemicals && pest.chemicals.length > 0)) && (
            <Section icon={<FlaskConical className="w-3.5 h-3.5 text-amber-400" />} label="Common Treatment Options" color="text-amber-400">
              <p className="text-[10px] text-slate-500 italic">
                Possible treatment options may include the following. Consider local agronomic advice before application.
              </p>

              {pest.spray_threshold && (
                <div className="rounded-lg bg-green-950/30 border border-green-500/20 p-3">
                  <div className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">Action Threshold</div>
                  <p className="text-sm text-green-200/80 leading-relaxed">{pest.spray_threshold}</p>
                </div>
              )}

              {pest.treatment_options && (
                <p className="text-sm text-slate-300 leading-relaxed">{pest.treatment_options}</p>
              )}

              {pest.chemicals && pest.chemicals.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-amber-400/70 uppercase tracking-wider mb-2 mt-1">Common Registered Active Ingredients</div>
                  <p className="text-[10px] text-slate-500 mb-2 italic">
                    Products containing these actives may be suitable where registered — always verify APVMA registration and crop label before use.
                  </p>
                  <div className="space-y-2">
                    {pest.chemicals.map(({ chemical, application_notes, efficacy_rating }) => (
                      <div key={chemical.id} className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="text-sm font-bold text-slate-200">{chemical.active_ingredient}</span>
                            {chemical.chemical_group && (
                              <span className="ml-2 text-[10px] text-slate-500">Mode of action: {chemical.chemical_group}</span>
                            )}
                          </div>
                          {efficacy_rating && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${EFFICACY_COLORS[efficacy_rating]}`}>
                              {efficacy_rating} efficacy
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Found in products such as: <span className="text-slate-300">{chemical.product_name}</span></p>
                        {chemical.withholding_period && (
                          <p className="text-xs text-amber-400/80 mt-1">WHI: {chemical.withholding_period}</p>
                        )}
                        {application_notes && <p className="text-xs text-slate-500 mt-1">{application_notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* 3. Monitoring Advice */}
          <Section icon={<Eye className="w-3.5 h-3.5 text-blue-400" />} label="Monitoring Advice" color="text-blue-400">
            {pest.monitoring_notes ? (
              <p className="text-sm text-slate-300 leading-relaxed">{pest.monitoring_notes}</p>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect crops regularly during peak activity periods. Monitor population levels against action thresholds before treatment decisions.
              </p>
            )}

            {pest.affected_crops.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Affected Crops</div>
                <div className="flex flex-wrap gap-1.5">
                  {pest.affected_crops.map(crop => (
                    <span key={crop} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* 4. Prevention Notes */}
          <Section icon={<Shield className="w-3.5 h-3.5 text-green-400" />} label="Prevention Notes" color="text-green-400">
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrated pest management (IPM) strategies — including crop rotation, beneficial insect conservation, and targeted monitoring — may reduce reliance on chemical treatments. Consult your agronomist for a tailored prevention plan.
            </p>
          </Section>

          <AgronomyDisclaimer variant="card" />
        </div>
      )}
    </div>
  );
}

function Section({ icon, label, color, children }: { icon: React.ReactNode; label: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-700/30">
        {icon}
        <div className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</div>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{value}</p>
    </div>
  );
}
