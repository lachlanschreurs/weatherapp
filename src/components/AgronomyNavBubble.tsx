import { useState, useEffect } from 'react';
import { Leaf, Sparkles } from 'lucide-react';

const ROTATING_PROMPTS = [
  'Need spray advice?',
  'Disease risk today?',
  'Ask AI — weed ID',
  'Spot a pest? Ask AI',
  'Fungicide timing?',
  'Identify crop disease',
];

interface Props {
  onClick: () => void;
  show?: boolean;
}

export function AgronomyNavBubble({ onClick, show = true }: Props) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [promptVisible, setPromptVisible] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptVisible(false);
      setTimeout(() => {
        setPromptIndex(i => (i + 1) % ROTATING_PROMPTS.length);
        setPromptVisible(true);
      }, 280);
    }, 3600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex-shrink-0">
      <style>{`
        @keyframes agro-btn-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.55), 0 0 18px 2px rgba(34,197,94,0.18), 0 4px 20px rgba(0,0,0,0.5); }
          50%  { box-shadow: 0 0 0 6px rgba(34,197,94,0.0), 0 0 28px 6px rgba(34,197,94,0.32), 0 4px 20px rgba(0,0,0,0.5); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.55), 0 0 18px 2px rgba(34,197,94,0.18), 0 4px 20px rgba(0,0,0,0.5); }
        }
        @keyframes agro-btn-pulse-hover {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.7), 0 0 32px 8px rgba(34,197,94,0.35), 0 4px 24px rgba(0,0,0,0.5); }
          50%       { box-shadow: 0 0 0 8px rgba(34,197,94,0.0), 0 0 40px 12px rgba(34,197,94,0.5), 0 4px 24px rgba(0,0,0,0.5); }
        }
        @keyframes agro-dot-beat {
          0%, 100% { opacity: 0.55; transform: scale(0.85); }
          50%       { opacity: 1;    transform: scale(1.25); }
        }
        @keyframes agro-prompt-in {
          0%   { opacity: 0; transform: translateY(3px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes agro-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .agro-btn-idle  { animation: agro-btn-pulse       3.8s ease-in-out infinite; }
        .agro-btn-hover { animation: agro-btn-pulse-hover  1.6s ease-in-out infinite; }
        .agro-dot       { animation: agro-dot-beat         1.9s ease-in-out infinite; }
        .agro-prompt-in { animation: agro-prompt-in        0.28s ease-out forwards; }
        .agro-shimmer-text {
          background: linear-gradient(90deg, #86efac 0%, #4ade80 35%, #bbf7d0 55%, #4ade80 75%, #86efac 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: agro-shimmer 3.2s linear infinite;
        }
      `}</style>

      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`
            relative flex items-center gap-2.5 rounded-xl border transition-all duration-200 font-bold shadow-xl
            px-5 py-2 text-sm
            ${hovered
              ? 'agro-btn-hover bg-green-900/80 border-green-400/80 text-green-100 scale-[1.03]'
              : 'agro-btn-idle  bg-green-950/70 border-green-500/60 text-green-200'
            }
          `}
          style={{
            minWidth: '11rem',
            background: hovered
              ? 'linear-gradient(135deg, rgba(20,55,30,0.95) 0%, rgba(10,35,18,0.95) 100%)'
              : 'linear-gradient(135deg, rgba(14,42,24,0.92) 0%, rgba(7,26,14,0.92) 100%)',
          }}
        >
          <div className={`absolute inset-0 rounded-xl opacity-20 pointer-events-none transition-opacity duration-300 ${hovered ? 'opacity-30' : 'opacity-15'}`}
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.35) 0%, transparent 70%)',
            }}
          />

          <Leaf className="w-4 h-4 text-green-400 flex-shrink-0 relative z-10" />

          <span className="hidden sm:inline relative z-10">
            <span className={hovered ? 'agro-shimmer-text' : 'text-green-200'}>
              Agronomy Advisor
            </span>
          </span>
          <span className="sm:hidden relative z-10 text-green-200">Agronomy</span>

          <span className="relative z-10 flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-wider ml-0.5"
            style={{
              background: 'rgba(34,197,94,0.15)',
              borderColor: 'rgba(34,197,94,0.35)',
              color: '#86efac',
            }}
          >
            <Sparkles className="w-2.5 h-2.5" />
            AI
          </span>
        </button>

        <div
          className={`flex items-center gap-1.5 transition-opacity duration-280 ${promptVisible ? 'agro-prompt-in opacity-100' : 'opacity-0'}`}
          key={promptIndex}
        >
          <span className="agro-dot w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-green-400/80 whitespace-nowrap tracking-wide">
            {ROTATING_PROMPTS[promptIndex]}
          </span>
        </div>
      </div>
    </div>
  );
}
