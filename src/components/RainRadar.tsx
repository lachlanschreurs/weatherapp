import { useState, useEffect, useRef } from 'react';
import { CloudRain, Minimize2, Maximize2, RefreshCw, Play, Pause } from 'lucide-react';

interface RainRadarProps {
  lat: number;
  lon: number;
  locationName: string;
}

interface RadarFrame {
  time: number;
  path: string;
}

export function RainRadar({ lat, lon, locationName }: RainRadarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [timestamps, setTimestamps] = useState<Date[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const radarLayersRef = useRef<any[]>([]);
  const animationIntervalRef = useRef<any>(null);

  const fetchRadarFrames = async () => {
    try {
      console.log('Fetching RainViewer data...');
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await response.json();
      console.log('RainViewer API response:', data);

      const pastFrames = data.radar.past || [];
      const nowcastFrames = data.radar.nowcast || [];
      const allFrames = [...pastFrames, ...nowcastFrames];

      console.log('Total frames:', allFrames.length);

      const frames = allFrames.map((frame: any) => ({
        time: frame.time,
        path: frame.path
      }));

      const times = allFrames.map((frame: any) => new Date(frame.time * 1000));

      setRadarFrames(frames);
      setTimestamps(times);
      setCurrentFrame(frames.length - 1);

      console.log('Frames loaded:', frames.length);
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
      const zoom = isExpanded ? 7 : 6;
      const map = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: zoom,
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        dragging: true,
        keyboard: true,
        maxZoom: 14,
        minZoom: 2
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 19
      }).addTo(map);

      const frames = await fetchRadarFrames();

      if (frames.length > 0) {
        console.log('Adding radar layers to map...');
        radarLayersRef.current = frames.map((frame, index) => {
          const tileUrl = `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/4/1_1.png`;
          console.log('Layer URL:', tileUrl);

          const layer = L.tileLayer(tileUrl, {
            opacity: index === frames.length - 1 ? 0.9 : 0,
            maxZoom: 14,
            attribution: 'RainViewer',
            zIndex: 300,
            tileSize: 256
          });
          layer.addTo(map);
          return layer;
        });
        console.log('Radar layers added:', radarLayersRef.current.length);
      }

      L.marker([lat, lon], {
        icon: L.divIcon({
          className: 'location-marker',
          html: `<div style="background: #ef4444; width: 28px; height: 28px; border-radius: 50%; border: 5px solid white; box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.4), 0 4px 15px rgba(0,0,0,0.6); position: relative; z-index: 1000;"></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(map);

      const customZoomControl = L.control({ position: 'topright' });
      customZoomControl.onAdd = function() {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        div.innerHTML = `
          <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
            <a id="zoom-in-btn" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; cursor: pointer; border-bottom: 1px solid #ddd; color: #333; font-size: 22px; font-weight: bold; text-decoration: none; user-select: none;">+</a>
            <a id="zoom-out-btn" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; cursor: pointer; color: #333; font-size: 22px; font-weight: bold; text-decoration: none; user-select: none;">−</a>
          </div>
        `;
        return div;
      };
      customZoomControl.addTo(map);

      setTimeout(() => {
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        if (zoomInBtn) {
          zoomInBtn.onclick = (e) => {
            e.preventDefault();
            map.zoomIn();
          };
        }
        if (zoomOutBtn) {
          zoomOutBtn.onclick = (e) => {
            e.preventDefault();
            map.zoomOut();
          };
        }
      }, 100);

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
            if (layer && layer.setOpacity) {
              layer.setOpacity(index === nextFrame ? 0.9 : 0);
            }
          });

          return nextFrame;
        });
      }, 600);
    }
  };

  const handleRefresh = async () => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(true);

    radarLayersRef.current.forEach(layer => {
      if (layer && layer.remove) {
        layer.remove();
      }
    });
    radarLayersRef.current = [];

    const frames = await fetchRadarFrames();

    if (mapInstanceRef.current && frames.length > 0) {
      const L = (window as any).L;
      radarLayersRef.current = frames.map((frame, index) => {
        const tileUrl = `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/4/1_1.png`;
        const layer = L.tileLayer(tileUrl, {
          opacity: index === frames.length - 1 ? 0.9 : 0,
          maxZoom: 14,
          attribution: 'RainViewer',
          zIndex: 300,
          tileSize: 256
        });
        layer.addTo(mapInstanceRef.current);
        return layer;
      });
      setCurrentFrame(frames.length - 1);
    }

    setIsLoading(false);
  };

  const getTimeDisplay = () => {
    if (timestamps.length === 0 || currentFrame >= timestamps.length) return 'Loading...';
    const frameTime = timestamps[currentFrame];
    const now = new Date();
    const diffMs = now.getTime() - frameTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 5) return 'Now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;

    return frameTime.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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
          <div className={`relative bg-gray-900 ${isExpanded ? 'h-[calc(100vh-12rem)]' : 'h-[650px]'}`}>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-[1000]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-white font-bold text-lg">Loading Rain Radar...</p>
                  <p className="text-gray-400 text-sm mt-2">Fetching live precipitation data</p>
                </div>
              </div>
            ) : null}

            <div ref={mapRef} className="w-full h-full"></div>

            <div className="absolute bottom-4 left-4 bg-gray-900/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border-2 border-gray-700 z-[500]">
              <div className="text-sm font-bold text-white mb-3">Precipitation Intensity</div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-6 rounded shadow-md border border-gray-600" style={{ background: 'linear-gradient(to right, rgba(92, 225, 230, 0.9), rgba(92, 225, 230, 0.9))' }}></div>
                  <span className="text-xs text-gray-200 font-medium">Light Rain</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-6 rounded shadow-md border border-gray-600" style={{ background: 'linear-gradient(to right, rgba(28, 245, 28, 0.9), rgba(28, 245, 28, 0.9))' }}></div>
                  <span className="text-xs text-gray-200 font-medium">Moderate</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-6 rounded shadow-md border border-gray-600" style={{ background: 'linear-gradient(to right, rgba(255, 255, 0, 0.9), rgba(255, 255, 0, 0.9))' }}></div>
                  <span className="text-xs text-gray-200 font-medium">Heavy</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-6 rounded shadow-md border border-gray-600" style={{ background: 'linear-gradient(to right, rgba(255, 140, 0, 0.9), rgba(255, 140, 0, 0.9))' }}></div>
                  <span className="text-xs text-gray-200 font-medium">Very Heavy</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-6 rounded shadow-md border border-gray-600" style={{ background: 'linear-gradient(to right, rgba(255, 0, 0, 0.9), rgba(255, 0, 0, 0.9))' }}></div>
                  <span className="text-xs text-gray-200 font-medium">Extreme</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-700 space-y-1">
                <div className="text-xs text-gray-300 font-medium">Mouse wheel to zoom</div>
                <div className="text-xs text-gray-300 font-medium">Click and drag to pan</div>
              </div>
            </div>

            <div className="absolute top-4 left-4 bg-gray-900/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-2xl border-2 border-gray-700 z-[500]">
              <div className="text-xs font-bold text-cyan-400 mb-1">Live Precipitation</div>
              <div className="text-base text-white font-bold">{getTimeDisplay()}</div>
              <div className="text-xs text-gray-400 mt-1">
                Frame {currentFrame + 1} of {radarFrames.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">RainViewer Global Radar</div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={toggleAnimation}
                disabled={radarFrames.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md hover:shadow-lg font-semibold"
                title={isPlaying ? 'Pause animation' : 'Play animation'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{isPlaying ? 'Pause' : 'Play'} Animation</span>
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-semibold"
                title="Refresh radar data"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh Data</span>
              </button>
            </div>
            <div className="text-center text-xs text-gray-600 mt-3 font-medium">
              Real-time global precipitation data updated every 10 minutes
            </div>
          </div>
        </>
      )}
    </div>
  );
}
