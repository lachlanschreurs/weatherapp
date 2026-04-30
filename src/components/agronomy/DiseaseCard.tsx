import { useState } from 'react';
import { ChevronDown, ChevronUp, Bug, AlertTriangle, FlaskConical, Thermometer, Eye } from 'lucide-react';
import type { Disease, CountryCode } from './types';
import { AgronomyDisclaimer } from '../AgronomyDisclaimer';
import { IPMPlanCard } from './IPMPlanCard';
import type { IPMWeatherContext } from '../../utils/ipm';
import { generateDiseaseIPM } from '../../utils/ipm';

const PATHOGEN_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  fungal:        { bg: 'bg-emerald-900/40', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  bacterial:     { bg: 'bg-blue-900/40',    text: 'text-blue-300',    border: 'border-blue-500/30' },
  viral:         { bg: 'bg-red-900/40',     text: 'text-red-300',     border: 'border-red-500/30' },
  oomycete:      { bg: 'bg-cyan-900/40',    text: 'text-cyan-300',    border: 'border-cyan-500/30' },
  nematode:      { bg: 'bg-orange-900/40',  text: 'text-orange-300',  border: 'border-orange-500/30' },
  physiological: { bg: 'bg-slate-800/60',   text: 'text-slate-300',   border: 'border-slate-500/30' },
  '':            { bg: 'bg-slate-800/60',   text: 'text-slate-300',   border: 'border-slate-500/30' },
};

const EFFICACY_COLORS = {
  high:     'bg-green-900/40 text-green-300 border-green-500/30',
  moderate: 'bg-amber-900/40 text-amber-300 border-amber-500/30',
  low:      'bg-red-900/40 text-red-300 border-red-500/30',
  '':       'bg-slate-800 text-slate-400 border-slate-600/40',
};

const REG_BODY_NAMES: Record<CountryCode, string> = { AU: 'APVMA', US: 'EPA', NZ: 'ACVM' };

interface Props {
  disease: Disease;
  weatherContext?: IPMWeatherContext;
  region?: CountryCode;
}

export function DiseaseCard({ disease, weatherContext, region = 'AU' }: Props) {
  const [expanded, setExpanded] = useState(false);
  const style = PATHOGEN_STYLES[disease.pathogen_type] || PATHOGEN_STYLES[''];

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
              <h3 className="font-bold text-white text-base leading-tight">{disease.common_name || disease.disease_name}</h3>
              {disease.common_name && <p className="text-xs text-slate-500 mt-0.5 italic">{disease.disease_name}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {disease.pathogen_type && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.bg} ${style.text} border ${style.border} capitalize`}>
                  {disease.pathogen_type}
                </span>
              )}
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {disease.affected_crops.slice(0, 5).map(crop => (
              <span key={crop} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-400">
                {crop}
              </span>
            ))}
            {disease.affected_crops.length > 5 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-500">
                +{disease.affected_crops.length - 5} more
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{disease.symptoms}</p>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-700/40 pt-4 space-y-4">

          {/* 1. Detected Issue */}
          <Section icon={<Bug className="w-3.5 h-3.5 text-red-400" />} label="Detected Issue" color="text-red-400">
            <InfoBlock icon={<Bug className="w-3.5 h-3.5 text-red-400" />} label="Symptoms" value={disease.symptoms} />
            <InfoBlock icon={<Thermometer className="w-3.5 h-3.5 text-amber-400" />} label="Conditions Favouring Outbreak" value={disease.conditions_favouring} />
            <InfoBlock icon={<Thermometer className="w-3.5 h-3.5 text-blue-400" />} label="Favourable Weather Conditions" value={disease.weather_favourable_conditions} />
          </Section>

          {/* 2. Common Treatment Options */}
          {disease.management_options && (
            <Section icon={<FlaskConical className="w-3.5 h-3.5 text-emerald-400" />} label="Common Treatment Options" color="text-emerald-400">
              <p className="text-[10px] text-slate-500 mb-2 italic">
                Possible treatment options may include the following. Products containing these actives may be suitable where registered. Consider local agronomic advice before application.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">{disease.management_options}</p>
            </Section>
          )}

          {disease.chemicals && disease.chemicals.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Registered Spray Options</div>
              </div>
              <p className="text-[10px] text-slate-500 mb-2.5 italic">
                Common registered active ingredients include the following. Products containing these actives may be suitable where registered — always verify {REG_BODY_NAMES[region]} registration and crop label before use.
              </p>
              <div className="space-y-2">
                {disease.chemicals.map(({ chemical, application_notes, efficacy_rating }) => (
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

          {/* 3. Monitoring Advice */}
          <Section icon={<Eye className="w-3.5 h-3.5 text-blue-400" />} label="Monitoring Advice" color="text-blue-400">
            {disease.affected_crops.length > 0 && (
              <div className="mb-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Affected Crops</div>
                <div className="flex flex-wrap gap-1.5">
                  {disease.affected_crops.map(crop => (
                    <span key={crop} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-slate-400 leading-relaxed">
              Monitor crops regularly for early symptoms. Inspect during periods of favourable conditions. Record observations and consult your agronomist for treatment thresholds.
            </p>
          </Section>

          {/* 4. IPM Management Plan */}
          <IPMPlanCard
            plan={generateDiseaseIPM(
              disease.common_name || disease.disease_name,
              disease.affected_crops,
              disease.symptoms,
              disease.conditions_favouring,
              !!(disease.chemicals && disease.chemicals.length > 0),
              weatherContext,
            )}
          />

          <AgronomyDisclaimer variant="card" />
        </div>
      )}
    </div>
  );
}

function Section({ icon, label, color, children }: { icon: React.ReactNode; label: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className={`flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-700/30`}>
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
