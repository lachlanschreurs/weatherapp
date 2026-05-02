import { Wind, Droplets, Thermometer, CloudRain, Leaf, ChevronRight } from 'lucide-react';

interface SprayWindowCardProps {
  sprayWindow: {
    startTime: string;
    endTime: string;
    duration: number;
    conditions: string;
    rating: 'Good' | 'Moderate' | 'Poor';
  } | null;
  windSpeedKmh: number;
  deltaT: number;
  rainChance: number;
  humidity: number;
  onCardClick: () => void;
}

type SprayStatus = 'IDEAL' | 'OKAY' | 'POOR';

function getSprayStatus(windSpeedKmh: number, deltaT: number, rainChance: number): SprayStatus {
  if (windSpeedKmh > 25 || windSpeedKmh < 3 || deltaT < 2 || deltaT > 8 || rainChance > 30) {
    return 'POOR';
  }
  if (windSpeedKmh > 15 || (deltaT >= 2 && deltaT < 4) || (deltaT > 6 && deltaT <= 8)) {
    return 'OKAY';
  }
  return 'IDEAL';
}

const statusConfig = {
  IDEAL: {
    label: 'IDEAL',
    badgeBg: 'bg-[#22c55e]',
    glowClass: 'farmcast-spray-glow-good',
    glowColor: 'rgba(34,197,94,0.35)',
  },
  OKAY: {
    label: 'OKAY',
    badgeBg: 'bg-[#facc15]',
    glowClass: 'farmcast-spray-glow-moderate',
    glowColor: 'rgba(250,204,21,0.3)',
  },
  POOR: {
    label: 'AVOID',
    badgeBg: 'bg-[#ef4444]',
    glowClass: '',
    glowColor: 'rgba(239,68,68,0.25)',
  },
};

export function SprayWindowCard({ sprayWindow, windSpeedKmh, deltaT, rainChance, humidity, onCardClick }: SprayWindowCardProps) {
  const status = getSprayStatus(windSpeedKmh, deltaT, rainChance);
  const config = statusConfig[status];
  const hasData = windSpeedKmh !== undefined && deltaT !== undefined;

  return (
    <button
      onClick={onCardClick}
      className={`relative overflow-hidden rounded-[16px] border border-white/[0.08] backdrop-blur-xl ${config.glowClass} hover:translate-y-[-2px] transition-all duration-200 w-full text-left group cursor-pointer`}
      style={{
        boxShadow: `0 10px 35px rgba(0,0,0,0.45), 0 0 35px ${config.glowColor}, inset 0 1px 0 rgba(255,255,255,0.04)`,
        background: `linear-gradient(135deg, ${status === 'IDEAL' ? 'rgba(34,197,94,0.12)' : status === 'OKAY' ? 'rgba(250,204,21,0.08)' : 'rgba(239,68,68,0.06)'}, rgba(255,255,255,0.02))`,
      }}
    >
      <div className="relative z-10 p-6 lg:p-7 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-400" />
            <span className="text-[10px] text-white/55 uppercase tracking-[0.12em]" style={{ fontWeight: 600, letterSpacing: '0.3px' }}>FarmCast Spray Window</span>
          </div>
          <span
            className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider text-[#07271f] ${config.badgeBg}`}
            style={{ boxShadow: `0 0 10px ${config.glowColor}` }}
          >
            {config.label}
          </span>
        </div>

        {/* Main content */}
        {!hasData ? (
          <div className="flex-1 flex items-center justify-center py-6">
            <p className="text-white/30 text-sm">Spray data unavailable</p>
          </div>
        ) : (
          <>
            {/* Hero time display */}
            <div className="flex-1 flex flex-col justify-center mb-5">
              {sprayWindow && (sprayWindow.rating === 'Good' || sprayWindow.rating === 'Moderate') ? (
                <div>
                  <p className="text-[2.2rem] xl:text-[2.6rem] font-extrabold text-white leading-[1.1]" style={{ letterSpacing: '-1px' }}>
                    {sprayWindow.startTime} &ndash; {sprayWindow.endTime}
                  </p>
                  <p className="text-sm text-white/55 mt-2.5 font-medium">
                    {sprayWindow.duration}hr window &bull; {sprayWindow.conditions}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xl font-bold text-white leading-tight">
                    No suitable window
                  </p>
                  <p className="text-sm text-white/40 mt-2">Conditions not favourable today</p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.08] mb-4" />

            {/* Metric chips */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5">
                <Wind className="w-3.5 h-3.5 text-white/30" />
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-wider font-medium">Wind</p>
                  <p className={`text-sm font-semibold ${windSpeedKmh <= 15 ? 'text-green-400' : windSpeedKmh <= 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {Math.round(windSpeedKmh)} km/h
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Thermometer className="w-3.5 h-3.5 text-white/30" />
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-wider font-medium">Delta T</p>
                  <p className={`text-sm font-semibold ${deltaT >= 4 && deltaT <= 6 ? 'text-green-400' : (deltaT >= 2 && deltaT <= 8) ? 'text-yellow-400' : 'text-red-400'}`}>
                    {deltaT.toFixed(1)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <CloudRain className="w-3.5 h-3.5 text-white/30" />
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-wider font-medium">Rain</p>
                  <p className={`text-sm font-semibold ${rainChance <= 20 ? 'text-green-400' : rainChance <= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {rainChance}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Droplets className="w-3.5 h-3.5 text-white/30" />
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-wider font-medium">Humidity</p>
                  <p className="text-sm font-semibold text-white/80">
                    {Math.round(humidity)}%
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Full analysis pill */}
        <div className="mt-5 flex items-center justify-center">
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] group-hover:bg-white/[0.08] group-hover:border-white/[0.1] transition-all duration-200">
            <span className="text-[11px] text-white/40 font-medium group-hover:text-white/70 transition-colors">Full analysis</span>
            <ChevronRight className="w-3 h-3 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all duration-200" />
          </div>
        </div>
      </div>
    </button>
  );
}
