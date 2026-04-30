import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Droplets, Wind, Sun, CloudDrizzle, Zap, Sprout, Calendar, RefreshCw, Activity, LogIn, AlertTriangle, Leaf, Snowflake, Thermometer, Map, MapPin, Database, Navigation, Wifi, Lock } from 'lucide-react';
import { getSprayCondition, calculateDeltaT, getDeltaTCondition, getDeltaTCardColors, getDeltaTIconColor, getDeltaTValueColor } from './utils/deltaT';
import { generateWeatherAlerts } from './utils/weatherAlerts';
import { findBestSprayWindow } from './utils/sprayWindow';
import { analyzePlantingDays, analyzeIrrigationNeeds } from './utils/farmingRecommendations';
import { getSprayAdvice } from './utils/sprayAdvice';
import { loadUnitPrefs, saveUnitPrefs, resolveUnits, convertTemp, convertWind, convertRain, convertPressure, formatTemp, formatTempValue, formatWind, formatWindValue, formatRain, formatRainValue, formatPressure, formatPressureValue, tempLabel, windLabel, rainLabel, pressureLabel, type UnitPreferences, type RegionUnits } from './utils/units';
import { LocationSearch, Location } from './components/LocationSearch';
import { HourlyForecast } from './components/HourlyForecast';
import { RainRadar } from './components/RainRadar';
import { ExtendedForecast } from './components/ExtendedForecast';
import { ProbeConnectionManager } from './components/ProbeConnectionManager';
import { AuthModal } from './components/AuthModal';
import { UserMenu } from './components/UserMenu';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationCenter } from './components/NotificationCenter';
import { AgronomyDatabase } from './components/agronomy/AgronomyDatabase';
import { PremiumTeaser } from './components/PremiumTeaser';
import FarmerJoe from './components/FarmerJoe';
import { PromoBanner } from './components/PromoBanner';
import { ActionableRecommendations } from './components/ActionableRecommendations';
import { Sparkline } from './components/Sparkline';
import { checkAndCreateWeatherAlerts, createWeatherUpdateNotification, getUserNotifications } from './utils/notificationService';
import { supabase } from './lib/supabase';
import { getFavoriteLocation } from './utils/savedLocations';
import { getUserLocation } from './utils/geolocation';
import { isNightTime } from './utils/weatherEffects';
import type { User } from '@supabase/supabase-js';
import { SubscriptionSuccessBanner } from './components/SubscriptionSuccessBanner';
import { fireSubscriptionConversion } from './utils/googleAds';
import { AgronomyNavBubble } from './components/AgronomyNavBubble';
import { ExplainerModal, InfoButton, TrustDisclaimer, UnderstandingFarmCast, ConnectSensorsModal } from './components/ExplainerModal';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TodayOnYourFarm } from './components/TodayOnYourFarm';

interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    pressure: number;
    weather: Array<{
      main: string;
      description: string;
    }>;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    rain?: {
      '1h'?: number;
    };
    feels_like: number;
    uvi?: number;
    sunrise?: number;
    sunset?: number;
  };
  hourly: Array<{
    dt: number;
    temp: number;
    humidity: number;
    weather: Array<{
      main: string;
      description: string;
    }>;
    wind_speed: number;
    wind_gust?: number;
    pop: number;
    rain?: {
      '1h'?: number;
    };
  }>;
  daily: Array<{
    dt: number;
    temp: {
      min: number;
      max: number;
      day: number;
    };
    humidity: number;
    weather: Array<{
      main: string;
      description: string;
    }>;
    wind_speed: number;
    pop: number;
    rain?: number;
    snow?: number;
  }>;
  alerts?: Array<{
    event: string;
    description: string;
  }>;
  timezone?: string;
  timezone_offset?: number;
}

function LockedOverlay({ label, onSubscribe }: { label: string; onSubscribe: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(to bottom, rgba(15,23,42,0.7), rgba(15,23,42,0.92))' }}>
      <div className="text-center px-6 py-6 max-w-sm">
        <div className="w-11 h-11 rounded-2xl bg-green-600/20 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-5 h-5 text-green-400" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">{label}</h3>
        <p className="text-sm text-slate-400 mb-4">Subscribe to unlock this feature and all premium tools.</p>
        <button
          onClick={onSubscribe}
          className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-green-900/40 hover:scale-[1.02]"
        >
          Start Free Trial
        </button>
        <p className="text-xs text-slate-600 mt-2">$2.99/mo after 30-day free trial</p>
      </div>
    </div>
  );
}

