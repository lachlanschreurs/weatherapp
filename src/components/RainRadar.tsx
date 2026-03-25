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

interface RainViewerResponse {
  host: string;
  radar: {
    past: RadarFrame[];
    nowcast: RadarFrame[];
  };
}

export function RainRadar({ lat, lon, locationName }: RainRadarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [radarHost, setRadarHost] = useState<string>('');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [opacity, setOpacity] = useState(0.7);
  const mapRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    fetchRadarData();
    const interval = setInterval(() => {
      fetchRadarData();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lat, lon]);

  useEffect(() => {
    if (radarFrames.length > 0 && isPlaying) {
      animationRef.current = window.setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % radarFrames.length);
      }, 400);
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
      const data: RainViewerResponse = await response.json();

      setRadarHost(data.host);
      const allFrames = [
        ...data.radar.past.map(f => ({ ...f, isForecast: false })),
        ...data.radar.nowcast.map(f => ({ ...f, isForecast: true }))
      ];
      setRadarFrames(allFrames);
      setCurrentFrame(data.radar.past.length - 1);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch radar data:', error);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!showRadar || radarFrames.length === 0 || !mapRef.current) return;

    const loadLeaflet = async () => {
      if (!(window as any).L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        document.head.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      if (mapRef.current && (window as any).L && radarHost && radarFrames.length > 0) {
        mapRef.current.innerHTML = '';
        const L = (window as any).L;

        const zoom = isExpanded ? 10 : 9;
        const map = L.map(mapRef.current).setView([lat, lon], zoom);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© Esri',
          maxZoom: 19,
        }).addTo(map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
          attribution: '© CartoDB',
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(map);

        const currentFrameData = radarFrames[currentFrame];
        const radarTileUrl = `${radarHost}${currentFrameData.path}/256/{z}/{x}/{y}/2/1_1.png`;

        const radarLayer = L.tileLayer(radarTileUrl, {
          opacity: opacity,
          attribution: '© RainViewer',
          tileSize: 256,
          zIndex: 10
        }).addTo(map);

        L.marker([lat, lon], {
          icon: L.divIcon({
            className: 'location-marker',
            html: '<div style="background: #60a5fa; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          }),
          title: locationName
        }).addTo(map);

        (mapRef.current as any)._leafletMap = map;
        (mapRef.current as any)._radarLayer = radarLayer;
      }
    };

    loadLeaflet();

    return () => {
      if (mapRef.current && (mapRef.current as any)._leafletMap) {
        (mapRef.current as any)._leafletMap.remove();
      }
    };
  }, [showRadar, lat, lon, isExpanded, radarFrames.length, radarHost]);

  useEffect(() => {
    if (mapRef.current && (mapRef.current as any)._radarLayer && radarFrames[currentFrame] && radarHost) {
      const map = (mapRef.current as any)._leafletMap;
      const oldLayer = (mapRef.current as any)._radarLayer;

      oldLayer.remove();

      const currentFrameData = radarFrames[currentFrame];
      const radarTileUrl = `${radarHost}${currentFrameData.path}/256/{z}/{x}/{y}/2/1_1.png`;

      const L = (window as any).L;
      const newLayer = L.tileLayer(radarTileUrl, {
        opacity: opacity,
        attribution: '© RainViewer',
        tileSize: 256,
        zIndex: 10
      }).addTo(map);

      (mapRef.current as any)._radarLayer = newLayer;
    }
  }, [currentFrame, radarFrames, radarHost]);

  useEffect(() => {
    if (mapRef.current && (mapRef.current as any)._radarLayer) {
      (mapRef.current as any)._radarLayer.setOpacity(opacity);
    }
  }, [opacity]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diffMinutes = Math.round((timestamp - now) / 60);

    if (diffMinutes === 0) {
      return 'Now';
    } else if (diffMinutes > 0) {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      if (hours > 0) {
        return `+${hours}h ${mins}m`;
      }
      return `+${diffMinutes}m`;
    } else {
      const hours = Math.floor(Math.abs(diffMinutes) / 60);
      const mins = Math.abs(diffMinutes) % 60;
      if (hours > 0) {
        return `-${hours}h ${mins}m`;
      }
      return `-${Math.abs(diffMinutes)}m`;
    }
  };

  const getCurrentFrameInfo = () => {
    if (radarFrames.length === 0 || !radarFrames[currentFrame]) return null;
    const frame = radarFrames[currentFrame];
    return {
      time: formatTime(frame.time),
      isForecast: frame.isForecast || false
    };
  };

  const frameInfo = getCurrentFrameInfo();

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
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-600">Loading radar data...</p>
                </div>
              </div>
            ) : radarFrames.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-600">No radar data available</p>
              </div>
            ) : (
              <div ref={mapRef} className="w-full h-full"></div>
            )}

            {!isLoading && radarFrames.length > 0 && frameInfo && (
              <>
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-gray-700" />
                    <span className="text-sm font-semibold text-gray-700">
                      {frameInfo.time}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatRelativeTime(radarFrames[currentFrame].time)}
                  </div>
                  {frameInfo.isForecast && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium mt-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                      Forecast
                    </div>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Precipitation Intensity</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-2.5 rounded bg-gradient-to-r from-blue-300 to-blue-400"></div>
                      <span className="text-xs text-gray-600">Light Rain</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-2.5 rounded bg-gradient-to-r from-green-400 to-yellow-400"></div>
                      <span className="text-xs text-gray-600">Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-2.5 rounded bg-gradient-to-r from-orange-400 to-red-500"></div>
                      <span className="text-xs text-gray-600">Heavy</span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Radar Opacity</div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-24"
                  />
                </div>
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
                    <span className="text-xs text-gray-500">-2h</span>
                    <span className="text-xs text-gray-600 font-medium">Now</span>
                    <span className="text-xs text-gray-500">+30m</span>
                  </div>
                </div>

                <div className="text-xs font-medium text-gray-600 min-w-fit">
                  Frame {currentFrame + 1} / {radarFrames.length}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Past 2 hours + 30 min forecast (10 min intervals)
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
