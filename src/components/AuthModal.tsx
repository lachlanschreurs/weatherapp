import { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, Phone, CreditCard, Shield, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'signup';
}

declare global {
  interface Window {
    Stripe: any;
  }
}

export function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardElementRef = useRef<any>(null);
  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const [stripeInitialized, setStripeInitialized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === 'login');
      setError(null);
      setEmail('');
      setPassword('');
      setName('');
      setPhoneNumber('');

      if (!isLogin && initialMode === 'signup') {
        initializeStripe();
      }
    }

    return () => {
      if (cardElementRef.current) {
        cardElementRef.current.destroy();
        cardElementRef.current = null;
      }
    };
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isLogin && isOpen && !stripeInitialized) {
      initializeStripe();
    }
  }, [isLogin, isOpen]);

  const initializeStripe = async () => {
    if (stripeInitialized || cardElementRef.current) return;

    if (!window.Stripe) {
      console.error('Stripe not loaded');
      return;
    }

    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('Stripe publishable key not configured');
      return;
    }

    try {
      stripeRef.current = window.Stripe(publishableKey);
      const elements = stripeRef.current.elements({
        mode: 'setup',
        currency: 'aud',
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#16a34a',
            colorBackground: '#ffffff',
            colorText: '#1a202c',
            colorDanger: '#dc2626',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
        },
      });

      elementsRef.current = elements;

      setTimeout(() => {
        const cardElement = elements.create('payment');
        const container = document.getElementById('card-element');
        if (container) {
          cardElement.mount('#card-element');
          cardElementRef.current = cardElement;
          setStripeInitialized(true);
        }
      }, 100);
    } catch (err) {
      console.error('Error initializing Stripe:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onSuccess();
        onClose();
      } else {
        if (!phoneNumber || phoneNumber.length < 10) {
          throw new Error('Please enter a valid phone number');
        }

        if (!stripeRef.current || !elementsRef.current) {
          throw new Error('Payment system not ready. Please wait a moment and try again.');
        }

        const { error: submitError } = await elementsRef.current.submit();
        if (submitError) {
          throw new Error(submitError.message);
        }

        const normalizedPhone = phoneNumber.replace(/\D/g, '');

        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone_number', normalizedPhone)
          .maybeSingle();

        if (existingProfile) {
          throw new Error('This phone number is already registered.');
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('Session not found');
          }

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-setup-intent`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to initialize payment');
          }

          const { clientSecret, customerId } = await response.json();

          const { error: confirmError } = await stripeRef.current.confirmSetup({
            elements: elementsRef.current,
            clientSecret,
            confirmParams: {
              return_url: window.location.origin,
            },
            redirect: 'if_required',
          });

          if (confirmError) {
            throw new Error(confirmError.message);
          }

          const trialEndDate = new Date();
          trialEndDate.setMonth(trialEndDate.getMonth() + 3);

          await supabase
            .from('profiles')
            .update({
              phone_number: normalizedPhone,
              trial_end_date: trialEndDate.toISOString(),
              stripe_customer_id: customerId,
              payment_method_set: true
            })
            .eq('id', authData.user.id);

          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <h2 className="text-3xl font-bold text-green-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Get Started with FarmCast'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isLogin ? 'Sign in to access your farm data' : 'Start your 3-month free trial today'}
          </p>

          {!isLogin && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-green-600 text-white rounded-full p-1.5 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">3 Months Free Trial</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    No charge today. Your card won't be charged until your trial ends.
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>Unlimited Farmer Joe AI chat</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>Daily weather email alerts</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>Weekly probe reports</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>Cancel anytime before trial ends</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="John Smith"
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0412 345 678"
                      required={!isLogin}
                      minLength={10}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    One trial per phone number
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {!isLogin && (
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 6 characters
                </p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Details
                </label>
                <div id="card-element" className="p-3 border border-gray-300 rounded-lg bg-white min-h-[44px]"></div>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-3.5 h-3.5 text-green-600" />
                  <span>Secured by Stripe. No charge during your 3-month trial.</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3.5 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Start Free Trial'}
            </button>

            {!isLogin && (
              <p className="text-xs text-center text-gray-500">
                By signing up, you agree to our terms. After 3 months, you'll be charged $5.99/month unless you cancel.
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-green-700 hover:text-green-800 font-semibold text-sm"
            >
              {isLogin ? "Don't have an account? Start free trial" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
