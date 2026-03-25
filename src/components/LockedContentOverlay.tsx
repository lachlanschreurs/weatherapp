import { Lock } from 'lucide-react';

interface LockedContentOverlayProps {
  onUpgrade: () => void;
}

export default function LockedContentOverlay({ onUpgrade }: LockedContentOverlayProps) {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
      <div className="text-center p-8 max-w-md">
        <div className="bg-amber-100 rounded-full p-4 inline-block mb-4">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h3>
        <p className="text-gray-600 mb-6">
          Upgrade to access full 5-day forecasts and extended farming recommendations.
        </p>
        <button
          onClick={onUpgrade}
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
