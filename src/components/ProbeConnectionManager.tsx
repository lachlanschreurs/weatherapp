import { useState, useEffect } from 'react';
import { Gauge, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle, Settings, Eye, EyeOff, Upload, Mail, Zap, CreditCard as Edit2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CSVUploadModal } from './CSVUploadModal';
import { EmailImportInstructions } from './EmailImportInstructions';

interface ProbeConnection {
  id: string;
  provider: string;
  station_id: string;
  device_id: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  last_error: string | null;
  sensor_mapping: Record<string, string>;
  connection_method: string;
  auth_config: Record<string, any>;
  friendly_name: string | null;
}

interface MoistureDepth {
  depth_cm: number;
  value: number;
  channel?: number;
}

interface ProbeReading {
  id: string;
  connection_id: string;
  moisture_percent: number | null;
  moisture_depths?: { depths: MoistureDepth[] };
  soil_temp_c: number | null;
  soil_temp_depths?: { depths: MoistureDepth[] };
  air_temp_c?: number | null;
  humidity_percent?: number | null;
  rainfall_mm: number | null;
  battery_level: number | null;
  measured_at: string;
  synced_at: string;
  raw_payload: any;
}

const PROVIDERS = [
  { id: 'fieldclimate', name: 'FieldClimate', authMethods: ['api_key'] },
  { id: 'john_deere', name: 'John Deere', authMethods: ['oauth', 'api_key'] },
  { id: 'cropx', name: 'CropX', authMethods: ['api_key'] },
  { id: 'sentek', name: 'Sentek', authMethods: ['api_key', 'username_password'] },
  { id: 'aquacheck', name: 'AquaCheck', authMethods: ['api_key', 'username_password'] },
  { id: 'wildeye', name: 'Wildeye', authMethods: ['api_key'] },
  { id: 'other', name: 'Other', authMethods: ['api_key', 'username_password'] },
];

const CONNECTION_METHODS = [
  { id: 'api', name: 'Connect Provider', icon: Zap, description: 'Live sync with your probe API' },
  { id: 'csv', name: 'Upload CSV', icon: Upload, description: 'Import historical data from file' },
  { id: 'email', name: 'Email Import', icon: Mail, description: 'Forward reports to Farmcast' },
];

function getBatteryStatus(mV: number) {
  const voltage = mV / 1000;

  if (voltage >= 3.2) {
    return {
      label: 'Healthy',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900',
      labelColor: 'text-green-700',
      statusColor: 'text-green-600',
    };
  } else if (voltage >= 2.8) {
    return {
      label: 'Fair',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-900',
      labelColor: 'text-yellow-700',
      statusColor: 'text-yellow-600',
    };
  } else {
    return {
      label: 'Low',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900',
      labelColor: 'text-red-700',
      statusColor: 'text-red-600',
    };
  }
}

