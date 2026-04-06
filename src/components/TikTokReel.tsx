import React, { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, Thermometer, Sprout, Bell, MessageCircle, Gauge, TrendingUp, MapPin, Clock, Activity, CloudRain, Sun } from 'lucide-react';

export default function TikTokReel() {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    if (autoPlay) {
      const interval = setInterval(() => {
        setStep((prev) => (prev + 1) % 6);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [autoPlay]);

  const slides = [
    {
      title: "Stop Guessing. Start Farming Smarter.",
      subtitle: "FarmCast gives you the weather data farmers actually need",
      type: "intro"
    },
    {
      title: "Spray Window Calculator",
      subtitle: "Know exactly when conditions are perfect for spraying",
      type: "spray"
    },
    {
      title: "Soil Moisture Monitoring",
      subtitle: "Connect your moisture probes and track soil conditions 24/7",
      type: "probe"
    },
    {
      title: "Farmer Joe AI Assistant",
      subtitle: "Your personal farming advisor, powered by AI",
      type: "ai"
    },
    {
      title: "Smart Alerts & Forecasts",
      subtitle: "Get notified about weather that matters to your farm",
      type: "forecast"
    },
    {
      title: "Try FarmCast FREE",
      subtitle: "Join farmers already making better decisions",
      type: "cta"
    }
  ];

  const currentSlide = slides[step];

  const renderScreenContent = () => {
    switch (currentSlide.type) {
      case 'intro':
        return (
          <div className="h-full bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center p-6">
            <div className="bg-green-700 rounded-2xl p-6 mb-6">
              <Sprout className="w-24 h-24 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-green-900 mb-4 text-center">FarmCast</h1>
            <p className="text-2xl text-gray-700 text-center mb-8">Weather Intelligence for Farmers</p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <div className="text-4xl font-bold text-green-700 mb-1">28°C</div>
                <div className="text-sm text-gray-600">Temperature</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <div className="text-4xl font-bold text-blue-600 mb-1">65%</div>
                <div className="text-sm text-gray-600">Humidity</div>
              </div>
            </div>
          </div>
        );

      case 'spray':
        return (
          <div className="h-full bg-white p-6 overflow-hidden">
            <div className="bg-green-100 rounded-xl p-4 mb-4 border-2 border-green-400">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-green-700" />
                <span className="font-bold text-green-700">Best Spray Window Today</span>
              </div>
              <div className="text-2xl font-bold text-green-800 mb-1">6:00 AM - 10:30 AM</div>
              <div className="text-sm text-green-700">4.5h window • Good conditions</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-4 text-white">
                <Wind className="w-6 h-6 mb-2" />
                <div className="text-3xl font-bold mb-1">12</div>
                <div className="text-sm opacity-90">km/h Wind</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-4 text-white">
                <Activity className="w-6 h-6 mb-2" />
                <div className="text-3xl font-bold mb-1">5.2</div>
                <div className="text-sm opacity-90">Delta-T</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg p-4 text-white">
                <Droplets className="w-6 h-6 mb-2" />
                <div className="text-3xl font-bold mb-1">68%</div>
                <div className="text-sm opacity-90">Humidity</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-4 text-white">
                <CloudRain className="w-6 h-6 mb-2" />
                <div className="text-3xl font-bold mb-1">0%</div>
                <div className="text-sm opacity-90">Rain Today</div>
              </div>
            </div>
          </div>
        );

      case 'probe':
        return (
          <div className="h-full bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Soil Moisture Probes</h2>
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-800">North Field - Probe 1</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Active</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">10cm depth:</span>
                    <span className="font-bold text-blue-600">42%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">30cm depth:</span>
                    <span className="font-bold text-blue-600">58%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '58%' }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-300">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Bell className="w-5 h-5" />
                  <span className="font-semibold">Irrigation recommended in 2 days</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="h-full bg-gradient-to-br from-purple-50 to-pink-50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-3">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Farmer Joe</h2>
                <p className="text-sm text-gray-600">AI Assistant</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-md">
                <p className="text-gray-700 text-sm mb-2">What's the best time to spray today?</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl rounded-tr-none p-4 shadow-md">
                <p className="text-sm mb-3">Based on current conditions, I recommend spraying between 6:00 AM and 10:30 AM today. Conditions are ideal with:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Wind: 8-12 km/h</li>
                  <li>• Delta-T: 4-6 (optimal)</li>
                  <li>• No rain forecast</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-md">
                <p className="text-gray-700 text-sm">Thanks! Can you analyze this crop image?</p>
                <div className="mt-2 bg-gray-200 rounded-lg h-24 flex items-center justify-center">
                  <Sprout className="w-12 h-12 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'forecast':
        return (
          <div className="h-full bg-white p-6">
            <h2 className="text-2xl font-bold text-green-900 mb-4">5-Day Forecast</h2>
            <div className="space-y-3">
              {[
                { day: 'Mon', high: 28, low: 16, rain: 10, icon: Sun },
                { day: 'Tue', high: 26, low: 14, rain: 5, icon: Sun },
                { day: 'Wed', high: 24, low: 15, rain: 60, icon: CloudRain },
                { day: 'Thu', high: 22, low: 14, rain: 80, icon: CloudRain },
                { day: 'Fri', high: 25, low: 15, rain: 20, icon: Cloud }
              ].map((day, idx) => {
                const Icon = day.icon;
                return (
                  <div key={idx} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border-2 border-green-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg text-gray-800 w-12">{day.day}</span>
                      <Icon className="w-8 h-8 text-gray-600" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-red-600 font-bold">{day.high}°</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-blue-600 font-bold">{day.low}°</span>
                      </div>
                      <div className="text-blue-600 font-semibold w-12 text-right">{day.rain}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="h-full bg-gradient-to-br from-green-500 to-emerald-600 flex flex-col items-center justify-center p-8 text-white">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-8 mb-6">
              <TrendingUp className="w-24 h-24" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-center">Try FarmCast FREE</h1>
            <p className="text-xl mb-8 text-center text-white/90">Join farmers making better decisions</p>
            <div className="bg-white text-green-800 px-8 py-4 rounded-2xl font-bold text-xl shadow-2xl mb-6">
              Start Your Free Trial
            </div>
            <div className="space-y-2 text-center">
              <p className="text-white/90">✓ 7-day free trial</p>
              <p className="text-white/90">✓ No credit card required</p>
              <p className="text-white/90">✓ Cancel anytime</p>
            </div>
            <p className="mt-8 text-2xl font-bold">farmcast.app</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-green-100 to-emerald-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Farm field background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-800 to-transparent"></div>
        {/* Crop rows effect */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 h-2 bg-green-700"
            style={{
              left: `${i * 8.33}%`,
              width: '4%',
              height: `${Math.random() * 30 + 10}%`,
              opacity: 0.3
            }}
          />
        ))}
      </div>

      {/* Sky/clouds effect */}
      <div className="absolute top-0 left-0 right-0 h-1/3">
        <div className="absolute top-10 left-10 w-32 h-16 bg-white/40 rounded-full blur-xl"></div>
        <div className="absolute top-20 right-20 w-40 h-20 bg-white/30 rounded-full blur-xl"></div>
        <div className="absolute top-32 left-1/3 w-36 h-18 bg-white/35 rounded-full blur-xl"></div>
      </div>

      {/* Mobile-optimized 9:16 aspect ratio container */}
      <div className="relative w-full max-w-md aspect-[9/16] flex flex-col items-center justify-center z-10">

        {/* Computer/Tablet device mockup */}
        <div className="relative w-[85%] perspective-1000" style={{ transform: 'rotateX(2deg) rotateY(-2deg)' }}>
          {/* Device frame */}
          <div className="relative bg-gray-800 rounded-2xl p-3 shadow-2xl">
            {/* Screen bezel */}
            <div className="relative bg-black rounded-lg p-2">
              {/* Actual screen content */}
              <div className="relative bg-white rounded-lg overflow-hidden shadow-inner aspect-[4/3] transition-all duration-700">
                {renderScreenContent()}
              </div>
            </div>

            {/* Camera/sensor */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rounded-full"></div>
          </div>

          {/* Device stand/base */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1/3 h-8 bg-gray-700 rounded-b-lg shadow-lg"></div>
        </div>

        {/* Floating title card */}
        <div className="mt-16 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-green-200 max-w-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">{currentSlide.title}</h2>
          <p className="text-sm text-gray-600 text-center">{currentSlide.subtitle}</p>
        </div>

        {/* Progress indicators */}
        <div className="mt-6 flex gap-2 justify-center">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setStep(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === step ? 'w-8 bg-green-600' : 'w-2 bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Navigation controls */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setStep((prev) => (prev - 1 + 6) % 6)}
            className="bg-white/90 backdrop-blur-sm border-2 border-green-600 text-green-700 font-semibold px-6 py-2 rounded-xl hover:bg-green-50 transition-colors shadow-lg"
          >
            Previous
          </button>
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="bg-green-600 text-white font-semibold px-6 py-2 rounded-xl hover:bg-green-700 transition-colors shadow-lg"
          >
            {autoPlay ? 'Pause' : 'Auto Play'}
          </button>
          <button
            onClick={() => setStep((prev) => (prev + 1) % 6)}
            className="bg-white/90 backdrop-blur-sm border-2 border-green-600 text-green-700 font-semibold px-6 py-2 rounded-xl hover:bg-green-50 transition-colors shadow-lg"
          >
            Next
          </button>
        </div>
      </div>

      {/* Instructions overlay */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-lg border border-gray-700 text-white px-6 py-3 rounded-full text-sm max-w-md text-center shadow-2xl z-20">
        <p>Record this on your phone in portrait mode • Click "Auto Play" for smooth transitions</p>
      </div>
    </div>
  );
}
