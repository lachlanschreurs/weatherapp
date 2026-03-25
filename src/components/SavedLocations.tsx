import { MapPin, Plus, Trash2, Star, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SavedLocation } from '../types/premium';
import { supabase } from '../lib/supabase';

interface SavedLocationsProps {
  currentUserId: string | null;
  isPremium: boolean;
  onLocationSelect: (lat: number, lon: number, name: string) => void;
}

export function SavedLocations({
  currentUserId,
  isPremium,
  onLocationSelect,
}: SavedLocationsProps) {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');

  useEffect(() => {
    if (isPremium && currentUserId) {
      fetchLocations();
    }
  }, [isPremium, currentUserId]);

  const fetchLocations = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', currentUserId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const setPrimary = async (id: string) => {
    try {
      await supabase
        .from('saved_locations')
        .update({ is_primary: false })
        .eq('user_id', currentUserId);

      const { error } = await supabase
        .from('saved_locations')
        .update({ is_primary: true })
        .eq('id', id);

      if (error) throw error;
      await fetchLocations();
    } catch (error) {
      console.error('Error setting primary location:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-800">Saved Locations</h2>
        </div>
        <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
          PREMIUM
        </span>
      </div>

      {!isPremium ? (
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-2">Save multiple locations</p>
          <p className="text-sm text-gray-600 mb-4">
            Track weather for all your fields and properties
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all">
            Upgrade to Premium
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((location) => (
            <div
              key={location.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-all"
            >
              <button
                onClick={() =>
                  onLocationSelect(location.latitude, location.longitude, location.name)
                }
                className="flex items-center gap-3 flex-1"
              >
                {location.is_primary && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                <span className="font-medium text-gray-800">{location.name}</span>
                <span className="text-xs text-gray-500">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </span>
              </button>
              <div className="flex items-center gap-2">
                {!location.is_primary && (
                  <button
                    onClick={() => setPrimary(location.id)}
                    className="p-1 hover:bg-yellow-100 rounded transition-all"
                    title="Set as primary"
                  >
                    <Star className="w-4 h-4 text-gray-400" />
                  </button>
                )}
                <button
                  onClick={() => deleteLocation(location.id)}
                  className="p-1 hover:bg-red-100 rounded transition-all"
                  title="Delete location"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}

          {locations.length < 10 && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-gray-600 hover:text-green-600"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Add Location</span>
            </button>
          )}

          {locations.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-4">
              No saved locations yet. Add one to get started!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
