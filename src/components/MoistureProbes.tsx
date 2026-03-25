import React, { useState, useEffect } from 'react';
import { Droplets, Thermometer, Battery, Plus, Trash2, Power, PowerOff, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MoistureProbe {
  id: string;
  name: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  depth_cm: number;
  soil_type: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface MoistureReading {
  id: string;
  probe_id: string;
  moisture_percentage: number;
  temperature_c: number | null;
  battery_percentage: number | null;
  reading_timestamp: string;
  created_at: string;
}

interface ProbeWithLatestReading extends MoistureProbe {
  latestReading?: MoistureReading;
  trend?: 'up' | 'down' | 'stable';
}

export default function MoistureProbes() {
  const [probes, setProbes] = useState<ProbeWithLatestReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProbe, setNewProbe] = useState({
    name: '',
    location_name: '',
    depth_cm: 15,
    soil_type: '',
  });

  useEffect(() => {
    fetchProbes();
    const interval = setInterval(fetchProbes, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchProbes = async () => {
    try {
      const { data: probesData, error: probesError } = await supabase
        .from('moisture_probes')
        .select('*')
        .order('created_at', { ascending: false });

      if (probesError) throw probesError;

      if (probesData) {
        const probesWithReadings = await Promise.all(
          probesData.map(async (probe) => {
            const { data: readings } = await supabase
              .from('moisture_readings')
              .select('*')
              .eq('probe_id', probe.id)
              .order('reading_timestamp', { ascending: false })
              .limit(2);

            let trend: 'up' | 'down' | 'stable' | undefined;
            if (readings && readings.length >= 2) {
              const diff = readings[0].moisture_percentage - readings[1].moisture_percentage;
              if (diff > 1) trend = 'up';
              else if (diff < -1) trend = 'down';
              else trend = 'stable';
            }

            return {
              ...probe,
              latestReading: readings?.[0],
              trend,
            };
          })
        );

        setProbes(probesWithReadings);
      }
    } catch (error) {
      console.error('Error fetching probes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProbe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('moisture_probes')
        .insert({
          user_id: user.id,
          name: newProbe.name,
          location_name: newProbe.location_name,
          depth_cm: newProbe.depth_cm,
          soil_type: newProbe.soil_type,
        });

      if (error) throw error;

      setNewProbe({ name: '', location_name: '', depth_cm: 15, soil_type: '' });
      setShowAddForm(false);
      fetchProbes();
    } catch (error) {
      console.error('Error adding probe:', error);
    }
  };

  const toggleProbeActive = async (probeId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('moisture_probes')
        .update({ active: !currentActive })
        .eq('id', probeId);

      if (error) throw error;
      fetchProbes();
    } catch (error) {
      console.error('Error toggling probe:', error);
    }
  };

  const deleteProbe = async (probeId: string) => {
    if (!confirm('Are you sure you want to delete this probe?')) return;

    try {
      const { error } = await supabase
        .from('moisture_probes')
        .delete()
        .eq('id', probeId);

      if (error) throw error;
      fetchProbes();
    } catch (error) {
      console.error('Error deleting probe:', error);
    }
  };

  const getMoistureColor = (percentage: number) => {
    if (percentage < 20) return 'text-red-600';
    if (percentage < 40) return 'text-orange-500';
    if (percentage < 60) return 'text-yellow-500';
    if (percentage < 80) return 'text-green-500';
    return 'text-blue-500';
  };

  const getMoistureLabel = (percentage: number) => {
    if (percentage < 20) return 'Very Dry';
    if (percentage < 40) return 'Dry';
    if (percentage < 60) return 'Moderate';
    if (percentage < 80) return 'Moist';
    return 'Wet';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Droplets className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Moisture Probes</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Probe
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={addProbe} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Probe Name</label>
              <input
                type="text"
                required
                value={newProbe.name}
                onChange={(e) => setNewProbe({ ...newProbe, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., North Field Probe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                required
                value={newProbe.location_name}
                onChange={(e) => setNewProbe({ ...newProbe, location_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., North Field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Depth (cm)</label>
              <input
                type="number"
                required
                min="1"
                max="200"
                value={newProbe.depth_cm}
                onChange={(e) => setNewProbe({ ...newProbe, depth_cm: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type (Optional)</label>
              <input
                type="text"
                value={newProbe.soil_type}
                onChange={(e) => setNewProbe({ ...newProbe, soil_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Clay loam"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Probe
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {probes.length === 0 ? (
        <div className="text-center py-12">
          <Droplets className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No moisture probes registered</p>
          <p className="text-gray-400 text-sm mt-2">Add a probe to start tracking soil moisture levels</p>
        </div>
      ) : (
        <div className="space-y-4">
          {probes.map((probe) => (
            <div
              key={probe.id}
              className={`border rounded-lg p-4 transition-all ${
                probe.active ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{probe.name}</h3>
                  <p className="text-sm text-gray-600">{probe.location_name} • {probe.depth_cm}cm depth</p>
                  {probe.soil_type && <p className="text-xs text-gray-500 mt-1">{probe.soil_type}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleProbeActive(probe.id, probe.active)}
                    className={`p-2 rounded-lg transition-colors ${
                      probe.active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    title={probe.active ? 'Deactivate probe' : 'Activate probe'}
                  >
                    {probe.active ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => deleteProbe(probe.id)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete probe"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {probe.latestReading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-blue-50 ${getMoistureColor(probe.latestReading.moisture_percentage)}`}>
                      <Droplets className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">
                        {probe.latestReading.moisture_percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        {getMoistureLabel(probe.latestReading.moisture_percentage)}
                        {probe.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                        {probe.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                      </p>
                    </div>
                  </div>

                  {probe.latestReading.temperature_c !== null && (
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                        <Thermometer className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">
                          {probe.latestReading.temperature_c.toFixed(1)}°C
                        </p>
                        <p className="text-xs text-gray-500">Soil Temp</p>
                      </div>
                    </div>
                  )}

                  {probe.latestReading.battery_percentage !== null && (
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${
                        probe.latestReading.battery_percentage > 20
                          ? 'bg-green-50 text-green-600'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        <Battery className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">
                          {probe.latestReading.battery_percentage.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500">Battery</p>
                      </div>
                    </div>
                  )}

                  <div className="col-span-2 md:col-span-1 flex items-center">
                    <div>
                      <p className="text-sm text-gray-600">Last Reading</p>
                      <p className="text-xs text-gray-500">
                        {new Date(probe.latestReading.reading_timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No readings yet</p>
                  <p className="text-xs text-gray-400 mt-1">Probe ID: {probe.id}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">API Endpoint</h3>
        <p className="text-sm text-blue-800 mb-2">
          Send readings to: <code className="bg-blue-100 px-2 py-1 rounded">POST {import.meta.env.VITE_SUPABASE_URL}/functions/v1/moisture-probe/reading</code>
        </p>
        <details className="text-sm text-blue-700">
          <summary className="cursor-pointer font-medium">View Example</summary>
          <pre className="mt-2 p-3 bg-blue-100 rounded overflow-x-auto text-xs">
{`{
  "probe_id": "uuid-here",
  "moisture_percentage": 45.5,
  "temperature_c": 18.2,
  "battery_percentage": 85.0,
  "reading_timestamp": "2024-03-25T10:30:00Z"
}`}
          </pre>
        </details>
      </div>
    </div>
  );
}
