import { Check, Home } from 'lucide-react';

export default function PricingPage() {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleSignUp = () => {
    window.location.href = '/?signup=true';
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#8FA88E' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-900 mb-3">FarmCast Premium</h1>
          <p className="text-xl text-green-800">Professional weather intelligence for farmers</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-green-100 text-green-800 font-semibold px-4 py-2 rounded-full text-sm mb-4">
              1 Month Free Trial
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-2">
              A$2.99<span className="text-2xl text-gray-600">/month</span>
            </h2>
            <p className="text-gray-600">Cancel anytime. No long-term commitment.</p>
          </div>

          <div className="border-t border-gray-200 pt-8 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Everything you need:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Farmer Joe AI Chat</h4>
                  <p className="text-sm text-gray-600">Unlimited AI-powered farming advice and pest analysis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Daily Email Alerts</h4>
                  <p className="text-sm text-gray-600">Weather forecasts and spray window notifications</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Weekly Probe Reports</h4>
                  <p className="text-sm text-gray-600">Comprehensive soil moisture analysis via email</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Advanced Features</h4>
                  <p className="text-sm text-gray-600">Extended forecasts, planting schedules, and more</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSignUp}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
            >
              Start Free Trial
            </button>
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Secure payments powered by Stripe
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Questions?</h3>
          <p className="text-gray-600">
            Contact us at{' '}
            <a href="mailto:support@farmcastweather.com" className="text-green-600 hover:text-green-700">
              support@farmcastweather.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
