import { useState } from 'react';
import { Loader2, Leaf, Brain, FileText, Bell, Droplets, FlaskConical, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubscriptionManagerProps {
  onClose: () => void;
}

const BENEFITS = [
  {
    icon: FlaskConical,
    label: 'Unlock Agronomy Advisor',
    sub: 'Instant answers for weeds, pests, diseases, chemicals & fertiliser',
    highlight: true,
  },
  {
    icon: Brain,
    label: 'Unlock Farmer Joe AI',
    sub: 'Your full-farm AI assistant — ask anything, anytime',
    highlight: true,
  },
  {
    icon: FileText,
    label: 'Unlock Full Farm Report',
    sub: 'Daily spray timing, extended 30-day forecasts & summaries',
    highlight: false,
  },
  {
    icon: Bell,
    label: 'Unlock Alerts & Premium Tools',
    sub: 'Frost alerts, rain notifications & advanced spray windows',
    highlight: false,
  },
  {
    icon: Droplets,
    label: 'Unlock Advanced Spray Timing',
    sub: 'Delta-T, wind, humidity and optimal application windows',
    highlight: false,
  },
  {
    icon: Leaf,
    label: 'Probe Monitoring',
    sub: 'Connect moisture and soil probes for real-time insights',
    highlight: false,
  },
];

export default function SubscriptionManager(_props: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to start subscription process');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="relative rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #0d1a10, #091209)',
          border: '1px solid rgba(34,197,94,0.25)',
          boxShadow: '0 0 0 1px rgba(34,197,94,0.1), 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(34,197,94,0.08)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.07) 0%, transparent 60%)',
          }}
        />


        <div className="relative px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-green-600/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
              <Leaf className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">FarmCast Premium</h2>
              <p className="text-xs text-slate-500 font-semibold">Your complete farm intelligence platform</p>
            </div>
          </div>
        </div>

        <div className="relative px-6 py-4">
          <div
            className="rounded-xl border border-green-700/30 px-4 py-3 mb-4"
            style={{ background: 'rgba(10,28,16,0.6)' }}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">$2.99</span>
              <span className="text-sm text-slate-400 font-semibold">/ month</span>
              <span className="ml-auto text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                30-day free trial
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">No credit card needed to start. Cancel anytime.</p>
          </div>

          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Includes:</p>

          <div className="space-y-2.5 mb-4">
            {BENEFITS.map(({ icon: Icon, label, sub, highlight }) => (
              <div
                key={label}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  highlight
                    ? 'border-green-600/30 bg-green-950/50'
                    : 'border-slate-800/60 bg-slate-900/30'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    highlight
                      ? 'bg-green-600/20 border border-green-500/30'
                      : 'bg-slate-800/60 border border-slate-700/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${highlight ? 'text-green-400' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${highlight ? 'text-white' : 'text-slate-300'}`}>
                      {label}
                    </span>
                    {highlight && (
                      <span className="text-[10px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Key Feature
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{sub}</p>
                </div>
                <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${highlight ? 'text-green-400' : 'text-slate-600'}`} />
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            style={{
              boxShadow: '0 4px 20px rgba(34,197,94,0.25)',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Start Free Trial — 30 Days Free'
            )}
          </button>

          <p className="text-xs text-slate-600 text-center mt-3 pb-2">
            Cancel anytime. You won't be charged until your 30-day trial ends.
          </p>
        </div>
      </div>
    </div>
  );
}
