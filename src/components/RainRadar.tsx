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
  const [radarFrames, setRadarFrames] = useState<string[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const radarLayersRef = useRef<any[]>([]);
  const animationIntervalRef = useRef<any>(null);

  const fetchRadarFrames = async () => {
    try {
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await response.json();

      const frames = data.radar.past.map((frame: any) =>
        `https://tilecache.rainviewer.com/v2/radar/${frame.path}/256/{z}/{x}/{y}/4/1_1.png`
      );

      setRadarFrames(frames);
      return frames;
    } catch (error) {
      console.error('Failed to fetch radar frames:', error);
      return [];
    }
  };

  useEffect(() => {
    if (!showRadar) return;

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
      const zoom = isExpanded ? 9 : 8;
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
        maxZoom: 18,
        minZoom: 3
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CartoDB',
        maxZoom: 19
      }).addTo(map);

      const frames = await fetchRadarFrames();

      if (frames.length > 0) {
        radarLayersRef.current = frames.map((frameUrl, index) => {
          const layer = L.tileLayer(frameUrl, {
            opacity: index === frames.length - 1 ? 0.8 : 0,
            maxZoom: 19,
            attribution: 'RainViewer'
          }).addTo(map);
          return layer;
        });
      }

      L.marker([lat, lon], {
        icon: L.divIcon({
          className: 'location-marker',
          html: '<div style="background: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.4), 0 2px 8px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(map);

      L.circle([lat, lon], {
        color: '#dc2626',
        fillColor: '#dc2626',
        fillOpacity: 0.08,
        radius: 50000,
        weight: 2,
        opacity: 0.5
      }).addTo(map);

      mapInstanceRef.current = map;
      setIsLoading(false);
    };

    initMap();

    return () => {
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
            layer.setOpacity(index === nextFrame ? 0.8 : 0);
          });

          return nextFrame;
        });
      }, 400);
    }
  };

  const handleRefresh = async () => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentFrame(0);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    setIsLoading(true);

    setTimeout(async () => {
      if (!mapRef.current) return;

      const L = (window as any).L;
      const zoom = isExpanded ? 9 : 8;
      const map = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        maxZoom: 18,
        minZoom: 3
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CartoDB',
        maxZoom: 19
      }).addTo(map);

      const frames = await fetchRadarFrames();

      if (frames.length > 0) {
        radarLayersRef.current = frames.map((frameUrl, index) => {
          const layer = L.tileLayer(frameUrl, {
            opacity: index === frames.length - 1 ? 0.8 : 0,
            maxZoom: 19,
            attribution: 'RainViewer'
          }).addTo(map);
          return layer;
        });
      }

      L.marker([lat, lon], {
        icon: L.divIcon({
          className: 'location-marker',
          html: '<div style="background: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.4), 0 2px 8px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(map);

      L.circle([lat, lon], {
        color: '#dc2626',
        fillColor: '#dc2626',
        fillOpacity: 0.08,
        radius: 50000,
        weight: 2,
        opacity: 0.5
      }).addTo(map);

      mapInstanceRef.current = map;
      setIsLoading(false);
    }, 100);
  };

  const getTimeAgo = () => {
    if (radarFrames.length === 0 || currentFrame >= radarFrames.length) return '';
    const minutesAgo = (radarFrames.length - 1 - currentFrame) * 10;
    if (minutesAgo === 0) return 'Now';
    return `${minutesAgo} min ago`;
  };

  return (
    <div className={`bg-white rounded-xl shadow-2xl overflow-hidden ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
            <CloudRain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Live Rain Radar</h3>
            <p className="text-sm text-blue-100">{locationName}</p>
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
          <div className={`relative bg-gray-900 ${isExpanded ? 'h-[calc(100vh-12rem)]' : 'h-[500px]'}`}>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-3"></div>
                  <p className="text-white font-medium">Loading radar...</p>
                </div>
              </div>
            ) : null}

            <div ref={mapRef} className="w-full h-full"></div>

            <div className="absolute bottom-4 left-4 bg-gray-900/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-gray-700 max-w-xs">
              <div className="text-xs font-bold text-white mb-2.5">Rain Intensity</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-3 rounded shadow-sm" style={{ background: 'rgba(0, 236, 236, 0.7)' }}></div>
                  <span className="text-xs text-gray-200 font-medium">Light</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-3 rounded shadow-sm" style={{ background: 'rgba(0, 153, 0, 0.7)' }}></div>
                  <span className="text-xs text-gray-200 font-medium">Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-3 rounded shadow-sm" style={{ background: 'rgba(255, 255, 0, 0.7)' }}></div>
                  <span className="text-xs text-gray-200 font-medium">Heavy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-3 rounded shadow-sm" style={{ background: 'rgba(255, 0, 0, 0.7)' }}></div>
                  <span className="text-xs text-gray-200 font-medium">Intense</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-gray-700 text-xs text-gray-300">
                <div className="font-medium">Scroll to zoom • Drag to pan</div>
              </div>
            </div>

            <div className="absolute top-4 left-4 bg-gray-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-xl border border-gray-700">
              <div className="text-xs font-bold text-blue-400">Global Rain Radar</div>
              <div className="text-xs text-gray-300 mt-0.5">{getTimeAgo()}</div>
              <div className="text-xs text-gray-400 mt-0.5">Powered by RainViewer</div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleAnimation}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                title={isPlaying ? 'Pause animation' : 'Play animation'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="text-sm">{isPlaying ? 'Pause' : 'Play'} Animation</span>
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                title="Refresh radar data"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
            <div className="text-center text-xs text-gray-500 mt-3">
              Real-time global precipitation data • Free & unlimited
            </div>
          </div>
        </>
      )}
    </div>
  );
}
