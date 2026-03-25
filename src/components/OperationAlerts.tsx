import { AlertTriangle, Info, AlertCircle, Sprout, Wheat, Droplets } from 'lucide-react';
import { OperationAlert } from '../types/premium';

interface OperationAlertsProps {
  alerts: OperationAlert[];
  isPremium: boolean;
}

const alertIcons = {
  spray: Droplets,
  harvest: Wheat,
  planting: Sprout,
  general: Info,
};

const severityStyles = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  critical: 'bg-red-50 border-red-200 text-red-800',
};

export function OperationAlerts({ alerts, isPremium }: OperationAlertsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h2 className="text-xl font-semibold text-gray-800">Operation Alerts</h2>
        </div>
        <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
          PREMIUM
        </span>
      </div>

      {!isPremium ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-2">
            Get real-time operation alerts
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Stay informed about optimal windows for spraying, harvesting, planting, and more
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all">
            Upgrade to Premium
          </button>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8">
          <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No active alerts at this time</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = alertIcons[alert.type];
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-2 ${severityStyles[alert.severity]} transition-all`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{alert.title}</h3>
                    <p className="text-sm mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span>
                        Start: {new Date(alert.start_time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      {alert.end_time && (
                        <span>
                          End: {new Date(alert.end_time).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
