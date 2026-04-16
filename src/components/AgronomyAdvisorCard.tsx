import { useState, useEffect, useRef } from 'react';
import { Leaf, ArrowRight, Sparkles, Camera, ChevronRight } from 'lucide-react';

const ROTATING_PLACEHOLDERS = [
  'Sclerotinia in celery?',
  'Best spray for aphids?',
  'Identify this weed...',
  'Powdery mildew treatment',
  'Nitrogen deficiency in spinach?',
  'Upload a crop photo for diagnosis',
  'Ryegrass resistance options?',
  'Botrytis in strawberries?',
];

const QUICK_CHIPS = [
  { label: 'Sclerotinia', icon: '🔬' },
  { label: 'Aphids', icon: '🐛' },
  { label: 'Ryegrass', icon: '🌾' },
  { label: 'Powdery mildew', icon: '🍃' },
  { label: 'N deficiency', icon: '🌿' },
  { label: 'Best spray', icon: '💧' },
  { label: 'Upload photo', icon: '📷', isPhoto: true },
];

interface Props {
  onOpen: (query?: string) => void;
  isAuthenticated?: boolean;
}

export function AgronomyAdvisorCard({ onOpen, isAuthenticated }: Props) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let charIndex = 0;
    const target = ROTATING_PLACEHOLDERS[placeholderIndex];
    setDisplayText('');
    setIsTyping(true);

    function typeNext() {
      if (charIndex < target.length) {
        setDisplayText(target.slice(0, charIndex + 1));
        charIndex++;
        typingRef.current = setTimeout(typeNext, 45);
      } else {
        setIsTyping(false);
        cycleRef.current = setTimeout(() => {
          setPlaceholderIndex(i => (i + 1) % ROTATING_PLACEHOLDERS.length);
        }, 2400);
      }
    }

    typingRef.current = setTimeout(typeNext, 300);

    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
      if (cycleRef.current) clearTimeout(cycleRef.current);
    };
  }, [placeholderIndex]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onOpen(query.trim() || undefined);
  }

  function handleChipClick(label: string) {
    onOpen(label);
  }

  return (
    <div className="relative mb-5">
      <div
        className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${
          focused
            ? 'border-green-500/60 shadow-[0_0_40px_rgba(34,197,94,0.15)] bg-slate-900/95'
            : 'border-green-600/30 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_24px_rgba(34,197,94,0.06)] bg-slate-900/80'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/30 via-transparent to-slate-950/60 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent pointer-events-none" />

        <div className="relative px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-600/20 border border-green-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Leaf className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-lg font-black text-white tracking-tight leading-none">Agronomy Advisor</h2>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI Powered
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 tracking-wide">
                  Weeds &bull; Pests &bull; Diseases &bull; Chemicals &bull; Fertiliser
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpen()}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-green-400 hover:text-green-300 transition-colors group"
            >
              <span className="hidden sm:inline">Browse all</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <p className="text-sm font-semibold text-slate-300 mb-3">
            What's affecting your crop today?
          </p>

          <form onSubmit={handleSubmit} className="relative">
            <div
              className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                focused
                  ? 'border-green-500/50 bg-slate-800/80 shadow-[0_0_0_3px_rgba(34,197,94,0.08)]'
                  : 'border-slate-700/60 bg-slate-800/50 hover:border-slate-600/70'
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={focused ? 'Type a crop problem, pest, weed or chemical...' : displayText + (isTyping ? '|' : '')}
                className="flex-1 bg-transparent px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none min-w-0 font-medium"
              />
              <div className="flex items-center gap-2 pr-3">
                <button
                  type="button"
                  onClick={() => onOpen('Upload photo')}
                  className="p-2 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-700/60 transition-all"
                  title="Upload crop photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition-all duration-200 shadow-sm hover:shadow-green-900/40 whitespace-nowrap"
                >
                  Search
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>

          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip.label}
                onClick={() => handleChipClick(chip.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 hover:scale-[1.03] active:scale-[0.98] ${
                  chip.isPhoto
                    ? 'bg-slate-800/80 border-slate-600/50 text-slate-400 hover:border-slate-500/60 hover:text-slate-300'
                    : 'bg-green-950/40 border-green-600/25 text-green-400/90 hover:bg-green-900/40 hover:border-green-500/40 hover:text-green-300'
                }`}
              >
                <span className="text-[11px]">{chip.icon}</span>
                {chip.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-600 mt-3 leading-relaxed">
            Instant answers for crop problems, chemical options, pests, weeds, diseases and nutrient issues.
            {!isAuthenticated && (
              <span className="text-slate-500"> Subscribe for full access.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
