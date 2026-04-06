import { useState, useEffect, useRef } from 'react';
import { CloudRain, Minimize2, Maximize2, RefreshCw, Play, Pause, AlertCircle } from 'lucide-react';

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
  const [radarLoadError, setRadarLoadError] = useState(false);
  const [radarCode, setRadarCode] = useState('');
  const [radarStation, setRadarStation] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const radarLayersRef = useRef<any[]>([]);
  const animationIntervalRef = useRef<any>(null);

  const getClosestRadarCode = (lat: number, lon: number): { code: string; name: string } => {
    const radars = [
      { code: '63', name: 'Adelaide', lat: -34.6177, lon: 138.4689 },
      { code: '01', name: 'Albany', lat: -34.9414, lon: 117.8161 },
      { code: '25', name: 'Alice Springs', lat: -23.7951, lon: 133.8886 },
      { code: '04', name: 'Bairnsdale', lat: -37.8871, lon: 147.5705 },
      { code: '70', name: 'Brisbane', lat: -27.7179, lon: 153.2401 },
      { code: '66', name: 'Cairns', lat: -17.0428, lon: 145.6631 },
      { code: '02', name: 'Canberra', lat: -35.6614, lon: 149.5121 },
      { code: '50', name: 'Carnarvon', lat: -24.8868, lon: 113.6711 },
      { code: '40', name: 'Darwin', lat: -12.4566, lon: 131.0443 },
      { code: '15', name: 'Esperance', lat: -33.8309, lon: 121.8917 },
      { code: '29', name: 'Geraldton', lat: -28.8049, lon: 114.6969 },
      { code: '39', name: 'Gove', lat: -12.2751, lon: 136.8194 },
      { code: '53', name: 'Grafton', lat: -29.6219, lon: 152.9517 },
      { code: '68', name: 'Gympie', lat: -26.2267, lon: 152.5771 },
      { code: '71', name: 'Hobart', lat: -42.8362, lon: 147.5050 },
      { code: '49', name: 'Katherine', lat: -14.5121, lon: 132.4470 },
      { code: '31', name: 'Kalgoorlie', lat: -30.7847, lon: 121.4537 },
      { code: '48', name: 'Learmonth', lat: -22.2356, lon: 114.0967 },
      { code: '30', name: 'Longreach', lat: -23.4397, lon: 144.2810 },
      { code: '69', name: 'Mackay', lat: -21.1175, lon: 149.1769 },
      { code: '03', name: 'Melbourne', lat: -37.8550, lon: 144.7561 },
      { code: '72', name: 'Mildura', lat: -34.2361, lon: 142.0864 },
      { code: '73', name: 'Moree', lat: -29.4994, lon: 149.8506 },
      { code: '05', name: 'Mt Gambier', lat: -37.7477, lon: 140.7746 },
      { code: '23', name: 'Namoi', lat: -31.0242, lon: 149.1969 },
      { code: '28', name: 'Newcastle', lat: -32.7298, lon: 151.8314 },
      { code: '76', name: 'Newdegate', lat: -33.0969, lon: 119.0197 },
      { code: '14', name: 'Perth', lat: -31.9247, lon: 116.2308 },
      { code: '24', name: 'Port Hedland', lat: -20.3717, lon: 118.6336 },
      { code: '67', name: 'Sydney', lat: -33.7008, lon: 151.2099 },
      { code: '64', name: 'Townsville', lat: -19.2506, lon: 146.5506 },
      { code: '19', name: 'Wagga Wagga', lat: -35.1575, lon: 147.4606 },
      { code: '42', name: 'Warrego', lat: -26.4406, lon: 147.3497 },
      { code: '78', name: 'Warruwi', lat: -11.6489, lon: 133.3806 },
      { code: '77', name: 'Watheroo', lat: -30.3194, lon: 116.0069 },
      { code: '17', name: 'Woomera', lat: -31.1558, lon: 136.8172 },
      { code: '41', name: 'Wyndham', lat: -15.4531, lon: 128.1189 }
    ];

    let closest = radars[0];
    let minDist = Number.MAX_VALUE;

    for (const radar of radars) {
      const dist = Math.sqrt(
        Math.pow(lat - radar.lat, 2) + Math.pow(lon - radar.lon, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closest = radar;
      }
    }

    return closest;
  };

  const getRadarFrames = (radarCode: string, numFrames: number = 6): string[] => {
    const frames: string[] = [];
    const baseTime = new Date();
    baseTime.setUTCMinutes(Math.floor(baseTime.getUTCMinutes() / 10) * 10, 0, 0);

    for (let i = numFrames - 1; i >= 0; i--) {
      const frameTime = new Date(baseTime.getTime() - (i * 10 * 60 * 1000));
      const year = frameTime.getUTCFullYear();
      const month = String(frameTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(frameTime.getUTCDate()).padStart(2, '0');
      const hours = String(frameTime.getUTCHours()).padStart(2, '0');
      const mins = String(frameTime.getUTCMinutes()).padStart(2, '0');
      const timeStr = `${year}${month}${day}${hours}${mins}`;

      frames.push(`https://www.bom.gov.au/radar/IDR${radarCode}.T.${timeStr}.png`);
    }

    return frames;
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
        maxZoom: 12,
        minZoom: 4
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      const radar = getClosestRadarCode(lat, lon);
      setRadarCode(radar.code);
      setRadarStation(radar.name);
      const frames = getRadarFrames(radar.code, 6);

      let loadedCount = 0;
      radarLayersRef.current = frames.map((frameUrl, index) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === 1) {
            setRadarLoadError(false);
          }
        };
        img.onerror = () => {
          if (index === frames.length - 1) {
            setRadarLoadError(true);
          }
        };
        img.src = frameUrl;

        const layer = L.imageOverlay(frameUrl, [
          [-44, 112],
          [-10, 154]
        ], {
          opacity: index === frames.length - 1 ? 0.7 : 0,
          className: 'radar-layer'
        }).addTo(map);
        return layer;
      });

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
            layer.setOpacity(index === nextFrame ? 0.7 : 0);
          });

          return nextFrame;
        });
      }, 500);
    }
  };

  const handleRefresh = () => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentFrame(0);
    setRadarLoadError(false);

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
        maxZoom: 12,
        minZoom: 4
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      const radar = getClosestRadarCode(lat, lon);
      setRadarCode(radar.code);
      setRadarStation(radar.name);
      const frames = getRadarFrames(radar.code, 6);

      let loadedCount = 0;
      radarLayersRef.current = frames.map((frameUrl, index) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === 1) {
            setRadarLoadError(false);
          }
        };
        img.onerror = () => {
          if (index === frames.length - 1) {
            setRadarLoadError(true);
          }
        };
        img.src = frameUrl;

        const layer = L.imageOverlay(frameUrl, [
          [-44, 112],
          [-10, 154]
        ], {
          opacity: index === frames.length - 1 ? 0.7 : 0,
          className: 'radar-layer'
        }).addTo(map);
        return layer;
      });

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

  return (
    <div className={`bg-white rounded-xl shadow-2xl overflow-hidden ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
            <CloudRain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Live Rain Radar</h3>
            <p className="text-sm text-red-100">{locationName}</p>
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-600 mx-auto mb-3"></div>
                  <p className="text-gray-700 font-medium">Loading BOM radar...</p>
                </div>
              </div>
            ) : null}

            {radarLoadError && !isLoading && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 shadow-xl z-10 max-w-md">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Radar Images Unavailable</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Unable to load radar images from BOM. This may be due to:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Radar maintenance or temporary outage</li>
                      <li>Images not yet available for this time period</li>
                      <li>Network connectivity issues</li>
                    </ul>
                    <button
                      onClick={handleRefresh}
                      className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div ref={mapRef} className="w-full h-full"></div>

            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-gray-200 max-w-xs">
              <div className="text-xs font-bold text-gray-900 mb-2.5">BOM Radar Legend</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-3 rounded shadow-sm" style={{ background: 'linear-gradient(to right, #00ECEC, #00BBBB)' }}></div>
                  <span className="text-xs text-gray-700 font-medium">Light Rain</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-3 rounded shadow-sm" style={{ background: 'linear-gradient(to right, #009900, #00FF00)' }}></div>
                  <span className="text-xs text-gray-700 font-medium">Moderate Rain</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-3 rounded shadow-sm" style={{ background: 'linear-gradient(to right, #FFFF00, #FF9900)' }}></div>
                  <span className="text-xs text-gray-700 font-medium">Heavy Rain</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-3 rounded shadow-sm" style={{ background: 'linear-gradient(to right, #FF0000, #CC0000)' }}></div>
                  <span className="text-xs text-gray-700 font-medium">Very Heavy</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-gray-200 text-xs text-gray-600">
                {!radarLoadError && <div className="font-medium mb-1">No rain visible? The radar shows real-time data.</div>}
                <div className="font-medium">Scroll to zoom • Drag to pan</div>
              </div>
            </div>

            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-xl border border-gray-200">
              <div className="text-xs font-bold text-red-700">Bureau of Meteorology</div>
              <div className="text-xs text-gray-600 mt-0.5">{radarStation} Radar (IDR{radarCode})</div>
              <div className="text-xs text-gray-500 mt-0.5">Last {6 - currentFrame}0 minutes</div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleAnimation}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                title={isPlaying ? 'Pause animation' : 'Play animation'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="text-sm">{isPlaying ? 'Pause' : 'Play'} Radar</span>
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
              Official radar data • Australian Bureau of Meteorology
            </div>
          </div>
        </>
      )}
    </div>
  );
}
