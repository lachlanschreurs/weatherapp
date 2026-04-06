import { useState, useEffect, useRef } from 'react';
import { CloudRain, Minimize2, Maximize2, RefreshCw } from 'lucide-react';

interface RainRadarProps {
  lat: number;
  lon: number;
  locationName: string;
}

export function RainRadar({ lat, lon, locationName }: RainRadarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const hasLoadedRef = useRef(false);

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
      const zoom = isExpanded ? 8 : 7;
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

      // Add OpenStreetMap base layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      // Add X Weather radar layer (free tier)
      // Using OpenWeatherMap radar as a professional alternative
      const apiKey = import.meta.env.OPENWEATHER_API_KEY || '205a644e0f57ecf98260a957076e46db';

      L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
        attribution: '© OpenWeather',
        opacity: 0.7,
        maxZoom: 19,
        minZoom: 3
      }).addTo(map);

      // Add clouds layer for better context
      L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
        attribution: '© OpenWeather',
        opacity: 0.4,
        maxZoom: 19,
        minZoom: 3
      }).addTo(map);

      // Add location marker
      L.marker([lat, lon], {
        icon: L.divIcon({
          className: 'location-marker',
          html: '<div style="background: #0284c7; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.4), 0 4px 16px rgba(0,0,0,0.3);"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map);

      // Add radius circle
      L.circle([lat, lon], {
        color: '#0284c7',
        fillColor: '#0284c7',
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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showRadar, lat, lon, isExpanded]);

  const handleRefresh = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    setIsLoading(true);

    setTimeout(() => {
      if (!mapRef.current) return;

      const L = (window as any).L;
      const zoom = isExpanded ? 8 : 7;
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

      const apiKey = import.meta.env.OPENWEATHER_API_KEY || '205a644e0f57ecf98260a957076e46db';

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}&t=${Date.now()}`, {
        attribution: '© OpenWeather',
        opacity: 0.7,
        maxZoom: 19
      }).addTo(map);

      L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}&t=${Date.now()}`, {
        attribution: '© OpenWeather',
        opacity: 0.4,
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
        radius: 50000,
        weight: 2,
        opacity: 0.5
      }).addTo(map);

      mapInstanceRef.current = map;
      setIsLoading(false);
    }, 100);
  };

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
          <div className={`relative bg-gray-100 ${isExpanded ? 'h-[calc(100vh-12rem)]' : 'h-[500px]'}`}>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-3"></div>
                  <p className="text-gray-700 font-medium">Loading radar...</p>
                </div>
              </div>
            ) : null}

            <div ref={mapRef} className="w-full h-full"></div>

            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-gray-200 max-w-xs">
              <div className="text-xs font-bold text-gray-900 mb-2.5">Precipitation & Clouds</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-3 rounded shadow-sm" style={{ background: '#37C0FF' }}></div>
                  <span className="text-xs text-gray-700 font-medium">Light Rain</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-3 rounded shadow-sm" style={{ background: '#0F8FFF' }}></div>
                  <span className="text-xs text-gray-700 font-medium">Moderate Rain</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-3 rounded shadow-sm" style={{ background: '#0462D4' }}></div>
                  <span className="text-xs text-gray-700 font-medium">Heavy Rain</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-3 rounded shadow-sm border border-gray-300" style={{ background: 'rgba(255,255,255,0.6)' }}></div>
                  <span className="text-xs text-gray-700 font-medium">Cloud Cover</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-gray-200 text-xs text-gray-600 font-medium">
                Scroll to zoom • Drag to pan
              </div>
            </div>

            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-xl border border-gray-200">
              <div className="text-xs font-bold text-sky-700">Live Weather Radar</div>
              <div className="text-xs text-gray-600 mt-0.5">Real-time precipitation</div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                title="Refresh radar data"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">Refresh Radar</span>
              </button>
            </div>
            <div className="text-center text-xs text-gray-500 mt-3">
              Data updates continuously • Powered by OpenWeather
            </div>
          </div>
        </>
      )}
    </div>
  );
}
