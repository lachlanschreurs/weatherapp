import { Crown, Calendar } from 'lucide-react';

interface SubscriptionBannerProps {
  daysRemaining: number;
  onUpgrade: () => void;
}

export default function SubscriptionBanner({ daysRemaining, onUpgrade }: SubscriptionBannerProps) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="bg-amber-400 rounded-full p-3">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-amber-900 mb-2">
            {daysRemaining > 0 ? `${daysRemaining} Days Left in Your Free Trial` : 'Trial Expired'}
          </h3>
          <p className="text-amber-800 mb-4">
            {daysRemaining > 0
              ? 'Upgrade now to continue accessing full 5-day forecasts and premium farming recommendations after your trial ends.'
              : 'Your trial has ended. Upgrade to access full 5-day forecasts and premium recommendations.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onUpgrade}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Upgrade to Premium
            </button>
            <div className="flex items-center gap-2 text-amber-700">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                {daysRemaining > 0 ? `Trial ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}` : 'Trial ended'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
