import { useState } from 'react';
import { ChevronDown, ChevronUp, FlaskConical, Clock, AlertTriangle, Shield, ExternalLink, Tag } from 'lucide-react';
import type { Chemical, WHPEntry, CountryCode } from './types';
import { AgronomyDisclaimer } from '../AgronomyDisclaimer';

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  fungicide: { bg: 'bg-emerald-900/40', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  insecticide: { bg: 'bg-amber-900/40', text: 'text-amber-300', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  herbicide: { bg: 'bg-orange-900/40', text: 'text-orange-300', border: 'border-orange-500/30', dot: 'bg-orange-400' },
  miticide: { bg: 'bg-rose-900/40', text: 'text-rose-300', border: 'border-rose-500/30', dot: 'bg-rose-400' },
  nematicide: { bg: 'bg-rose-900/40', text: 'text-rose-300', border: 'border-rose-500/30', dot: 'bg-rose-400' },
  other: { bg: 'bg-slate-800/40', text: 'text-slate-300', border: 'border-slate-500/30', dot: 'bg-slate-400' },
};

const REG_BODY_INFO: Record<CountryCode, { name: string; label: string; badge: string }> = {
  AU: { name: 'APVMA', label: 'APVMA Reg.', badge: 'APVMA' },
  US: { name: 'EPA', label: 'EPA Reg. No.', badge: 'EPA' },
  NZ: { name: 'ACVM', label: 'ACVM Reg.', badge: 'ACVM' },
};

interface Props {
  chemical: Chemical;
  region?: CountryCode;
}

export function ChemicalCard({ chemical, region = 'AU' }: Props) {
  const [expanded, setExpanded] = useState(false);
  const style = CATEGORY_STYLES[chemical.category] || CATEGORY_STYLES.other;
  const regBody = REG_BODY_INFO[chemical.country || region];

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
              <h3 className="font-bold text-white text-base leading-tight">{chemical.active_ingredient}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Found in: <span className="text-slate-400">{chemical.product_name}</span></p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-600/40 uppercase tracking-wider">
                {regBody.badge}
              </span>
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
          <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 px-3 py-2">
            <p className="text-[10px] text-slate-500 italic">
              {chemical.active_ingredient} may be used where registered for the listed crops and target issues. Always verify current {regBody.name} registration, product label, and withholding periods before use.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DetailBlock icon={<FlaskConical className="w-3.5 h-3.5" />} label="Mode of Action" value={chemical.mode_of_action} />
            <DetailBlock icon={<FlaskConical className="w-3.5 h-3.5" />} label="Formulation" value={chemical.formulation_type} />
            <DetailBlock icon={<Clock className="w-3.5 h-3.5 text-blue-400" />} label="Re-entry Period" value={chemical.reentry_period} />
          </div>

          <WHPTable entries={chemical.whp_entries} fallback={chemical.withholding_period} />

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

          <div className="flex flex-wrap gap-3 pt-1">
            {(chemical.apvma_registration || chemical.registration_number) && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Tag className="w-3 h-3" />
                <span>{regBody.label}: <span className="text-slate-400 font-mono">{chemical.registration_number || chemical.apvma_registration}</span></span>
              </div>
            )}
            {chemical.label_link && (
              <a
                href={chemical.label_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View Product Label
              </a>
            )}
          </div>

          <AgronomyDisclaimer variant="card" />
        </div>
      )}
    </div>
  );
}

const AU_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
const INTL_REGIONS = ['USA', 'NZ'];

interface CropGroup {
  crop: string;
  entries: WHPEntry[];
  isUniform: boolean;
  uniformEntry?: WHPEntry;
}

function dayLabel(days: number) {
  return days === 0 ? 'Nil' : `${days}d`;
}

function dayColor(days: number) {
  if (days === 0) return 'text-green-400';
  if (days <= 7) return 'text-amber-300';
  if (days <= 14) return 'text-amber-400';
  return 'text-orange-400';
}

