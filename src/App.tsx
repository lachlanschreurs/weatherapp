import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Droplets, Wind, Gauge, Sun, CloudDrizzle, Zap, Clock, Sprout, Calendar, LogOut, RefreshCw } from 'lucide-react';
import { getSprayCondition } from './utils/deltaT';
import { generateWeatherAlerts } from './utils/weatherAlerts';
import { findBestSprayWindow } from './utils/sprayWindow';
import { analyzePlantingDays, analyzeIrrigationNeeds, PlantingDay, IrrigationDay } from './utils/farmingRecommendations';
import { AlertBanner } from './components/AlertBanner';
import { LocationSearch, Location } from './components/LocationSearch';
import { HourlyForecast } from './components/HourlyForecast';
import { RainRadar } from './components/RainRadar';
import { supabase, Profile } from './lib/supabase';
import AuthModal from './components/AuthModal';
import SubscriptionBanner from './components/SubscriptionBanner';
import LockedContentOverlay from './components/LockedContentOverlay';
import { ExtendedForecast } from './components/ExtendedForecast';
import { AIWeatherExplanation } from './components/AIWeatherExplanation';
import { OperationAlerts } from './components/OperationAlerts';
import { SavedLocations } from './components/SavedLocations';
import { RainProbabilityBreakdown } from './components/RainProbabilityBreakdown';
import { WindTiming } from './components/WindTiming';
import { SoilWorkability } from './components/SoilWorkability';
import {
  generateExtendedForecast,
  generateRainProbabilityData,
  generateWindTimingData,
  generateSoilWorkabilityData,
  generateOperationAlerts,
} from './utils/premiumDataGenerators';

interface WeatherData {
  current: {
    main: {
      temp: number;
      humidity: number;
      pressure: number;
    };
    weather: Array<{
      main: string;
      description: string;
    }>;
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    rain?: {
      '1h'?: number;
    };
  };
  forecast: {
    list: Array<{
      dt: number;
      main: {
        temp: number;
        temp_min: number;
        temp_max: number;
        humidity: number;
      };
      weather: Array<{
        main: string;
        description: string;
      }>;
      wind: {
        speed: number;
        gust?: number;
      };
      rain?: {
        '3h'?: number;
      };
      dt_txt: string;
    }>;
  };
}

