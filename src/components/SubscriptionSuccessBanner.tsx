import { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SubscriptionSuccessBannerProps {
  onDismiss: () => void;
}

export function SubscriptionSuccessBanner({ onDismiss }: SubscriptionSuccessBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  useEffect(() => {
    const auto = setTimeout(handleDismiss, 8000);
    return () => clearTimeout(auto);
  }, []);

  return (
    <div
      className={`mb-5 rounded-2xl border border-green-500/40 bg-green-950/60 backdrop-blur-sm shadow-xl overflow-hidden transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
    >
      <div className="px-6 py-4 flex items-start sm:items-center gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-green-300 mb-0.5">Welcome to FarmCast Premium!</h3>
          <p className="text-sm text-green-200/70">
            Your subscription is active. You now have full access to all premium features — extended forecasts, Farmer Joe AI, probe monitoring, and more.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-green-500 hover:text-green-300 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
