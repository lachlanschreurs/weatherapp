import { MapPin, Trash2, Star, Loader2, Clock, History } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Location } from './LocationSearch';

interface SavedLocationsProps {
  userId: string;
  onLocationSelect: (location: Location) => void;
  currentLocation: Location;
}

interface SavedLocationData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  is_primary: boolean;
  created_at: string;
  last_accessed_at: string;
}

export function SavedLocations({
  userId,
  onLocationSelect,
  currentLocation,
}: SavedLocationsProps) {
  const [locations, setLocations] = useState<SavedLocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchLocations();
    }
  }, [userId]);

  useEffect(() => {
    if (userId && currentLocation) {
      saveOrUpdateLocation();
    }
  }, [currentLocation, userId]);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveOrUpdateLocation = async () => {
    try {
      const { data: existing } = await supabase
        .from('saved_locations')
        .select('id')
        .eq('user_id', userId)
        .eq('latitude', currentLocation.lat)
        .eq('longitude', currentLocation.lon)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('saved_locations')
          .update({ last_accessed_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('saved_locations')
          .insert({
            user_id: userId,
            name: currentLocation.name,
            latitude: currentLocation.lat,
            longitude: currentLocation.lon,
            is_primary: false,
            last_accessed_at: new Date().toISOString(),
          });
      }

      fetchLocations();
    } catch (error) {
      console.error('Error saving location:', error);
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
        .eq('user_id', userId);

      const { error } = await supabase
        .from('saved_locations')
        .update({ is_primary: true })
        .eq('id', id);

      if (error) throw error;

      await supabase
        .from('profiles')
        .update({ default_location_id: id })
        .eq('id', userId);

      await fetchLocations();
    } catch (error) {
      console.error('Error setting primary location:', error);
    }
  };

  const handleLocationClick = (location: SavedLocationData) => {
    onLocationSelect({
      name: location.name,
      lat: location.latitude,
      lon: location.longitude,
      country: '',
      state: '',
    });
    setIsExpanded(false);
  };

  const formatLastAccessed = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 mb-4 w-full text-left hover:opacity-70 transition-opacity"
      >
        <History className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">Search History</h3>
        {locations.length > 0 && (
          <span className="text-sm text-gray-500">({locations.length})</span>
        )}
      </button>

      {isExpanded && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No location history yet</p>
              <p className="text-xs mt-1">Search for locations to build your history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <button
                    onClick={() => handleLocationClick(location)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    {location.is_primary && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 group-hover:text-green-700 truncate">
                        {location.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatLastAccessed(location.last_accessed_at)}</span>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!location.is_primary && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimary(location.id);
                        }}
                        className="p-2 hover:bg-yellow-100 rounded-lg transition-all"
                        title="Set as primary location"
                      >
                        <Star className="w-4 h-4 text-gray-400 hover:text-yellow-500" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLocation(location.id);
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-all"
                      title="Remove from history"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
