import { Bot, Loader2, Sparkles } from 'lucide-react';
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
    if (weatherData) {
      fetchExplanation();
    }
  }, [weatherData]);

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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Weather Assistant</h2>
            <p className="text-blue-100 text-sm">Personalized insights for your farm</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-none p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-gray-600">Analyzing weather data...</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl rounded-tl-none p-5 shadow-sm border border-gray-100">
                <p className="text-gray-800 leading-relaxed whitespace-pre-line">{explanation}</p>
              </div>
              <div className="mt-2 ml-2 text-xs text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Powered by AI</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
