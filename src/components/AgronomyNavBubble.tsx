import { useState } from 'react';
import { Leaf, Sparkles } from 'lucide-react';

interface Props {
  onClick: () => void;
  show?: boolean;
}

export function AgronomyNavBubble({ onClick }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative flex-shrink-0">
      <style>{`
        @keyframes agro-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.6), 0 0 20px 3px rgba(34,197,94,0.2), 0 4px 20px rgba(0,0,0,0.55); }
          50%  { box-shadow: 0 0 0 7px rgba(34,197,94,0.0), 0 0 32px 8px rgba(34,197,94,0.38), 0 4px 20px rgba(0,0,0,0.55); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6), 0 0 20px 3px rgba(34,197,94,0.2), 0 4px 20px rgba(0,0,0,0.55); }
        }
        @keyframes agro-pulse-hover {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.75), 0 0 36px 10px rgba(34,197,94,0.42), 0 6px 28px rgba(0,0,0,0.6); }
          50%       { box-shadow: 0 0 0 9px rgba(34,197,94,0.0), 0 0 48px 14px rgba(34,197,94,0.55), 0 6px 28px rgba(0,0,0,0.6); }
        }
        @keyframes agro-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .agro-idle  { animation: agro-pulse       3.8s ease-in-out infinite; }
        .agro-hover { animation: agro-pulse-hover  1.6s ease-in-out infinite; }
        .agro-shimmer {
          background: linear-gradient(90deg, #86efac 0%, #4ade80 30%, #d1fae5 52%, #4ade80 74%, #86efac 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: agro-shimmer 3s linear infinite;
        }
        .agro-db-tag {
          background: linear-gradient(90deg, rgba(34,197,94,0.18) 0%, rgba(16,185,129,0.12) 100%);
          border: 1px solid rgba(34,197,94,0.28);
          color: #6ee7a7;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          line-height: 1;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
        }
      `}</style>

      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          relative flex flex-col items-center justify-center rounded-xl border transition-all duration-200 shadow-xl
          px-5 py-2 gap-0.5
          ${hovered
            ? 'agro-hover border-green-400/75 scale-[1.03]'
            : 'agro-idle  border-green-500/55'
          }
        `}
        style={{
          minWidth: '12.5rem',
          background: hovered
            ? 'linear-gradient(135deg, rgba(18,52,28,0.97) 0%, rgba(9,32,17,0.97) 100%)'
            : 'linear-gradient(135deg, rgba(12,38,20,0.94) 0%, rgba(6,24,13,0.94) 100%)',
        }}
      >
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.14) 0%, rgba(16,185,129,0.04) 55%, transparent 100%)',
          }}
        />

        <div className="relative z-10 flex items-center gap-2">
          <Leaf className="w-4 h-4 text-green-400 flex-shrink-0" />

          <span className="hidden sm:inline text-sm font-bold">
            <span className={hovered ? 'agro-shimmer' : 'text-green-200'}>
              Agronomy Advisor
            </span>
          </span>
          <span className="sm:hidden text-sm font-bold text-green-200">Agronomy</span>

          <span
            className="flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-wider flex-shrink-0"
            style={{
              background: 'rgba(34,197,94,0.14)',
              borderColor: 'rgba(34,197,94,0.32)',
              color: '#86efac',
            }}
          >
            <Sparkles className="w-2.5 h-2.5" />
            AI
          </span>
        </div>

        <div className="relative z-10 flex items-center gap-1.5">
          <span className="agro-db-tag">AI + Database</span>
          <span
            className="text-[9.5px] font-semibold tracking-wide"
            style={{ color: 'rgba(110,231,167,0.55)' }}
          >
            Chemicals · Diseases · Pests · Weeds
          </span>
        </div>
      </button>
    </div>
  );
}
