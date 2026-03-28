import { useState, useEffect, useRef } from 'react';
import { CloudRain, Minimize2, Maximize2, Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';

interface RainRadarProps {
  lat: number;
  lon: number;
  locationName: string;
}

interface RadarFrame {
  path: string;
  time: number;
  isForecast?: boolean;
}

export function RainRadar({ lat, lon, locationName }: RainRadarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [radarHost, setRadarHost] = useState<string>('');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [opacity, setOpacity] = useState(0.6);
  const mapRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    fetchRadarData();
    const interval = setInterval(fetchRadarData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (radarFrames.length > 0 && isPlaying) {
      animationRef.current = window.setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % radarFrames.length);
      }, 500);
    }
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [radarFrames.length, isPlaying]);

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

      const pastFrames = (data.radar.past || []).map((f: any) => ({
        path: f.path,
        time: f.time,
        isForecast: false
      }));

      const forecastFrames = (data.radar.nowcast || []).map((f: any) => ({
        path: f.path,
        time: f.time,
        isForecast: true
      }));

      const allFrames = [...pastFrames, ...forecastFrames];

      if (allFrames.length === 0) {
        throw new Error('No radar frames available');
      }

      setRadarFrames(allFrames);
      setCurrentFrame(Math.max(0, pastFrames.length - 1));
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch radar data:', error);
      setIsLoading(false);
    }
  }

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
      }

      mapRef.current.innerHTML = '';

      const L = (window as any).L;
      const zoom = isExpanded ? 11 : 10;
      const map = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: zoom,
        zoomControl: true,
        attributionControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      const radarLayer = L.layerGroup().addTo(map);

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

      mapInstanceRef.current = {
        map,
        radarLayer
      };
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showRadar, lat, lon, isExpanded, radarHost, radarFrames.length]);

  useEffect(() => {
    if (!mapInstanceRef.current || radarFrames.length === 0 || !radarHost) return;

    const { radarLayer } = mapInstanceRef.current;
    const L = (window as any).L;

    radarLayer.clearLayers();

    const frame = radarFrames[currentFrame];
    if (!frame) return;

    const tileUrl = `${radarHost}${frame.path}/256/{z}/{x}/{y}/6/1_1.png`;

    L.tileLayer(tileUrl, {
      opacity: opacity,
      tileSize: 256,
      zIndex: 1000
    }).addTo(radarLayer);
  }, [currentFrame, radarFrames, radarHost, opacity]);

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

  const currentFrameData = radarFrames[currentFrame];

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
            ) : radarFrames.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <CloudRain className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No radar data available</p>
                  <button
                    onClick={fetchRadarData}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div ref={mapRef} className="w-full h-full"></div>

                {currentFrameData && (
                  <>
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-700" />
                        <span className="text-sm font-semibold text-gray-700">
                          {formatTime(currentFrameData.time)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatRelativeTime(currentFrameData.time)}
                      </div>
                      {currentFrameData.isForecast && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium mt-2">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                          Forecast
                        </div>
                      )}
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

          {!isLoading && radarFrames.length > 0 && (
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentFrame(0)}
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                    title="First frame"
                  >
                    <SkipBack className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setCurrentFrame(radarFrames.length - 1)}
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                    title="Last frame"
                  >
                    <SkipForward className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <div className="flex-1 max-w-2xl">
                  <input
                    type="range"
                    min="0"
                    max={radarFrames.length - 1}
                    value={currentFrame}
                    onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1 px-1">
                    <span className="text-xs text-gray-500">Past</span>
                    <span className="text-xs text-gray-600 font-medium">Now</span>
                    <span className="text-xs text-gray-500">Future</span>
                  </div>
                </div>

                <div className="text-xs font-medium text-gray-600 min-w-fit">
                  {currentFrame + 1} / {radarFrames.length}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Radar animation showing past and forecast precipitation
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
