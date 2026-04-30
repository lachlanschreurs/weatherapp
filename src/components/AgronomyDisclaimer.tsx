import { AlertTriangle } from 'lucide-react';

export const DISCLAIMER_FULL =
  'FarmCast provides general agricultural information only and does not constitute chemical, agronomic, fertiliser, or legal application advice. Users must independently verify current registrations (APVMA in Australia, EPA in USA, ACVM/EPA NZ in New Zealand), product labels, crop suitability, withholding periods, application rates, and local conditions before use. Always consult your agronomist before making treatment decisions.';

export const DISCLAIMER_SHORT =
  'General guidance only. Always verify current label directions and local agronomic advice before application.';

export const AI_DISCLAIMER_SUFFIX =
  'Always verify with current label directions and local agronomic advice before spraying or applying products.';

interface Props {
  variant?: 'full' | 'short' | 'inline' | 'card';
}

export function AgronomyDisclaimer({ variant = 'full' }: Props) {
  if (variant === 'inline') {
    return (
      <p className="text-[10px] text-slate-600 leading-relaxed mt-2 italic">
        {DISCLAIMER_SHORT}
      </p>
    );
  }

  if (variant === 'short') {
    return (
      <div className="mt-3 pt-3 border-t border-slate-700/30">
        <p className="text-[10px] text-slate-600 leading-relaxed italic">{DISCLAIMER_SHORT}</p>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-1">
        <p className="text-[10px] text-slate-500 leading-relaxed">{DISCLAIMER_FULL}</p>
        <p className="text-[10px] text-slate-600 leading-relaxed italic font-medium">{DISCLAIMER_SHORT}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-700/30 bg-slate-800/30 px-4 py-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] text-slate-500 leading-relaxed">{DISCLAIMER_FULL}</p>
          <p className="text-[10px] text-slate-600 leading-relaxed mt-1.5 font-medium italic">{DISCLAIMER_SHORT}</p>
        </div>
      </div>
    </div>
  );
}
