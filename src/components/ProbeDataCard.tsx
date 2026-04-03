import { useState, useEffect } from 'react';
import { Gauge, RefreshCw, AlertCircle, Droplets, Thermometer, CloudRain, Battery } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProbeReading {
  id: string;
  connection_id: string;
  moisture_percent: number | null;
  soil_temp_c: number | null;
  rainfall_mm: number | null;
  battery_level: number | null;
  measured_at: string;
  synced_at: string;
}

interface ProbeConnection {
  id: string;
  provider: string;
  station_id: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_error: string | null;
}

interface ProbeDataCardProps {
  onManageProbes?: () => void;
}

export function ProbeDataCard({ onManageProbes }: ProbeDataCardProps) {
  const [reading, setReading] = useState<ProbeReading | null>(null);
  const [connection, setConnection] = useState<ProbeConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProbeData();

    const subscription = supabase
      .channel('probe_readings_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'probe_readings_latest' },
        () => {
          loadProbeData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadProbeData() {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: connections, error: connError } = await supabase
        .from('probe_connections')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (connError) throw connError;

      if (!connections || connections.length === 0) {
        setConnection(null);
        setReading(null);
        return;
      }

      const activeConnection = connections[0];
      setConnection(activeConnection);

      const { data: readingData, error: readError } = await supabase
        .from('probe_readings_latest')
        .select('*')
        .eq('connection_id', activeConnection.id)
        .maybeSingle();

      if (readError) throw readError;

      setReading(readingData);

    } catch (err: any) {
      console.error('Error loading probe data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSync() {
    if (!connection) return;

    try {
      setIsSyncing(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/sync-probe-data?connection_id=${connection.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to sync probe data');
      }

      await loadProbeData();

    } catch (err: any) {
      console.error('Error syncing probe data:', err);
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function getMoistureColor(percent: number | null) {
    if (percent === null) return 'gray';
    if (percent < 20) return 'red';
    if (percent < 40) return 'orange';
    if (percent < 60) return 'yellow';
    return 'blue';
  }

  function getMoistureLabel(percent: number | null) {
    if (percent === null) return 'Unknown';
    if (percent < 20) return 'Very Dry';
    if (percent < 40) return 'Dry';
    if (percent < 60) return 'Moderate';
    if (percent < 80) return 'Moist';
    return 'Very Moist';
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
              <Gauge className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Soil Moisture Probe</h3>
              <p className="text-sm text-green-100">Live sensor data</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <Gauge className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No probe connected</h4>
          <p className="text-gray-600 mb-4">Connect your moisture probe to see live soil data</p>
          {onManageProbes && (
            <button
              onClick={onManageProbes}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              Connect Probe
            </button>
          )}
        </div>
      </div>
    );
  }

  const moistureColor = getMoistureColor(reading?.moisture_percent ?? null);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
              <Gauge className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Soil Moisture Probe</h3>
              <p className="text-sm text-green-100">Station {connection.station_id}</p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {connection.last_error && !error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">Could not refresh probe data. Please check your API details or station ID.</p>
            </div>
          </div>
        )}

        {reading ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`bg-${moistureColor}-50 rounded-lg p-4 border border-${moistureColor}-200`}>
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className={`w-5 h-5 text-${moistureColor}-600`} />
                  <span className={`text-sm font-medium text-${moistureColor}-700`}>Soil Moisture</span>
                </div>
                <div className={`text-3xl font-bold text-${moistureColor}-900 mb-1`}>
                  {reading.moisture_percent !== null ? `${reading.moisture_percent.toFixed(1)}%` : 'N/A'}
                </div>
                <div className={`text-xs text-${moistureColor}-600`}>
                  {getMoistureLabel(reading.moisture_percent)}
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Soil Temp</span>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-1">
                  {reading.soil_temp_c !== null ? `${reading.soil_temp_c.toFixed(1)}°C` : 'N/A'}
                </div>
                <div className="text-xs text-orange-600">
                  {reading.soil_temp_c !== null ? `${(reading.soil_temp_c * 9/5 + 32).toFixed(1)}°F` : ''}
                </div>
              </div>

              <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                <div className="flex items-center gap-2 mb-2">
                  <CloudRain className="w-5 h-5 text-cyan-600" />
                  <span className="text-sm font-medium text-cyan-700">Rainfall</span>
                </div>
                <div className="text-3xl font-bold text-cyan-900 mb-1">
                  {reading.rainfall_mm !== null ? `${reading.rainfall_mm.toFixed(1)}` : 'N/A'}
                </div>
                <div className="text-xs text-cyan-600">
                  {reading.rainfall_mm !== null ? 'mm' : ''}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Battery className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Battery</span>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-1">
                  {reading.battery_level !== null ? `${reading.battery_level.toFixed(0)}%` : 'N/A'}
                </div>
                <div className="text-xs text-green-600">
                  {reading.battery_level !== null && reading.battery_level > 20 ? 'Good' : reading.battery_level !== null ? 'Low' : ''}
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500 pt-3 border-t border-gray-200">
              Last updated: {formatTimestamp(reading.synced_at)}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No data available</p>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {isSyncing ? 'Syncing...' : 'Fetch Data'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
