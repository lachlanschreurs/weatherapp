import { useState } from 'react';
import { ChevronDown, ChevronUp, Leaf, Eye, AlertTriangle, FlaskConical, Activity } from 'lucide-react';
import type { Weed, CountryCode } from './types';
import { AgronomyDisclaimer } from '../AgronomyDisclaimer';
import { IPMPlanCard } from './IPMPlanCard';
import type { IPMWeatherContext } from '../../utils/ipm';
import { generateWeedIPM } from '../../utils/ipm';

const EFFICACY_COLORS = {
  high: 'bg-green-900/40 text-green-300 border-green-500/30',
  moderate: 'bg-amber-900/40 text-amber-300 border-amber-500/30',
  low: 'bg-red-900/40 text-red-300 border-red-500/30',
  '': 'bg-slate-800 text-slate-400 border-slate-600/40',
};

const REG_BODY_NAMES: Record<CountryCode, string> = { AU: 'APVMA', US: 'EPA', NZ: 'ACVM', CA: 'PMRA' };

interface Props {
  weed: Weed;
  weatherContext?: IPMWeatherContext;
  region?: CountryCode;
}

export function WeedCard({ weed, weatherContext, region = 'AU' }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-orange-500/20 bg-slate-900/60 overflow-hidden transition-all duration-200 hover:bg-slate-900/80">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start gap-4"
      >
        <div className="mt-0.5 w-8 h-8 rounded-lg bg-orange-900/40 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
          <Leaf className="w-4 h-4 text-orange-300" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div>
              <h3 className="font-bold text-white text-base leading-tight">{weed.common_name || weed.weed_name}</h3>
              {weed.common_name && <p className="text-xs text-slate-500 mt-0.5 italic">{weed.weed_name}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {weed.weed_family && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-900/40 text-orange-300 border border-orange-500/30">
                  {weed.weed_family}
                </span>
              )}
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {weed.affected_environments.slice(0, 5).map(env => (
              <span key={env} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-400">
                {env}
              </span>
            ))}
            {weed.affected_environments.length > 5 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-500">
                +{weed.affected_environments.length - 5} more
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{weed.growth_habit}</p>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-700/40 pt-4 space-y-4">
          <InfoBlock icon={<Eye className="w-3.5 h-3.5 text-blue-400" />} label="Identification" value={weed.identification_details} />
          <InfoBlock icon={<Activity className="w-3.5 h-3.5 text-amber-400" />} label="Growth Habit" value={weed.growth_habit} />
          <InfoBlock icon={<Leaf className="w-3.5 h-3.5 text-green-400" />} label="Control Methods" value={weed.control_methods} />

          {(weed.resistance_notes || weed.resistance_group) && (
            <div className="rounded-lg bg-amber-950/30 border border-amber-500/20 p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Resistance</div>
              </div>
              {weed.resistance_group && (
                <p className="text-xs text-amber-400 font-semibold mb-1">Group: {weed.resistance_group}</p>
              )}
              {weed.resistance_notes && (
                <p className="text-sm text-amber-200/80 leading-relaxed">{weed.resistance_notes}</p>
              )}
            </div>
          )}

          {weed.affected_environments.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Affected Crops & Environments</div>
              <div className="flex flex-wrap gap-1.5">
                {weed.affected_environments.map(env => (
                  <span key={env} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300">
                    {env}
                  </span>
                ))}
              </div>
            </div>
          )}

          {weed.chemicals && weed.chemicals.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <FlaskConical className="w-3.5 h-3.5 text-orange-400" />
                <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">Registered Spray Options</div>
              </div>
              <p className="text-[10px] text-slate-500 mb-2.5 italic">
                Common registered active ingredients include the following. Products containing these actives may be suitable where registered — always verify {REG_BODY_NAMES[region]} registration and crop label before use.
              </p>
              <div className="space-y-2">
                {weed.chemicals.map(({ chemical, application_notes, efficacy_rating }) => (
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
                    <p className="text-xs text-slate-400 mt-0.5">Used in: <span className="text-slate-300 font-medium">{chemical.product_name}</span></p>
                    {chemical.withholding_period && (
                      <p className="text-xs text-amber-400/80 mt-1">WHI: {chemical.withholding_period}</p>
                    )}
                    {application_notes && <p className="text-xs text-slate-500 mt-1">{application_notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IPM Management Plan */}
          <IPMPlanCard
            plan={generateWeedIPM(
              weed.common_name || weed.weed_name,
              weed.affected_environments,
              weed.control_methods,
              weed.resistance_group,
              !!(weed.chemicals && weed.chemicals.length > 0),
              weatherContext,
            )}
          />

          <AgronomyDisclaimer variant="card" />
        </div>
      )}
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
