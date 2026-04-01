import { useState, useEffect } from 'react';

interface WeatherEffectsProps {
  weatherCode: string;
  isNight: boolean;
}

export function WeatherEffects({ weatherCode, isNight }: WeatherEffectsProps) {
  const [showLightning, setShowLightning] = useState(false);
  const code = weatherCode?.toLowerCase() || '';

  const hasStorm = code.includes('thunder') || code.includes('storm');
  const hasRain = code.includes('rain') || code.includes('shower') || code.includes('drizzle');
  const hasFog = code.includes('mist') || code.includes('fog') || code.includes('haze');
  const isClear = !hasStorm && !hasRain && !hasFog && !code.includes('cloud');

  useEffect(() => {
    if (hasStorm) {
      const lightningInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          setShowLightning(true);
          setTimeout(() => setShowLightning(false), 200);
        }
      }, 3000);

      return () => clearInterval(lightningInterval);
    }
  }, [hasStorm]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {isNight && isClear && (
        <div className="absolute inset-0">
          {[...Array(80)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${1 + Math.random() * 2}px`,
                height: `${1 + Math.random() * 2}px`,
                opacity: 0.3 + Math.random() * 0.7,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {hasRain && (
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={`rain-${i}`}
              className="absolute animate-rain"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.4 + Math.random() * 0.3}s`,
                opacity: 0.3 + Math.random() * 0.3,
              }}
            >
              <div className="w-0.5 h-6 bg-blue-200 rounded-full shadow-sm"></div>
            </div>
          ))}
        </div>
      )}

      {hasStorm && (
        <>
          <div
            className={`absolute inset-0 bg-white transition-opacity duration-100 ${
              showLightning ? 'opacity-40' : 'opacity-0'
            }`}
            style={{ mixBlendMode: 'screen' }}
          />
          <div className="absolute inset-0">
            {[...Array(60)].map((_, i) => (
              <div
                key={`storm-rain-${i}`}
                className="absolute animate-rain"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-${Math.random() * 20}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${0.3 + Math.random() * 0.2}s`,
                  opacity: 0.5 + Math.random() * 0.3,
                }}
              >
                <div className="w-1 h-8 bg-blue-100 rounded-full shadow-md"></div>
              </div>
            ))}
          </div>
        </>
      )}

      {hasFog && (
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={`fog-${i}`}
              className="absolute animate-fog rounded-full blur-3xl"
              style={{
                left: `${(i * 25) - 10}%`,
                top: `${20 + (i % 3) * 20}%`,
                width: '50%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)',
                animationDelay: `${i * 2}s`,
                animationDuration: '15s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
