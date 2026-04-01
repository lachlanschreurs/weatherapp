import { useEffect, useState } from 'react';
import { Check, Loader2, Home } from 'lucide-react';

export default function SuccessPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#8FA88E' }}>
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 animate-spin text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing your subscription...</h2>
          <p className="text-gray-600">Please wait while we activate your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#8FA88E' }}>
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <Check className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to FarmCast Premium!</h1>

        <p className="text-lg text-gray-700 mb-6">
          Your subscription has been activated successfully.
        </p>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-green-900 mb-3">What's included:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Unlimited Farmer Joe AI chat</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Daily email weather alerts</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Weekly probe reports</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>1-month free trial</span>
            </li>
          </ul>
        </div>

        <button
          onClick={handleGoHome}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Go to FarmCast Dashboard
        </button>

        <p className="text-xs text-gray-500 mt-4">
          You can manage your subscription anytime from your account settings.
        </p>
      </div>
    </div>
  );
}
