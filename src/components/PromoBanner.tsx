import { Crown, Mail, CloudRain, Droplets, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';

interface PromoBannerProps {
  onSignUp: () => void;
  isLoggedIn: boolean;
}

export function PromoBanner({ onSignUp, isLoggedIn }: PromoBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || isLoggedIn) return null;

  return (
    <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-2xl shadow-2xl p-8 mb-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 transform rotate-12 translate-x-1/4 -translate-y-1/4">
          <CloudRain className="w-64 h-64 text-white" />
        </div>
        <div className="absolute bottom-0 left-0 transform -rotate-12 -translate-x-1/4 translate-y-1/4">
          <Droplets className="w-48 h-48 text-white" />
        </div>
      </div>

      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
        aria-label="Dismiss"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-yellow-400 p-2 rounded-lg">
            <Crown className="w-8 h-8 text-yellow-900" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">
              Get More with FarmCast Premium
            </h2>
            <p className="text-green-100 text-lg">
              Make smarter farming decisions with daily forecasts delivered to your inbox
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20">
            <div className="flex items-start gap-3">
              <div className="bg-green-500 p-2 rounded-lg flex-shrink-0">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg mb-2">Daily Email Forecasts</h3>
                <p className="text-green-100 text-sm">
                  Wake up to comprehensive weather reports tailored for your farm location, delivered every morning
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 p-2 rounded-lg flex-shrink-0">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg mb-2">Moisture Probe Reports</h3>
                <p className="text-green-100 text-sm">
                  Get weekly summaries of your soil moisture data with insights and irrigation recommendations
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20">
            <div className="flex items-start gap-3">
              <div className="bg-yellow-500 p-2 rounded-lg flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg mb-2">Extended Forecasts</h3>
                <p className="text-green-100 text-sm">
                  Plan ahead with 14-day forecasts, spray windows, planting conditions, and irrigation planning
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <div>
            <div className="text-white font-bold text-2xl mb-1">
              Start Your Free 30-Day Trial
            </div>
            <p className="text-green-100">
              No credit card required. Cancel anytime. Just $9.99/month after trial.
            </p>
          </div>
          <button
            onClick={onSignUp}
            className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 whitespace-nowrap"
          >
            Start Free Trial
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-green-200 text-sm">
            Join hundreds of farmers making better decisions with FarmCast Premium
          </p>
        </div>
      </div>
    </div>
  );
}
