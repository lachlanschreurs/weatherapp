import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Gauge, RefreshCw, AlertCircle, Droplets, CloudRain, Battery } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Component, type ReactNode } from 'react';

interface MoistureDepth {
  depth_cm: number;
  value: number;
  channel: number;
}

interface ProbeReading {
  id: string;
  connection_id: string;
  moisture_percent: number | null;
  soil_temp_c: number | null;
  rainfall_mm: number | null;
  battery_level: number | null;
  air_temp_c: number | null;
  humidity_percent: number | null;
  moisture_depths: unknown;
  soil_temp_depths: unknown;
  measured_at: string;
  synced_at: string;
}

interface ProbeConnection {
  id: string;
  provider: string;
  station_id: string;
  friendly_name: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  last_error: string | null;
}

interface StationData {
  connection: ProbeConnection;
  reading: ProbeReading | null;
}

interface ProcessedDepth {
  depth_cm: number;
  value: number;
}

interface ProcessedReading {
  moisture_percent: number | null;
  soil_temp_c: number | null;
  rainfall_mm: number | null;
  battery_level: number | null;
  moisture_depths: ProcessedDepth[];
  soil_temp_depths: ProcessedDepth[];
  measured_at: string;
  synced_at: string;
}

interface ProbeDataCardProps {
  onManageProbes?: () => void;
}

class ProbeErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-slate-900/70 rounded-xl shadow-lg p-6 border border-slate-700/60">
          <div className="flex items-center gap-3 text-yellow-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Probe data temporarily unavailable</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function safeParseMoistureDepths(raw: unknown): ProcessedDepth[] {
  try {
    if (!raw || typeof raw !== 'object') return [];
    const obj = raw as Record<string, unknown>;
    const depths = obj.depths;
    if (!Array.isArray(depths)) return [];
    const result: ProcessedDepth[] = [];
    for (const item of depths) {
      if (!item || typeof item !== 'object') continue;
      const d = item as Record<string, unknown>;
      const depth_cm = typeof d.depth_cm === 'number' ? d.depth_cm : Number(d.depth_cm);
      const value = typeof d.value === 'number' ? d.value : Number(d.value);
      if (!isFinite(depth_cm) || !isFinite(value)) continue;
      result.push({ depth_cm, value });
    }
    return result;
  } catch {
    return [];
  }
}

function safeToFixed(n: number | null | undefined, digits: number): string {
  if (n === null || n === undefined || !isFinite(n)) return 'N/A';
  return n.toFixed(digits);
}

function processReading(reading: ProbeReading | null): ProcessedReading | null {
  if (!reading) return null;
  return {
    moisture_percent: reading.moisture_percent,
    soil_temp_c: reading.soil_temp_c,
    rainfall_mm: reading.rainfall_mm,
    battery_level: reading.battery_level,
    moisture_depths: safeParseMoistureDepths(reading.moisture_depths),
    soil_temp_depths: safeParseMoistureDepths(reading.soil_temp_depths),
    measured_at: reading.measured_at,
    synced_at: reading.synced_at,
  };
}

function getMoistureStatus(v: number | null) {
  if (v === null || !isFinite(v)) {
    return { status: 'Unknown', bg: 'bg-slate-800/60', border: 'border-slate-700/50', text: 'text-slate-400', accent: 'text-slate-500' };
  }
  if (v < 15) return { status: 'Very Dry', bg: 'bg-red-900/30', border: 'border-red-700/40', text: 'text-red-300', accent: 'text-red-400' };
  if (v < 25) return { status: 'Dry', bg: 'bg-yellow-900/30', border: 'border-yellow-700/40', text: 'text-yellow-300', accent: 'text-yellow-400' };
  if (v <= 40) return { status: 'Ideal', bg: 'bg-green-900/30', border: 'border-green-700/40', text: 'text-green-300', accent: 'text-green-400' };
  if (v <= 55) return { status: 'Moist', bg: 'bg-blue-900/30', border: 'border-blue-700/40', text: 'text-blue-300', accent: 'text-blue-400' };
  return { status: 'Saturated', bg: 'bg-cyan-900/30', border: 'border-cyan-700/40', text: 'text-cyan-300', accent: 'text-cyan-400' };
}

function getBatteryStatus(mV: number | null) {
  if (mV === null || !isFinite(mV)) {
    return { label: 'Unknown', bg: 'bg-slate-800/60', border: 'border-slate-700/50', text: 'text-slate-400', status: 'text-slate-500' };
  }
  if (mV >= 3000) return { label: 'Healthy', bg: 'bg-green-900/30', border: 'border-green-700/40', text: 'text-green-300', status: 'text-green-400' };
  if (mV >= 2500) return { label: 'Monitor', bg: 'bg-yellow-900/30', border: 'border-yellow-700/40', text: 'text-yellow-300', status: 'text-yellow-400' };
  return { label: 'Replace', bg: 'bg-red-900/30', border: 'border-red-700/40', text: 'text-red-300', status: 'text-red-400' };
}

function formatTimestamp(timestamp: string) {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Unknown';
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Unknown';
  }
}

