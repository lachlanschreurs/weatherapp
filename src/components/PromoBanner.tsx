import { Sprout, X, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface PromoBannerProps {
  onSignUp: () => void;
  isLoggedIn: boolean;
}

const PROOF_POINTS = [
  'Best spray window',
  'Rain risk alerts',
  'Field conditions',
  'AI farm support',
];

export function PromoBanner({ onSignUp, isLoggedIn }: PromoBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || isLoggedIn) return null;

  return (
    <div className="relative mb-5 rounded-2xl border border-green-700/50 bg-gradient-to-br from-green-950/80 via-slate-900/90 to-slate-900/80 backdrop-blur-sm shadow-2xl overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(34,197,94,0.08),transparent_60%)]" />

      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-4 right-4 z-10 text-green-400/50 hover:text-green-300 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative z-10 px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex items-center justify-center w-7 h-7 bg-green-600/30 border border-green-500/40 rounded-lg flex-shrink-0">
                <Sprout className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs font-bold tracking-widest uppercase text-green-400">Australian Farm Intelligence</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug mb-2 tracking-tight">
              Built for Australian farmers — spray timing, rainfall alerts, crop decisions and AI support in one platform.
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-4 max-w-2xl">
              Know your best spray window, rain risk and field conditions before you move machinery.
            </p>

            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {PROOF_POINTS.map((point) => (
                <div key={point} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-300">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-center gap-2 flex-shrink-0">
            <button
              onClick={onSignUp}
              className="w-full lg:w-auto bg-green-600 hover:bg-green-500 border border-green-500/60 hover:border-green-400/80 text-white font-bold px-6 py-3 rounded-xl text-sm sm:text-base transition-all duration-200 shadow-lg shadow-green-900/40 hover:shadow-green-800/50 hover:scale-[1.02] whitespace-nowrap"
            >
              Start Free Trial — Unlock Full Farm Report
            </button>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <p className="text-xs text-slate-400 font-medium">Built by farmers, for Australian farms · $2.99/mo after trial</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
