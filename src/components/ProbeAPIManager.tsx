import { useState, useEffect } from 'react';
import { Database, Plus, Trash2, CreditCard as Edit2, Save, X, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface ProbeAPI {
  id: string;
  user_id: string;
  name: string;
  api_url: string;
  api_key?: string;
  probe_type: string;
  created_at: string;
}

interface ProbeAPIManagerProps {
  user: User | null;
}

export function ProbeAPIManager({ user }: ProbeAPIManagerProps) {
  const [probeAPIs, setProbeAPIs] = useState<ProbeAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    api_url: '',
    api_key: '',
    probe_type: 'soil_moisture',
  });

  useEffect(() => {
    if (user) {
      fetchProbeAPIs();
    }
  }, [user]);

  const fetchProbeAPIs = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('probe_apis')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProbeAPIs(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (editingId) {
      const { error } = await supabase
        .from('probe_apis')
        .update({
          name: formData.name,
          api_url: formData.api_url,
          api_key: formData.api_key,
          probe_type: formData.probe_type,
        })
        .eq('id', editingId);

      if (!error) {
        setEditingId(null);
        fetchProbeAPIs();
      }
    } else {
      const { error } = await supabase
        .from('probe_apis')
        .insert({
          user_id: user.id,
          name: formData.name,
          api_url: formData.api_url,
          api_key: formData.api_key,
          probe_type: formData.probe_type,
        });

      if (!error) {
        setShowAddForm(false);
        fetchProbeAPIs();
      }
    }

    setFormData({ name: '', api_url: '', api_key: '', probe_type: 'soil_moisture' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this probe API?')) return;

    const { error } = await supabase
      .from('probe_apis')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchProbeAPIs();
    }
  };

  const startEdit = (probe: ProbeAPI) => {
    setFormData({
      name: probe.name,
      api_url: probe.api_url,
      api_key: probe.api_key || '',
      probe_type: probe.probe_type,
    });
    setEditingId(probe.id);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ name: '', api_url: '', api_key: '', probe_type: 'soil_moisture' });
  };

  if (!user) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-200">
        <div className="text-center">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-700 mb-3">Probe API Management</h3>
          <p className="text-gray-600">Sign in to manage your soil and environmental probe APIs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-green-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-green-700" />
          <h3 className="text-2xl font-bold text-green-900">Probe API Management</h3>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Probe API</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-green-50 rounded-xl border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-green-900">
              {editingId ? 'Edit Probe API' : 'Add New Probe API'}
            </h4>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Probe Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., North Field Soil Probe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Probe Type
              </label>
              <select
                value={formData.probe_type}
                onChange={(e) => setFormData({ ...formData, probe_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="soil_moisture">Soil Moisture</option>
                <option value="temperature">Temperature</option>
                <option value="humidity">Humidity</option>
                <option value="ph_level">pH Level</option>
                <option value="nutrient">Nutrient Sensor</option>
                <option value="weather_station">Weather Station</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                API URL
              </label>
              <input
                type="url"
                value={formData.api_url}
                onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://api.example.com/probe/data"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                API Key (Optional)
              </label>
              <input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter API key if required"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="flex items-center gap-2 bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{editingId ? 'Update' : 'Add'} Probe API</span>
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading probe APIs...</p>
        </div>
      ) : probeAPIs.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No probe APIs configured yet</p>
          <p className="text-sm text-gray-500 mt-2">Add your first probe API to start monitoring</p>
        </div>
      ) : (
        <div className="space-y-4">
          {probeAPIs.map((probe) => (
            <div
              key={probe.id}
              className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-5 border border-green-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-5 h-5 text-green-700" />
                    <h4 className="text-lg font-bold text-gray-800">{probe.name}</h4>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-semibold">
                      {probe.probe_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    <strong>API URL:</strong> {probe.api_url}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Created:</strong> {new Date(probe.created_at).toLocaleDateString('en-AU')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(probe)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(probe.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> Connect your soil probes, weather stations, and environmental sensors to integrate real-time field data with FarmCast weather predictions.
        </p>
      </div>
    </div>
  );
}