function ProbeDataCardInner({ onManageProbes }: ProbeDataCardProps) {
  const [stations, setStations] = useState<StationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const loadProbeData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mountedRef.current) return;

      const { data: connections, error: connError } = await supabase
        .from('probe_connections')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (connError) throw connError;
      if (!mountedRef.current) return;

      if (!connections || connections.length === 0) {
        setStations([]);
        return;
      }

      const stationDataPromises = connections.map(async (connection: ProbeConnection) => {
        const { data: readingData } = await supabase
          .from('probe_readings_latest')
          .select('*')
          .eq('connection_id', connection.id)
          .maybeSingle();

        return { connection, reading: readingData as ProbeReading | null };
      });

      const stationData = await Promise.all(stationDataPromises);
      if (mountedRef.current) {
        setStations(stationData);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load probe data';
      console.error('Error loading probe data:', err);
      if (mountedRef.current) setError(msg);
    } finally {
      isFetchingRef.current = false;
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadProbeData();

    const subscription = supabase
      .channel('probe_readings_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'probe_readings_latest' },
        () => { loadProbeData(); }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [loadProbeData]);

  const processedStations = useMemo(() => {
    return stations.map(({ connection, reading }) => ({
      connection,
      processed: processReading(reading),
    }));
  }, [stations]);

  async function handleSync(connectionId?: string) {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = connectionId
        ? `${supabaseUrl}/functions/v1/sync-probe-data?connection_id=${connectionId}`
        : `${supabaseUrl}/functions/v1/sync-probe-data`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.timed_out) {
        setError('Last sync delayed — previous values shown');
      } else if (!result.success) {
        throw new Error(result.error || 'Failed to sync probe data');
      }

      await loadProbeData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      console.error('Error syncing probe data:', err);
      setError(msg);
    } finally {
      setIsSyncing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="bg-slate-900/70 rounded-xl shadow-lg p-6 border border-slate-700/60">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="bg-slate-900/70 rounded-xl shadow-lg overflow-hidden border border-slate-700/60">
        <div className="bg-slate-800/80 border-b border-slate-700/60 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 rounded-lg p-2">
              <Gauge className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-200">Soil Moisture Probes</h3>
              <p className="text-sm text-slate-400">Live sensor data</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <Gauge className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-slate-300 mb-2">No probe connected</h4>
          <p className="text-slate-500 mb-4">Connect your moisture probe to see live soil data</p>
          {onManageProbes && (
            <button
              onClick={onManageProbes}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
            >
              Connect Probe
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700/40 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {processedStations.map(({ connection, processed }) => (
        <div key={connection.id} className="bg-slate-900/70 rounded-xl shadow-lg overflow-hidden border border-slate-700/60">
          <div className="bg-slate-800/80 border-b border-slate-700/60 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 rounded-lg p-2">
                  <Gauge className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">
                    {connection.friendly_name || `Station ${connection.station_id}`}
                  </h3>
                  <p className="text-sm text-slate-400">{connection.station_id}</p>
                </div>
              </div>
              <button
                onClick={() => handleSync(connection.id)}
                disabled={isSyncing}
                className="p-2 bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {connection.last_error && (
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700/40 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-300">Could not refresh probe data</p>
              </div>
            )}

            {processed ? (
              <>
                {processed.moisture_depths.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      Soil Moisture by Depth
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {processed.moisture_depths.map((depth, idx) => {
                        const s = getMoistureStatus(depth.value);
                        return (
                          <div key={idx} className={`rounded-lg p-3 border ${s.bg} ${s.border}`}>
                            <div className={`text-xs font-medium mb-1 ${s.accent}`}>{depth.depth_cm}cm depth</div>
                            <div className={`text-2xl font-bold ${s.text}`}>{safeToFixed(depth.value, 1)}%</div>
                            <div className={`text-xs font-semibold mt-1 ${s.accent}`}>{s.status}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {processed.rainfall_mm !== null && (
                    <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-700/40">
                      <div className="text-xs font-medium text-blue-400 mb-1 flex items-center gap-1">
                        <CloudRain className="w-3 h-3" /> Rainfall
                      </div>
                      <div className="text-2xl font-bold text-blue-300">{safeToFixed(processed.rainfall_mm, 1)}mm</div>
                      <div className="text-xs font-semibold text-blue-400 mt-1">Total</div>
                    </div>
                  )}

                  {processed.battery_level !== null && (() => {
                    const b = getBatteryStatus(processed.battery_level);
                    return (
                      <div className={`${b.bg} rounded-lg p-3 border ${b.border}`}>
                        <div className={`text-xs font-medium mb-1 flex items-center gap-1 ${b.status}`}>
                          <Battery className="w-3 h-3" /> Battery
                        </div>
                        <div className={`text-2xl font-bold ${b.text}`}>
                          {safeToFixed(processed.battery_level / 1000, 2)}V
                        </div>
                        <div className={`text-xs font-semibold mt-1 ${b.status}`}>{b.label}</div>
                      </div>
                    );
                  })()}
                </div>

                <div className="text-center text-sm text-slate-500 pt-3 border-t border-slate-700/50">
                  Last updated: {formatTimestamp(processed.synced_at)}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">No data available</p>
                <button
                  onClick={() => handleSync(connection.id)}
                  disabled={isSyncing}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {isSyncing ? 'Syncing...' : 'Fetch Data'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProbeDataCard(props: ProbeDataCardProps) {
  return (
    <ProbeErrorBoundary>
      <ProbeDataCardInner {...props} />
    </ProbeErrorBoundary>
  );
}
