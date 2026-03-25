import { useState, useEffect, useRef } from 'react';
import { CloudRain, Minimize2, Maximize2, Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';

interface RainRadarProps {
  lat: number;
  lon: number;
  locationName: string;
}

interface RadarFrame {
  url: string;
  time: number;
  isForecast: boolean;
  radarId?: string;
}

interface BOMRadar {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export function RainRadar({ lat, lon, locationName }: RainRadarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [opacity, setOpacity] = useState(0.9);
  const [showWind, setShowWind] = useState(true);
  const [nearestRadar, setNearestRadar] = useState<BOMRadar | null>(null);
  const [windData, setWindData] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const windAnimationRef = useRef<number>();

  const bomRadars: BOMRadar[] = [
    { id: '02', name: 'Brisbane (Marburg)', lat: -27.6, lon: 152.5 },
    { id: '03', name: 'Sydney (Terrey Hills)', lat: -33.7, lon: 151.2 },
    { id: '04', name: 'Melbourne (Laverton)', lat: -37.9, lon: 144.8 },
    { id: '14', name: 'Adelaide (Buckland Park)', lat: -34.6, lon: 138.5 },
    { id: '15', name: 'Perth (Serpentine)', lat: -32.4, lon: 116.0 },
    { id: '16', name: 'Hobart (Mt Koonya)', lat: -42.8, lon: 147.6 },
    { id: '29', name: 'Canberra (Captains Flat)', lat: -35.7, lon: 149.5 },
    { id: '50', name: 'Wollongong (Appin)', lat: -34.3, lon: 150.9 },
    { id: '63', name: 'Newcastle', lat: -32.7, lon: 152.0 },
    { id: '66', name: 'Grafton', lat: -29.6, lon: 152.9 },
    { id: '71', name: 'Cairns', lat: -16.8, lon: 145.7 },
    { id: '73', name: 'Townsville', lat: -19.2, lon: 146.8 },
    { id: '76', name: 'Mackay', lat: -21.1, lon: 149.2 },
  ];

  const findNearestRadar = (latitude: number, longitude: number): BOMRadar => {
    let nearest = bomRadars[0];
    let minDistance = Number.MAX_VALUE;

    bomRadars.forEach(radar => {
      const distance = Math.sqrt(
        Math.pow(radar.lat - latitude, 2) + Math.pow(radar.lon - longitude, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = radar;
      }
    });

    return nearest;
  };

  useEffect(() => {
    const radar = findNearestRadar(lat, lon);
    setNearestRadar(radar);
  }, [lat, lon]);

  useEffect(() => {
    if (nearestRadar) {
      fetchRadarData();
      fetchWindData();
      const interval = setInterval(() => {
        fetchRadarData();
        fetchWindData();
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [nearestRadar]);

  async function fetchWindData() {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=wind_speed_10m,wind_direction_10m&forecast_days=1`
      );
      const data = await response.json();
      setWindData(data);
    } catch (error) {
      console.error('Failed to fetch wind data:', error);
    }
  }

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
    if (!nearestRadar) return;

    try {
      setIsLoading(true);
      const frames: RadarFrame[] = [];
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const frameTime = new Date(now.getTime() - i * 10 * 60 * 1000);
        const timestamp = Math.floor(frameTime.getTime() / 1000);

        frames.push({
          url: `https://api.weather.bom.gov.au/v1/imagery/radar/IDR${nearestRadar.id}.T.${timestamp}.png`,
          time: timestamp,
          isForecast: false,
          radarId: nearestRadar.id
        });
      }

      setRadarFrames(frames);
      setCurrentFrame(frames.length - 1);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch BOM radar data:', error);
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

      if (mapRef.current && (window as any).L && nearestRadar) {
        mapRef.current.innerHTML = '';
        const L = (window as any).L;

        const zoom = isExpanded ? 8 : 7;
        const centerLat = (lat + nearestRadar.lat) / 2;
        const centerLon = (lon + nearestRadar.lon) / 2;
        const map = L.map(mapRef.current).setView([centerLat, centerLon], zoom);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© Esri',
          maxZoom: 19,
        }).addTo(map);

        const darkOverlay = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
          attribution: '© CartoDB',
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(map);

        const currentFrameData = radarFrames[currentFrame];
        const imageUrl = currentFrameData.url;

        const radarImageBounds = [
          [nearestRadar.lat - 3, nearestRadar.lon - 3],
          [nearestRadar.lat + 3, nearestRadar.lon + 3]
        ];

        const radarLayer = L.imageOverlay(imageUrl, radarImageBounds, {
          opacity: opacity,
          attribution: 'Rain data © Bureau of Meteorology',
          crossOrigin: 'anonymous',
          className: 'rain-radar-overlay'
        }).addTo(map);

        if (showWind && windData && windData.current) {
          if (windAnimationRef.current) {
            cancelAnimationFrame(windAnimationRef.current);
          }

          const canvas = document.createElement('canvas');
          const size = map.getSize();
          canvas.width = size.x;
          canvas.height = size.y;
          canvas.style.position = 'absolute';
          canvas.style.pointerEvents = 'none';
          canvas.style.zIndex = '1000';
          canvas.style.top = '0';
          canvas.style.left = '0';

          const CanvasLayer = L.Layer.extend({
            onAdd: function (map: any) {
              const pane = map.getPane('overlayPane');
              pane.appendChild(canvas);
              canvasRef.current = canvas;
              this._map = map;
              map.on('move zoom', this._reset, this);
              this._reset();
              drawWindParticles(canvas, map, windData.current);
            },
            onRemove: function (map: any) {
              const pane = map.getPane('overlayPane');
              if (canvas.parentNode === pane) {
                pane.removeChild(canvas);
              }
              map.off('move zoom', this._reset, this);
              if (windAnimationRef.current) {
                cancelAnimationFrame(windAnimationRef.current);
              }
              canvasRef.current = null;
            },
            _reset: function () {
              const size = this._map.getSize();
              canvas.width = size.x;
              canvas.height = size.y;
              const topLeft = this._map.containerPointToLayerPoint([0, 0]);
              L.DomUtil.setPosition(canvas, topLeft);
            }
          });

          const canvasLayer = new CanvasLayer();
          canvasLayer.addTo(map);
          (mapRef.current as any)._canvasLayer = canvasLayer;
        }

        L.marker([lat, lon], {
          title: locationName
        }).addTo(map);

        L.marker([nearestRadar.lat, nearestRadar.lon], {
          icon: L.divIcon({
            className: 'radar-station-marker',
            html: '<div style="background: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          }),
          title: nearestRadar.name
        }).addTo(map);

        (mapRef.current as any)._leafletMap = map;
        (mapRef.current as any)._radarLayer = radarLayer;
      }
    };

    loadLeaflet();

    return () => {
      if (windAnimationRef.current) {
        cancelAnimationFrame(windAnimationRef.current);
      }
      if (mapRef.current && (mapRef.current as any)._canvasLayer) {
        const map = (mapRef.current as any)._leafletMap;
        if (map) {
          map.removeLayer((mapRef.current as any)._canvasLayer);
        }
        (mapRef.current as any)._canvasLayer = null;
      }
      if (mapRef.current && (mapRef.current as any)._leafletMap) {
        (mapRef.current as any)._leafletMap.remove();
      }
    };
  }, [showRadar, lat, lon, isExpanded, radarFrames.length, showWind, windData]);

  useEffect(() => {
    if (mapRef.current && (mapRef.current as any)._radarLayer && radarFrames[currentFrame] && nearestRadar) {
      const map = (mapRef.current as any)._leafletMap;
      const oldLayer = (mapRef.current as any)._radarLayer;

      oldLayer.remove();

      const currentFrameData = radarFrames[currentFrame];
      const imageUrl = currentFrameData.url;

      const radarImageBounds = [
        [nearestRadar.lat - 3, nearestRadar.lon - 3],
        [nearestRadar.lat + 3, nearestRadar.lon + 3]
      ];

      const L = (window as any).L;
      const newLayer = L.imageOverlay(imageUrl, radarImageBounds, {
        opacity: opacity,
        attribution: 'Rain data © Bureau of Meteorology',
        crossOrigin: 'anonymous',
        className: 'rain-radar-overlay'
      }).addTo(map);

      (mapRef.current as any)._radarLayer = newLayer;
    }
  }, [currentFrame, radarFrames, nearestRadar]);

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

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    age: number;
    maxAge: number;
  }

  function getWindColor(speed: number): string {
    if (speed < 10) return '#4ade80';
    if (speed < 20) return '#facc15';
    if (speed < 30) return '#fb923c';
    return '#ef4444';
  }

  function drawWindArrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, length: number, color: string, alpha: number) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.9;

    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-length / 2, 0);
    ctx.lineTo(length / 2, 0);
    ctx.stroke();

    const arrowSize = 7;
    ctx.beginPath();
    ctx.moveTo(length / 2, 0);
    ctx.lineTo(length / 2 - arrowSize, -arrowSize / 2);
    ctx.lineTo(length / 2 - arrowSize, arrowSize / 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawWindParticles(canvas: HTMLCanvasElement, map: any, currentWind: any) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const particles: Particle[] = [];
    const gridSize = 50;
    const windSpeed = currentWind.wind_speed_10m || 0;
    const windDirection = currentWind.wind_direction_10m || 0;

    const windRadians = (windDirection * Math.PI) / 180;
    const speedFactor = Math.max(windSpeed / 8, 0.5);
    const arrowLength = 25 + (windSpeed / 2);
    const windColor = getWindColor(windSpeed);

    const cols = Math.ceil(canvas.width / gridSize);
    const rows = Math.ceil(canvas.height / gridSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * gridSize + (Math.random() - 0.5) * gridSize * 0.3;
        const y = row * gridSize + (Math.random() - 0.5) * gridSize * 0.3;

        particles.push({
          x: x,
          y: y,
          vx: Math.sin(windRadians) * speedFactor,
          vy: -Math.cos(windRadians) * speedFactor,
          age: Math.random() * 150,
          maxAge: 150
        });
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.age++;

        if (particle.x < -50 || particle.x > canvas.width + 50 ||
            particle.y < -50 || particle.y > canvas.height + 50 ||
            particle.age > particle.maxAge) {
          const col = Math.floor(Math.random() * cols);
          const row = Math.floor(Math.random() * rows);
          particle.x = col * gridSize + (Math.random() - 0.5) * gridSize * 0.3;
          particle.y = row * gridSize + (Math.random() - 0.5) * gridSize * 0.3;
          particle.age = 0;
        }

        const alpha = Math.max(0, 1 - (particle.age / particle.maxAge));
        drawWindArrow(ctx, particle.x, particle.y, windRadians, arrowLength, windColor, alpha);
      });

      if (canvasRef.current) {
        windAnimationRef.current = requestAnimationFrame(animate);
      }
    }

    animate();
  }

  useEffect(() => {
    return () => {
      if (windAnimationRef.current) {
        cancelAnimationFrame(windAnimationRef.current);
      }
    };
  }, []);

  const getCurrentFrameInfo = () => {
    if (radarFrames.length === 0 || !radarFrames[currentFrame]) return null;
    const frame = radarFrames[currentFrame];
    return {
      time: formatTime(frame.time),
      isForecast: frame.isForecast
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
            <p className="text-sm text-cyan-100">{nearestRadar ? nearestRadar.name : locationName}</p>
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
                  <div className="text-xs text-gray-500 mb-2">
                    {formatRelativeTime(radarFrames[currentFrame].time)}
                  </div>
                  {frameInfo.isForecast && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                      Forecast
                    </div>
                  )}
                  {windData && windData.current && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Current Wind</div>
                      <div className="text-xs text-gray-600">
                        <div>Speed: {windData.current.wind_speed_10m} km/h</div>
                        <div>Direction: {windData.current.wind_direction_10m}°</div>
                        {windData.current.wind_gusts_10m && (
                          <div>Gusts: {windData.current.wind_gusts_10m} km/h</div>
                        )}
                      </div>
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
                  <div className="text-xs font-semibold text-gray-700 mb-2">Layers</div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Radar Opacity</label>
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
                    <div className="pt-2 border-t border-gray-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showWind}
                          onChange={(e) => setShowWind(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700 font-medium">Wind Flow</span>
                      </label>
                    </div>
                  </div>
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
                  </div>
                </div>

                <div className="text-xs font-medium text-gray-600 min-w-fit">
                  Frame {currentFrame + 1} / {radarFrames.length}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Past 2 hours of live radar images (10 min intervals)
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
