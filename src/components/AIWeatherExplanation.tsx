import { Sparkles, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AIWeatherExplanationProps {
  weatherData: any;
  locationName: string;
  isPremium: boolean;
}

export function AIWeatherExplanation({
  weatherData,
  locationName,
  isPremium,
}: AIWeatherExplanationProps) {
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isPremium && weatherData) {
      fetchExplanation();
    }
  }, [isPremium, weatherData]);

  const fetchExplanation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-weather-explanation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            weather: weatherData,
            location: locationName,
          }),
        }
      );

      const data = await response.json();
      setExplanation(data.explanation);
    } catch (error) {
      console.error('Failed to fetch AI explanation:', error);
      setExplanation('Unable to generate explanation at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-md p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-800">AI Weather Insights</h2>
        </div>
        <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
          PREMIUM
        </span>
      </div>

      {!isPremium ? (
        <div className="text-center py-8">
          <div className="mb-4">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-2">
              Get AI-powered weather insights tailored for farming
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Understand complex weather patterns in plain English with actionable recommendations
            </p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all">
            Upgrade to Premium
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : (
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{explanation}</p>
        </div>
      )}
    </div>
  );
}
