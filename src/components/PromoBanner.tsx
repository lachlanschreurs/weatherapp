import { Crown, X } from 'lucide-react';
import { useState } from 'react';

interface PromoBannerProps {
  onSignUp: () => void;
  isLoggedIn: boolean;
}

export function PromoBanner({ onSignUp, isLoggedIn }: PromoBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || isLoggedIn) return null;

  return (
    <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-4 mb-4 relative">
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center justify-between gap-4 pr-6">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 p-1.5 rounded">
            <Crown className="w-5 h-5 text-green-900" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">
              Get daily forecasts + probe reports
            </div>
            <div className="text-green-100 text-xs">
              30-day free trial, then $9.99/month
            </div>
          </div>
        </div>
        <button
          onClick={onSignUp}
          className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-semibold px-4 py-2 rounded text-sm shadow-md hover:shadow-lg transition-all whitespace-nowrap"
        >
          Start Free Trial
        </button>
      </div>
    </div>
  );
}
