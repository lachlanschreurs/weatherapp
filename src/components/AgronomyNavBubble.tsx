import { useState, useEffect } from 'react';
import { Leaf, Sparkles } from 'lucide-react';

const BUBBLE_PROMPTS = [
  'What weed is this?',
  'Best spray for aphids?',
  'Sclerotinia in celery?',
  'Identify a disease',
  'Find the right chemical',
  'Upload a crop photo',
  'Ryegrass resistance?',
  'Botrytis in strawberries?',
];

interface Props {
  onClick: () => void;
  show?: boolean;
}

export function AgronomyNavBubble({ onClick, show = true }: Props) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % BUBBLE_PROMPTS.length);
        setVisible(true);
      }, 300);
    }, 3400);
    return () => clearInterval(interval);
  }, [show]);

  return (
    <div className="relative flex-shrink-0">
      <style>{`
        @keyframes nav-bubble-in {
          0% { opacity: 0; transform: translateY(-6px) scale(0.94); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes nav-dot-pulse {
          0%, 100% { opacity: 0.5; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes nav-glow-breathe {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0), 0 4px 16px rgba(0,0,0,0.4); }
          50% { box-shadow: 0 0 12px 2px rgba(34,197,94,0.18), 0 4px 16px rgba(0,0,0,0.4); }
        }
        .nav-bubble-in { animation: nav-bubble-in 0.3s ease-out forwards; }
        .nav-dot { animation: nav-dot-pulse 1.8s ease-in-out infinite; }
        .nav-glow { animation: nav-glow-breathe 3.5s ease-in-out infinite; }
      `}</style>

      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`nav-glow relative flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 text-sm font-bold shadow-lg ${
          hovered
            ? 'bg-green-900/70 border-green-500/70 text-green-200'
            : 'bg-green-950/60 border-green-600/50 text-green-300'
        }`}
      >
        <Leaf className="w-4 h-4 text-green-400 flex-shrink-0" />
        <span className="hidden sm:inline">Agronomy Advisor</span>
        <span className="sm:hidden">Agronomy</span>
        <span className="flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 uppercase tracking-wider ml-0.5">
          <Sparkles className="w-2 h-2" />
          AI
        </span>
      </button>

      {show && <div
        className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        style={{ top: 'calc(100% + 10px)' }}
      >
        <div
          className={`nav-bubble-in relative transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
          key={index}
        >
          <div
            className="relative px-3 py-2 rounded-xl border backdrop-blur-md whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, rgba(12,24,16,0.97) 0%, rgba(8,18,12,0.97) 100%)',
              borderColor: 'rgba(34,197,94,0.35)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 16px rgba(34,197,94,0.1)',
            }}
          >
            <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-t border-l"
              style={{
                background: 'linear-gradient(135deg, rgba(12,24,16,0.97) 0%, rgba(8,18,12,0.97) 100%)',
                borderColor: 'rgba(34,197,94,0.35)',
              }}
            />
            <div className="flex items-center gap-2">
              <span className="nav-dot w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              <span className="text-xs font-bold text-green-200">
                {BUBBLE_PROMPTS[index]}
              </span>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}
