import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Trash2, Loader2, Camera, XCircle, Wheat, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  image_url?: string | null;
}

interface FarmerJoeProps {
  weatherContext?: {
    location?: string;
    currentWeather?: any;
    forecast?: any;
    daily?: any[];
    rainfall?: {
      current1h: number;
      todayExpectedMm: number;
      todayChancePct: number;
    };
    wind?: {
      speedKmh: number;
      gustKmh: number | null;
      direction: string;
    };
    deltaT?: number;
    deltaTRating?: string;
    humidity?: number;
    tempC?: number;
    dewpointC?: number;
    uvIndex?: number;
    pressure?: number;
    feelsLike?: number;
    soilTempC?: number;
    soilMoisturePct?: number;
    probeIsLive?: boolean;
    sprayWindow?: { start: string; end: string; rating: string } | null;
    frostRisk?: boolean;
    frostWarning?: boolean;
    minTempNext24h?: number;
  };
  isAuthenticated?: boolean;
}

const FarmerJoeAvatar = ({ size = 'md', glowing = false }: { size?: 'sm' | 'md' | 'lg'; glowing?: boolean }) => {
  const dims = { sm: 40, md: 52, lg: 68 };
  const d = dims[size];

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: d, height: d }}
    >
      {glowing && (
        <div
          className="absolute inset-0 rounded-full animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, rgba(34,197,94,0.35) 0%, rgba(34,197,94,0) 70%)',
            transform: 'scale(1.5)',
          }}
        />
      )}
      <div
        className="relative rounded-full overflow-hidden border-2 border-green-500/50 shadow-lg"
        style={{
          width: d,
          height: d,
          boxShadow: glowing ? '0 0 16px 4px rgba(34,197,94,0.3)' : undefined,
        }}
      >
        <svg viewBox="0 0 100 100" width={d} height={d}>
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a3a2a" />
              <stop offset="100%" stopColor="#0f2419" />
            </linearGradient>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f5cba7" />
              <stop offset="100%" stopColor="#e8a87c" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="50" fill="url(#bgGrad)" />
          <circle cx="50" cy="44" r="26" fill="url(#skinGrad)" />
          <path d="M 28 42 Q 29 28 50 27 Q 71 28 72 42" fill="#6b3a1f" />
          <rect x="24" y="30" width="52" height="10" rx="5" fill="#8B4513" />
          <rect x="20" y="37" width="60" height="6" rx="3" fill="#A0522D" />
          <ellipse cx="39" cy="44" rx="4" ry="4.5" fill="#2C1810" />
          <ellipse cx="61" cy="44" rx="4" ry="4.5" fill="#2C1810" />
          <ellipse cx="40" cy="43" rx="1.5" ry="1.5" fill="#fff" opacity="0.6" />
          <ellipse cx="62" cy="43" rx="1.5" ry="1.5" fill="#fff" opacity="0.6" />
          <path d="M 42 54 Q 50 60 58 54" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 37 38 Q 40 35 43 38" stroke="#5C3D2E" strokeWidth="1.5" fill="none" />
          <path d="M 57 38 Q 60 35 63 38" stroke="#5C3D2E" strokeWidth="1.5" fill="none" />
          <circle cx="50" cy="50" r="50" fill="none" stroke="rgba(34,197,94,0.15)" strokeWidth="1" />
          <ellipse cx="50" cy="76" rx="20" ry="16" fill="#1e4d30" />
          <rect x="43" y="74" width="6" height="14" rx="3" fill="#2d6b42" />
          <rect x="51" y="74" width="6" height="14" rx="3" fill="#2d6b42" />
        </svg>
      </div>
    </div>
  );
};

const TOOLTIP_TOPICS = [
  { label: 'Weather & spraying', icon: '🌤' },
  { label: 'Soil & irrigation', icon: '💧' },
  { label: 'Livestock advice', icon: '🐄' },
  { label: 'Machinery & timing', icon: '🚜' },
  { label: 'Pest identification', icon: '🔍' },
];

const SUGGESTION_PROMPTS = [
  'What are the best spray conditions today?',
  'When should I plant my crops this week?',
  'Help me identify this pest (upload image)',
  'Is it safe to muster today?',
];

