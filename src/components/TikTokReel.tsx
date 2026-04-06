import React, { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, Thermometer, Sprout, Bell, MessageCircle, Gauge, TrendingUp, MapPin } from 'lucide-react';

export default function TikTokReel() {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    if (autoPlay) {
      const interval = setInterval(() => {
        setStep((prev) => (prev + 1) % 6);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [autoPlay]);

  const slides = [
    {
      title: "Stop Guessing. Start Farming Smarter.",
      subtitle: "FarmCast gives you the weather data farmers actually need",
      icon: Cloud,
      gradient: "from-blue-500 to-cyan-500",
      features: []
    },
    {
      title: "Spray Window Calculator",
      subtitle: "Know exactly when conditions are perfect for spraying",
      icon: Sprout,
      gradient: "from-green-500 to-emerald-500",
      features: [
        "Real-time spray conditions",
        "Delta-T calculations",
        "Wind speed monitoring",
        "Temperature tracking"
      ]
    },
    {
      title: "Soil Moisture Monitoring",
      subtitle: "Connect your moisture probes and track soil conditions 24/7",
      icon: Droplets,
      gradient: "from-blue-600 to-indigo-600",
      features: [
        "Multiple depth readings",
        "Trend analysis",
        "Irrigation alerts",
        "Weekly reports"
      ]
    },
    {
      title: "Farmer Joe AI Assistant",
      subtitle: "Your personal farming advisor, powered by AI",
      icon: MessageCircle,
      gradient: "from-purple-500 to-pink-500",
      features: [
        "Crop advice",
        "Image analysis",
        "Disease detection",
        "24/7 support"
      ]
    },
    {
      title: "Smart Alerts & Forecasts",
      subtitle: "Get notified about weather that matters to your farm",
      icon: Bell,
      gradient: "from-orange-500 to-red-500",
      features: [
        "Rain alerts",
        "Frost warnings",
        "Wind notifications",
        "14-day forecasts"
      ]
    },
    {
      title: "Try FarmCast FREE",
      subtitle: "Join farmers already making better decisions",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-500",
      features: [
        "7-day free trial",
        "No credit card required",
        "Cancel anytime",
        "Premium features included"
      ]
    }
  ];

  const currentSlide = slides[step];
  const Icon = currentSlide.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Mobile-optimized 9:16 aspect ratio container */}
      <div className="relative w-full max-w-md aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl">

        {/* Animated background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${currentSlide.gradient} opacity-90 transition-all duration-1000`} />

        {/* Animated pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-8 text-white">

          {/* Top section - Logo/Branding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-8 h-8" />
              <span className="text-2xl font-bold">FarmCast</span>
            </div>
            <div className="text-sm bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              {step + 1}/6
            </div>
          </div>

          {/* Middle section - Main content */}
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 py-8">

            {/* Icon with animation */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl animate-pulse" />
              <div className="relative bg-white/10 backdrop-blur-sm p-8 rounded-full border-4 border-white/30">
                <Icon className="w-20 h-20" strokeWidth={2} />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold leading-tight drop-shadow-lg">
              {currentSlide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-white/90 drop-shadow">
              {currentSlide.subtitle}
            </p>

            {/* Features list */}
            {currentSlide.features.length > 0 && (
              <div className="w-full max-w-xs space-y-3 mt-4">
                {currentSlide.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20"
                    style={{
                      animation: `slideInRight 0.5s ease-out ${idx * 0.1}s both`
                    }}
                  >
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom section - CTA */}
          <div className="space-y-4">
            {step === 5 ? (
              <div className="space-y-3">
                <button className="w-full bg-white text-gray-900 font-bold py-4 rounded-2xl text-lg shadow-xl hover:scale-105 transition-transform">
                  Start Free Trial
                </button>
                <p className="text-center text-sm text-white/80">
                  farmcast.app
                </p>
              </div>
            ) : (
              <div className="flex gap-2 justify-center">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setStep(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === step ? 'w-8 bg-white' : 'w-2 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep((prev) => (prev - 1 + 6) % 6)}
                className="flex-1 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className="flex-1 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-colors"
              >
                {autoPlay ? 'Pause' : 'Auto Play'}
              </button>
              <button
                onClick={() => setStep((prev) => (prev + 1) % 6)}
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold py-3 rounded-xl hover:bg-white/30 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions overlay */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-lg border border-white/20 text-white px-6 py-3 rounded-full text-sm max-w-md text-center">
        <p>📱 Record this on your phone in portrait mode • Click "Auto Play" for smooth transitions</p>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
