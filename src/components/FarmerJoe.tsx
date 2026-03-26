import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Trash2, Loader2 } from 'lucide-react';
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
}

export default function FarmerJoe({ weatherContext }: FarmerJoeProps) {
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
        alert('Please sign in to chat with Farmer Joe');
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

      // Reload chat history to get the new message
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
      {/* Side Tab */}
      <div
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-0'
        }`}
      >
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-green-600 text-white px-3 py-6 rounded-l-lg shadow-lg hover:bg-green-700 transition-all duration-200 flex flex-col items-center gap-2 group"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            <MessageCircle className="w-5 h-5 rotate-180" />
            <span className="font-semibold text-sm whitespace-nowrap">
              Farmer Joe
            </span>
          </button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed right-0 top-0 w-full sm:w-[450px] h-full bg-white shadow-2xl flex flex-col z-50 border-l-2 border-green-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-800 rounded-full flex items-center justify-center text-lg font-bold">
                🧑‍🌾
              </div>
              <div>
                <h3 className="font-semibold">Farmer Joe</h3>
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
                <div className="text-4xl mb-3">👋</div>
                <p className="text-sm font-medium mb-2">Howdy! I'm Farmer Joe</p>
                <p className="text-xs">
                  Ask me about weather conditions, farm planning, or any farming advice you need!
                </p>
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
