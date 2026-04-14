import { Sprout, X } from 'lucide-react';
import { useState } from 'react';

interface PromoBannerProps {
  onSignUp: () => void;
  isLoggedIn: boolean;
}

export function PromoBanner({ onSignUp, isLoggedIn }: PromoBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || isLoggedIn) return null;

  return (
    <div className="rounded-xl border border-green-700/40 bg-green-950/50 backdrop-blur-sm px-5 py-3.5 mb-5 relative">
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-3 right-3 text-green-400/60 hover:text-green-300 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center justify-between gap-4 pr-6">
        <div className="flex items-center gap-3">
          <div className="bg-green-700/40 p-1.5 rounded-lg border border-green-600/30 flex-shrink-0">
            <Sprout className="w-4 h-4 text-green-300" />
          </div>
          <div>
            <div className="text-green-100 font-medium text-sm leading-snug">
              Built for Australian farmers — spray windows, rainfall alerts, forecasts and AI support in one platform.
            </div>
            <div className="text-green-400/70 text-xs mt-0.5">
              Free 30-day trial · then $2.99/month
            </div>
          </div>
        </div>
        <button
          onClick={onSignUp}
          className="bg-green-600/80 hover:bg-green-500/90 border border-green-500/40 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap hover:border-green-400/60 shadow-sm"
        >
          Explore Free for 30 Days
        </button>
      </div>
    </div>
  );
}
