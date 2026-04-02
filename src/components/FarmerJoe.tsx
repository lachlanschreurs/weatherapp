import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Trash2, Loader2, Camera, XCircle } from 'lucide-react';
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
  };
  isAuthenticated?: boolean;
}

const FarmerJoeAvatar = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#86A789" stroke="#5C7556" strokeWidth="2"/>
        <circle cx="50" cy="45" r="35" fill="#F5E6D3"/>
        <rect x="30" y="15" width="40" height="15" rx="8" fill="#8B4513"/>
        <rect x="25" y="25" width="50" height="8" fill="#A0522D"/>
        <ellipse cx="38" cy="45" rx="4" ry="5" fill="#2C1810"/>
        <ellipse cx="62" cy="45" rx="4" ry="5" fill="#2C1810"/>
        <path d="M 40 58 Q 50 63 60 58" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M 35 38 Q 38 35 41 38" stroke="#5C3D2E" strokeWidth="1.5" fill="none"/>
        <path d="M 59 38 Q 62 35 65 38" stroke="#5C3D2E" strokeWidth="1.5" fill="none"/>
        <circle cx="50" cy="75" r="12" fill="#4A7C59"/>
        <rect x="38" y="82" width="8" height="18" fill="#5C7556"/>
        <rect x="54" y="82" width="8" height="18" fill="#5C7556"/>
      </svg>
    </div>
  );
}

export default function FarmerJoe({ weatherContext, isAuthenticated = false }: FarmerJoeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [guestQuestionCount, setGuestQuestionCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showBubble, setShowBubble] = useState(true);
  const [hasEngaged, setHasEngaged] = useState(false);
  const [bubbleText, setBubbleText] = useState("Hey! Got a farming question?");
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
      const showBubbleTimeout = setTimeout(() => {
        setShowBubble(true);
        setBubbleText("Hey! Got a farming question?");
      }, 2700);

      const hideTimeout = setTimeout(() => {
        setShowBubble(false);
      }, 10000);

      return () => {
        clearTimeout(showBubbleTimeout);
        clearTimeout(hideTimeout);
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
    setShowBubble(false);

    if (!hasEngaged) {
      localStorage.setItem('farmerJoeEngaged', 'true');
      setHasEngaged(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/farmer-joe`;

      const requestBody = {
        message: input,
        weatherContext: weatherContext,
        chatHistory: messages.map(m => ({
          role: m.role,
          content: m.content,
          image_url: m.image_url
        })),
        image: imageToSend,
      };

      console.log('Sending request to Farmer Joe:', {
        url: apiUrl,
        messageLength: input.length,
        hasImage: !!imageToSend,
        historyCount: messages.length
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', {
          status: response.status,
          statusText: response.statusText,
          url: apiUrl,
          errorText: errorText
        });
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('API response:', data);

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
          assistantMessage
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
    if (!confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      return;
    }

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

  if (!isOpen && showBubble && !hasEngaged) {
    return (
      <>
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all z-50 animate-bounce-gentle flex items-center justify-center"
          style={{
            width: '70px',
            height: '70px',
            animation: 'gentle-bounce 2.5s ease-in-out infinite'
          }}
        >
          <FarmerJoeAvatar size="md" />
        </button>

        <div className="fixed bottom-28 right-6 bg-white rounded-2xl shadow-2xl p-4 z-50 max-w-xs border-2 border-green-600 animate-fade-in">
          <div className="flex items-start gap-3">
            <FarmerJoeAvatar size="sm" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 mb-1">Farmer Joe</p>
              <p className="text-sm text-gray-700">{bubbleText}</p>
            </div>
            <button
              onClick={() => setShowBubble(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <style>{`
          @keyframes gentle-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-bounce-gentle {
            animation: gentle-bounce 2.5s ease-in-out infinite;
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
        `}</style>
      </>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all z-50 flex items-center justify-center"
        style={{
          width: '70px',
          height: '70px',
        }}
      >
        <FarmerJoeAvatar size="md" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border-2 border-green-600">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FarmerJoeAvatar size="sm" />
          <div>
            <h3 className="font-bold text-lg">Farmer Joe</h3>
            <p className="text-xs text-green-100">Your farming assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-white hover:bg-green-800 p-2 rounded transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleClose}
            className="text-white hover:bg-green-800 p-2 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-green-50 to-white">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <FarmerJoeAvatar size="lg" />
            <h4 className="text-lg font-bold text-green-900 mt-4 mb-2">
              Welcome to Farmer Joe!
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              I'm here to help with farming advice, pest identification, and weather-based recommendations.
            </p>
            <div className="text-left w-full space-y-2">
              <p className="text-xs text-gray-500 font-semibold mb-2">Try asking:</p>
              <button
                onClick={() => setInput("What are the best spray conditions today?")}
                className="w-full text-left text-xs bg-white hover:bg-green-50 border border-green-200 rounded-lg p-2 transition-colors"
              >
                "What are the best spray conditions today?"
              </button>
              <button
                onClick={() => setInput("When should I plant my crops?")}
                className="w-full text-left text-xs bg-white hover:bg-green-50 border border-green-200 rounded-lg p-2 transition-colors"
              >
                "When should I plant my crops?"
              </button>
              <button
                onClick={() => setInput("Help me identify this pest (upload image)")}
                className="w-full text-left text-xs bg-white hover:bg-green-50 border border-green-200 rounded-lg p-2 transition-colors"
              >
                "Help me identify this pest (upload image)"
              </button>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <FarmerJoeAvatar size="sm" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-green-200 text-gray-800'
                }`}
              >
                {message.image_url && (
                  <img
                    src={message.image_url}
                    alt="Uploaded"
                    className="rounded-lg mb-2 max-w-full h-auto"
                  />
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <FarmerJoeAvatar size="sm" />
            </div>
            <div className="bg-white border border-green-200 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isAuthenticated && guestQuestionCount >= MAX_GUEST_QUESTIONS ? (
        <div className="p-4 bg-yellow-50 border-t border-yellow-200">
          <p className="text-sm text-gray-700 mb-3 text-center">
            You've reached the maximum number of guest questions.
          </p>
          <button
            onClick={() => window.location.href = '/?signup=true'}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Sign Up to Continue
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 border-t border-green-200">
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border-2 border-green-600"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
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
              className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
              title="Upload image"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Farmer Joe..."
              className="flex-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {!isAuthenticated && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              {MAX_GUEST_QUESTIONS - guestQuestionCount} guest questions remaining
            </p>
          )}
        </form>
      )}
    </div>
  );
}
