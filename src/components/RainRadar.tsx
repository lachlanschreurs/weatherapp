import { useState, useEffect, useRef } from 'react';
import { CloudRain, Minimize2, Maximize2 } from 'lucide-react';

interface RainRadarProps {
  lat: number;
  lon: number;
  locationName: string;
}

export function RainRadar({ lat, lon, locationName }: RainRadarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [radarFrames, setRadarFrames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRadarData();
    const interval = setInterval(fetchRadarData, 10 * 60 * 1000); // Refresh every 10 minutes
    return () => clearInterval(interval);
  }, []);


  async function fetchRadarData() {
    try {
      setIsLoading(true);
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await response.json();

      if (data.radar && data.radar.past && data.radar.past.length > 0) {
        const latestFrame = data.radar.past[data.radar.past.length - 1];
        const frameUrl = `https://tilecache.rainviewer.com${latestFrame.path}/256/{z}/{x}/{y}/4/1_1.png`;
        setRadarFrames([frameUrl]);
      }
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

      if (mapRef.current && (window as any).L) {
        mapRef.current.innerHTML = '';
        const L = (window as any).L;

        const zoom = isExpanded ? 8 : 7;
        const map = L.map(mapRef.current).setView([lat, lon], zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        const radarLayer = L.tileLayer(radarFrames[0], {
          opacity: 0.6,
          zIndex: 1000,
        }).addTo(map);

        L.marker([lat, lon]).addTo(map);

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
  }, [showRadar, lat, lon, isExpanded, radarFrames.length]);

  useEffect(() => {
    if (mapRef.current && (mapRef.current as any)._radarLayer && radarFrames[0]) {
      (mapRef.current as any)._radarLayer.setUrl(radarFrames[0]);
    }
  }, [radarFrames]);

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 border-blue-300 ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
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
            title={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {showRadar && (
        <div className={`relative bg-gray-100 ${isExpanded ? 'h-[calc(100vh-8rem)]' : 'h-96'}`}>
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

          {!isLoading && radarFrames.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="text-xs font-semibold text-gray-700 mb-2">Radar Legend</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-blue-300"></div>
                  <span className="text-xs text-gray-600">Light</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-yellow-400"></div>
                  <span className="text-xs text-gray-600">Moderate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                  <span className="text-xs text-gray-600">Heavy</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showRadar && !isLoading && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            {radarFrames.length > 0
              ? 'Current precipitation radar. Updates every 10 minutes.'
              : 'Radar data temporarily unavailable'}
          </p>
        </div>
      )}
    </div>
  );
}
