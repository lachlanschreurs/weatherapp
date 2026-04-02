import { useState, useEffect, useRef, useMemo } from 'react';
import { CloudRain, Minimize2, Maximize2, RefreshCw, Clock } from 'lucide-react';

interface RainRadarProps {
  lat: number;
  lon: number;
  locationName: string;
}

interface RadarFrame {
  path: string;
  time: number;
}

export function RainRadar({ lat, lon, locationName }: RainRadarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [radarFrame, setRadarFrame] = useState<RadarFrame | null>(null);
  const [radarHost, setRadarHost] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [opacity, setOpacity] = useState(0.8);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      fetchRadarData();
      hasLoadedRef.current = true;
    }

    const refreshInterval = setInterval(() => {
      fetchRadarData();
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  async function fetchRadarData() {
    try {
      setIsLoading(true);
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.host || !data.radar) {
        throw new Error('Invalid API response');
      }

      setRadarHost(data.host);

      const pastFrames = data.radar.past || [];

      if (pastFrames.length > 0) {
        const latestFrame = pastFrames[pastFrames.length - 1];
        setRadarFrame({
          path: latestFrame.path,
          time: latestFrame.time
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch radar data:', error);
      setIsLoading(false);
    }
  }

  const manualRefresh = () => {
    fetchRadarData();
  };

  useEffect(() => {
    if (!showRadar || !radarFrame || !radarHost) return;

    const initMap = async () => {
      if (!(window as any).L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        await new Promise((resolve) => {
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      if (!mapRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }

      mapRef.current.innerHTML = '';

      const L = (window as any).L;
      const zoom = isExpanded ? 10 : 9;
      const map = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: zoom,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        dragging: true,
        maxZoom: 15,
        minZoom: 5
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 15,
        updateWhenIdle: false,
        updateWhenZooming: true,
        keepBuffer: 4
      }).addTo(map);

      L.marker([lat, lon], {
        icon: L.divIcon({
          className: 'location-marker',
          html: '<div style="background: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 3px #ef4444, 0 3px 8px rgba(0,0,0,0.4);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(map);

      L.circle([lat, lon], {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.1,
        radius: 5000,
        weight: 2,
        opacity: 0.3
      }).addTo(map);

      mapInstanceRef.current = map;

      const radarTileUrl = `${radarHost}${radarFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;

      tileLayerRef.current = L.tileLayer(radarTileUrl, {
        opacity: opacity,
        tileSize: 256,
        zIndex: 1000,
        maxZoom: 15,
        attribution: 'RainViewer',
        updateWhenIdle: false,
        updateWhenZooming: true,
        keepBuffer: 4,
        maxNativeZoom: 11
      }).addTo(map);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [showRadar, lat, lon, isExpanded, radarFrame, radarHost, opacity]);


  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diffMinutes = Math.round((timestamp - now) / 60);

    if (diffMinutes === 0) return 'Now';
    if (diffMinutes > 0) {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return hours > 0 ? `+${hours}h ${mins}m` : `+${diffMinutes}m`;
    }
    const hours = Math.floor(Math.abs(diffMinutes) / 60);
    const mins = Math.abs(diffMinutes) % 60;
    return hours > 0 ? `-${hours}h ${mins}m` : `-${Math.abs(diffMinutes)}m`;
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
            <CloudRain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Live Rain Radar</h3>
            <p className="text-sm text-cyan-100">{locationName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRadar(!showRadar)}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {showRadar ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            title={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {showRadar && (
        <>
          <div className={`relative bg-gray-100 ${isExpanded ? 'h-[calc(100vh-16rem)]' : 'h-96'}`}>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-600 font-medium">Loading radar data...</p>
                </div>
              </div>
            ) : !radarFrame ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <CloudRain className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No radar data available</p>
                  <button
                    onClick={manualRefresh}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div ref={mapRef} className="w-full h-full"></div>

                {radarFrame && (
                  <>
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-700" />
                        <span className="text-sm font-semibold text-gray-700">
                          {formatTime(radarFrame.time)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatRelativeTime(radarFrame.time)}
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 max-w-xs">
                      <div className="text-xs font-bold text-gray-800 mb-2.5">Rainfall Intensity</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="w-8 h-3 rounded" style={{ background: 'rgba(150, 220, 255, 0.85)' }}></div>
                          <span className="text-xs text-gray-700 font-medium flex-1">Light</span>
                          <span className="text-xs text-gray-500">0.5-2 mm/h</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="w-8 h-3 rounded" style={{ background: 'rgba(0, 150, 255, 0.85)' }}></div>
                          <span className="text-xs text-gray-700 font-medium flex-1">Moderate</span>
                          <span className="text-xs text-gray-500">2-10 mm/h</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="w-8 h-3 rounded" style={{ background: 'rgba(255, 200, 0, 0.85)' }}></div>
                          <span className="text-xs text-gray-700 font-medium flex-1">Heavy</span>
                          <span className="text-xs text-gray-500">10-50 mm/h</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="w-8 h-3 rounded" style={{ background: 'rgba(255, 100, 0, 0.85)' }}></div>
                          <span className="text-xs text-gray-700 font-medium flex-1">Intense</span>
                          <span className="text-xs text-gray-500">&gt;50 mm/h</span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Opacity</div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="w-24"
                      />
                      <div className="text-xs text-gray-500 mt-1 text-center">{Math.round(opacity * 100)}%</div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {!isLoading && radarFrame && (
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-3 border-t border-gray-200">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={manualRefresh}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  title="Refresh radar data"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm font-medium">Refresh Radar</span>
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Live radar data - Auto-refreshes every 5 minutes
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
