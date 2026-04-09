import { Location } from '../components/LocationSearch';
import { getCurrentPosition as getCapacitorPosition, isNativePlatform } from './capacitor';

export async function getCurrentPosition(): Promise<GeolocationPosition> {
  if (isNativePlatform()) {
    const coords = await getCapacitorPosition();
    return {
      coords: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: 0,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    } as GeolocationPosition;
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
      maximumAge: 300000,
      enableHighAccuracy: false,
    });
  });
}

export async function reverseGeocode(lat: number, lon: number): Promise<Location> {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || import.meta.env.OPENWEATHER_API_KEY;
  const response = await fetch(
    `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`
  );

  if (!response.ok) {
    throw new Error('Failed to get location name');
  }

  const data = await response.json();
  if (data.length === 0) {
    throw new Error('Location not found');
  }

  const place = data[0];
  return {
    name: place.name,
    lat: place.lat,
    lon: place.lon,
    country: place.country,
    state: place.state,
  };
}

export async function getUserLocation(): Promise<Location> {
  try {
    const position = await getCurrentPosition();
    return reverseGeocode(position.coords.latitude, position.coords.longitude);
  } catch (error) {
    console.warn('Could not get user location, using Melbourne as default:', error);
    return {
      name: 'Melbourne',
      lat: -37.8136,
      lon: 144.9631,
      country: 'AU',
      state: 'Victoria',
    };
  }
}
