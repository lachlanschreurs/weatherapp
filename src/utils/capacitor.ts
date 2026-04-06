import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = () => {
  return Capacitor.getPlatform();
};

export const initializeApp = async () => {
  if (!isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#1e40af' });

    await SplashScreen.hide();
  } catch (error) {
    console.error('Error initializing app:', error);
  }
};

export const requestLocationPermission = async () => {
  if (!isNativePlatform()) {
    return true;
  }

  try {
    const permission = await Geolocation.checkPermissions();

    if (permission.location === 'granted') {
      return true;
    }

    const request = await Geolocation.requestPermissions();
    return request.location === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

export const getCurrentPosition = async () => {
  try {
    if (isNativePlatform()) {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } else {
      return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => reject(error),
          { enableHighAccuracy: true }
        );
      });
    }
  } catch (error) {
    console.error('Error getting current position:', error);
    throw error;
  }
};

export const setupPushNotifications = async () => {
  if (!isNativePlatform()) return;

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('Push notification permission denied');
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
    });

  } catch (error) {
    console.error('Error setting up push notifications:', error);
  }
};

export const scheduleLocalNotification = async (title: string, body: string, id?: number) => {
  if (!isNativePlatform()) return;

  try {
    const permission = await LocalNotifications.checkPermissions();

    if (permission.display !== 'granted') {
      const request = await LocalNotifications.requestPermissions();
      if (request.display !== 'granted') {
        return;
      }
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: id || Date.now(),
          schedule: { at: new Date(Date.now() + 1000) },
          sound: undefined,
          attachments: undefined,
          actionTypeId: '',
          extra: null
        }
      ]
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

export const triggerHaptic = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  if (!isNativePlatform()) return;

  try {
    const impactStyle =
      style === 'light' ? ImpactStyle.Light :
      style === 'heavy' ? ImpactStyle.Heavy :
      ImpactStyle.Medium;

    await Haptics.impact({ style: impactStyle });
  } catch (error) {
    console.error('Error triggering haptic:', error);
  }
};

export const setStatusBarColor = async (color: string, isDark: boolean = false) => {
  if (!isNativePlatform()) return;

  try {
    await StatusBar.setBackgroundColor({ color });
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
  } catch (error) {
    console.error('Error setting status bar:', error);
  }
};
