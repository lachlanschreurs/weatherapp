import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  message: string;
  response: string;
  created_at: string;
  isUser?: boolean;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const clearChatHistory = async () => {
    if (!confirm('Are you sure you want to clear your chat history with Farmer Joe?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all user's messages

      if (error) throw error;

      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
      alert('Failed to clear chat history');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
          id: tempId,
          message: userMessage,
          response: 'Please sign in to have a personalized conversation and save your chat history. For now, I can give you a quick tip: Check the current spray conditions and 5-day forecast on the main dashboard!',
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMessage]);
        setIsLoading(false);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/farmer-joe`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          weatherContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Farmer Joe');
      }

      const data = await response.json();

      await loadChatHistory();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-6 bottom-6 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 z-50 group p-1"
        >
          <div className="relative">
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-full p-3 flex items-center gap-3">
              <FarmerJoeAvatar size="md" />
              <div className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 pr-0 group-hover:pr-3">
                <span className="font-semibold text-sm whitespace-nowrap">Chat with Farmer Joe</span>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed right-0 top-0 w-full sm:w-[450px] h-full bg-white shadow-2xl flex flex-col z-50 border-l-2 border-green-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FarmerJoeAvatar size="md" />
              <div>
                <h3 className="font-semibold text-lg">Farmer Joe</h3>
                <p className="text-xs text-green-100">Your AI Farming Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChatHistory}
                className="hover:bg-green-800 p-2 rounded transition-colors"
                title="Clear chat history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-green-800 p-2 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center px-4">
                <FarmerJoeAvatar size="lg" />
                <p className="text-lg font-semibold mb-2 mt-4 text-gray-700">Howdy! I'm Farmer Joe</p>
                <p className="text-sm text-gray-600 mb-4">
                  Your AI farming assistant here to help with weather conditions, farm planning, and agricultural advice.
                </p>
                {!isAuthenticated && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 mt-2">
                    <p className="font-medium mb-1">Sign in for full features:</p>
                    <ul className="text-left space-y-1">
                      <li>• Save conversation history</li>
                      <li>• Get personalized advice</li>
                      <li>• Access weather context</li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-lg rounded-tr-none px-4 py-2 max-w-[80%]">
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>

                  {/* Farmer Joe Response */}
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg rounded-tl-none px-4 py-2 max-w-[80%] shadow-sm">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.response}</p>
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Farmer Joe is typing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="w-full px-4 py-3 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-sm rounded-t-lg"
              />
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Ask about spray windows, planting times, or weather
                </p>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <span className="text-sm font-medium">Send</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
