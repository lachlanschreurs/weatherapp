import { useState, useEffect, useRef } from 'react';
import { CloudRain, Minimize2, Maximize2, RefreshCw, Clock, Play, Pause } from 'lucide-react';

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
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [radarHost, setRadarHost] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [opacity, setOpacity] = useState(0.85);
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const radarLayersRef = useRef<any[]>([]);
  const animationIntervalRef = useRef<number | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      fetchRadarData();
      hasLoadedRef.current = true;
    }

    const refreshInterval = setInterval(() => {
      fetchRadarData();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(refreshInterval);
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
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

      const allFrames: RadarFrame[] = [];
      const pastFrames = data.radar.past || [];
      const nowcastFrames = data.radar.nowcast || [];

      pastFrames.forEach((frame: any) => {
        allFrames.push({ path: frame.path, time: frame.time });
      });

      nowcastFrames.forEach((frame: any) => {
        allFrames.push({ path: frame.path, time: frame.time });
      });

      setRadarFrames(allFrames);
      setCurrentFrameIndex(allFrames.length > 0 ? allFrames.length - 1 : 0);
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
    if (isAnimating && radarFrames.length > 0) {
      animationIntervalRef.current = window.setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % radarFrames.length);
      }, 500);
    } else if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    };
  }, [isAnimating, radarFrames.length]);

  useEffect(() => {
    if (!showRadar || radarFrames.length === 0 || !radarHost) return;

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
        radarLayersRef.current = [];
      }

      mapRef.current.innerHTML = '';

      const L = (window as any).L;
      const zoom = isExpanded ? 11 : 10;
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
        keyboard: true,
        maxZoom: 16,
        minZoom: 4
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      L.marker([lat, lon], {
        icon: L.divIcon({
          className: 'location-marker',
          html: '<div style="background: #0284c7; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.4), 0 4px 16px rgba(0,0,0,0.3);"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map);

      L.circle([lat, lon], {
        color: '#0284c7',
        fillColor: '#0284c7',
        fillOpacity: 0.08,
        radius: 15000,
        weight: 2,
        opacity: 0.5
      }).addTo(map);

      mapInstanceRef.current = map;

      radarFrames.forEach((frame) => {
        const radarTileUrl = `${radarHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
        const layer = L.tileLayer(radarTileUrl, {
          opacity: 0,
          tileSize: 256,
          zIndex: 1000,
          maxZoom: 16,
          minZoom: 4,
          attribution: 'RainViewer'
        });
        layer.addTo(map);
        radarLayersRef.current.push(layer);
      });
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        radarLayersRef.current = [];
      }
    };
  }, [showRadar, lat, lon, isExpanded, radarFrames, radarHost]);

  useEffect(() => {
    radarLayersRef.current.forEach((layer, index) => {
      if (layer && layer.setOpacity) {
        layer.setOpacity(index === currentFrameIndex ? opacity : 0);
      }
    });
  }, [currentFrameIndex, opacity]);


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

  const currentFrame = radarFrames[currentFrameIndex];
  const isPastFrame = currentFrame && currentFrame.time < Date.now() / 1000;
  const isFutureFrame = currentFrame && currentFrame.time > Date.now() / 1000;

  return (
    <div className={`bg-white rounded-xl shadow-2xl overflow-hidden ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-sky-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
            <CloudRain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Live Rain Radar</h3>
            <p className="text-sm text-sky-100">{locationName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRadar(!showRadar)}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium backdrop-blur-sm"
          >
            {showRadar ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors backdrop-blur-sm"
            title={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {showRadar && (
        <>
          <div className={`relative bg-gray-100 ${isExpanded ? 'h-[calc(100vh-18rem)]' : 'h-[500px]'}`}>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-3"></div>
                  <p className="text-gray-700 font-medium">Loading radar data...</p>
                </div>
              </div>
            ) : radarFrames.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <CloudRain className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium">No radar data available</p>
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

                {currentFrame && (
                  <>
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-sky-600" />
                        <span className="text-sm font-bold text-gray-900">
                          {formatTime(currentFrame.time)}
                        </span>
                        {isFutureFrame && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-300">
                            Forecast
                          </span>
                        )}
                        {isPastFrame && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold border border-gray-300">
                            Past
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {formatRelativeTime(currentFrame.time)}
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-gray-200 max-w-xs">
                      <div className="text-xs font-bold text-gray-900 mb-2.5">Rainfall Intensity Legend</div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-3 rounded shadow-sm" style={{ background: '#92dcff' }}></div>
                          <span className="text-xs text-gray-700 font-medium">Light (0.5-2 mm/h)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-3 rounded shadow-sm" style={{ background: '#0096ff' }}></div>
                          <span className="text-xs text-gray-700 font-medium">Moderate (2-10 mm/h)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-3 rounded shadow-sm" style={{ background: '#ffc800' }}></div>
                          <span className="text-xs text-gray-700 font-medium">Heavy (10-50 mm/h)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-3 rounded shadow-sm" style={{ background: '#ff6400' }}></div>
                          <span className="text-xs text-gray-700 font-medium">Intense (&gt;50 mm/h)</span>
                        </div>
                      </div>
                      <div className="mt-2.5 pt-2.5 border-t border-gray-200 text-xs text-gray-500">
                        {isPastFrame ? '📊 Historical data' : isFutureFrame ? '🔮 Forecast data' : '🔴 Live data'}
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-gray-200">
                      <div className="text-xs font-semibold text-gray-900 mb-2">Radar Opacity</div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="w-28 h-2 accent-sky-600 cursor-pointer"
                      />
                      <div className="text-xs text-gray-600 mt-1.5 text-center font-medium">{Math.round(opacity * 100)}%</div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {!isLoading && radarFrames.length > 0 && (
            <div className="bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-4 border-t border-gray-200">
              <div className="flex items-center justify-center gap-3 mb-3">
                <button
                  onClick={() => setIsAnimating(!isAnimating)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                  title={isAnimating ? 'Pause Animation' : 'Play Animation'}
                >
                  {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="text-sm">{isAnimating ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  onClick={manualRefresh}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-all shadow-md hover:shadow-lg border border-gray-300 font-medium"
                  title="Refresh radar data"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm">Refresh</span>
                </button>
              </div>
              <div className="mb-2.5">
                <input
                  type="range"
                  min="0"
                  max={radarFrames.length - 1}
                  value={currentFrameIndex}
                  onChange={(e) => {
                    setCurrentFrameIndex(parseInt(e.target.value));
                    setIsAnimating(false);
                  }}
                  className="w-full h-2 accent-sky-600 cursor-pointer"
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-700 font-medium">Frame {currentFrameIndex + 1} of {radarFrames.length}</span>
                <span className="text-gray-500">Drag map to pan • Scroll to zoom • Auto-refresh: 5 min</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
