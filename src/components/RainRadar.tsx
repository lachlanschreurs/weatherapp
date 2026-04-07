import { useState, useEffect, useRef } from 'react';
import { CloudRain, Minimize2, Maximize2, RefreshCw, Play, Pause } from 'lucide-react';

interface RainRadarProps {
  lat: number;
  lon: number;
  locationName: string;
}

export function RainRadar({ lat, lon, locationName }: RainRadarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const radarLayersRef = useRef<any[]>([]);
  const framesRef = useRef<any[]>([]);
  const animationIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!showRadar) return;

    let mounted = true;

    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!(window as any).L) {
          console.log('Loading Leaflet...');
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);

          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
          console.log('Leaflet loaded');
        }

        if (!mounted || !mapRef.current) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        const L = (window as any).L;

        console.log('Creating map centered at:', lat, lon);
        const map = L.map(mapRef.current, {
          center: [lat, lon],
          zoom: 7,
          zoomControl: false,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19
        }).addTo(map);

        console.log('Fetching RainViewer data...');
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');

        if (!response.ok) {
          throw new Error(`RainViewer API returned ${response.status}`);
        }

        const data = await response.json();
        console.log('RainViewer response:', data);

        const frames = [...(data.radar?.past || []), ...(data.radar?.nowcast || [])];
        console.log('Total frames available:', frames.length);

        if (frames.length === 0) {
          throw new Error('No radar data available');
        }

        framesRef.current = frames;

        radarLayersRef.current = frames.map((frame: any, index: number) => {
          const url = `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
          console.log(`Frame ${index} URL:`, url);

          const layer = L.tileLayer(url, {
            opacity: index === frames.length - 1 ? 0.6 : 0,
            zIndex: 200,
            attribution: 'RainViewer'
          });

          layer.addTo(map);
          return layer;
        });

        setCurrentFrame(frames.length - 1);
        console.log('Radar layers added:', radarLayersRef.current.length);

        L.marker([lat, lon], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(map);

        L.control.zoom({ position: 'topright' }).addTo(map);

        mapInstanceRef.current = map;
        setIsLoading(false);
        console.log('Map initialization complete');

      } catch (err) {
        console.error('Map initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load radar');
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showRadar, lat, lon, isExpanded]);

  const toggleAnimation = () => {
    if (isPlaying) {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      animationIntervalRef.current = setInterval(() => {
        setCurrentFrame(prev => {
          const nextFrame = (prev + 1) % radarLayersRef.current.length;

          radarLayersRef.current.forEach((layer, index) => {
            if (layer && layer.setOpacity) {
              layer.setOpacity(index === nextFrame ? 0.6 : 0);
            }
          });

          return nextFrame;
        });
      }, 500);
    }
  };

  const handleRefresh = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    radarLayersRef.current = [];
    framesRef.current = [];
    setCurrentFrame(0);
    setIsPlaying(false);
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }
  };

  const getFrameTime = () => {
    if (!framesRef.current[currentFrame]) return '';
    const time = new Date(framesRef.current[currentFrame].time * 1000);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - time.getTime()) / 60000);

    if (diffMins < 5) return 'Now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <div className={`bg-white rounded-xl shadow-2xl overflow-hidden ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CloudRain className="w-6 h-6 text-white" />
          <div>
            <h3 className="text-lg font-bold text-white">Live Rain Radar</h3>
            <p className="text-sm text-blue-100">{locationName}</p>
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
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {showRadar && (
        <>
          <div className={`relative ${isExpanded ? 'h-[calc(100vh-12rem)]' : 'h-[500px]'}`}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-[1000]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-700 font-semibold">Loading radar...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-[1000]">
                <div className="text-center bg-white p-6 rounded-lg shadow-lg max-w-md">
                  <CloudRain className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-red-600 font-semibold mb-2">Failed to load radar</p>
                  <p className="text-gray-600 text-sm mb-4">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            <div ref={mapRef} className="w-full h-full"></div>

            {!isLoading && !error && (
              <>
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-[500]">
                  <div className="text-xs font-semibold text-gray-600">Frame Time</div>
                  <div className="text-sm font-bold text-gray-900">{getFrameTime()}</div>
                  <div className="text-xs text-gray-500">
                    {currentFrame + 1} / {framesRef.current.length}
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[500]">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Intensity</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-3 rounded" style={{ background: '#5CE1E6' }}></div>
                      <span className="text-xs text-gray-600">Light</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-3 rounded" style={{ background: '#1CF51C' }}></div>
                      <span className="text-xs text-gray-600">Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-3 rounded" style={{ background: '#FFFF00' }}></div>
                      <span className="text-xs text-gray-600">Heavy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-3 rounded" style={{ background: '#FF8C00' }}></div>
                      <span className="text-xs text-gray-600">Very Heavy</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {!error && (
            <div className="bg-gray-50 px-4 py-3 border-t">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={toggleAnimation}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