export function ProbeConnectionManager() {
  const [connections, setConnections] = useState<ProbeConnection[]>([]);
  const [readings, setReadings] = useState<Map<string, ProbeReading>>(new Map());
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAPIForm, setShowAPIForm] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
  const [formData, setFormData] = useState({
    friendly_name: '',
    provider: 'fieldclimate',
    connection_method: 'api_key',
    api_key: '',
    api_secret: '',
    username: '',
    password: '',
    station_id: '',
    device_id: '',
    sensor_mapping: '',
  });

  const [showSecrets, setShowSecrets] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showRawData, setShowRawData] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  useEffect(() => {
    loadConnections();
  }, []);

  async function loadConnections() {
    try {
      setIsLoading(true);
      setError(null);

      const { data: connectionsData, error: connError } = await supabase
        .from('probe_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (connError) throw connError;

      setConnections(connectionsData || []);

      const { data: readingsData, error: readError } = await supabase
        .from('probe_readings_latest')
        .select('*');

      if (readError) throw readError;

      const readingsMap = new Map();
      (readingsData || []).forEach((reading: ProbeReading) => {
        readingsMap.set(reading.connection_id, reading);
      });
      setReadings(readingsMap);

    } catch (err: any) {
      console.error('Error loading probe connections:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectConnectionMethod(methodId: string) {
    setShowAddMenu(false);
    if (methodId === 'api') {
      setShowAPIForm(true);
    } else if (methodId === 'csv') {
      setShowCSVModal(true);
    } else if (methodId === 'email') {
      setShowEmailModal(true);
    }
  }

  async function handleAddAPIConnection(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setTestingConnection(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let sensorMapping = {};
      if (formData.sensor_mapping.trim()) {
        try {
          sensorMapping = JSON.parse(formData.sensor_mapping);
        } catch {
          throw new Error('Invalid sensor mapping JSON');
        }
      }

      const authConfig: Record<string, any> = {};
      if (formData.connection_method === 'api_key') {
        authConfig.api_key = formData.api_key.trim();
        authConfig.api_secret = formData.api_secret.trim();
      } else if (formData.connection_method === 'username_password') {
        authConfig.username = formData.username.trim();
        authConfig.password = formData.password.trim();
      }

      const { data: connection, error: insertError } = await supabase
        .from('probe_connections')
        .insert({
          user_id: user.id,
          provider: formData.provider,
          friendly_name: formData.friendly_name.trim() || null,
          connection_method: formData.connection_method,
          auth_config: authConfig,
          api_key: formData.api_key.trim() || null,
          api_secret: formData.api_secret.trim() || null,
          station_id: formData.station_id.trim(),
          device_id: formData.device_id.trim() || null,
          sensor_mapping: sensorMapping,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (formData.provider === 'fieldclimate') {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

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
          await supabase
            .from('probe_connections')
            .delete()
            .eq('id', connection.id);

          const detailedError = result.error || 'Failed to connect to probe';
          console.error('FieldClimate API Error Details:', result);
          throw new Error(`FieldClimate Error: ${detailedError}`);
        }
      }

      setSuccessMessage('Probe connected successfully!');
      setShowAPIForm(false);
      resetForm();
      await loadConnections();

    } catch (err: any) {
      console.error('Error adding probe connection:', err);
      setError(err.message);
    } finally {
      setTestingConnection(false);
    }
  }

  function resetForm() {
    setFormData({
      friendly_name: '',
      provider: 'fieldclimate',
      connection_method: 'api_key',
      api_key: '',
      api_secret: '',
      username: '',
      password: '',
      station_id: '',
      device_id: '',
      sensor_mapping: '',
    });
    setSelectedProvider(PROVIDERS[0]);
  }

  async function handleDeleteConnection(connectionId: string) {
    if (!confirm('Are you sure you want to remove this probe connection?')) {
      return;
    }

    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('probe_connections')
        .delete()
        .eq('id', connectionId);

      if (deleteError) throw deleteError;

      setSuccessMessage('Probe connection removed');
      await loadConnections();

    } catch (err: any) {
      console.error('Error deleting probe connection:', err);
      setError(err.message);
    }
  }

  async function handleSyncConnection(connectionId: string) {
    try {
      setIsSyncing(true);
      setError(null);
      setSuccessMessage(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/sync-probe-data?connection_id=${connectionId}`,
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

      setSuccessMessage('Probe data synced successfully!');
      await loadConnections();

    } catch (err: any) {
      console.error('Error syncing probe data:', err);
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSyncAll() {
    try {
      setIsSyncing(true);
      setError(null);
      setSuccessMessage(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/sync-probe-data`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error('Failed to sync probe data');
      }

      setSuccessMessage('All probe data synced successfully!');
      await loadConnections();

    } catch (err: any) {
      console.error('Error syncing all probe data:', err);
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }

  function handleStartEditName(connection: ProbeConnection) {
    setEditingName(connection.id);
    setEditNameValue(connection.friendly_name || getProviderDisplayName(connection.provider));
  }

  function handleCancelEditName() {
    setEditingName(null);
    setEditNameValue('');
  }

  async function handleSaveEditName(connectionId: string) {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('probe_connections')
        .update({ friendly_name: editNameValue.trim() || null })
        .eq('id', connectionId);

      if (updateError) throw updateError;

      setSuccessMessage('Probe renamed successfully');
      setEditingName(null);
      setEditNameValue('');
      await loadConnections();

    } catch (err: any) {
      console.error('Error renaming probe:', err);
      setError(err.message);
    }
  }

  function formatTimestamp(timestamp: string | null) {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }

  function getProviderDisplayName(providerId: string): string {
    const provider = PROVIDERS.find(p => p.id === providerId);
    return provider?.name || providerId;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading probe connections...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                <Gauge className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Moisture Probe Sources</h2>
                <p className="text-sm text-green-100">Connect any probe provider or import data</p>
              </div>
            </div>
            <div className="flex gap-2">
              {connections.length > 0 && (
                <button
                  onClick={handleSyncAll}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync All
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Source
                </button>

                {showAddMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                    {CONNECTION_METHODS.map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => handleSelectConnectionMethod(method.id)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-100 last:border-0"
                        >
                          <div className="mt-0.5">
                            <Icon className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{method.name}</div>
                            <div className="text-sm text-gray-600">{method.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {showAPIForm && (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Provider API</h3>
            <form onSubmit={handleAddAPIConnection} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connection Name (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.friendly_name}
                    onChange={(e) => setFormData({ ...formData, friendly_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., North Field Probe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider *
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) => {
                      const provider = PROVIDERS.find(p => p.id === e.target.value) || PROVIDERS[0];
                      setSelectedProvider(provider);
                      setFormData({
                        ...formData,
                        provider: e.target.value,
                        connection_method: provider.authMethods[0] || 'api_key'
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {PROVIDERS.map(provider => (
                      <option key={provider.id} value={provider.id}>{provider.name}</option>
                    ))}
                  </select>
                </div>

                {selectedProvider.authMethods.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Authentication Method *
                    </label>
                    <select
                      value={formData.connection_method}
                      onChange={(e) => setFormData({ ...formData, connection_method: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {selectedProvider.authMethods.includes('api_key') && (
                        <option value="api_key">API Key</option>
                      )}
                      {selectedProvider.authMethods.includes('oauth') && (
                        <option value="oauth">OAuth</option>
                      )}
                      {selectedProvider.authMethods.includes('username_password') && (
                        <option value="username_password">Username & Password</option>
                      )}
                    </select>
                  </div>
                )}

                {formData.connection_method === 'api_key' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key / Public Key *
                      </label>
                      <div className="relative">
                        <input
                          type={showSecrets ? 'text' : 'password'}
                          required
                          value={formData.api_key}
                          onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Your API key"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecrets(!showSecrets)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Secret / Private Key {formData.provider === 'fieldclimate' ? '*' : '(if required)'}
                      </label>
                      <input
                        type={showSecrets ? 'text' : 'password'}
                        required={formData.provider === 'fieldclimate'}
                        value={formData.api_secret}
                        onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Your API secret"
                      />
                    </div>
                  </>
                )}

                {formData.connection_method === 'username_password' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Your username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type={showSecrets ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Your password"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Station ID / Device ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.station_id}
                    onChange={(e) => setFormData({ ...formData, station_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 12345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-Device ID (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.device_id}
                    onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Leave empty if not required"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sensor Mapping (optional JSON)
                  </label>
                  <input
                    type="text"
                    value={formData.sensor_mapping}
                    onChange={(e) => setFormData({ ...formData, sensor_mapping: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                    placeholder='{"moisture": "sm1", "soil_temp": "st1"}'
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAPIForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testingConnection}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {testingConnection ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {formData.provider === 'fieldclimate' ? 'Testing Connection...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Connect Provider
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="p-6">
          {connections.length === 0 ? (
            <div className="text-center py-12">
              <Gauge className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No probe connections</h3>
              <p className="text-gray-600 mb-4">Connect any moisture probe provider or import your data</p>
              <button
                onClick={() => setShowAddMenu(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Your First Source
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection, index) => {
                const reading = readings.get(connection.id);

                const bgColors = [
                  'bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100',
                  'bg-gradient-to-br from-emerald-100 via-green-50 to-teal-100',
                  'bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100',
                  'bg-gradient-to-br from-teal-100 via-cyan-50 to-sky-100',
                ];
                const borderColors = [
                  'border-2 border-blue-300',
                  'border-2 border-emerald-300',
                  'border-2 border-amber-300',
                  'border-2 border-teal-300',
                ];

                const colorIndex = index % bgColors.length;

                return (
                  <div key={connection.id} className={`${bgColors[colorIndex]} border ${borderColors[colorIndex]} rounded-lg p-4`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {editingName === connection.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEditName(connection.id);
                                  if (e.key === 'Escape') handleCancelEditName();
                                }}
                                className="px-3 py-1.5 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-semibold text-gray-900"
                                placeholder="e.g., North Field Probe"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEditName(connection.id)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Save name"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEditName}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <h4 className="font-semibold text-gray-900">
                                {connection.friendly_name || getProviderDisplayName(connection.provider)}
                              </h4>
                              <button
                                onClick={() => handleStartEditName(connection)}
                                className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Rename probe"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {connection.friendly_name && (
                                <span className="text-sm text-gray-500">
                                  ({getProviderDisplayName(connection.provider)})
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Station: {connection.station_id}</span>
                          <span>Last sync: {formatTimestamp(connection.last_sync_at)}</span>
                          {connection.last_error && (
                            <span className="text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {connection.last_error.substring(0, 50)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {connection.connection_method === 'api_key' && connection.provider === 'fieldclimate' && (
                          <button
                            onClick={() => handleSyncConnection(connection.id)}
                            disabled={isSyncing}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Sync now"
                          >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        <button
                          onClick={() => setShowRawData(showRawData === connection.id ? null : connection.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View raw data"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteConnection(connection.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove connection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {reading ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-xs text-blue-700 font-medium mb-1">Soil Moisture</div>
                          <div className="text-2xl font-bold text-blue-900">
                            {reading.moisture_percent !== null ? `${reading.moisture_percent.toFixed(1)}%` : 'N/A'}
                          </div>
                          {reading.moisture_depths?.depths && reading.moisture_depths.depths.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-blue-200 space-y-1">
                              {reading.moisture_depths.depths.map((depth, idx) => (
                                <div key={idx} className="flex justify-between text-xs">
                                  <span className="text-blue-600 font-medium">{depth.depth_cm}cm:</span>
                                  <span className="text-blue-900 font-semibold">{depth.value.toFixed(1)}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3">
                          <div className="text-xs text-orange-700 font-medium mb-1">Soil Temp</div>
                          <div className="text-2xl font-bold text-orange-900">
                            {reading.soil_temp_c !== null ? `${reading.soil_temp_c.toFixed(1)}°C` : 'N/A'}
                          </div>
                          {reading.soil_temp_depths?.depths && reading.soil_temp_depths.depths.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-orange-200 space-y-1">
                              {reading.soil_temp_depths.depths.map((depth, idx) => (
                                <div key={idx} className="flex justify-between text-xs">
                                  <span className="text-orange-600 font-medium">{depth.depth_cm}cm:</span>
                                  <span className="text-orange-900 font-semibold">{depth.value.toFixed(1)}°C</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="bg-cyan-50 rounded-lg p-3">
                          <div className="text-xs text-cyan-700 font-medium mb-1">Rainfall</div>
                          <div className="text-2xl font-bold text-cyan-900">
                            {reading.rainfall_mm !== null ? `${reading.rainfall_mm.toFixed(1)}mm` : 'N/A'}
                          </div>
                          <div className="text-xs text-cyan-600 font-semibold mt-1">Total</div>
                        </div>
                        {reading.battery_level !== null && (() => {
                          const batteryStatus = getBatteryStatus(reading.battery_level);
                          return (
                            <div className={`${batteryStatus.bgColor} rounded-lg p-3 border ${batteryStatus.borderColor}`}>
                              <div className={`text-xs ${batteryStatus.labelColor} font-medium mb-1`}>Battery</div>
                              <div className={`text-2xl font-bold ${batteryStatus.textColor}`}>
                                {(reading.battery_level / 1000).toFixed(2)}V
                              </div>
                              <div className={`text-xs ${batteryStatus.statusColor} font-semibold mt-1`}>
                                {batteryStatus.label}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No data available. Click sync to fetch latest readings.
                      </div>
                    )}

                    {showRawData === connection.id && reading?.raw_payload && (
                      <div className="mt-4 p-4 bg-gray-900 rounded-lg overflow-auto max-h-96">
                        <div className="text-xs text-gray-400 mb-2">Raw API Response (for debugging)</div>
                        <pre className="text-xs text-green-400 font-mono">
                          {JSON.stringify(reading.raw_payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCSVModal && (
        <CSVUploadModal
          onClose={() => setShowCSVModal(false)}
          onSuccess={async () => {
            setShowCSVModal(false);
            await loadConnections();
          }}
        />
      )}

      {showEmailModal && (
        <EmailImportInstructions
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}