function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [location, setLocation] = useState<Location>(() => {
    const savedLocation = localStorage.getItem('farmcast-location');
    if (savedLocation) {
      try {
        return JSON.parse(savedLocation);
      } catch {
        return {
          name: 'Middle Tarwin',
          lat: -38.699,
          lon: 146.463,
          country: 'AU',
          state: 'Victoria',
        };
      }
    }
    return {
      name: 'Middle Tarwin',
      lat: -38.699,
      lon: 146.463,
      country: 'AU',
      state: 'Victoria',
    };
  });

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setHasAccess(false);
        setDaysRemaining(0);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [location]);

  useEffect(() => {
    if (profile) {
      checkSubscriptionStatus();
    }
  }, [profile]);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  }

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  }

  function checkSubscriptionStatus() {
    if (!profile) {
      setHasAccess(false);
      setDaysRemaining(0);
      return;
    }

    const now = new Date();
    const trialEnd = new Date(profile.trial_ends_at);
    const subscriptionEnd = profile.subscription_ends_at ? new Date(profile.subscription_ends_at) : null;

    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    setDaysRemaining(Math.max(0, daysLeft));

    const inTrial = profile.subscription_status === 'trial' && now < trialEnd;
    const hasActiveSubscription = profile.subscription_status === 'active' && subscriptionEnd && now < subscriptionEnd;

    setHasAccess(inTrial || hasActiveSubscription);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setHasAccess(false);
    setDaysRemaining(0);
  }

  function handleUpgrade() {
    alert('Subscription management coming soon! Contact us to upgrade your account.');
  }

  async function fetchWeather() {
    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const timestamp = Date.now();
      const apiUrl = `${supabaseUrl}/functions/v1/weather?lat=${location.lat}&lon=${location.lon}&t=${timestamp}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      setWeather(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function getWeatherIcon(weatherCode: string, size: string = 'w-16 h-16') {
    const code = weatherCode?.toLowerCase() || '';

    if (code.includes('thunder') || code.includes('storm')) {
      return <Zap className={`${size} text-yellow-500`} />;
    }
    if (code.includes('rain') || code.includes('shower')) {
      return <CloudRain className={`${size} text-blue-500`} />;
    }
    if (code.includes('drizzle')) {
      return <CloudDrizzle className={`${size} text-blue-400`} />;
    }
    if (code.includes('cloud') || code.includes('overcast')) {
      return <Cloud className={`${size} text-gray-500`} />;
    }
    return <Sun className={`${size} text-yellow-400`} />;
  }

  function getBackgroundGradient(weatherCode: string) {
    const code = weatherCode?.toLowerCase() || '';

    if (code.includes('thunder') || code.includes('storm')) {
      return 'from-gray-800 via-slate-700 to-gray-900';
    }
    if (code.includes('rain') || code.includes('shower') || code.includes('drizzle')) {
      return 'from-slate-600 via-gray-500 to-slate-600';
    }
    if (code.includes('cloud') || code.includes('overcast')) {
      return 'from-gray-400 via-gray-300 to-gray-500';
    }
    return 'from-amber-300 via-yellow-200 to-sky-400';
  }

  function getTextColor(weatherCode: string) {
    const code = weatherCode?.toLowerCase() || '';

    if (code.includes('thunder') || code.includes('storm')) {
      return 'text-white';
    }
    if (code.includes('rain')) {
      return 'text-white';
    }
    return 'text-gray-800';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#8FA88E' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading FarmCast...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#8FA88E' }}>
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={fetchWeather}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const current = weather?.current;
  const forecastList = weather?.forecast?.list || [];

  if (!current) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#8FA88E' }}>
        <div className="text-center">
          <p className="text-gray-700 text-lg">No weather data available</p>
        </div>
      </div>
    );
  }

  const tempC = current.main.temp;
  const humidity = current.main.humidity;
  const weatherCode = current.weather[0]?.main || 'clear';
  const weatherDescription = current.weather[0]?.description || 'clear';
  const bgGradient = getBackgroundGradient(weatherCode);
  const textColor = getTextColor(weatherCode);

  const windSpeedKmh = current.wind.speed * 3.6;
  const windGustKmh = current.wind.gust ? current.wind.gust * 3.6 : null;
  const windDegrees = current.wind.deg;
  const getWindDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };
  const windDirection = getWindDirection(windDegrees);

  const handleLocationSelect = (newLocation: Location) => {
    setLocation(newLocation);
    localStorage.setItem('farmcast-location', JSON.stringify(newLocation));
  };

  const rainfall = current.rain?.['1h'] || 0;
  const sprayCondition = getSprayCondition(windSpeedKmh, rainfall);

  const dewpointC = tempC - ((100 - humidity) / 5);

  const currentTime = Date.now() / 1000;
  const last12Hours = forecastList.filter((item: any) => {
    const timeDiff = currentTime - item.dt;
    return timeDiff >= 0 && timeDiff <= 12 * 3600;
  });

  const rainfall12h = last12Hours.reduce((sum: number, item: any) => {
    return sum + (item.rain?.['3h'] || 0);
  }, 0);

  const dailyForecasts = forecastList.reduce((acc: any[], item: any) => {
    const date = new Date(item.dt * 1000).toLocaleDateString('en-AU');
    const existing = acc.find(f => f.date === date);

    if (!existing) {
      acc.push({
        date,
        dt: item.dt,
        temps: [item.main.temp],
        tempMin: item.main.temp_min,
        tempMax: item.main.temp_max,
        humidity: item.main.humidity,
        weather: item.weather[0]?.main || 'clear',
        windSpeed: item.wind.speed * 3.6,
        rain: item.rain?.['3h'] || 0,
        rainCount: item.rain?.['3h'] ? 1 : 0,
        totalForecasts: 1,
        forecastItems: [item],
      });
    } else {
      existing.temps.push(item.main.temp);
      existing.tempMin = Math.min(existing.tempMin, item.main.temp_min);
      existing.tempMax = Math.max(existing.tempMax, item.main.temp_max);
      existing.rain += item.rain?.['3h'] || 0;
      existing.rainCount += item.rain?.['3h'] ? 1 : 0;
      existing.totalForecasts += 1;
      existing.forecastItems.push(item);
    }

    return acc;
  }, []).slice(0, 5);

  const todayForecast = dailyForecasts[0];
  const todayRainChance = todayForecast ? Math.round((todayForecast.rainCount / todayForecast.totalForecasts) * 100) : 0;
  const todayExpectedRain = todayForecast ? todayForecast.rain : 0;

  const alerts = generateWeatherAlerts(
    tempC,
    humidity,
    current.wind.speed,
    rainfall,
    weatherCode,
    forecastList
  );

  const dailyData = dailyForecasts.map(day => ({
    date: new Date(day.dt * 1000),
    tempMax: day.tempMax,
    tempMin: day.tempMin,
    humidity: day.humidity,
    windSpeed: day.windSpeed,
    rain: day.rain,
    weather: day.weather,
  }));

  const plantingDays = analyzePlantingDays(dailyData);
  const irrigationDays = analyzeIrrigationNeeds(dailyData);

  const todayOnly = !user || !hasAccess;
  const visiblePlantingDays = todayOnly ? plantingDays.slice(0, 1) : plantingDays;
  const visibleIrrigationDays = todayOnly ? irrigationDays.slice(0, 1) : irrigationDays;

  const extendedForecast = generateExtendedForecast(weather);
  const rainProbability = generateRainProbabilityData(weather);
  const windTiming = generateWindTimingData(weather);
  const soilWorkability = generateSoilWorkabilityData(weather, extendedForecast);
  const operationAlerts = generateOperationAlerts(weather, extendedForecast);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#8FA88E' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 bg-green-700 rounded-xl shadow-lg">
                  <Sprout className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold text-green-900 mb-2">FarmCast</h1>
                  <p className="text-xl text-green-900">
                    {location.name}
                    {location.state && `, ${location.state}`}
                    {location.country && `, ${location.country}`}
                  </p>
                  {lastUpdated && (
                    <p className="text-sm text-green-900 mt-1">
                      Last updated: {lastUpdated.toLocaleTimeString('en-AU', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {user ? (
                  <>
                    <span className="text-sm text-green-800">{user.email}</span>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium shadow-md flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-md"
                  >
                    Start Free Trial
                  </button>
                )}
                <button
                  onClick={fetchWeather}
                  className="p-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors shadow-md"
                  title="Refresh weather data"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <LocationSearch
              onLocationSelect={handleLocationSelect}
              currentLocation={location.name}
            />
          </div>
        </header>

        {user && !hasAccess && (
          <SubscriptionBanner daysRemaining={daysRemaining} onUpgrade={handleUpgrade} />
        )}

        {hasAccess && (
          <div className="mb-6">
            <SavedLocations
              currentUserId={user?.id || null}
              isPremium={hasAccess}
              onLocationSelect={handleLocationSelect}
            />
          </div>
        )}

        {hasAccess && operationAlerts.length > 0 && (
          <div className="mb-6">
            <OperationAlerts alerts={operationAlerts} isPremium={hasAccess} />
          </div>
        )}

        <div className={`relative overflow-hidden bg-gradient-to-br ${bgGradient} rounded-2xl shadow-2xl p-8 mb-6 ${textColor}`}>
          {weatherCode.toLowerCase().includes('rain') && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-rain opacity-40"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-${Math.random() * 20}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                  }}
                >
                  <div className="w-0.5 h-4 bg-blue-200 rounded-full"></div>
                </div>
              ))}
            </div>
          )}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              {getWeatherIcon(weatherCode, 'w-24 h-24')}
              <div>
                <div className="text-7xl font-bold mb-2">
                  {Math.round(tempC)}°C
                </div>
                <div className="text-2xl capitalize opacity-90">
                  {weatherDescription}
                </div>
              </div>
            </div>

            <div className={`px-8 py-6 ${sprayCondition.bgColor} rounded-xl border-2 border-opacity-20 shadow-lg`}>
              <div className="text-center">
                <div className="text-sm font-semibold uppercase tracking-wider opacity-70 mb-1">
                  Spray Conditions
                </div>
                <div className={`text-4xl font-bold ${sprayCondition.color} mb-2`}>
                  {sprayCondition.rating}
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {sprayCondition.reason}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/30">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Wind className="w-6 h-6" />
                <span className="font-semibold">Wind Speed</span>
              </div>
              <div className="text-3xl font-bold">
                {Math.round(windSpeedKmh)} km/h
              </div>
              <div className="text-sm opacity-80 mt-1">
                {windDirection}
                {windGustKmh && ` • Gusts: ${Math.round(windGustKmh)} km/h`}
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CloudRain className="w-6 h-6" />
                <span className="font-semibold">Rain Today</span>
              </div>
              <div className="text-3xl font-bold">
                {todayRainChance}%
              </div>
              <div className="text-sm opacity-80 mt-1">
                Expected: {todayExpectedRain.toFixed(1)} mm
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Droplets className="w-6 h-6" />
                <span className="font-semibold">Humidity</span>
              </div>
              <div className="text-3xl font-bold">{humidity}%</div>
              <div className="text-sm opacity-80 mt-1">
                Dew Point: {Math.round(dewpointC)}°C
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CloudRain className="w-6 h-6" />
                <span className="font-semibold">Last 12 Hours</span>
              </div>
              <div className="text-3xl font-bold">
                {rainfall12h.toFixed(1)} mm
              </div>
              <div className="text-sm opacity-80 mt-1">
                Rainfall
              </div>
            </div>
          </div>
        </div>

        <HourlyForecast forecastList={forecastList} />

        <div className="mb-6">
          <AIWeatherExplanation
            weatherData={weather}
            locationName={location.name}
            isPremium={hasAccess}
          />
        </div>

        <div className="mb-6">
          <RainRadar
            lat={location.lat}
            lon={location.lon}
            locationName={location.name}
          />
        </div>

        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RainProbabilityBreakdown hourlyData={rainProbability} isPremium={hasAccess} />
          <WindTiming hourlyData={windTiming} isPremium={hasAccess} />
        </div>

        <div className="mb-6">
          <ExtendedForecast forecast={extendedForecast} isPremium={hasAccess} />
        </div>

        <div className="mb-6">
          <SoilWorkability predictions={soilWorkability} isPremium={hasAccess} />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-green-900 mb-6">5-Day Forecast</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {dailyForecasts.map((day: any, index: number) => {
              const date = new Date(day.dt * 1000);
              const dayName = date.toLocaleDateString('en-AU', { weekday: 'short' });
              const dayDate = date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
              const forecastSpray = getSprayCondition(day.windSpeed, day.rain);
              const bestWindow = findBestSprayWindow(day.forecastItems);

              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-5 border-2 border-green-100 hover:shadow-lg transition-shadow"
                >
                  <div className="text-center">
                    <div className="font-bold text-lg text-green-900">{dayName}</div>
                    <div className="text-sm text-green-900 mb-3">{dayDate}</div>

                    <div className="flex justify-center mb-3">
                      {getWeatherIcon(day.weather || 'clear', 'w-12 h-12')}
                    </div>

                    <div className="text-3xl font-bold text-gray-800 mb-1">
                      {Math.round(day.tempMax)}°
                    </div>
                    <div className="text-lg text-gray-600 mb-3">
                      {Math.round(day.tempMin)}°
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Wind:</span>
                        <span className="font-semibold">{Math.round(day.windSpeed)} km/h</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Rain:</span>
                        <span className="font-semibold">{day.rain.toFixed(1)} mm</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Humidity:</span>
                        <span className="font-semibold">{day.humidity}%</span>
                      </div>
                    </div>

                    {bestWindow ? (
                      <div className={`mt-4 py-3 px-3 rounded-lg ${bestWindow.rating === 'Good' ? 'bg-green-100' : 'bg-yellow-100'} border-2 ${bestWindow.rating === 'Good' ? 'border-green-300' : 'border-yellow-300'}`}>
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <div className="text-xs font-semibold text-gray-600">Best Spray Window</div>
                        </div>
                        <div className={`font-bold text-sm mb-1 ${bestWindow.rating === 'Good' ? 'text-green-700' : 'text-yellow-700'}`}>
                          {bestWindow.startTime} - {bestWindow.endTime}
                        </div>
                        <div className="text-xs text-gray-600">
                          {bestWindow.duration.toFixed(0)}h window
                        </div>
                      </div>
                    ) : (
                      <div className={`mt-4 py-2 px-3 rounded-lg bg-red-100 border-2 border-red-300`}>
                        <div className="text-xs font-semibold text-gray-600 mb-1">Spray</div>
                        <div className="font-bold text-red-700 text-sm">
                          Not Recommended
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl p-6 border-2 border-green-200">
          <h3 className="text-lg font-bold text-green-900 mb-3">Spray Conditions Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <div>
                <span className="font-semibold text-green-800">Good:</span>
                <span className="text-gray-700"> Wind &lt;15 km/h, no rain</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <div>
                <span className="font-semibold text-yellow-800">Moderate:</span>
                <span className="text-gray-700"> Wind 15-25 km/h</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <div>
                <span className="font-semibold text-red-800">Poor:</span>
                <span className="text-gray-700"> Wind &gt;25 km/h or rain</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-300 relative">
            {todayOnly && plantingDays.length > 1 && <LockedContentOverlay onUpgrade={handleUpgrade} />}
            <div className="flex items-center gap-2 mb-4">
              <Sprout className="w-6 h-6 text-green-900" />
              <h3 className="text-xl font-bold text-green-900">Best Planting Days</h3>
            </div>

            {visiblePlantingDays.length > 0 ? (
              <div className="space-y-3">
                {visiblePlantingDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      day.rating === 'Excellent'
                        ? 'bg-green-50 border-green-400'
                        : day.rating === 'Good'
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-lime-50 border-lime-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="font-bold text-gray-800">{day.dayName}</span>
                        <span className="text-sm text-gray-600">{day.date}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        day.rating === 'Excellent'
                          ? 'bg-green-600 text-white'
                          : day.rating === 'Good'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-lime-600 text-white'
                      }`}>
                        {day.rating}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {day.reasons.map((reason, i) => (
                        <div key={i} className="text-sm text-gray-700 flex items-start gap-1">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No favorable planting days in forecast</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-300 relative">
            {todayOnly && irrigationDays.length > 1 && <LockedContentOverlay onUpgrade={handleUpgrade} />}
            <div className="flex items-center gap-2 mb-4">
              <Droplets className="w-6 h-6 text-green-900" />
              <h3 className="text-xl font-bold text-green-900">Irrigation Schedule</h3>
            </div>

            <div className="space-y-3">
              {visibleIrrigationDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${
                    day.level === 'High'
                      ? 'bg-red-50 border-red-300'
                      : day.level === 'Medium'
                      ? 'bg-yellow-50 border-yellow-300'
                      : day.level === 'Low'
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="font-bold text-gray-800">{day.dayName}</span>
                      <span className="text-sm text-gray-600">{day.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {day.rainAmount > 0 && (
                        <span className="text-xs text-gray-600">{day.rainAmount.toFixed(1)}mm</span>
                      )}
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        day.level === 'High'
                          ? 'bg-red-600 text-white'
                          : day.level === 'Medium'
                          ? 'bg-yellow-600 text-white'
                          : day.level === 'Low'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600 text-white'
                      }`}>
                        {day.level}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{day.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center text-sm text-gray-600 pb-6">
          <div className="mb-1">Data updates every hour. Powered by OpenWeather.</div>
          <div className="font-semibold text-green-700">FarmCast for Agricultural Planning</div>
        </footer>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          checkAuth();
        }}
      />
    </div>
  );
}

export default App;
