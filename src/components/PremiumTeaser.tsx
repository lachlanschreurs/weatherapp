import { Lock, FileText, Brain, Activity, Leaf } from 'lucide-react';

interface PremiumTeaserProps {
  onSignUpClick: () => void;
}

export function PremiumTeaser({ onSignUpClick }: PremiumTeaserProps) {
  const features = [
    {
      icon: FileText,
      label: 'Daily spray reports',
    },
    {
      icon: Brain,
      label: 'Farmer Joe AI',
    },
    {
      icon: Leaf,
      label: 'Agronomy Advisor',
    },
    {
      icon: Activity,
      label: 'Probe insights',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-xl">
      <div className="px-6 py-4 border-b border-slate-700/40 flex items-center gap-2">
        <Lock className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Premium Features</span>
      </div>

      <div className="px-6 py-5 flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-400 font-medium">{feature.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-green-700/25 bg-green-950/20 px-4 py-3">
          <p className="text-xs text-green-400/80 font-semibold mb-0.5">Agronomy Advisor — included with every plan</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Instantly search weeds, pests, diseases, chemicals and nutrient deficiencies. Get the right answer for your crop problem — in the paddock, right when you need it.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <button
            onClick={onSignUpClick}
            className="bg-green-600/80 hover:bg-green-500/90 border border-green-500/40 hover:border-green-400/60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm whitespace-nowrap"
          >
            Explore Free for 30 Days
          </button>
          <span className="text-xs text-slate-500">Unlock all premium features — no credit card needed to start.</span>
        </div>
      </div>
    </div>
  );
}
