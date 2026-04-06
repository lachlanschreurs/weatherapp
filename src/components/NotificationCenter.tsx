import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, AlertTriangle, Info, CloudRain, Trash2, Wind, Zap, Thermometer, Sun, Droplets, AlertCircle, CheckCircle } from 'lucide-react';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications, type WeatherNotification } from '../utils/notificationService';
import { supabase } from '../lib/supabase';
import type { WeatherAlert } from '../utils/weatherAlerts';

interface NotificationCenterProps {
  userId: string;
  alerts?: WeatherAlert[];
}

export function NotificationCenter({ userId, alerts = [] }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<WeatherNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showAlerts, setShowAlerts] = useState(true);

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    const data = await getUserNotifications(userId);
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.read).length);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(userId);
    loadNotifications();
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
    loadNotifications();
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      await clearAllNotifications(userId);
      loadNotifications();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'update':
        return <CloudRain className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertIcon = (iconName: string) => {
    const iconClass = 'w-5 h-5 flex-shrink-0';

    switch (iconName) {
      case 'cloud-rain':
        return <CloudRain className={iconClass} />;
      case 'wind':
        return <Wind className={iconClass} />;
      case 'zap':
        return <Zap className={iconClass} />;
      case 'thermometer':
        return <Thermometer className={iconClass} />;
      case 'sun':
        return <Sun className={iconClass} />;
      case 'droplets':
        return <Droplets className={iconClass} />;
      case 'alert-triangle':
        return <AlertTriangle className={iconClass} />;
      case 'alert-circle':
        return <AlertCircle className={iconClass} />;
      case 'check-circle':
        return <CheckCircle className={iconClass} />;
      default:
        return <AlertTriangle className={iconClass} />;
    }
  };

  const getAlertStyles = (severity: string) => {
    switch (severity) {
      case 'safe':
        return {
          containerClass: 'bg-green-50 border-green-300',
          iconColor: 'text-green-700',
          titleClass: 'text-green-900',
          messageClass: 'text-green-800',
        };
      case 'info':
        return {
          containerClass: 'bg-blue-50 border-blue-300',
          iconColor: 'text-blue-700',
          titleClass: 'text-blue-900',
          messageClass: 'text-blue-800',
        };
      case 'caution':
        return {
          containerClass: 'bg-yellow-50 border-yellow-300',
          iconColor: 'text-yellow-700',
          titleClass: 'text-yellow-900',
          messageClass: 'text-yellow-800',
        };
      case 'warning':
        return {
          containerClass: 'bg-red-50 border-red-300',
          iconColor: 'text-red-700',
          titleClass: 'text-red-900',
          messageClass: 'text-red-800',
        };
      default:
        return {
          containerClass: 'bg-gray-50 border-gray-300',
          iconColor: 'text-gray-700',
          titleClass: 'text-gray-900',
          messageClass: 'text-gray-800',
        };
    }
  };

  const getNotificationStyle = (type: string, read: boolean) => {
    const baseStyle = 'p-4 border-l-4 transition-colors';
    const readStyle = read ? 'bg-gray-50' : 'bg-white';

    switch (type) {
      case 'alert':
        return `${baseStyle} ${readStyle} border-red-500`;
      case 'update':
        return `${baseStyle} ${readStyle} border-blue-500`;
      default:
        return `${baseStyle} ${readStyle} border-gray-400`;
    }
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { warning: 0, caution: 1, info: 2, safe: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const hasWarnings = sortedAlerts.some(alert => alert.severity === 'warning');
  const hasCautions = sortedAlerts.some(alert => alert.severity === 'caution');
  const totalAlerts = alerts.length + unreadCount;

  const bellColor = hasWarnings
    ? 'text-red-600'
    : hasCautions
    ? 'text-yellow-600'
    : totalAlerts > 0
    ? 'text-blue-600'
    : 'text-gray-700';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-md"
        title="Notifications & Alerts"
      >
        <Bell className={`w-5 h-5 ${bellColor}`} />
        {totalAlerts > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 ${hasWarnings ? 'bg-red-500' : hasCautions ? 'bg-yellow-500' : 'bg-blue-500'} text-white text-xs font-bold rounded-full flex items-center justify-center`}>
            {totalAlerts > 9 ? '9+' : totalAlerts}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications & Alerts
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-green-700 hover:text-green-800 font-semibold flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {alerts.length > 0 && (
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => setShowAlerts(true)}
                  className={`px-3 py-1 rounded ${showAlerts ? 'bg-white text-green-700 font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  Current Alerts ({alerts.length})
                </button>
                <button
                  onClick={() => setShowAlerts(false)}
                  className={`px-3 py-1 rounded ${!showAlerts ? 'bg-white text-green-700 font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  History ({notifications.length})
                </button>
              </div>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {showAlerts && alerts.length > 0 ? (
              <div className="p-3 space-y-2">
                {sortedAlerts.map((alert) => {
                  const styles = getAlertStyles(alert.severity);

                  return (
                    <div
                      key={alert.id}
                      className={`${styles.containerClass} border-l-4 border rounded-lg p-3`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={styles.iconColor}>
                          {getAlertIcon(alert.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`${styles.titleClass} font-semibold text-sm mb-1`}>
                            {alert.title}
                          </h4>
                          <p className={`${styles.messageClass} text-xs leading-relaxed`}>
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !showAlerts && notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={getNotificationStyle(notification.type, notification.read || false)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={() => handleDelete(notification.id!)}
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                          {notification.message}
                        </p>
                        {notification.data?.location && (
                          <p className="text-xs text-gray-500 mt-1">
                            Location: {notification.data.location}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {new Date(notification.created_at!).toLocaleString('en-AU', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id!)}
                              className="text-xs text-green-700 hover:text-green-800 font-semibold flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No {showAlerts ? 'current alerts' : 'notifications'} yet</p>
                <p className="text-xs mt-1">{showAlerts ? 'Weather alerts will appear here' : 'Past notifications will appear here'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
