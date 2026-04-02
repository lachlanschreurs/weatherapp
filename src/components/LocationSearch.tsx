import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, Star, Trash2, Navigation } from 'lucide-react';
import { getSavedLocations, saveLocation, setFavoriteLocation, deleteSavedLocation, SavedLocation } from '../utils/savedLocations';
import { getUserLocation } from '../utils/geolocation';

export interface Location {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: Location, fromCurrentLocation?: boolean) => void;
  currentLocation: string;
  userId?: string;
  isUsingCurrentLocation?: boolean;
}

export function LocationSearch({ onLocationSelect, currentLocation, userId, isUsingCurrentLocation = false }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const favoriteLocation = savedLocations.find(loc => loc.is_favorite);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (userId) {
      loadSavedLocations();
    }
  }, [userId]);

  const loadSavedLocations = async () => {
    if (!userId) return;
    const locations = await getSavedLocations(userId);
    setSavedLocations(locations);
  };

  const searchLocation = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const apiKey = '205a644e0f57ecf98260a957076e46db';
      const apiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchQuery)}&limit=5&appid=${apiKey}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error('Failed to search locations');
      }

      const data = await response.json();
      const locations = data.map((item: any) => ({
        name: item.name,
        lat: item.lat,
        lon: item.lon,
        country: item.country,
        state: item.state,
      }));

      setResults(locations);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching location:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    searchLocation(value);
  };

  const handleSelectLocation = async (location: Location) => {
    onLocationSelect(location, false);
    setQuery('');
    setResults([]);
    setShowResults(false);
    setIsExpanded(false);

    if (userId) {
      const exists = savedLocations.find(
        loc => loc.latitude === location.lat && loc.longitude === location.lon
      );
      if (!exists) {
        await saveLocation(userId, location);
        await loadSavedLocations();
      }
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getUserLocation();
      onLocationSelect(location, true);
      setQuery('');
      setResults([]);
      setShowResults(false);
      setIsExpanded(false);
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Could not get your current location. Please check your browser permissions.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSetFavorite = async (locationId: string) => {
    if (!userId) return;
    const success = await setFavoriteLocation(userId, locationId);
    if (success) {
      await loadSavedLocations();
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!userId) return;
    const success = await deleteSavedLocation(userId, locationId);
    if (success) {
      await loadSavedLocations();
    }
  };

  const handleSelectSavedLocation = (saved: SavedLocation) => {
    const location: Location = {
      name: saved.name,
      lat: saved.latitude,
      lon: saved.longitude,
      country: saved.country,
      state: saved.state || undefined,
    };
    onLocationSelect(location, false);
    setIsExpanded(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-4 py-3 border-2 border-green-300 rounded-lg bg-white shadow-sm hover:border-green-500 transition-colors flex items-center gap-3 text-left"
        >
          {isUsingCurrentLocation ? (
            <Navigation className="w-5 h-5 text-blue-600" />
          ) : favoriteLocation ? (
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
          ) : (
            <MapPin className="w-5 h-5 text-green-600" />
          )}
          <div className="flex-1">
            <div className="text-sm text-gray-500 mb-0.5">
              {isUsingCurrentLocation ? 'Current Location' : favoriteLocation ? 'Favorite Location' : 'Selected Location'}
            </div>
            <div className="font-semibold text-gray-800">{currentLocation}</div>
          </div>
          <Search className="w-5 h-5 text-gray-400" />
        </button>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => {
                if (results.length > 0) {
                  setShowResults(true);
                } else if (savedLocations.length > 0) {
                  setShowResults(true);
                }
              }}
              placeholder="Search for a location..."
              className="w-full pl-10 pr-10 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-500 bg-white shadow-sm"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-600 animate-spin" />
            )}
          </div>

          {showResults && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-green-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
              {!query && (
                <>
                  <button
                    onClick={handleUseCurrentLocation}
                    disabled={isLoadingLocation}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-green-100 flex items-center gap-3"
                  >
                    {isLoadingLocation ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                    ) : (
                      <Navigation className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-blue-600">
                        {isLoadingLocation ? 'Getting your location...' : 'Use Current Location'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Automatically detect your position
                      </div>
                    </div>
                  </button>

                  {userId && savedLocations.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 border-b border-green-100">
                        <div className="text-xs font-semibold text-gray-600 uppercase">Saved Locations</div>
                      </div>
                      {savedLocations.map((saved) => (
                        <div
                          key={saved.id}
                          className="w-full px-4 py-3 hover:bg-green-50 transition-colors border-b border-green-100 last:border-0 flex items-center gap-3"
                        >
                          <button
                            onClick={() => handleSelectSavedLocation(saved)}
                            className="flex-1 flex items-center gap-3 text-left"
                          >
                            <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">
                                {saved.name}
                                {saved.state && `, ${saved.state}`}
                              </div>
                              <div className="text-sm text-gray-600">
                                {saved.country}
                              </div>
                            </div>
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSetFavorite(saved.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                saved.is_favorite
                                  ? 'text-yellow-500 hover:text-yellow-600'
                                  : 'text-gray-400 hover:text-yellow-500'
                              }`}
                              title={saved.is_favorite ? 'Remove from favorites' : 'Set as favorite'}
                            >
                              <Star className={`w-4 h-4 ${saved.is_favorite ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(saved.id)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete location"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}

              {query && results.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-gray-50 border-b border-green-100">
                    <div className="text-xs font-semibold text-gray-600 uppercase">Search Results</div>
                  </div>
                  {results.map((location, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectLocation(location)}
                      className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors border-b border-green-100 last:border-0 flex items-center gap-3"
                    >
                      <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-800">
                          {location.name}
                          {location.state && `, ${location.state}`}
                        </div>
                        <div className="text-sm text-gray-600">
                          {location.country}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {query && query.length >= 2 && results.length === 0 && !isSearching && (
                <div className="px-4 py-4 text-center text-gray-600">
                  No locations found
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
