import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Droplets, Wind, Gauge, Sun, CloudDrizzle, Zap, Clock, Sprout, Calendar, RefreshCw, Activity, LogIn, AlertTriangle } from 'lucide-react';
import { getSprayCondition, calculateDeltaT, getDeltaTCondition } from './utils/deltaT';
import { generateWeatherAlerts } from './utils/weatherAlerts';
import { findBestSprayWindow } from './utils/sprayWindow';
import { analyzePlantingDays, analyzeIrrigationNeeds, PlantingDay, IrrigationDay } from './utils/farmingRecommendations';
import { getSprayAdvice } from './utils/sprayAdvice';
import { LocationSearch, Location } from './components/LocationSearch';
import { HourlyForecast } from './components/HourlyForecast';
import { RainRadar } from './components/RainRadar';
import { ExtendedForecast } from './components/ExtendedForecast';
import { ProbeAPIManager } from './components/ProbeAPIManager';
import { AuthModal } from './components/AuthModal';
import { UserMenu } from './components/UserMenu';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationCenter } from './components/NotificationCenter';
import { PremiumTeaser } from './components/PremiumTeaser';
import FarmerJoe from './components/FarmerJoe';
import EmailSubscriptions from './components/EmailSubscriptions';
import { checkAndCreateWeatherAlerts, createWeatherUpdateNotification, getUserNotifications } from './utils/notificationService';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

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
  const [location, setLocation] = useState<Location>({
    name: 'Melbourne',
    lat: -37.8136,
    lon: 144.9631,
    country: 'AU',
    state: 'Victoria',
  });
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setAppError(`Application Error: ${event.error?.message || 'Unknown error'}`);
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setAppError(`Promise Error: ${event.reason?.message || event.reason || 'Unknown error'}`);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    fetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lon]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkAdminStatus(session.user.id);

          if (event === 'SIGNED_IN') {
            await createWeatherUpdateNotification(
              session.user.id,
              `${location.name}${location.state ? ', ' + location.state : ''}`,
              'welcome',
              'Welcome to FarmCast! You will now receive weather alerts and updates for your location.'
            );

            if (weather) {
              processWeatherNotifications(weather);
            }
          }
        } else {
          setIsAdmin(false);
          setShowAdminPanel(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    setIsAdmin(data?.role === 'admin');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  async function processWeatherNotifications(weatherData: any) {
    if (!user) return;

    const current = weatherData.current;
    const forecastList = weatherData.forecast.list;

    const tempC = Math.round(current.main.temp);
    const humidity = current.main.humidity;
    const rainfall = current.rain?.['1h'] || 0;
    const weatherCode = current.weather[0]?.main || '';

    const alerts = generateWeatherAlerts(
      tempC,
      humidity,
      current.wind.speed,
      rainfall,
      weatherCode,
      forecastList
    );

    if (alerts.length > 0) {
      await checkAndCreateWeatherAlerts(
        user.id,
        `${location.name}${location.state ? ', ' + location.state : ''}`,
        alerts
      );
    }

    const upcomingRain = forecastList.slice(0, 8).some((forecast: any) =>
      forecast.weather[0]?.main === 'Rain' || forecast.rain?.['3h'] > 0
    );

    if (upcomingRain) {
      const lastNotifications = await getUserNotifications(user.id);

      const recentRainAlert = lastNotifications.some(n =>
        n.data?.alert_type === 'rain' &&
        new Date(n.created_at!).getTime() > Date.now() - 6 * 60 * 60 * 1000
      );

      if (!recentRainAlert) {
        await createWeatherUpdateNotification(
          user.id,
          `${location.name}${location.state ? ', ' + location.state : ''}`,
          'rain',
          'Rain expected in the next 24 hours. Plan accordingly for outdoor activities.'
        );
      }
    }
  }

  async function fetchWeather() {
    setLoading(true);
    setError(null);
    setAppError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl) {
        throw new Error('Supabase URL is not configured. Please check your .env file.');
      }

      const weatherUrl = `${supabaseUrl}/functions/v1/weather?lat=${location.lat}&lon=${location.lon}`;
      console.log('Fetching weather from:', weatherUrl);

      const response = await fetch(weatherUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Weather API error:', response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${errorText}` };
        }
        throw new Error(errorData.error || `Failed to fetch weather data (HTTP ${response.status})`);
      }

      const weatherData = await response.json();
      console.log('Weather data received:', weatherData);

      setWeather(weatherData);
      setLastUpdated(new Date());

      if (user) {
        processWeatherNotifications(weatherData).catch(err => {
          console.error('Notification error:', err);
        });
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setAppError(errorMessage);
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

  if (appError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#8FA88E' }}>
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Application Error</h2>
          <p className="text-gray-700 mb-4">{appError}</p>
          <button
            onClick={() => {
              setAppError(null);
              setError(null);
              fetchWeather();
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#8FA88E' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg font-semibold">Loading FarmCast...</p>
          <p className="mt-2 text-gray-600 text-sm">Fetching weather data for {location.name}</p>
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

  if (!current || !current.main || !current.weather || current.weather.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#8FA88E' }}>
        <div className="text-center">
          <p className="text-gray-700 text-lg">No weather data available</p>
          <button
            onClick={fetchWeather}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Load Weather
          </button>
        </div>
      </div>
    );
  }

  const tempC = current.main.temp || 0;
  const humidity = current.main.humidity || 0;
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
  const sprayAdvice = getSprayAdvice(windSpeedKmh, rainfall, forecastList);

  const dewpointC = tempC - ((100 - humidity) / 5);
  const deltaT = calculateDeltaT(tempC, humidity);
  const deltaTCondition = getDeltaTCondition(deltaT);

  const calculateFeelsLike = (temp: number, humidity: number, windSpeed: number) => {
    if (temp >= 27) {
      const heatIndex = -8.78469475556 +
        1.61139411 * temp +
        2.33854883889 * humidity +
        -0.14611605 * temp * humidity +
        -0.012308094 * temp * temp +
        -0.0164248277778 * humidity * humidity +
        0.002211732 * temp * temp * humidity +
        0.00072546 * temp * humidity * humidity +
        -0.000003582 * temp * temp * humidity * humidity;
      return heatIndex;
    } else if (temp <= 10 && windSpeed > 4.8) {
      const windChill = 13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeed, 0.16) + 0.3965 * temp * Math.pow(windSpeed, 0.16);
      return windChill;
    }
    return temp;
  };

  const feelsLike = calculateFeelsLike(tempC, humidity, windSpeedKmh);

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

  const dailyForecastData = dailyForecasts.map((day: any) => {
    const date = new Date(day.dt * 1000);
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const windDeg = day.forecastItems[0]?.wind?.deg || 0;
    const windDir = directions[Math.round(windDeg / 45) % 8];

    return {
      date: date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
      dayName: date.toLocaleDateString('en-AU', { weekday: 'short' }),
      tempHigh: day.tempMax,
      tempLow: day.tempMin,
      rainChance: Math.round((day.rainCount / day.totalForecasts) * 100),
      windSpeed: day.windSpeed,
      windDirection: windDir,
    };
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#8FA88E' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold text-green-800 mb-1">FarmCast</span>
                  <div className="flex items-center justify-center w-12 h-12 bg-green-700 rounded-xl shadow-lg">
                    <Sprout className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-5xl font-bold text-green-900 mb-1">
                    {location.name}
                    {location.state && `, ${location.state}`}
                  </h1>
                  <p className="text-sm text-green-700 font-medium mb-1">
                    Agriculture-focused weather intelligence
                  </p>
                  {lastUpdated && (
                    <p className="text-sm text-green-900">
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
                    <EmailSubscriptions location={`${location.name}${location.state ? ', ' + location.state : ''}, ${location.country}`} />
                    <NotificationCenter userId={user.id} />
                    <UserMenu
                      user={user}
                      onSignOut={handleSignOut}
                      isAdmin={isAdmin}
                      onAdminPanelToggle={() => setShowAdminPanel(!showAdminPanel)}
                    />
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setShowAuthModal(true);
                      }}
                      className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-green-700"
                    >
                      <LogIn className="w-5 h-5 text-green-700" />
                      <span className="font-semibold text-green-700">Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode('signup');
                        setShowAuthModal(true);
                      }}
                      className="flex items-center gap-2 bg-green-700 px-4 py-2 rounded-lg shadow-md hover:shadow-lg hover:bg-green-800 transition-colors"
                    >
                      <span className="font-semibold text-white">Sign Up</span>
                    </button>
                  </>
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

          </div>
        </header>


        <div className="mb-6">
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            currentLocation={location.name}
          />
        </div>

        {showAdminPanel && isAdmin && (
          <div className="mb-6">
            <AdminDashboard />
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
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-6">
              {getWeatherIcon(weatherCode, 'w-24 h-24')}
              <div>
                <div className="text-7xl font-bold mb-2">
                  {Math.round(tempC)}°C
                </div>
                <div className="text-lg opacity-80 mb-2">
                  Feels like {Math.round(feelsLike)}°C
                </div>
                <div className="text-2xl capitalize opacity-90">
                  {weatherDescription}
                </div>
              </div>
            </div>

            <div className={`${sprayAdvice.bgColor} rounded-lg border-2 ${sprayAdvice.color === 'text-green-700' ? 'border-green-400' : sprayAdvice.color === 'text-yellow-700' ? 'border-yellow-400' : 'border-red-400'} px-4 py-3 flex items-center gap-3`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${sprayAdvice.color}`} />
              <div className="flex-1">
                <span className={`font-bold ${sprayAdvice.color}`}>Spray Alert: </span>
                <span className={`${sprayAdvice.color}`}>{sprayAdvice.message}</span>
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
                <Activity className="w-6 h-6" />
                <span className="font-semibold">Delta T</span>
              </div>
              <div className="text-3xl font-bold">{deltaT.toFixed(1)}°C</div>
              <div className="text-sm opacity-80 mt-1">
                {deltaTCondition.rating} - {deltaTCondition.reason}
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Droplets className="w-6 h-6" />
                <span className="font-semibold">Humidity</span>
              </div>
              <div className="text-3xl font-bold">
                {humidity}%
              </div>
              <div className="text-sm opacity-80 mt-1">
                Dew Point: {Math.round(dewpointC)}°C
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <HourlyForecast forecastList={forecastList} />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
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
                  className="bg-white rounded-xl p-5 border-2 border-green-100 shadow-md hover:shadow-xl transition-all"
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

        {user && (
          <div className="mt-8 mb-8">
            <ProbeAPIManager user={user} />
          </div>
        )}

        {!user && (
          <div className="mb-8">
            <PremiumTeaser
              onSignUpClick={() => {
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
            />
          </div>
        )}

        <div className="mt-8 bg-white rounded-xl shadow-md p-6 border-2 border-green-200">
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

        <div className="mb-8">
          <RainRadar
            lat={location.lat}
            lon={location.lon}
            locationName={location.name}
          />
        </div>

        {user && (
          <div className="mb-8">
            <ExtendedForecast location={location} />
          </div>
        )}

        {user && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-xl p-6 border-2 border-green-300 relative">
              <div className="flex items-center gap-2 mb-4">
                <Sprout className="w-6 h-6 text-green-900" />
                <h3 className="text-xl font-bold text-green-900">Best Planting Days</h3>
              </div>

              {plantingDays.length > 0 ? (
                <div className="space-y-3">
                  {plantingDays.map((day, idx) => (
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
                        <div className="flex items-center gap-2 flex-1">
                          <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <span className="font-bold text-gray-800 whitespace-nowrap">{day.dayName}</span>
                          <span className="text-sm text-gray-600 whitespace-nowrap">{day.date}</span>
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

            <div className="bg-white rounded-xl shadow-xl p-6 border-2 border-blue-300 relative">
              <div className="flex items-center gap-2 mb-4">
                <Droplets className="w-6 h-6 text-green-900" />
                <h3 className="text-xl font-bold text-green-900">Irrigation Schedule</h3>
              </div>

              <div className="space-y-3">
                {irrigationDays.map((day, idx) => (
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
                      <div className="flex items-center gap-2 flex-1">
                        <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span className="font-bold text-gray-800 whitespace-nowrap">{day.dayName}</span>
                        <span className="text-sm text-gray-600 whitespace-nowrap">{day.date}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
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
        )}

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
        }}
        initialMode={authMode}
      />

      <FarmerJoe
        weatherContext={{
          location: `${location.name}${location.state ? ', ' + location.state : ''}`,
          currentWeather: current,
          forecast: forecastList.slice(0, 8),
        }}
        isAuthenticated={!!user}
      />
    </div>
  );
}

export default App;
