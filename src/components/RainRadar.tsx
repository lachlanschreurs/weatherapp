import { useState } from 'react';
import { CloudRain, Minimize2, Maximize2 } from 'lucide-react';

interface RainRadarProps {
  lat: number;
  lon: number;
  locationName: string;
}

export function RainRadar({ lat, lon, locationName }: RainRadarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRadar, setShowRadar] = useState(true);

  const rainviewerUrl = `https://tilecache.rainviewer.com/v2/coverage/${Date.now()}/256/{z}/{x}/{y}/2/1_1.png`;

  const zoom = isExpanded ? 8 : 7;

  const leafletUrl = `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`;
  const leafletCss = `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`;

  const mapContainerId = `rain-radar-map-${Math.random().toString(36).substr(2, 9)}`;

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
          <iframe
            src={`https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=650&height=450&zoom=${zoom}&level=surface&overlay=radar&product=radar&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
            className="w-full h-full border-0"
            title="Rain Radar"
          />

          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="text-xs font-semibold text-gray-700 mb-2">Radar Legend</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#00ff00' }}></div>
                <span className="text-xs text-gray-600">Light</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ffff00' }}></div>
                <span className="text-xs text-gray-600">Moderate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ff0000' }}></div>
                <span className="text-xs text-gray-600">Heavy</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRadar && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            Live radar data updates automatically. Showing precipitation within the last hour.
          </p>
        </div>
      )}
    </div>
  );
}
