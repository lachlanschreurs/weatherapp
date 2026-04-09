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
          containerClass: 'bg-green-950/40 border-green-500/40',
          iconColor: 'text-green-400',
          titleClass: 'text-green-300',
          messageClass: 'text-green-400/80',
        };
      case 'info':
        return {
          containerClass: 'bg-blue-950/40 border-blue-500/40',
          iconColor: 'text-blue-400',
          titleClass: 'text-blue-300',
          messageClass: 'text-blue-400/80',
        };
      case 'caution':
        return {
          containerClass: 'bg-yellow-950/40 border-yellow-500/40',
          iconColor: 'text-yellow-400',
          titleClass: 'text-yellow-300',
          messageClass: 'text-yellow-400/80',
        };
      case 'warning':
        return {
          containerClass: 'bg-red-950/40 border-red-500/40',
          iconColor: 'text-red-400',
          titleClass: 'text-red-300',
          messageClass: 'text-red-400/80',
        };
      default:
        return {
          containerClass: 'bg-slate-800/60 border-slate-600/40',
          iconColor: 'text-slate-400',
          titleClass: 'text-slate-200',
          messageClass: 'text-slate-400',
        };
    }
  };

  const getNotificationStyle = (type: string, read: boolean) => {
    const baseStyle = 'p-4 border-l-4 transition-colors';
    const readStyle = read ? 'bg-slate-800/30' : 'bg-slate-800/60';

    switch (type) {
      case 'alert':
        return `${baseStyle} ${readStyle} border-red-500/60`;
      case 'update':
        return `${baseStyle} ${readStyle} border-blue-500/60`;
      default:
        return `${baseStyle} ${readStyle} border-slate-600/60`;
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
    ? 'text-red-400'
    : hasCautions
    ? 'text-yellow-400'
    : totalAlerts > 0
    ? 'text-blue-400'
    : 'text-slate-400';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-800 border border-slate-600/50 rounded-xl hover:bg-slate-700/80 hover:border-slate-500/60 transition-all duration-200 shadow-lg"
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
        <div className="absolute right-0 mt-2 w-96 bg-slate-900 rounded-xl shadow-2xl border border-slate-700/60 z-50 max-h-[600px] flex flex-col">
          <div className="px-4 py-3 border-b border-slate-700/60 bg-slate-800/80 rounded-t-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                <Bell className="w-5 h-5 text-slate-400" />
                Notifications & Alerts
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-green-400 hover:text-green-300 font-semibold flex items-center gap-1 transition-colors"
                    title="Mark all as read"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition-colors"
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
                  className={`px-3 py-1 rounded-lg transition-colors ${showAlerts ? 'bg-slate-700 text-green-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Current Alerts ({alerts.length})
                </button>
                <button
                  onClick={() => setShowAlerts(false)}
                  className={`px-3 py-1 rounded-lg transition-colors ${!showAlerts ? 'bg-slate-700 text-green-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
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
              <div className="divide-y divide-slate-700/40">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={getNotificationStyle(notification.type, notification.read || false)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-semibold ${!notification.read ? 'text-slate-100' : 'text-slate-400'}`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={() => handleDelete(notification.id!)}
                            className="text-slate-500 hover:text-slate-300 flex-shrink-0 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className={`text-sm mt-1 ${!notification.read ? 'text-slate-300' : 'text-slate-500'}`}>
                          {notification.message}
                        </p>
                        {notification.data?.location && (
                          <p className="text-xs text-slate-500 mt-1">
                            Location: {notification.data.location}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-slate-600">
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
                              className="text-xs text-green-400 hover:text-green-300 font-semibold flex items-center gap-1 transition-colors"
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
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                <p className="text-sm text-slate-400">No {showAlerts ? 'current alerts' : 'notifications'} yet</p>
                <p className="text-xs mt-1 text-slate-600">{showAlerts ? 'Weather alerts will appear here' : 'Past notifications will appear here'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
