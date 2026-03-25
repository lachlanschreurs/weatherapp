import {
  CloudRain,
  Wind,
  Zap,
  Thermometer,
  Sun,
  Droplets,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { WeatherAlert, AlertSeverity } from '../utils/weatherAlerts';

interface AlertBannerProps {
  alerts: WeatherAlert[];
}

function getAlertIcon(iconName: string) {
  const iconClass = 'w-6 h-6 flex-shrink-0';

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
    case 'check-circle':
      return <CheckCircle className={iconClass} />;
    default:
      return <AlertTriangle className={iconClass} />;
  }
}

function getAlertStyles(severity: AlertSeverity) {
  switch (severity) {
    case 'safe':
      return {
        containerClass: 'bg-green-100 border-green-400',
        borderClass: 'border-l-green-700',
        titleClass: 'text-green-900',
        messageClass: 'text-green-800',
        iconColor: 'text-green-700',
      };
    case 'caution':
      return {
        containerClass: 'bg-yellow-100 border-yellow-400',
        borderClass: 'border-l-yellow-700',
        titleClass: 'text-yellow-900',
        messageClass: 'text-yellow-800',
        iconColor: 'text-yellow-700',
      };
    case 'warning':
      return {
        containerClass: 'bg-red-100 border-red-400',
        borderClass: 'border-l-red-700',
        titleClass: 'text-red-900',
        messageClass: 'text-red-800',
        iconColor: 'text-red-700',
      };
  }
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { warning: 0, caution: 1, safe: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <div className="mb-6 space-y-3">
      <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6" />
        Weather Alerts
      </h2>

      <div className="space-y-3">
        {sortedAlerts.map((alert) => {
          const styles = getAlertStyles(alert.severity);

          return (
            <div
              key={alert.id}
              className={`${styles.containerClass} ${styles.borderClass} border-l-4 border-2 rounded-lg p-4 shadow-md transition-all hover:shadow-lg`}
            >
              <div className="flex items-start gap-4">
                <div className={styles.iconColor}>
                  {getAlertIcon(alert.icon)}
                </div>
                <div className="flex-1">
                  <h3 className={`${styles.titleClass} font-bold text-lg mb-1`}>
                    {alert.title}
                  </h3>
                  <p className={`${styles.messageClass} text-sm leading-relaxed`}>
                    {alert.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
