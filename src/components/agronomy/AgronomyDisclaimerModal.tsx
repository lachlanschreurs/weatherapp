import { AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';

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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-700/40">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-black text-white leading-tight">Agronomy Information Disclaimer</h2>
            <p className="text-xs text-slate-500 mt-0.5">Please read before accessing this database</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-slate-300 leading-relaxed">
            FarmCast provides agronomy information as a general guide only. Product labels, rates, withholding periods (WHP), registrations, permitted uses, and regional approvals may change and may not always be reflected immediately in this database.
          </p>

          <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-4 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Users must always:</p>
            {[
              'Check the current registered product label before use',
              'Confirm rates, withholding periods, crop suitability, and regional registration requirements',
              'Follow all local regulations and manufacturer instructions',
              'Seek advice from a qualified local agronomist before making spray, fertiliser, pest, disease, or crop management decisions',
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                <p className="text-sm text-slate-300 leading-relaxed">{point}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-red-950/30 border border-red-500/20 px-4 py-3">
            <p className="text-xs text-red-300/80 leading-relaxed">
              FarmCast does not accept liability for loss, damage, crop outcomes, chemical misuse, off-label application, or decisions made solely from information provided in this platform.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-slate-700/40 space-y-3">
          <p className="text-[11px] text-center text-slate-500 italic">
            Always read the label and consult your local agronomist before application.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleViewLabel}
              className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl border border-slate-600/60 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white text-sm font-semibold transition-all duration-200"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              View Label First
            </button>
            <button
              onClick={handleAccept}
              className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold shadow-lg shadow-green-900/40 transition-all duration-200"
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
