import { Lock, Calendar, Brain, Activity, Bell } from 'lucide-react';

interface PremiumTeaserProps {
  onSignUpClick: () => void;
}

export function PremiumTeaser({ onSignUpClick }: PremiumTeaserProps) {
  const features = [
    {
      icon: Calendar,
      title: '30-Day Extended Forecast',
      description: 'Plan ahead with detailed month-long weather predictions',
    },
    {
      icon: Brain,
      title: 'AI Crop Planning Reports',
      description: 'Get personalized insights for optimal planting and harvesting',
    },
    {
      icon: Activity,
      title: 'Probe Integration',
      description: 'Connect moisture probes for real-time soil data',
    },
    {
      icon: Bell,
      title: 'Advanced Spray Alerts',
      description: 'Receive notifications for ideal spraying windows',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 border-2 border-green-200">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-3xl font-bold text-green-900 mb-2">Unlock Premium Features</h3>
        <p className="text-gray-600 text-lg">Take your farm planning to the next level</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-5 border-2 border-green-100 shadow-md hover:shadow-lg transition-all hover:border-green-300"
            >
              <div className="flex items-start gap-4">
                <div className="bg-green-100 rounded-lg p-3 flex-shrink-0">
                  <Icon className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <button
          onClick={onSignUpClick}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Start Free Trial
        </button>
        <p className="text-sm text-gray-500 mt-3">No credit card required</p>
      </div>
    </div>
  );
}
