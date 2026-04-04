import { supabase } from '../lib/supabase';

export interface WeatherNotification {
  id?: string;
  user_id: string;
  title: string;
  message: string;
  type: 'alert' | 'update' | 'info';
  read?: boolean;
  created_at?: string;
  data?: {
    location?: string;
    alert_type?: string;
    severity?: string;
    conditions?: any;
  };
}

export async function createNotification(notification: Omit<WeatherNotification, 'id' | 'created_at' | 'read'>) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([notification])
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return data;
}

export async function getUserNotifications(userId: string, unreadOnly = false) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data as WeatherNotification[];
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return true;
}

export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
}

export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    return false;
  }

  return true;
}

export async function clearAllNotifications(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error clearing all notifications:', error);
    return false;
  }

  return true;
}

export async function checkAndCreateWeatherAlerts(
  userId: string,
  location: string,
  weatherAlerts: Array<{ severity: string; message: string; icon: any }>
) {
  const recentNotifications = await getUserNotifications(userId);
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  for (const alert of weatherAlerts) {
    const isDuplicate = recentNotifications.some(
      notif =>
        notif.type === 'alert' &&
        notif.data?.alert_type === alert.severity &&
        new Date(notif.created_at!) > oneHourAgo
    );

    if (!isDuplicate) {
      await createNotification({
        user_id: userId,
        title: `${alert.severity} Weather Alert`,
        message: alert.message,
        type: 'alert',
        data: {
          location,
          alert_type: alert.severity,
          severity: alert.severity,
        },
      });
    }
  }
}

export async function createWeatherUpdateNotification(
  userId: string,
  location: string,
  updateType: string,
  message: string
) {
  await createNotification({
    user_id: userId,
    title: `Weather Update - ${location}`,
    message,
    type: 'update',
    data: {
      location,
      alert_type: updateType,
    },
  });
}
