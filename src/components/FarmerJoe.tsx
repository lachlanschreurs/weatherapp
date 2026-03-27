import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Trash2, Loader2, Camera, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SubscriptionManager from './SubscriptionManager';

interface Message {
  id: string;
  message: string;
  response: string;
  created_at: string;
  image_url?: string | null;
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

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionEndsAt: string | null;
  needsSubscription: boolean;
  messagesCount: number;
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
  const [imageUploadCount, setImageUploadCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [hasEngaged, setHasEngaged] = useState(false);
  const [bubbleText, setBubbleText] = useState("Hey! Got a farming question?");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FREE_MESSAGES = 10;
  const MAX_FREE_UPLOADS = 2;
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
      // Show bubble after first drop (at 2s into 4s animation)
      const showBubbleTimeout = setTimeout(() => {
        setShowBubble(true);
        setBubbleText("Hey! Got a farming question?");
      }, 2500);

      // Hide bubble after total animation + display time
      const hideTimeout = setTimeout(() => {
        setShowBubble(false);
      }, 10500);

      return () => {
        clearTimeout(showBubbleTimeout);
        clearTimeout(hideTimeout);
      };
    } else {
      setShowBubble(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
      if (!isAuthenticated) {
        const savedCount = localStorage.getItem('farmerJoeGuestQuestions');
        setGuestQuestionCount(savedCount ? parseInt(savedCount) : 0);
      } else {
        checkSubscriptionStatus();
        sendGreeting();
      }
    }
  }, [isOpen, isAuthenticated]);

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubscriptionStatus(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('farmer_joe_subscription_status, farmer_joe_subscription_ends_at, farmer_joe_messages_count')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const hasActiveSubscription = data.farmer_joe_subscription_status === 'active' &&
          (!data.farmer_joe_subscription_ends_at || new Date(data.farmer_joe_subscription_ends_at) > new Date());

        const messagesCount = data.farmer_joe_messages_count || 0;

        setSubscriptionStatus({
          hasActiveSubscription,
          subscriptionEndsAt: data.farmer_joe_subscription_ends_at,
          needsSubscription: !hasActiveSubscription && messagesCount >= MAX_FREE_MESSAGES,
          messagesCount
        });
      } else {
        setSubscriptionStatus({
          hasActiveSubscription: false,
          subscriptionEndsAt: null,
          needsSubscription: false,
          messagesCount: 0
        });
      }

      // Get image upload count
      const { count } = await supabase
        .from('farmer_joe_chats')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .not('image_url', 'is', null);

      setImageUploadCount(count || 0);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const sendGreeting = async () => {
    // Greeting removed - users start the conversation
  };

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Check upload limit for non-subscribers
    if (subscriptionStatus && !subscriptionStatus.hasActiveSubscription && imageUploadCount >= MAX_FREE_UPLOADS) {
      setShowSubscriptionPrompt(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      setSelectedImage(base64Data);
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

  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage = input.trim() || 'Please analyze this image';
    const imageData = selectedImage;
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (guestQuestionCount >= MAX_FREE_MESSAGES) {
          const tempId = `temp-${Date.now()}`;
          const tempMessage: Message = {
            id: tempId,
            message: userMessage,
            response: "You've reached your 10 free messages! Sign in to subscribe and get unlimited access to Farmer Joe for just $5.99/month. Get personalized farming advice, weather insights, and save your conversation history. Click the sign-in button at the top right to get started!",
            created_at: new Date().toISOString(),
          };
          setMessages(prev => [...prev, tempMessage]);
          setIsLoading(false);
          return;
        }

        const newCount = guestQuestionCount + 1;
        setGuestQuestionCount(newCount);
        localStorage.setItem('farmerJoeGuestQuestions', newCount.toString());

        const remainingQuestions = MAX_FREE_MESSAGES - newCount;
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
          id: tempId,
          message: userMessage,
          response: `Thanks for your question! ${remainingQuestions > 0 ? `You have ${remainingQuestions} free message${remainingQuestions !== 1 ? 's' : ''} remaining.` : 'This was your last free message!'} Sign in and subscribe for just $5.99/month to get unlimited access, personalized advice based on your location and weather, and save your chat history. Here's a quick tip: Check the current spray conditions and 5-day forecast on the main dashboard!`,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMessage]);
        setIsLoading(false);
        return;
      }

      // Check if authenticated user has active subscription
      if (subscriptionStatus?.needsSubscription) {
        setShowSubscriptionPrompt(true);
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
          id: tempId,
          message: userMessage,
          response: "To continue chatting with Farmer Joe, you'll need to subscribe for just $5.99/month. This gives you unlimited access to personalized farming advice, weather insights, and your conversation history is always saved. Click the 'Subscribe Now' button below to get started!",
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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message: userMessage,
          imageBase64: imageData,
          weatherContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Edge function error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received response from Farmer Joe:', data);

      await loadChatHistory();
      await checkSubscriptionStatus(); // Refresh counts after message
    } catch (error) {
      console.error('Error sending message:', error);

      const tempId = `error-${Date.now()}`;
      const errorMessage: Message = {
        id: tempId,
        message: userMessage,
        response: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check your connection.`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
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
        <div className="fixed right-6 bottom-6 z-50">
          {showBubble && !hasEngaged && (
            <div className="absolute bottom-full right-0 mb-4 animate-bounce-gentle">
              <div className="relative bg-white rounded-2xl shadow-2xl px-6 py-4 max-w-[220px] border-2 border-green-400">
                <button
                  onClick={() => setShowBubble(false)}
                  className="absolute -top-2 -right-2 bg-gray-600 text-white rounded-full p-1 hover:bg-gray-700 transition-colors shadow-md"
                  aria-label="Dismiss bubble"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-sm font-bold text-green-700 text-center leading-relaxed">
                  {bubbleText}
                </p>
                <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r-2 border-b-2 border-green-400 transform rotate-45"></div>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setIsOpen(true);
              setShowBubble(false);
              if (!hasEngaged) {
                localStorage.setItem('farmerJoeEngaged', 'true');
                setHasEngaged(true);
              }
            }}
            className={`bg-gradient-to-br from-green-600 to-green-700 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 group p-1 ${!hasEngaged ? 'animate-drop-bounce' : ''}`}
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
        </div>
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
                <p className="text-xs text-green-100">
                  {subscriptionStatus?.hasActiveSubscription ? (
                    'Premium Subscriber'
                  ) : isAuthenticated && subscriptionStatus ? (
                    `${Math.max(0, MAX_FREE_MESSAGES - subscriptionStatus.messagesCount)} free messages left`
                  ) : !isAuthenticated ? (
                    `${MAX_FREE_MESSAGES - guestQuestionCount} free messages left`
                  ) : (
                    'Your AI Farming Assistant'
                  )}
                </p>
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
                    <p className="font-medium mb-2">Free Trial: {MAX_FREE_MESSAGES - guestQuestionCount} messages remaining</p>
                    <p className="font-medium mb-1">Subscribe for $5.99/month:</p>
                    <ul className="text-left space-y-1">
                      <li>• Unlimited messages</li>
                      <li>• Unlimited image uploads</li>
                      <li>• Save conversation history</li>
                      <li>• Get personalized advice</li>
                    </ul>
                  </div>
                )}
                {isAuthenticated && subscriptionStatus && !subscriptionStatus.hasActiveSubscription && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 mt-2">
                    <p className="font-medium mb-2">Free Trial</p>
                    <p className="text-xs mb-2">• {Math.max(0, MAX_FREE_MESSAGES - subscriptionStatus.messagesCount)} messages remaining</p>
                    <p className="text-xs mb-3">• {Math.max(0, MAX_FREE_UPLOADS - imageUploadCount)} image uploads remaining</p>
                    <button
                      onClick={() => setShowSubscriptionManager(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors text-xs"
                    >
                      Subscribe Now - $5.99/month
                    </button>
                  </div>
                )}
                {isAuthenticated && subscriptionStatus?.needsSubscription && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mt-2">
                    <p className="font-semibold mb-2">Subscription Required</p>
                    <p className="mb-2">Subscribe to Farmer Joe for just $5.99/month to get:</p>
                    <ul className="text-left space-y-1 mb-3">
                      <li>• Unlimited AI chat access</li>
                      <li>• Personalized farm advice</li>
                      <li>• Weather-based insights</li>
                      <li>• Conversation history</li>
                    </ul>
                    <button
                      onClick={() => setShowSubscriptionManager(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                      Subscribe Now - $5.99/month
                    </button>
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {/* User Message - only show if message exists */}
                  {msg.message && (
                    <div className="flex justify-end items-end gap-2">
                      <div className="bg-blue-600 text-white rounded-2xl rounded-br-none px-4 py-3 max-w-[80%] shadow-md">
                        {msg.image_url && (
                          <div className="mb-2">
                            <div className="bg-white rounded p-1">
                              <Camera className="w-8 h-8 text-blue-600 mx-auto" />
                              <p className="text-xs text-blue-600 text-center mt-1">Image attached</p>
                            </div>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Farmer Joe Response */}
                  <div className="flex justify-start items-start gap-2">
                    <div className="flex-shrink-0 mt-1">
                      <FarmerJoeAvatar size="sm" />
                    </div>
                    <div className="bg-green-50 border-2 border-green-200 rounded-2xl rounded-tl-none px-4 py-3 max-w-[75%] shadow-sm">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{msg.response}</p>
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
            {!isAuthenticated && guestQuestionCount >= MAX_FREE_MESSAGES ? (
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 text-center">
                <p className="font-semibold mb-2">Free Trial Expired</p>
                <p className="text-sm mb-3">You've used all 10 free messages! Sign in and subscribe for $5.99/month to unlock unlimited access to Farmer Joe!</p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Sign In Now
                </button>
              </div>
            ) : subscriptionStatus?.needsSubscription && showSubscriptionPrompt ? (
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-4 text-center">
                <p className="font-semibold mb-2">Free Trial Complete</p>
                <p className="text-sm mb-3">You've used all 10 free messages. Subscribe for $5.99/month to continue chatting with Farmer Joe!</p>
                <button
                  onClick={() => setShowSubscriptionManager(true)}
                  className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors w-full"
                >
                  Subscribe Now - $5.99/month
                </button>
              </div>
            ) : (
              <>
                {imagePreview && (
                  <div className="mb-3 relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Selected"
                      className="max-w-[200px] max-h-[200px] rounded-lg border-2 border-green-300 object-cover"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={imagePreview ? "Describe what you want to know about this image..." : "Type your message or upload a photo..."}
                    disabled={isLoading}
                    className="w-full px-4 py-3 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-sm rounded-t-lg"
                  />
                  <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                        disabled={isLoading}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Upload photo of pest or disease"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                      <p className="text-xs text-gray-500">
                        {!isAuthenticated && guestQuestionCount > 0
                          ? `${MAX_GUEST_QUESTIONS - guestQuestionCount} free questions left`
                          : imagePreview ? 'Photo ready to analyze' : 'Ask about pests, diseases, weather'
                        }
                      </p>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={(!input.trim() && !selectedImage) || isLoading}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <span className="text-sm font-medium">Send</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showSubscriptionManager && (
        <SubscriptionManager onClose={() => setShowSubscriptionManager(false)} />
      )}
    </>
  );
}
