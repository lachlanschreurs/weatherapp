import React, { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, Thermometer, Sprout, Bell, MessageCircle, Gauge, TrendingUp, MapPin, Clock, Activity, CloudRain, Sun, Zap, AlertTriangle } from 'lucide-react';

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
          <div className="h-full bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center p-4">
            <div className="bg-green-700 rounded-2xl p-4 mb-4">
              <Sprout className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-green-900 mb-2 text-center">FarmCast</h1>
            <p className="text-sm text-gray-700 text-center mb-4">Weather Intelligence for Farmers</p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="bg-white rounded-lg p-3 shadow-lg">
                <div className="text-2xl font-bold text-green-700 mb-1">28°C</div>
                <div className="text-xs text-gray-600">Temperature</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">65%</div>
                <div className="text-xs text-gray-600">Humidity</div>
              </div>
            </div>
          </div>
        );

      case 'spray':
        return (
          <div className="h-full bg-white p-4 overflow-y-auto">
            <div className="bg-green-100 rounded-xl p-3 mb-3 border-2 border-green-400">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-green-700" />
                <span className="font-bold text-sm text-green-700">Best Spray Window Today</span>
              </div>
              <div className="text-xl font-bold text-green-800 mb-1">6:00 AM - 10:30 AM</div>
              <div className="text-xs text-green-700">4.5h window • Good conditions</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-3 text-white">
                <Wind className="w-5 h-5 mb-1" />
                <div className="text-2xl font-bold mb-0.5">12</div>
                <div className="text-xs opacity-90">km/h Wind</div>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg p-3 text-white">
                <Activity className="w-5 h-5 mb-1" />
                <div className="text-2xl font-bold mb-0.5">5.2</div>
                <div className="text-xs opacity-90">Delta-T</div>
              </div>
              <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg p-3 text-white">
                <Droplets className="w-5 h-5 mb-1" />
                <div className="text-2xl font-bold mb-0.5">68%</div>
                <div className="text-xs opacity-90">Humidity</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg p-3 text-white">
                <CloudRain className="w-5 h-5 mb-1" />
                <div className="text-2xl font-bold mb-0.5">0%</div>
                <div className="text-xs opacity-90">Rain Today</div>
              </div>
            </div>

            <div className="mt-3 bg-yellow-50 rounded-lg p-3 border-2 border-yellow-300">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-700" />
                <span className="font-bold text-xs text-yellow-800">Spray Advice</span>
              </div>
              <p className="text-xs text-yellow-800">Excellent spraying conditions. Low wind and optimal Delta-T for herbicide application.</p>
            </div>
          </div>
        );

      case 'probe':
        return (
          <div className="h-full bg-gradient-to-br from-blue-50 to-cyan-50 p-4 overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Soil Moisture Probes</h2>
            <div className="space-y-2">
              <div className="bg-white rounded-xl p-3 shadow-lg border-2 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-gray-800">North Field - Probe 1</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">10cm depth:</span>
                    <span className="font-bold text-sm text-blue-600">42%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">30cm depth:</span>
                    <span className="font-bold text-sm text-blue-600">58%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '58%' }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">60cm depth:</span>
                    <span className="font-bold text-sm text-blue-600">71%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '71%' }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-3 border-2 border-yellow-300">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Bell className="w-4 h-4" />
                  <span className="font-semibold text-xs">Irrigation recommended in 2 days</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-3 border-2 border-blue-200">
                <div className="flex items-center gap-2 text-blue-800 mb-1">
                  <Gauge className="w-4 h-4" />
                  <span className="font-semibold text-xs">Battery: 87%</span>
                </div>
                <div className="text-xs text-blue-700">Last updated: 5 minutes ago</div>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="h-full bg-gradient-to-br from-green-50 to-emerald-50 p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-full p-2">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Farmer Joe</h2>
                <p className="text-xs text-gray-600">AI Assistant</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-md">
                <p className="text-gray-700 text-xs">What's the best time to spray today?</p>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-2xl rounded-tr-sm p-3 shadow-md">
                <p className="text-xs mb-2">Based on current conditions, I recommend spraying between 6:00 AM and 10:30 AM today. Conditions are ideal with:</p>
                <ul className="text-xs space-y-0.5 ml-3">
                  <li>• Wind: 8-12 km/h</li>
                  <li>• Delta-T: 4-6 (optimal)</li>
                  <li>• No rain forecast</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-md">
                <p className="text-gray-700 text-xs mb-2">Thanks! Can you analyze this crop image?</p>
                <div className="mt-1 bg-gray-200 rounded-lg h-16 flex items-center justify-center">
                  <Sprout className="w-8 h-8 text-gray-400" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-2xl rounded-tr-sm p-3 shadow-md">
                <p className="text-xs">The crop appears healthy with good color. No visible signs of disease or pest damage. Recommend continuing current management practices.</p>
              </div>
            </div>
          </div>
        );

      case 'forecast':
        return (
          <div className="h-full bg-white p-4 overflow-y-auto">
            <h2 className="text-lg font-bold text-green-900 mb-3">7-Day Forecast</h2>
            <div className="space-y-2">
              {[
                { day: 'Mon', high: 28, low: 16, rain: 10, icon: Sun },
                { day: 'Tue', high: 26, low: 14, rain: 5, icon: Sun },
                { day: 'Wed', high: 24, low: 15, rain: 60, icon: CloudRain },
                { day: 'Thu', high: 22, low: 14, rain: 80, icon: CloudRain },
                { day: 'Fri', high: 25, low: 15, rain: 20, icon: Cloud },
                { day: 'Sat', high: 27, low: 16, rain: 0, icon: Sun },
                { day: 'Sun', high: 29, low: 17, rain: 5, icon: Sun }
              ].map((day, idx) => {
                const Icon = day.icon;
                return (
                  <div key={idx} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-2 border-2 border-green-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-gray-800 w-10">{day.day}</span>
                      <Icon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-red-600 font-bold text-sm">{day.high}°</span>
                        <span className="text-gray-400 mx-0.5 text-xs">/</span>
                        <span className="text-blue-600 font-bold text-sm">{day.low}°</span>
                      </div>
                      <div className="text-blue-600 font-semibold text-sm w-10 text-right">{day.rain}%</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 bg-red-50 rounded-lg p-3 border-2 border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="font-bold text-xs text-red-800">Weather Alert</span>
              </div>
              <p className="text-xs text-red-700">Heavy rain expected Wed-Thu. Plan field work accordingly.</p>
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="h-full bg-gradient-to-br from-green-600 to-emerald-700 flex flex-col items-center justify-center p-6 text-white">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 mb-4">
              <TrendingUp className="w-16 h-16" />
            </div>
            <h1 className="text-3xl font-bold mb-3 text-center">Try FarmCast FREE</h1>
            <p className="text-base mb-6 text-center text-white/90">Join farmers making better decisions</p>
            <div className="bg-white text-green-800 px-6 py-3 rounded-2xl font-bold text-base shadow-2xl mb-4">
              Start Your Free Trial
            </div>
            <div className="space-y-1 text-center text-sm">
              <p className="text-white/90">✓ 7-day free trial</p>
              <p className="text-white/90">✓ No credit card required</p>
              <p className="text-white/90">✓ Cancel anytime</p>
            </div>
            <p className="mt-6 text-xl font-bold">farmcast.app</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center"
         style={{
           backgroundImage: `url('https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
         }}>

      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Mobile-optimized 9:16 aspect ratio container */}
      <div className="relative w-full max-w-md aspect-[9/16] flex flex-col items-center justify-center z-10">

        {/* Computer/Tablet device mockup with 3D perspective */}
        <div className="relative w-[85%]" style={{
          transform: 'perspective(1200px) rotateX(5deg) rotateY(-5deg)',
          transformStyle: 'preserve-3d'
        }}>
          {/* Device shadow */}
          <div className="absolute -inset-4 bg-black/40 blur-2xl rounded-3xl" style={{ transform: 'translateZ(-50px)' }}></div>

          {/* Device frame */}
          <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-3 shadow-2xl">
            {/* Screen bezel */}
            <div className="relative bg-black rounded-xl p-2">
              {/* Actual screen content */}
              <div className="relative bg-white rounded-lg overflow-hidden shadow-inner aspect-[4/3] transition-all duration-700">
                {renderScreenContent()}
              </div>
            </div>

            {/* Top bar elements */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
              <div className="w-16 h-1 bg-gray-700 rounded-full"></div>
            </div>
          </div>

          {/* Device stand/base */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1/2">
            <div className="h-8 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-xl shadow-lg"></div>
            <div className="h-2 w-3/4 mx-auto bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-lg"></div>
          </div>
        </div>

        {/* Floating title card */}
        <div className="mt-20 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-green-300 max-w-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">{currentSlide.title}</h2>
          <p className="text-sm text-gray-600 text-center">{currentSlide.subtitle}</p>
        </div>

        {/* Progress indicators */}
        <div className="mt-6 flex gap-2 justify-center">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setStep(idx)}
              className={`h-2.5 rounded-full transition-all ${
                idx === step ? 'w-10 bg-green-500 shadow-lg shadow-green-500/50' : 'w-2.5 bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Navigation controls */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setStep((prev) => (prev - 1 + 6) % 6)}
            className="bg-white/90 backdrop-blur-sm border-2 border-green-500 text-green-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-green-50 transition-all shadow-lg hover:shadow-xl"
          >
            Previous
          </button>
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="bg-green-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            {autoPlay ? 'Pause' : 'Auto Play'}
          </button>
          <button
            onClick={() => setStep((prev) => (prev + 1) % 6)}
            className="bg-white/90 backdrop-blur-sm border-2 border-green-500 text-green-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-green-50 transition-all shadow-lg hover:shadow-xl"
          >
            Next
          </button>
        </div>
      </div>

      {/* Instructions overlay */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-lg border border-gray-700 text-white px-6 py-3 rounded-full text-sm max-w-md text-center shadow-2xl z-20">
        <p>📱 Record this on your phone in portrait mode • Click "Auto Play" for smooth transitions</p>
      </div>
    </div>
  );
}