function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [location, setLocation] = useState<Location>({
    name: '',
    lat: 0,
    lon: 0,
    country: '',
  });
  const [locationResolved, setLocationResolved] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [hasLoadedInitialLocation, setHasLoadedInitialLocation] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [probeReading, setProbeReading] = useState<{ soil_temp_c: number | null; moisture_percent: number | null } | null>(null);
  const [hasActiveProbe, setHasActiveProbe] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [showAgronomyDB, setShowAgronomyDB] = useState(false);
  const [agronomyInitialQuery, setAgronomyInitialQuery] = useState('');
  const [showSubscriptionSuccess, setShowSubscriptionSuccess] = useState(false);
  const [unitPrefs, setUnitPrefs] = useState<UnitPreferences>(loadUnitPrefs());
  const [explainerOpen, setExplainerOpen] = useState<string | null>(null);
  const [showConnectSensors, setShowConnectSensors] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const countryCode = location.country || 'AU';
  const units: RegionUnits = resolveUnits({ country: countryCode }, unitPrefs);

  const handleUnitPrefsChange = (newPrefs: UnitPreferences) => {
    setUnitPrefs(newPrefs);
    saveUnitPrefs(newPrefs);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Show the location prompt screen instead of silently requesting
    setLocationDenied(true);
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setAppError(`Application Error: ${event.error?.message || 'Unknown error'}`);
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
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
    if (!locationResolved) return;
    fetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lon, locationResolved]);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[App] Session error:', sessionError);
      }

      if (session?.user) {
        setUser(session.user);
        await checkAdminStatus(session.user.id);
        await checkTrialStatus(session.user.id);

        await loadUserLocation(session.user.id);
      } else {
        setUser(null);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'PASSWORD_RECOVERY') {
          const newPassword = prompt('Enter your new password:');
          if (newPassword && newPassword.length >= 6) {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
              alert('Error updating password: ' + error.message);
            } else {
              alert('Password updated successfully! You can now log in with your new password.');
              window.location.href = '/';
            }
          } else {
            alert('Password must be at least 6 characters long.');
          }
          return;
        }

        if (session?.user) {
          if (event === 'SIGNED_IN') {
            await loadUserLocation(session.user.id);
          }

          setUser(session.user);
          await checkAdminStatus(session.user.id);
          await checkTrialStatus(session.user.id);

          if (event === 'SIGNED_IN' && weather) {
            processWeatherNotifications(weather);
          }
        } else {
          if (event === 'SIGNED_OUT') {
            loadGuestLocation();
          }

          setUser(null);
          setIsAdmin(false);
          setShowAdminPanel(false);
          setTrialExpired(false);
          setTrialEndDate(null);
          setHasActiveSubscription(false);
        }
      })();
    });

    const params = new URLSearchParams(window.location.search);
    const subscriptionStatus = params.get('subscription');
    if (subscriptionStatus === 'success') {
      fireSubscriptionConversion();
      setShowSubscriptionSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (subscriptionStatus) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) {
      setProbeReading(null);
      setHasActiveProbe(false);
      return;
    }
    const loadProbeReading = async () => {
      const { data: connections } = await supabase
        .from('probe_connections')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      if (!connections || connections.length === 0) {
        setHasActiveProbe(false);
        setProbeReading(null);
        return;
      }

      setHasActiveProbe(true);

      const { data: reading } = await supabase
        .from('probe_readings_latest')
        .select('soil_temp_c, moisture_percent')
        .eq('connection_id', connections[0].id)
        .maybeSingle();

      setProbeReading(reading ?? null);
    };
    loadProbeReading();
  }, [user]);

  const loadUserLocation = async (userId: string) => {
    try {
      const favoriteLocation = await getFavoriteLocation(userId);
      if (favoriteLocation) {
        setLocation(favoriteLocation);
        setLocationResolved(true);
        setLocationDenied(false);
        setIsUsingCurrentLocation(false);
        setHasLoadedInitialLocation(true);
      }
    } catch (error) {
      console.error('Error loading favorite location:', error);
    }
  };

  const loadGuestLocation = async () => {
    try {
      const userLocation = await getUserLocation();
      setLocation(userLocation);
      setLocationResolved(true);
      setLocationDenied(false);
      setIsUsingCurrentLocation(true);
      setHasLoadedInitialLocation(true);
    } catch {
      setLocationDenied(true);
      setLocationResolved(false);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      setIsAdmin(false);
      return;
    }

    if (data) {
      setIsAdmin(data.role === 'admin');
    } else {
      setIsAdmin(false);
    }
  };

  const checkTrialStatus = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('trial_end_date, stripe_subscription_id, farmer_joe_subscription_status')
      .eq('id', userId)
      .maybeSingle();

    if (!data) return;

    const hasStripeSubscription = !!(data.stripe_subscription_id);
    const subscriptionActive = data.farmer_joe_subscription_status === 'active' && hasStripeSubscription;
    setHasActiveSubscription(subscriptionActive);

    if (data.trial_end_date) {
      const endDate = new Date(data.trial_end_date);
      setTrialEndDate(endDate);
      const expired = new Date() > endDate && !subscriptionActive;
      setTrialExpired(expired);
    } else {
      setTrialExpired(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  async function processWeatherNotifications(weatherData: any) {
    if (!user) return;

    const current = weatherData.current;
    const hourlyList = weatherData.hourly || [];

    const tempC = Math.round(current.temp);
    const humidity = current.humidity;
    const rainfall = current.rain?.['1h'] || 0;
    const weatherCode = current.weather[0]?.main || '';

    const alerts = generateWeatherAlerts(
      tempC,
      humidity,
      current.wind_speed,
      rainfall,
      weatherCode,
      hourlyList
    );

    if (alerts.length > 0) {
      await checkAndCreateWeatherAlerts(
        user.id,
        `${location.name}${location.state ? ', ' + location.state : ''}`,
        alerts
      );
    }

    const upcomingRain = hourlyList.slice(0, 8).some((forecast: any) =>
      forecast.weather[0]?.main === 'Rain' || forecast.rain?.['1h'] > 0
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
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing. Please check your .env file.');
      }

      const weatherUrl = `${supabaseUrl}/functions/v1/weather?lat=${location.lat}&lon=${location.lon}`;

      const response = await fetch(weatherUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${errorText}` };
        }
        throw new Error(errorData.error || `Failed to fetch weather data (HTTP ${response.status})`);
      }

      const weatherData = await response.json();
      setWeather(weatherData);
      setLastUpdated(new Date());

      if (user) {
        processWeatherNotifications(weatherData).catch(err => {
          console.error('Notification error:', err);
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function getWeatherIcon(weatherCode: string, size: string = 'w-16 h-16', className: string = '') {
    const code = weatherCode?.toLowerCase() || '';

    if (code.includes('thunder') || code.includes('storm')) {
      return <Zap className={`${size} ${className || 'text-yellow-400'}`} />;
    }
    if (code.includes('rain') || code.includes('shower')) {
      return <CloudRain className={`${size} ${className || 'text-blue-400'}`} />;
    }
    if (code.includes('drizzle')) {
      return <CloudDrizzle className={`${size} ${className || 'text-blue-300'}`} />;
    }
    if (code.includes('cloud') || code.includes('overcast')) {
      return <Cloud className={`${size} ${className || 'text-slate-300'}`} />;
    }
    return <Sun className={`${size} ${className || 'text-amber-400'}`} />;
  }

  if (appError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Application Error</h2>
          <p className="text-slate-300 mb-4">{appError}</p>
          <button
            onClick={() => {
              setAppError(null);
              setError(null);
              fetchWeather();
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (locationDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-5 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30">
              <MapPin className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-white text-2xl font-bold tracking-wide mb-2">FarmCast</p>
            <p className="text-slate-300 text-base mb-1">Where are you farming?</p>
            <p className="text-slate-500 text-sm">Get hyper-local weather for your exact location, anywhere in the world</p>
          </div>

          <button
            onClick={() => {
              setLocationDenied(false);
              getUserLocation().then((loc) => {
                setLocation(loc);
                setLocationResolved(true);
                setIsUsingCurrentLocation(true);
                setHasLoadedInitialLocation(true);
              }).catch(() => {
                setLocationDenied(true);
              });
            }}
            className="w-full mb-4 px-4 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors"
          >
            <Navigation className="w-5 h-5" />
            Allow Location Access
          </button>

          <div className="relative flex items-center mb-4">
            <div className="flex-1 border-t border-slate-700" />
            <span className="px-3 text-slate-500 text-sm">or search manually</span>
            <div className="flex-1 border-t border-slate-700" />
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <LocationSearch
              onLocationSelect={(loc) => {
                setLocation(loc);
                setLocationResolved(true);
                setLocationDenied(false);
                setIsUsingCurrentLocation(false);
                setHasLoadedInitialLocation(true);
              }}
              currentLocation=""
            />
          </div>

          <p className="text-center text-slate-600 text-xs mt-4">Works worldwide — Australia, USA, UK, Europe and beyond</p>
        </div>
      </div>
    );
  }

  if (!locationResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-700 border-t-green-500 absolute inset-0"></div>
            <div className="flex items-center justify-center h-20 w-20">
              <Map className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <p className="text-white text-xl font-bold tracking-wide">FarmCast</p>
          <p className="mt-2 text-slate-400 text-sm">Detecting your location...</p>
          <p className="mt-1 text-slate-500 text-xs">Allow location access for precise local weather</p>
          <p className="mt-1 text-slate-600 text-xs">Works anywhere in the world</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-700 border-t-green-500 absolute inset-0"></div>
            <div className="flex items-center justify-center h-20 w-20">
              <Sprout className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <p className="text-white text-xl font-bold tracking-wide">FarmCast</p>
          <p className="mt-2 text-slate-400 text-sm">Loading weather data for {location.name}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-slate-300">{error}</p>
          <button
            onClick={fetchWeather}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const current = weather?.current;
  const hourlyList = weather?.hourly || [];
  const dailyList = weather?.daily || [];

  if (!current || !current.weather || current.weather.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <p className="text-slate-300 text-lg">No weather data available</p>
          <button
            onClick={fetchWeather}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
          >
            Load Weather
          </button>
        </div>
      </div>
    );
  }

  const tempC = current.temp || 0;
  const humidity = current.humidity || 0;
  const weatherCode = current.weather[0]?.main || 'clear';
  const weatherDescription = current.weather[0]?.description || 'clear';
  const isNight = isNightTime(weather?.timezone_offset);

  const windSpeedKmh = (current.wind_speed || 0) * 3.6;
  const windGustKmh = current.wind_gust ? current.wind_gust * 3.6 : null;
  const windDegrees = current.wind_deg || 0;
  const getWindDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };
  const windDirection = getWindDirection(windDegrees);

  const handleLocationSelect = async (newLocation: Location, fromCurrentLocation = false) => {
    setLocation(newLocation);
    setIsUsingCurrentLocation(fromCurrentLocation);
    localStorage.setItem('farmcast-location', JSON.stringify(newLocation));
  };

  const rainfall = current.rain?.['1h'] || 0;

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

  const today = new Date().toLocaleDateString('en-AU');
  const todayHours = hourlyList.filter((item: any) => {
    const itemDate = new Date(item.dt * 1000).toLocaleDateString('en-AU');
    return itemDate === today;
  });

  const todayHighTemp = todayHours.length > 0
    ? Math.max(...todayHours.map((f: any) => f.temp))
    : tempC;
  const todayLowTemp = todayHours.length > 0
    ? Math.min(...todayHours.map((f: any) => f.temp))
    : tempC;

  const dailyForecasts = dailyList.slice(0, 5).map((day: any) => {
    const dayStartIndex = dailyList.indexOf(day) * 8;
    const dayHourlyData = hourlyList.slice(dayStartIndex, dayStartIndex + 8);

    return {
      date: new Date(day.dt * 1000).toLocaleDateString('en-AU'),
      dt: day.dt,
      temps: [day.temp.min, day.temp.max],
      tempMin: day.temp.min,
      tempMax: day.temp.max,
      humidity: day.humidity,
      weather: day.weather[0]?.main || 'clear',
      windSpeed: day.wind_speed * 3.6,
      rain: day.rain || 0,
      rainCount: day.pop > 0.3 ? 1 : 0,
      totalForecasts: 1,
      forecastItems: dayHourlyData.length > 0 ? dayHourlyData : hourlyList.slice(0, 8),
      pop: day.pop,
    };
  });

  const todayForecast = dailyForecasts[0];
  const todayRainChance = todayForecast ? Math.round(todayForecast.pop * 100) : 0;
  const todayExpectedRain = todayForecast ? todayForecast.rain : 0;

  const alerts = generateWeatherAlerts(
    tempC,
    humidity,
    current.wind_speed,
    rainfall,
    weatherCode,
    hourlyList
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

  const uvIndex = current.uvi || 0;
  const getUVLevel = (uvi: number) => {
    if (uvi <= 2) return { label: 'Low', color: 'text-green-400' };
    if (uvi <= 5) return { label: 'Moderate', color: 'text-yellow-400' };
    if (uvi <= 7) return { label: 'High', color: 'text-orange-400' };
    if (uvi <= 10) return { label: 'Very High', color: 'text-red-400' };
    return { label: 'Extreme', color: 'text-red-600' };
  };
  const uvLevel = getUVLevel(uvIndex);

  const gdd = Math.max(0, ((todayHighTemp + todayLowTemp) / 2) - 10);
  const eto = ((0.0023 * (tempC + 17.8) * Math.sqrt(Math.abs(todayHighTemp - todayLowTemp)) * (uvIndex * 2.5 + 5)) / 24).toFixed(1);

  const soilTempC = (tempC - 3 + (rainfall > 0 ? -1 : 0)).toFixed(1);
  const soilMoisture = Math.min(100, Math.max(0, 40 + (todayRainChance * 0.4) - (tempC - 15) * 0.8)).toFixed(0);

  const minTempNext24h = Math.min(...hourlyList.slice(0, 24).map((h: any) => h.temp));
  const frostRisk = minTempNext24h <= 2;
  const frostWarning = minTempNext24h <= 4;

  const todayBestWindow = findBestSprayWindow(todayHours);

  const getWindColor = (speed: number) => {
    if (speed < 15) return 'text-green-400';
    if (speed < 25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const deltaTColors = getDeltaTCardColors(deltaTCondition.rating);

  return (
    <div className="min-h-screen farmcast-bg text-slate-100">
      <div className="farmcast-bg-overlay" />

      <div className="relative z-10 max-w-screen-2xl mx-auto px-4 xl:px-8 py-4">

        {/* HEADER */}
        <header className="mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-xl shadow-lg shadow-green-900/50 flex-shrink-0 farmcast-logo-glow">
                <Sprout className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl xl:text-3xl font-black text-white tracking-tight leading-none">
                    {location.name}
                    {location.state && <span className="text-slate-400 font-normal">, {location.state}</span>}
                  </h1>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs font-bold text-green-400 tracking-widest uppercase">FarmCast</span>
                  <span className="text-slate-600 text-xs">•</span>
                  <span className="text-slate-400 text-sm">
                    {currentTime.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  <span className="text-slate-600 text-xs">•</span>
                  <span className="text-slate-400 text-sm font-mono">
                    {currentTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                  {lastUpdated && (
                    <>
                      <span className="text-slate-600 text-xs">•</span>
                      <span className="text-slate-600 text-xs">Updated {lastUpdated.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <button
                onClick={() => document.getElementById('radar-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-slate-300 hover:bg-slate-700/80 hover:text-white transition-all duration-200 text-sm font-semibold shadow-lg"
              >
                <Map className="w-4 h-4 text-blue-400" />
                Radar
              </button>
              <AgronomyNavBubble
                onClick={() => { setAgronomyInitialQuery(''); setShowAgronomyDB(true); }}
                show={true}
              />
              {user ? (
                <>
                  <NotificationCenter userId={user.id} alerts={alerts} />
                  <UserMenu
                    user={user}
                    onSignOut={handleSignOut}
                    isAdmin={isAdmin}
                    onAdminPanelToggle={() => setShowAdminPanel(!showAdminPanel)}
                    unitPrefs={unitPrefs}
                    onUnitPrefsChange={handleUnitPrefsChange}
                  />
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                    className="flex items-center gap-2 bg-slate-800/80 border border-slate-600/50 px-4 py-2 rounded-xl hover:bg-slate-700/80 hover:border-slate-500/60 transition-all duration-200 text-sm font-semibold text-slate-300 hover:text-white shadow-lg"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                      className="flex items-center gap-2 bg-green-600/90 border border-green-500/40 px-4 py-2 rounded-xl hover:bg-green-500/90 hover:border-green-400/60 transition-all duration-200 text-sm font-semibold text-white shadow-lg shadow-green-900/30"
                    >
                      Start Free Trial — Unlock Full Farm Report
                    </button>
                    <p className="text-slate-400 text-xs">Built by farmers, for real farm decisions</p>
                  </div>
                </>
              )}
              <button
                onClick={fetchWeather}
                className="p-2.5 bg-slate-800 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                title="Refresh weather data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="mb-5">
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            currentLocation={location.name}
            userId={user?.id}
            isUsingCurrentLocation={isUsingCurrentLocation}
          />
        </div>

        <PromoBanner
          onSignUp={() => { setAuthMode('signup'); setShowAuthModal(true); }}
          isLoggedIn={!!user}
        />

        {showSubscriptionSuccess && (
          <SubscriptionSuccessBanner onDismiss={() => setShowSubscriptionSuccess(false)} />
        )}

        {showAdminPanel && isAdmin && (
          <div className="mb-6">
            <AdminDashboard />
          </div>
        )}

        {/* FROST ALERT BANNER */}
        {(frostRisk || frostWarning) && (
          <div className={`mb-5 rounded-xl border px-5 py-3 flex items-center gap-3 ${frostRisk ? 'bg-blue-950/80 border-blue-400/50' : 'bg-blue-950/50 border-blue-500/30'}`}>
            <Snowflake className={`w-5 h-5 flex-shrink-0 ${frostRisk ? 'text-blue-300 animate-pulse' : 'text-blue-400'}`} />
            <div>
              <span className={`font-bold ${frostRisk ? 'text-blue-200' : 'text-blue-300'}`}>
                {frostRisk ? 'FROST RISK — ' : 'FROST WARNING — '}
              </span>
              <span className="text-slate-300 text-sm">
                Minimum temperature of {formatTemp(minTempNext24h, units.temp)} expected in next 24 hours.
                {frostRisk ? ' Protect sensitive crops immediately.' : ' Monitor crops overnight.'}
              </span>
            </div>
          </div>
        )}

        {/* HERO CURRENT CONDITIONS */}
        <div className="mb-5">

          {/* Main Temp Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm shadow-2xl farmcast-hero-glow hover:border-slate-600/80 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/40 via-transparent to-green-950/30" />
            <div className="relative z-10 p-6 xl:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {getWeatherIcon(weatherCode, 'w-20 h-20 xl:w-28 xl:h-28')}
                    {isNight && <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-700 rounded-full border border-slate-500" />}
                  </div>
                  <div>
                    <div className="text-8xl xl:text-9xl font-black text-white leading-none tracking-tighter">
                      {formatTempValue(tempC, units.temp)}<span className="text-5xl xl:text-6xl text-slate-400">{tempLabel(units.temp)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-slate-400 text-lg">Feels like <span className="text-white font-semibold">{formatTemp(feelsLike, units.temp)}</span></span>
                    </div>
                    <div className="mt-1 text-xl text-slate-300 capitalize font-medium">{weatherDescription}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2 text-right">
                    <span className="text-slate-400 text-sm">H</span>
                    <span className="text-red-400 font-bold text-xl">{formatTempValue(todayHighTemp, units.temp)}°</span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="text-slate-400 text-sm">L</span>
                    <span className="text-blue-400 font-bold text-xl">{formatTempValue(todayLowTemp, units.temp)}°</span>
                  </div>
                  <div className="mt-2 text-right">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">UV Index</div>
                    <div className={`text-lg font-bold ${uvLevel.color}`}>{Math.round(uvIndex)} <span className="text-sm font-normal">{uvLevel.label}</span></div>
                  </div>
                  <div className="mt-1 text-right">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pressure</div>
                    <div className="text-lg font-bold text-slate-300">{formatPressureValue(current.pressure, units.pressure)} <span className="text-sm font-normal text-slate-500">{pressureLabel(units.pressure)}</span></div>
                  </div>
                </div>
              </div>

              {/* Mini stat row */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700/50">
                <div className="text-center">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Soil Temp</div>
                  {hasActiveProbe && probeReading?.soil_temp_c != null ? (
                    <>
                      <div className="text-lg font-bold text-amber-300">{formatTempValue(probeReading.soil_temp_c, units.temp, 1)}{tempLabel(units.temp)}</div>
                      <div className="text-xs text-green-400 font-medium">live probe</div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-bold text-amber-300/70">{formatTempValue(Number(soilTempC), units.temp, 1)}{tempLabel(units.temp)}</div>
                      {user ? (
                        <button
                          onClick={() => document.getElementById('probe-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className="text-xs text-amber-400/80 hover:text-amber-300 underline underline-offset-2 transition-colors"
                        >
                          connect probe
                        </button>
                      ) : (
                        <div className="text-xs text-slate-500">estimated</div>
                      )}
                    </>
                  )}
                </div>
                <div className="text-center border-x border-slate-700/50">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Soil Moisture</div>
                  {hasActiveProbe && probeReading?.moisture_percent != null ? (
                    <>
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-lg font-bold text-cyan-300">{probeReading.moisture_percent.toFixed(1)}%</div>
                        <Sparkline
                          values={[26, 27, 28, 29, probeReading.moisture_percent]}
                          color="#67e8f9"
                          width={48}
                          height={20}
                        />
                      </div>
                      <div className="text-xs text-green-400 font-medium">live probe</div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-lg font-bold text-cyan-300/70">{soilMoisture}%</div>
                        <Sparkline
                          values={[28, 30, 29, 31, Number(soilMoisture)]}
                          color="#67e8f9"
                          width={48}
                          height={20}
                        />
                      </div>
                      {user ? (
                        <button
                          onClick={() => document.getElementById('probe-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className="text-xs text-cyan-400/80 hover:text-cyan-300 underline underline-offset-2 transition-colors"
                        >
                          connect probe
                        </button>
                      ) : (
                        <div className="text-xs text-slate-500">estimated</div>
                      )}
                    </>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">GDD Today</div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-lg font-bold text-green-300">{gdd.toFixed(1)}</div>
                    <Sparkline
                      values={[8, 10, 9, 11, gdd]}
                      color="#86efac"
                      width={48}
                      height={20}
                    />
                  </div>
                  <div className="text-xs text-slate-500">base {formatTemp(10, units.temp)}</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* DECISION ENGINE — Compact expandable cards */}
        <TodayOnYourFarm
          tempC={tempC}
          humidity={humidity}
          windSpeedKmh={windSpeedKmh}
          windGustKmh={windGustKmh ?? windSpeedKmh}
          deltaT={deltaT}
          deltaTRating={deltaTCondition.rating}
          todayBestWindow={todayBestWindow}
          todayRainChance={todayRainChance}
          todayExpectedRain={todayExpectedRain}
          rainfall={rainfall}
          frostRisk={frostRisk}
          frostWarning={frostWarning}
          soilMoisture={probeReading?.moisture_percent ?? Number(soilMoisture)}
          soilTempC={probeReading?.soil_temp_c ?? Number(soilTempC)}
          uvIndex={uvIndex}
        />

        {/* BIG METRIC CARDS ROW */}
        <div className="mb-5 grid grid-cols-2 lg:grid-cols-5 gap-4">

          {/* Wind */}
          <div className={`rounded-2xl border bg-slate-900/70 backdrop-blur-sm p-5 shadow-xl hover:bg-slate-800/70 hover:scale-[1.02] transition-all duration-200 ${windSpeedKmh > 25 ? 'border-red-500/40' : windSpeedKmh > 15 ? 'border-yellow-500/40' : 'border-slate-700/60'}`}>
            <div className="flex items-center justify-between mb-3">
              <Wind className={`w-6 h-6 ${getWindColor(windSpeedKmh)}`} />
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${windSpeedKmh > 25 ? 'bg-red-500/20 text-red-300 border-red-500/40' : windSpeedKmh > 15 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' : 'bg-green-500/20 text-green-300 border-green-500/40'}`}>
                {windSpeedKmh > 25 ? 'HIGH' : windSpeedKmh > 15 ? 'MODERATE' : 'CALM'}
              </span>
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Wind Speed</div>
            <div className={`text-4xl font-black leading-none ${getWindColor(windSpeedKmh)}`}>
              {formatWindValue(windSpeedKmh, units.wind)}
            </div>
            <div className="text-sm text-slate-400 mt-1">{windLabel(units.wind)} {windDirection}</div>
            {windGustKmh && (
              <div className="text-xs text-slate-500 mt-1">Gusts {formatWind(windGustKmh, units.wind)}</div>
            )}
          </div>

          {/* Rain */}
          <div className={`rounded-2xl border bg-slate-900/70 backdrop-blur-sm p-5 shadow-xl hover:bg-slate-800/70 hover:scale-[1.02] transition-all duration-200 ${todayRainChance > 70 ? 'border-blue-500/40' : todayRainChance > 40 ? 'border-sky-500/30' : 'border-slate-700/60'}`}>
            <div className="flex items-center justify-between mb-3">
              <CloudRain className={`w-6 h-6 ${todayRainChance > 70 ? 'text-blue-400' : todayRainChance > 40 ? 'text-sky-400' : 'text-slate-500'}`} />
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${todayRainChance > 70 ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : todayRainChance > 40 ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-slate-700/40 text-slate-400 border-slate-600/40'}`}>
                {todayRainChance > 70 ? 'LIKELY' : todayRainChance > 40 ? 'POSSIBLE' : 'LOW'}
              </span>
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Rain Today</div>
            <div className={`text-4xl font-black leading-none ${todayRainChance > 70 ? 'text-blue-400' : todayRainChance > 40 ? 'text-sky-400' : 'text-slate-300'}`}>
              {todayRainChance}%
            </div>
            <div className="text-sm text-slate-400 mt-1">{formatRain(todayExpectedRain, units.rain)} expected</div>
          </div>

          {/* Delta T */}
          <div className={`rounded-2xl border bg-slate-900/70 backdrop-blur-sm p-5 shadow-xl hover:bg-slate-800/70 hover:scale-[1.02] transition-all duration-200 ${deltaTColors.border} ${deltaTCondition.rating === 'Excellent' ? 'farmcast-deltat-glow' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <Activity className={`w-6 h-6 ${getDeltaTIconColor(deltaTCondition.rating)}`} />
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${deltaTColors.badge} ${deltaTCondition.rating === 'Excellent' ? 'farmcast-pulse-green' : ''}`}>
                {deltaTCondition.rating.toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">Delta T <InfoButton onClick={() => setExplainerOpen('deltaT')} label="" /></div>
            <div className={`text-4xl font-black leading-none ${getDeltaTValueColor(deltaTCondition.rating)}`}>
              {deltaT.toFixed(1)}°
            </div>
          </div>

          {/* Humidity */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm p-5 shadow-xl hover:bg-slate-800/70 hover:scale-[1.02] transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <Droplets className="w-6 h-6 text-cyan-400" />
              <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-slate-700/40 text-slate-400 border-slate-600/40">
                HUMIDITY
              </span>
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Relative Humidity</div>
            <div className="text-4xl font-black leading-none text-cyan-400">
              {humidity}%
            </div>
            <div className="text-sm text-slate-400 mt-1">Dew point {formatTemp(dewpointC, units.temp)}</div>
          </div>

          {/* ETo */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm p-5 shadow-xl hover:bg-slate-800/70 hover:scale-[1.02] transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <Leaf className="w-6 h-6 text-emerald-400" />
              <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-emerald-900/30 text-emerald-300 border-emerald-500/30">
                CROP
              </span>
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">ETo Today</div>
            <div className="text-4xl font-black leading-none text-emerald-400">
              {eto}
            </div>
            <div className="text-sm text-slate-400 mt-1">{rainLabel(units.rain)} evapotranspiration</div>
            <div className="text-xs text-slate-500 mt-1">GDD {gdd.toFixed(1)} (base {formatTemp(10, units.temp)})</div>
          </div>
        </div>

        {/* PREMIUM TEASER — shown after main cards so value lands first */}
        {!user && (
          <div className="mb-5">
            <PremiumTeaser
              onSignUpClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
            />
          </div>
        )}

        {/* TRIAL EXPIRED PAYWALL */}
        {user && trialExpired && (
          <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-950/40 backdrop-blur-sm shadow-xl overflow-hidden">
            <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-amber-300 mb-0.5">Your free trial has ended</h3>
                <p className="text-sm text-amber-200/70">
                  Your 30-day free trial
                  {trialEndDate ? ` ended on ${trialEndDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}` : ' has expired'}.
                  Subscribe to continue accessing premium features like Farmer Joe AI, Agronomy Advisor, extended forecasts, probe data, and planting insights.
                </p>
              </div>
              <button
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="flex-shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm whitespace-nowrap"
              >
                Subscribe — $2.99/mo
              </button>
            </div>
          </div>
        )}

        {/* FORECAST CONFIDENCE STRIP */}
        {(() => {
          const rainHour = hourlyList.findIndex((h: any) => (h.rain?.['1h'] || 0) > 0.1 || h.pop > 0.6);
          const rainStartTime = rainHour >= 0
            ? new Date((hourlyList[rainHour].dt) * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
            : null;

          const windEaseHour = hourlyList.findIndex((h: any, i: number) =>
            i > 2 && h.wind_speed * 3.6 < windSpeedKmh * 0.7 && windSpeedKmh > 15
          );
          const windEaseTime = windEaseHour >= 0
            ? new Date((hourlyList[windEaseHour].dt) * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
            : null;

          const confidenceLevel = todayRainChance > 60 ? 'High' : todayRainChance > 30 ? 'Moderate' : 'High';
          const confidenceColor = confidenceLevel === 'High' ? 'text-green-300' : 'text-amber-300';
          const confidenceDot = confidenceLevel === 'High' ? 'bg-green-400' : 'bg-amber-400';

          if (!rainStartTime && !windEaseTime) return null;

          return (
            <div className="mb-5 rounded-xl border border-slate-700/40 bg-slate-900/40 backdrop-blur-sm px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${confidenceDot}`} />
                <span className="text-xs text-slate-500 uppercase tracking-wider">Forecast Confidence</span>
                <span className={`text-xs font-bold ${confidenceColor}`}>{confidenceLevel}</span>
              </div>
              {rainStartTime && (
                <>
                  <div className="w-px h-3 bg-slate-700 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Rain starts approx</span>
                    <span className="text-xs font-semibold text-sky-300">{rainStartTime}</span>
                  </div>
                </>
              )}
              {windEaseTime && (
                <>
                  <div className="w-px h-3 bg-slate-700 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Wind eases after</span>
                    <span className="text-xs font-semibold text-slate-300">{windEaseTime}</span>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* UNDERSTANDING FARMCAST */}
        <div className="mb-5">
          <UnderstandingFarmCast />
        </div>

        {/* CONNECT SENSORS CTA */}
        <div className="mb-5">
          <button
            onClick={() => setShowConnectSensors(true)}
            className="w-full rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm shadow-xl p-5 flex items-center justify-between hover:bg-slate-800/70 hover:border-green-500/30 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-600/20 border border-green-500/30 flex items-center justify-center group-hover:bg-green-600/30 transition-colors">
                <Wifi className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white">Connect Your Farm Sensors / Weather Station</div>
                <div className="text-xs text-slate-500 mt-0.5">Improve accuracy with live probe data from your paddock</div>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-600/20 text-green-400 border border-green-500/30 group-hover:bg-green-600/30 transition-colors flex-shrink-0">
              Learn how
            </span>
          </button>
        </div>

        {/* ACTIONABLE RECOMMENDATIONS */}
        <div className="mb-5">
          <ActionableRecommendations
            locationName={`${location.name}${location.state ? ', ' + location.state : ''}`}
            windSpeedKmh={windSpeedKmh}
            windGustKmh={windGustKmh}
            windDirection={windDirection}
            deltaT={deltaT}
            deltaTRating={deltaTCondition.rating}
            todayRainChance={todayRainChance}
            todayExpectedRain={todayExpectedRain}
            currentRainfall={rainfall}
            tempC={tempC}
            uvIndex={uvIndex}
            humidity={humidity}
            sprayWindowStart={todayBestWindow?.startTime}
            sprayWindowEnd={todayBestWindow?.endTime}
            isAuthenticated={!!user}
            onSignUpClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
            units={units}
            onExplainerClick={(key) => setExplainerOpen(key)}
          />
        </div>

        {/* HOURLY FORECAST */}
        <div className="mb-5">
          <HourlyForecast forecastList={hourlyList} currentWeather={current} units={units} />
        </div>

        {/* 5-DAY FORECAST */}
        <div className="mb-5 rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">5-Day Forecast</h2>
            <span className="text-xs text-slate-500 uppercase tracking-wider">Spray windows & conditions</span>
          </div>

          <div className="p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {dailyForecasts.map((day: any, index: number) => {
              const date = new Date(day.dt * 1000);
              const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-AU', { weekday: 'short' });
              const dayDate = date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
              const bestWindow = findBestSprayWindow(day.forecastItems);
              const rainPct = Math.round(day.pop * 100);

              return (
                <div
                  key={index}
                  className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-4 hover:bg-slate-700/60 hover:border-slate-600/60 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-bold text-white">{dayName}</div>
                      <div className="text-xs text-slate-500">{dayDate}</div>
                    </div>
                    {getWeatherIcon(day.weather || 'clear', 'w-8 h-8')}
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-black text-white">{formatTempValue(day.tempMax, units.temp)}°</span>
                    <span className="text-lg text-slate-500">{formatTempValue(day.tempMin, units.temp)}°</span>
                  </div>

                  <div className="space-y-1.5 text-xs mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rain</span>
                      <span className={`font-semibold ${rainPct > 70 ? 'text-blue-400' : rainPct > 40 ? 'text-sky-400' : 'text-slate-400'}`}>{rainPct}% / {formatRain(day.rain, units.rain)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Wind</span>
                      <span className={`font-semibold ${getWindColor(day.windSpeed)}`}>{formatWind(day.windSpeed, units.wind)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Humidity</span>
                      <span className="text-slate-300 font-semibold">{day.humidity}%</span>
                    </div>
                  </div>

                  {bestWindow ? (
                    <div className={`rounded-lg px-2.5 py-2 text-center ${bestWindow.rating === 'Good' ? 'bg-green-900/50 border border-green-600/30' : 'bg-yellow-900/50 border border-yellow-600/30'}`}>
                      <div className="text-xs font-bold text-slate-400 mb-0.5">Spray</div>
                      <div className={`text-xs font-bold ${bestWindow.rating === 'Good' ? 'text-green-300' : 'text-yellow-300'}`}>
                        {bestWindow.startTime}–{bestWindow.endTime}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg px-2.5 py-2 text-center bg-red-950/50 border border-red-800/30">
                      <div className="text-xs font-bold text-red-400">No Spray Window</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Spray conditions legend */}
          <div className="px-6 py-3 border-t border-slate-700/50 flex items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-green-500" /><span>Good: wind &lt;{formatWindValue(15, units.wind)} {windLabel(units.wind)}, no rain</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-yellow-500" /><span>Moderate: wind {formatWindValue(15, units.wind)}–{formatWindValue(25, units.wind)} {windLabel(units.wind)}</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500" /><span>Poor: wind &gt;{formatWindValue(25, units.wind)} {windLabel(units.wind)} or rain</span></div>
          </div>
        </div>

        {/* PROBE SECTION */}
        <div id="probe-section" className="mt-5 mb-5 relative">
          {(!user || trialExpired) && <LockedOverlay label="Soil Probe Connection" onSubscribe={() => { setAuthMode('signup'); setShowAuthModal(true); }} />}
          <div className={(!user || trialExpired) ? 'pointer-events-none' : ''}>
            <ProbeConnectionManager />
          </div>
        </div>

        {/* RADAR */}
        <div id="radar-section" className="mb-5">
          <RainRadar
            lat={location.lat}
            lon={location.lon}
            locationName={location.name}
          />
        </div>

        <div className="mb-5 relative">
          {(!user || trialExpired) && <LockedOverlay label="30-Day Extended Forecast" onSubscribe={() => { setAuthMode('signup'); setShowAuthModal(true); }} />}
          <div className={(!user || trialExpired) ? 'pointer-events-none' : ''}>
            <ExtendedForecast location={location} />
          </div>
        </div>

        {/* PLANTING + IRRIGATION */}
        <div className="mt-5 relative">
          {(!user || trialExpired) && <LockedOverlay label="Planting & Irrigation Insights" onSubscribe={() => { setAuthMode('signup'); setShowAuthModal(true); }} />}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-5 ${(!user || trialExpired) ? 'pointer-events-none' : ''}`}>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-2">
                <Sprout className="w-5 h-5 text-green-400" />
                <h3 className="text-base font-bold text-white">Best Planting Days</h3>
                <InfoButton onClick={() => setExplainerOpen('planting')} />
              </div>
              <div className="p-4">
                {plantingDays.length > 0 ? (
                  <div className="space-y-3">
                    {plantingDays.map((day, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border ${day.rating === 'Excellent' ? 'bg-green-950/60 border-green-600/30' : day.rating === 'Good' ? 'bg-emerald-950/60 border-emerald-600/30' : 'bg-lime-950/60 border-lime-600/30'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span className="font-bold text-white">{day.dayName}</span>
                            <span className="text-sm text-slate-400">{day.date}</span>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${day.rating === 'Excellent' ? 'bg-green-600 text-white' : day.rating === 'Good' ? 'bg-emerald-600 text-white' : 'bg-lime-600 text-white'}`}>
                            {day.rating}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {day.reasons.map((reason, i) => (
                            <div key={i} className="text-sm text-slate-400 flex items-start gap-1.5">
                              <span className="text-green-500 mt-0.5">•</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-6">No favorable planting days in forecast</p>
                )}
                <TrustDisclaimer />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Irrigation Schedule</h3>
                <InfoButton onClick={() => setExplainerOpen('irrigation')} />
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {irrigationDays.map((day, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${day.level === 'High' ? 'bg-red-950/60 border-red-600/30' : day.level === 'Medium' ? 'bg-yellow-950/60 border-yellow-600/30' : day.level === 'Low' ? 'bg-blue-950/60 border-blue-600/30' : 'bg-slate-800/60 border-slate-600/30'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="font-bold text-white">{day.dayName}</span>
                          <span className="text-sm text-slate-400">{day.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {day.rainAmount > 0 && <span className="text-xs text-slate-500">{formatRain(day.rainAmount, units.rain)}</span>}
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${day.level === 'High' ? 'bg-red-600 text-white' : day.level === 'Medium' ? 'bg-yellow-600 text-white' : day.level === 'Low' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'}`}>
                            {day.level}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">{day.recommendation}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-3 px-1">
                  Use as a starting guide — adjust for your soil, crop stage, and irrigation system.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-8 pb-6">
          <div className="rounded-2xl border border-slate-700/30 bg-slate-900/40 backdrop-blur-sm px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 bg-green-700/40 rounded-lg border border-green-600/30">
                <Sprout className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-300">FarmCast — Your Daily Farm Decision Engine</div>
                <div className="text-xs text-slate-600">Know exactly what to do on your farm, every day.</div>
              </div>
            </div>
            <div className="flex items-center flex-wrap justify-center sm:justify-end gap-x-4 gap-y-1 text-xs text-slate-600">
              {lastUpdated && (
                <span>Last updated: {lastUpdated.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
              )}
              <span>•</span>
              <span>Data refreshes hourly</span>
              <span>•</span>
              <button
                onClick={() => setShowPrivacyPolicy(true)}
                className="text-slate-500 hover:text-green-400 transition-colors"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <span>© {new Date().getFullYear()} FarmCast</span>
            </div>
          </div>
        </footer>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      {explainerOpen && (
        <ExplainerModal
          isOpen={true}
          onClose={() => setExplainerOpen(null)}
          explainerKey={explainerOpen}
        />
      )}

      <ConnectSensorsModal
        isOpen={showConnectSensors}
        onClose={() => setShowConnectSensors(false)}
      />

      {showPrivacyPolicy && (
        <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
      )}

      {showAgronomyDB && (
        <AgronomyDatabase
          onClose={() => { setShowAgronomyDB(false); setAgronomyInitialQuery(''); }}
          isPremium={hasActiveSubscription || (!!user && !trialExpired)}
          onSignUp={() => { setShowAgronomyDB(false); setAgronomyInitialQuery(''); setAuthMode('signup'); setShowAuthModal(true); }}
          initialQuery={agronomyInitialQuery}
          userCountry={countryCode}
          weatherContext={{
            tempC,
            humidity,
            windSpeedKmh,
            windGustKmh,
            windDirection,
            deltaT,
            deltaTRating: deltaTCondition.rating,
            todayRainChance,
            todayExpectedRain,
            currentRainfall: rainfall,
            sprayWindowStart: todayBestWindow?.startTime,
            sprayWindowEnd: todayBestWindow?.endTime,
          }}
        />
      )}


      <FarmerJoe
        weatherContext={{
          location: `${location.name}${location.state ? ', ' + location.state : ''}`,
          currentWeather: current,
          forecast: hourlyList.slice(0, 24),
          daily: dailyList.slice(0, 7),
          rainfall: {
            current1h: current.rain?.['1h'] || 0,
            todayExpectedMm: todayExpectedRain,
            todayChancePct: todayRainChance,
          },
          wind: {
            speedKmh: windSpeedKmh,
            gustKmh: windGustKmh,
            direction: windDirection,
          },
          deltaT,
          deltaTRating: deltaTCondition.rating,
          humidity,
          tempC,
          dewpointC: Math.round(dewpointC),
          uvIndex,
          pressure: current.pressure,
          feelsLike: Math.round(feelsLike),
          soilTempC: hasActiveProbe && probeReading?.soil_temp_c != null ? probeReading.soil_temp_c : Number(soilTempC),
          soilMoisturePct: hasActiveProbe && probeReading?.moisture_percent != null ? probeReading.moisture_percent : Number(soilMoisture),
          probeIsLive: hasActiveProbe && (probeReading?.soil_temp_c != null || probeReading?.moisture_percent != null),
          sprayWindow: todayBestWindow ? { start: todayBestWindow.startTime, end: todayBestWindow.endTime, rating: todayBestWindow.rating } : null,
          frostRisk,
          frostWarning,
          minTempNext24h: Math.round(minTempNext24h),
        }}
        isAuthenticated={!!user && !trialExpired}
      />
    </div>
  );
}

export default App;
