import { AlertTriangle, ExternalLink, ShieldCheck, BookOpen, ClipboardList } from 'lucide-react';

const DISCLAIMER_VERSION = 'v1';
const STORAGE_KEY = 'farmcast_agronomy_disclaimer_accepted';

export function hasAcceptedAgronomyDisclaimer(): boolean {
  return localStorage.getItem(STORAGE_KEY) === DISCLAIMER_VERSION;
}

export function acceptAgronomyDisclaimer() {
  localStorage.setItem(STORAGE_KEY, DISCLAIMER_VERSION);
}

interface Props {
  onAccept: () => void;
}

export function AgronomyDisclaimerModal({ onAccept }: Props) {
  function handleAccept() {
    acceptAgronomyDisclaimer();
    onAccept();
  }

  function handleViewLabel() {
    window.open('https://www.apvma.gov.au/node/10976', '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden">

        {/* Header */}
        <div className="px-7 pt-7 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-tight tracking-tight">
                Agronomy Information Disclaimer
              </h2>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                Guide only — always verify before application
              </p>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-800" />

        {/* Body */}
        <div className="px-7 py-5 space-y-5 max-h-[56vh] overflow-y-auto">

          {/* Section 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">General Guide Only</p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed pl-6">
              FarmCast provides agronomy information as a general guide only. Product labels, rates, withholding periods (WHP), registrations, permitted uses, and regional approvals may change and may not always be immediately reflected.
            </p>
          </div>

          <div className="h-px bg-slate-800/60" />

          {/* Section 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Before Using Any Recommendation</p>
            </div>
            <div className="pl-6 space-y-2.5">
              {[
                'Check the current registered product label',
                'Confirm rates, WHP, crop suitability, and regional registration',
                'Follow manufacturer instructions and local regulations',
                'Consult your local agronomist before making decisions',
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 mt-[7px]" />
                  <p className="text-sm text-slate-300 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-800/60" />

          {/* Section 3 — Liability */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-xs font-bold text-amber-400/80 uppercase tracking-wider">Liability Notice</p>
            </div>
            <div className="ml-6 rounded-xl bg-amber-950/30 border border-amber-500/20 px-4 py-3.5">
              <p className="text-sm text-amber-200/75 leading-relaxed">
                FarmCast does not accept liability for crop loss, damage, off-label application, chemical misuse, or decisions made solely from platform information.
              </p>
            </div>
          </div>

        </div>

        <div className="h-px bg-slate-800" />

        {/* Footer */}
        <div className="px-7 py-5 space-y-4">
          <p className="text-xs text-center text-slate-500 italic leading-relaxed">
            Always read the current label and seek local agronomy advice.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleViewLabel}
              className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700/60 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-all duration-200"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              View Label First
            </button>
            <button
              onClick={handleAccept}
              className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white text-sm font-bold shadow-lg shadow-green-950/50 transition-all duration-200"
            >
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              I Understand
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