export default function FarmerJoe({ weatherContext, isAuthenticated = false }: FarmerJoeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [guestQuestionCount, setGuestQuestionCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasEngaged, setHasEngaged] = useState(false);
  const [showIntroTooltip, setShowIntroTooltip] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_GUEST_QUESTIONS = 3;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const hasEngagedBefore = localStorage.getItem('farmerJoeEngaged') === 'true';
    setHasEngaged(hasEngagedBefore);

    if (!hasEngagedBefore) {
      const introTimeout = setTimeout(() => {
        setShowIntroTooltip(true);
      }, 3500);
      const hideIntro = setTimeout(() => {
        setShowIntroTooltip(false);
      }, 12000);
      return () => {
        clearTimeout(introTimeout);
        clearTimeout(hideIntro);
      };
    }
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadChatHistory();
    }
  }, [isOpen, isAuthenticated]);

  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }

      if (data && data.length > 0) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setShowIntroTooltip(false);
    setShowTooltip(false);
    setIsMinimized(false);

    if (!hasEngaged) {
      localStorage.setItem('farmerJoeEngaged', 'true');
      setHasEngaged(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedImage(base64String);
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() && !selectedImage) return;

    if (!isAuthenticated) {
      if (guestQuestionCount >= MAX_GUEST_QUESTIONS) {
        alert('You have reached the maximum number of guest questions. Please sign up to continue.');
        return;
      }
      setGuestQuestionCount(prev => prev + 1);
    }

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
      image_url: selectedImage,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const imageToSend = selectedImage;
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/farmer-joe`;

      const requestBody = {
        message: input,
        weatherContext,
        chatHistory: messages.map(m => ({
          role: m.role,
          content: m.content,
          image_url: m.image_url,
        })),
        image: imageToSend,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': session?.access_token
          ? `Bearer ${session.access_token}`
          : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: data.messageId || `temp-assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => {
        const withoutTempUser = prev.filter(m => m.id !== userMessage.id);
        return [
          ...withoutTempUser,
          { ...userMessage, id: data.userMessageId || userMessage.id },
          assistantMessage,
        ];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all chat history? This cannot be undone.')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setMessages([]);
    } catch (error) {
      console.error('Error clearing history:', error);
      alert('Failed to clear history');
    }
  };

  return (
    <>
      <style>{`
        @keyframes joe-breathe {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0.0), 0 8px 32px rgba(0,0,0,0.4); }
          50% { transform: scale(1.04); box-shadow: 0 0 0 8px rgba(34,197,94,0.12), 0 12px 40px rgba(0,0,0,0.5); }
        }
        @keyframes joe-glow-ring {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes joe-tooltip-in {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes joe-chat-in {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .joe-btn { animation: joe-breathe 3.5s ease-in-out infinite; }
        .joe-glow-ring { animation: joe-glow-ring 3.5s ease-in-out infinite; }
        .joe-tooltip-in { animation: joe-tooltip-in 0.3s ease-out forwards; }
        .joe-chat-in { animation: joe-chat-in 0.28s cubic-bezier(0.34,1.2,0.64,1) forwards; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
      `}</style>

      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {showIntroTooltip && (
            <div className="joe-tooltip-in bg-slate-800/95 border border-slate-600/60 rounded-2xl shadow-2xl p-4 max-w-[220px] backdrop-blur-md">
              <div className="flex items-center gap-2 mb-2">
                <Wheat className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="text-xs font-bold text-white">Farmer Joe — AI Assistant</p>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">Ask me anything about your farm today.</p>
              <div className="space-y-1">
                {TOOLTIP_TOPICS.map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="text-base leading-none">{t.icon}</span>
                    <span>{t.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowIntroTooltip(false)}
                className="absolute top-2 right-2 text-slate-600 hover:text-slate-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {showTooltip && !showIntroTooltip && (
            <div className="joe-tooltip-in bg-slate-800/90 border border-slate-600/50 rounded-xl shadow-xl px-3 py-2 backdrop-blur-sm">
              <p className="text-xs font-medium text-slate-200 whitespace-nowrap">AI farming assistant — ask me anything</p>
            </div>
          )}

          <div className="relative">
            <div
              className="absolute inset-0 rounded-full joe-glow-ring pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)',
                transform: 'scale(1.4)',
              }}
            />

            <button
              onClick={handleOpen}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="joe-btn relative w-[72px] h-[72px] rounded-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-green-500/60 shadow-2xl hover:border-green-400/80 transition-colors duration-200 focus:outline-none"
              aria-label="Open Farmer Joe AI assistant"
            >
              <div className="absolute inset-0 rounded-full ring-2 ring-green-500/20" />
              <FarmerJoeAvatar size="md" glowing />
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="joe-chat-in fixed bottom-6 right-6 z-50 flex flex-col shadow-2xl rounded-2xl overflow-hidden"
          style={{
            width: 400,
            height: isMinimized ? 'auto' : 620,
            boxShadow: '0 0 0 1px rgba(34,197,94,0.2), 0 25px 60px rgba(0,0,0,0.6)',
            background: 'linear-gradient(to bottom, #0f1a13, #0b1410)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-green-900/40 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #0d2117 0%, #111e15 100%)' }}
            onClick={() => setIsMinimized(m => !m)}
          >
            <div className="flex items-center gap-3">
              <FarmerJoeAvatar size="sm" glowing />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm tracking-wide">Farmer Joe</h3>
                  <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-500">Your AI farming assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              {isAuthenticated && messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all"
                  title="Clear chat history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(m => !m)}
                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all"
                title={isMinimized ? 'Expand' : 'Minimise'}
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={handleClose}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800/60 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'linear-gradient(to bottom, #0d1a10, #091209)' }}>
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                      <p className="text-xs text-slate-500">Loading your history...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-2 py-6">
                    <div className="mb-4">
                      <FarmerJoeAvatar size="lg" glowing />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">G'day! I'm Farmer Joe</h4>
                    <p className="text-sm text-slate-400 mb-3 leading-relaxed max-w-xs">
                      Your AI farming assistant. Ask me about spray windows, soil conditions, livestock, or anything farm-related.
                    </p>
                    <p className="text-[10px] text-slate-600 leading-relaxed mb-4 max-w-xs italic">
                      General guidance only. Always verify with product labels, APVMA registrations, and your agronomist before acting on any advice.
                    </p>
                    <div className="w-full space-y-2">
                      {SUGGESTION_PROMPTS.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => setInput(prompt)}
                          className="w-full text-left text-xs bg-slate-800/60 hover:bg-green-900/30 border border-slate-700/60 hover:border-green-600/40 text-slate-300 hover:text-white rounded-xl px-3 py-2.5 transition-all duration-150 flex items-center gap-2"
                        >
                          <span className="w-1 h-1 rounded-full bg-green-500 flex-shrink-0" />
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 mt-1">
                          <FarmerJoeAvatar size="sm" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          message.role === 'user'
                            ? 'bg-green-700/80 text-white border border-green-600/40'
                            : 'bg-slate-800/80 text-slate-200 border border-slate-700/50'
                        }`}
                        style={{
                          boxShadow: message.role === 'user'
                            ? '0 4px 16px rgba(34,197,94,0.15)'
                            : '0 4px 16px rgba(0,0,0,0.3)',
                        }}
                      >
                        {message.image_url && (
                          <img
                            src={message.image_url}
                            alt="Uploaded"
                            className="rounded-lg mb-2 max-w-full h-auto border border-slate-700/50"
                          />
                        )}
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 mt-1">
                      <FarmerJoeAvatar size="sm" />
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl px-4 py-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {!isAuthenticated && guestQuestionCount >= MAX_GUEST_QUESTIONS ? (
                <div className="p-4 border-t border-green-900/30 bg-slate-900/80">
                  <p className="text-sm text-slate-300 mb-3 text-center">
                    You've used all {MAX_GUEST_QUESTIONS} guest questions.
                  </p>
                  <button
                    onClick={() => window.location.href = '/?signup=true'}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm shadow-lg shadow-green-900/40"
                  >
                    Sign Up to Continue — Free
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="p-3 border-t border-green-900/30"
                  style={{ background: 'rgba(13,26,16,0.95)' }}
                >
                  {imagePreview && (
                    <div className="mb-2 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-xl border border-green-600/50"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-400 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-green-400 border border-slate-700/60 rounded-xl transition-all flex-shrink-0"
                      title="Upload image for pest identification"
                    >
                      <Camera className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask Farmer Joe anything..."
                      className="flex-1 bg-slate-800/60 border border-slate-700/60 text-slate-200 placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-600/60 focus:ring-1 focus:ring-green-600/30 transition-all"
                      disabled={isLoading}
                    />

                    <button
                      type="submit"
                      disabled={isLoading || (!input.trim() && !selectedImage)}
                      className="p-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all flex-shrink-0 shadow-lg shadow-green-900/30"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  {!isAuthenticated && (
                    <p className="text-xs text-slate-600 mt-2 text-center">
                      {MAX_GUEST_QUESTIONS - guestQuestionCount} free question{MAX_GUEST_QUESTIONS - guestQuestionCount !== 1 ? 's' : ''} remaining — sign up for unlimited access
                    </p>
                  )}
                </form>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