function WHPTable({ entries, fallback }: { entries?: WHPEntry[]; fallback: string }) {
  if (!entries || entries.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Withholding Period</span>
        </div>
        <p className="text-sm text-amber-300 font-semibold">{fallback}</p>
      </div>
    );
  }

  // Split into AU vs international entries
  const auEntries = entries.filter(e => e.state === 'All' || AU_STATES.includes(e.state));
  const intlEntries = entries.filter(e => INTL_REGIONS.includes(e.state));

  // Group AU entries by crop
  const auCropMap = new Map<string, WHPEntry[]>();
  for (const e of auEntries) {
    if (!auCropMap.has(e.crop)) auCropMap.set(e.crop, []);
    auCropMap.get(e.crop)!.push(e);
  }

  const auGroups: CropGroup[] = Array.from(auCropMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([crop, cropEntries]) => {
      const isUniform = cropEntries.length === 1 && cropEntries[0].state === 'All';
      return { crop, entries: cropEntries, isUniform, uniformEntry: isUniform ? cropEntries[0] : undefined };
    });

  const auRegistered = auGroups.filter(g => g.entries.some(e => e.registered));
  const auNotRegistered = auGroups.filter(g => g.entries.every(e => !e.registered));

  // Group international entries by region then crop
  const intlByCrop = new Map<string, WHPEntry[]>();
  for (const e of intlEntries) {
    const key = e.crop;
    if (!intlByCrop.has(key)) intlByCrop.set(key, []);
    intlByCrop.get(key)!.push(e);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Withholding Period by Crop &amp; Region</span>
      </div>

      {/* Australia section */}
      {auRegistered.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Australia (APVMA)</span>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-950/15 overflow-hidden">
            {auRegistered.map((group, gi) => (
              <div key={group.crop} className={gi > 0 ? 'border-t border-amber-500/10' : ''}>
                <div className="flex items-center justify-between px-3 py-1.5 bg-amber-950/20">
                  <span className="text-xs font-bold text-slate-300">{group.crop}</span>
                  {group.isUniform && group.uniformEntry && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">All states</span>
                      <span className={`text-sm font-bold tabular-nums ${dayColor(group.uniformEntry.days)}`}>
                        {dayLabel(group.uniformEntry.days)}
                      </span>
                      {group.uniformEntry.notes && (
                        <span className="text-[10px] text-slate-500 italic">{group.uniformEntry.notes}</span>
                      )}
                    </div>
                  )}
                </div>
                {!group.isUniform && (
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-px bg-slate-700/20 border-t border-amber-500/10">
                    {AU_STATES.map(state => {
                      const entry = group.entries.find(e => e.state === state || e.state === 'All');
                      if (!entry) {
                        return (
                          <div key={state} className="bg-slate-900/60 px-1.5 py-2 text-center">
                            <div className="text-[9px] font-bold text-slate-600 uppercase mb-0.5">{state}</div>
                            <div className="text-[10px] text-slate-700">—</div>
                          </div>
                        );
                      }
                      return (
                        <div key={state} className={`px-1.5 py-2 text-center ${entry.registered ? 'bg-slate-900/40' : 'bg-slate-900/80'}`}>
                          <div className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">{state}</div>
                          {entry.registered ? (
                            <div className={`text-xs font-bold tabular-nums ${dayColor(entry.days)}`}>
                              {dayLabel(entry.days)}
                            </div>
                          ) : (
                            <div className="text-[9px] font-semibold text-red-500/70">N/R</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {group.isUniform && group.uniformEntry?.application_notes && (
                  <div className="px-3 py-1 text-[10px] text-slate-500 italic border-t border-amber-500/10">
                    {group.uniformEntry.application_notes}
                  </div>
                )}
              </div>
            ))}
            {auNotRegistered.length > 0 && (
              <div className="border-t border-red-500/20 bg-red-950/10 px-3 py-2">
                <div className="text-[10px] font-bold text-red-400/70 uppercase tracking-wider mb-1">Not Registered (AU)</div>
                <div className="flex flex-wrap gap-1.5">
                  {auNotRegistered.map(g => (
                    <span key={g.crop} className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/40 text-red-400/70 border border-red-500/20">
                      {g.crop}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* International section — USA and NZ */}
      {intlEntries.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">International</span>
          </div>
          <div className="rounded-lg border border-slate-600/30 bg-slate-800/30 overflow-hidden">
            {INTL_REGIONS.map((region, ri) => {
              const regionEntries = intlEntries.filter(e => e.state === region);
              if (regionEntries.length === 0) return null;

              const regionLabel = region === 'USA' ? 'USA (EPA)' : 'New Zealand (ACVM)';
              const registered = regionEntries.filter(e => e.registered);
              const notReg = regionEntries.filter(e => !e.registered);

              return (
                <div key={region} className={ri > 0 ? 'border-t border-slate-600/20' : ''}>
                  <div className="px-3 py-1.5 bg-slate-800/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{regionLabel}</span>
                  </div>
                  {registered.length > 0 && (
                    <div className="px-3 py-2 space-y-1">
                      {registered.map(e => (
                        <div key={e.id} className="flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-300">{e.crop}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-bold tabular-nums ${dayColor(e.days)}`}>
                              {dayLabel(e.days)}
                            </span>
                            {e.application_notes && (
                              <span className="text-[10px] text-slate-500 italic truncate max-w-[140px]">{e.application_notes}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {notReg.length > 0 && (
                    <div className="px-3 py-2 border-t border-slate-600/20">
                      {notReg.map(e => (
                        <div key={e.id} className="flex items-start gap-2">
                          <span className="text-[10px] font-bold text-red-400/70 mt-0.5">N/R</span>
                          <span className="text-[10px] text-slate-500">{e.crop}{e.notes ? ` — ${e.notes}` : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-600 italic">
        N/R = Not registered. AU: verify with APVMA. USA: EPA reg. NZ: ACVM reg. Always check current label before use.
      </p>
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
