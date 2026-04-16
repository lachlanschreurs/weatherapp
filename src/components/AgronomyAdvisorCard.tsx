import { useState, useEffect, useRef } from 'react';
import { Leaf, ArrowRight, Sparkles, Camera, ChevronRight, Lock, Zap, FlaskConical } from 'lucide-react';

const FLOATING_PROMPTS = [
  { text: 'What weed is this?', icon: '🌿' },
  { text: 'Best spray for aphids?', icon: '🐛' },
  { text: 'Sclerotinia in celery?', icon: '🔬' },
  { text: 'Identify a disease', icon: '🍃' },
  { text: 'Find the right chemical', icon: '💧' },
  { text: 'Upload a crop photo', icon: '📷' },
  { text: 'Ryegrass resistance?', icon: '🌾' },
  { text: 'Botrytis in strawberries?', icon: '🍓' },
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

const LIVE_PROMPTS = [
  { query: 'Aphids on my canola — what spray window?', tag: 'Pests' },
  { query: 'Ryegrass is taking over — resistance options?', tag: 'Weeds' },
  { query: 'Yellow spots on wheat leaves — disease?', tag: 'Diseases' },
  { query: 'Withholding period for Roundup?', tag: 'Chemicals' },
  { query: 'Pale new leaves — iron or zinc deficiency?', tag: 'Nutrition' },
  { query: 'Sclerotinia risk after rain?', tag: 'Diseases' },
  { query: 'Capeweed in lucerne — safest option?', tag: 'Weeds' },
  { query: 'Diamondback moth — spray threshold?', tag: 'Pests' },
];

interface Props {
  onOpen: (query?: string) => void;
  isAuthenticated?: boolean;
  onSubscribeClick?: () => void;
}

export function AgronomyAdvisorCard({ onOpen, isAuthenticated, onSubscribeClick }: Props) {
  const [floatingIndex, setFloatingIndex] = useState(0);
  const [floatingVisible, setFloatingVisible] = useState(true);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [livePromptIndex, setLivePromptIndex] = useState(0);
  const [promptVisible, setPromptVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let charIndex = 0;
    const target = FLOATING_PROMPTS[placeholderIndex].text;
    setDisplayText('');
    setIsTyping(true);

    function typeNext() {
      if (charIndex < target.length) {
        setDisplayText(target.slice(0, charIndex + 1));
        charIndex++;
        typingRef.current = setTimeout(typeNext, 48);
      } else {
        setIsTyping(false);
        cycleRef.current = setTimeout(() => {
          setPlaceholderIndex(i => (i + 1) % FLOATING_PROMPTS.length);
        }, 2200);
      }
    }

    typingRef.current = setTimeout(typeNext, 280);
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
      if (cycleRef.current) clearTimeout(cycleRef.current);
    };
  }, [placeholderIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingVisible(false);
      setTimeout(() => {
        setFloatingIndex(i => (i + 1) % FLOATING_PROMPTS.length);
        setFloatingVisible(true);
      }, 350);
    }, 3600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAuthenticated) return;
    const interval = setInterval(() => {
      setPromptVisible(false);
      setTimeout(() => {
        setLivePromptIndex(i => (i + 1) % LIVE_PROMPTS.length);
        setPromptVisible(true);
      }, 400);
    }, 3800);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onOpen(query.trim() || undefined);
  }

  const currentPrompt = LIVE_PROMPTS[livePromptIndex];
  const floatingPrompt = FLOATING_PROMPTS[floatingIndex];

  return (
    <>
      <style>{`
        @keyframes agro-breathe {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0); }
          50% { transform: scale(1.015); box-shadow: 0 0 24px 4px rgba(34,197,94,0.12); }
        }
        @keyframes agro-float-in {
          0% { opacity: 0; transform: translateY(6px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes agro-dot-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes agro-ring-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.06); }
        }
        .agro-breathe { animation: agro-breathe 4s ease-in-out infinite; }
        .agro-float-in { animation: agro-float-in 0.35s ease-out forwards; }
        .agro-dot { animation: agro-dot-pulse 1.8s ease-in-out infinite; }
        .agro-ring { animation: agro-ring-pulse 3s ease-in-out infinite; }
      `}</style>

      <div
        className="relative mb-5"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {!isAuthenticated && (
          <div
            className="absolute -top-3 right-4 z-10 pointer-events-none"
            key={floatingIndex}
          >
            <div
              className={`agro-float-in flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-sm transition-opacity duration-300 ${
                floatingVisible ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: 'linear-gradient(135deg, rgba(15,26,18,0.97) 0%, rgba(10,20,14,0.97) 100%)',
                borderColor: 'rgba(34,197,94,0.35)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 12px rgba(34,197,94,0.1)',
              }}
            >
              <span className="text-sm leading-none">{floatingPrompt.icon}</span>
              <span className="text-xs font-bold text-green-300 whitespace-nowrap">{floatingPrompt.text}</span>
              <span className="agro-dot w-1.5 h-1.5 rounded-full bg-green-400 ml-0.5 flex-shrink-0" />
            </div>
          </div>
        )}

        <div
          className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
            focused
              ? 'border-green-500/60 bg-slate-900/98'
              : hovered && !isAuthenticated
              ? 'border-green-500/45 bg-slate-900/95'
              : 'border-green-600/30 bg-slate-900/80'
          } ${!isAuthenticated ? 'agro-breathe' : ''}`}
          style={{
            boxShadow: focused
              ? '0 0 0 1px rgba(34,197,94,0.2), 0 8px 40px rgba(0,0,0,0.5), 0 0 40px rgba(34,197,94,0.12)'
              : hovered && !isAuthenticated
              ? '0 0 0 1px rgba(34,197,94,0.15), 0 8px 32px rgba(0,0,0,0.45), 0 0 24px rgba(34,197,94,0.08)'
              : '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(34,197,94,0.05)',
          }}
        >
          {!isAuthenticated && (
            <div
              className="agro-ring absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 60%)',
              }}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-br from-green-950/25 via-transparent to-slate-950/50 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/35 to-transparent pointer-events-none" />

          <div className="relative px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 flex-shrink-0">
                  {!isAuthenticated && (
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, rgba(34,197,94,0) 70%)',
                        transform: 'scale(1.5)',
                        animation: 'agro-ring-pulse 3s ease-in-out infinite',
                      }}
                    />
                  )}
                  <div className="relative w-11 h-11 rounded-xl bg-green-600/20 border border-green-500/35 flex items-center justify-center shadow-inner">
                    <Leaf className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-lg font-black text-white tracking-tight leading-none">Agronomy Advisor</h2>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI
                    </span>
                    {!isAuthenticated && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 uppercase tracking-wider">
                        Most Used
                      </span>
                    )}
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

            {(hovered || focused) && !isAuthenticated ? (
              <p className="text-sm font-semibold text-green-300 mb-3 transition-all duration-200">
                Instant help for weeds, pests, diseases, chemicals and fertiliser.
              </p>
            ) : (
              <p className="text-sm font-semibold text-slate-300 mb-3 transition-all duration-200">
                What's affecting your crop today?
              </p>
            )}

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
                  placeholder={
                    focused
                      ? 'Type a crop problem, pest, weed or chemical...'
                      : displayText + (isTyping ? '|' : '')
                  }
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
                  onClick={() => onOpen(chip.label)}
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

            {!isAuthenticated ? (
              <div className="mt-4 rounded-xl border border-green-600/25 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(10,28,16,0.9) 0%, rgba(8,20,12,0.9) 100%)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(34,197,94,0.08)',
                }}
              >
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="agro-dot w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Live on FarmCast</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-600/20 text-green-400 border border-green-500/25 transition-opacity duration-300 ${
                        promptVisible ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {currentPrompt.tag}
                    </span>
                  </div>

                  <p
                    className={`text-sm text-white font-semibold leading-snug mb-1 transition-opacity duration-300 ${
                      promptVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    "{currentPrompt.query}"
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Subscribers get instant answers — weeds, pests, diseases, chemicals and more.
                  </p>
                </div>

                <div className="px-4 pb-4 pt-1 border-t border-green-900/40">
                  <div className="mb-3 space-y-1.5">
                    {[
                      { icon: FlaskConical, label: 'Agronomy Advisor', sub: 'Weeds, pests, diseases, chemicals' },
                      { icon: Sparkles, label: 'Farmer Joe AI', sub: 'Full farm AI assistant' },
                      { icon: Zap, label: 'Full Farm Report', sub: 'Spray timing, alerts, forecasts' },
                    ].map(({ icon: Icon, label, sub }) => (
                      <div key={label} className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-green-600/15 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-3 h-3 text-green-400" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white">{label}</span>
                          <span className="text-xs text-slate-500 ml-1.5">{sub}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={onSubscribeClick}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow-[0_0_16px_rgba(34,197,94,0.3)] group"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Unlock Agronomy Advisor — Free for 30 Days
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <p className="text-[11px] text-slate-600 text-center mt-2">
                    No credit card needed to start your free trial.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-600 mt-3 leading-relaxed">
                Instant answers for crop problems, chemical options, pests, weeds, diseases and nutrient issues.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
