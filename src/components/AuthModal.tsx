import { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, Phone, CreditCard } from 'lucide-react';
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
  const [step, setStep] = useState<'auth' | 'payment'>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupUserId, setSignupUserId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const cardElementRef = useRef<any>(null);
  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === 'login');
      setStep('auth');
      setError(null);
      setSignupUserId(null);
      setClientSecret(null);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (step === 'payment' && clientSecret && !cardElementRef.current) {
      initializeStripe();
    }
  }, [step, clientSecret]);

  const initializeStripe = async () => {
    if (!window.Stripe) {
      setError('Payment system not loaded. Please refresh the page.');
      return;
    }

    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      setError('Payment configuration error');
      return;
    }

    stripeRef.current = window.Stripe(publishableKey);
    const elements = stripeRef.current.elements({
      clientSecret,
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
    const cardElement = elements.create('payment');
    cardElement.mount('#card-element');
    cardElementRef.current = cardElement;
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess();
        onClose();
      } else {
        if (!phoneNumber || phoneNumber.length < 10) {
          throw new Error('Please enter a valid phone number');
        }

        const normalizedPhone = phoneNumber.replace(/\D/g, '');

        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone_number', normalizedPhone)
          .maybeSingle();

        if (existingProfile) {
          throw new Error('This phone number is already registered. Each phone number can only be used once.');
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          setSignupUserId(authData.user.id);

          const trialEndDate = new Date();
          trialEndDate.setMonth(trialEndDate.getMonth() + 3);

          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              phone_number: normalizedPhone,
              trial_end_date: trialEndDate.toISOString()
            })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error('Error updating profile:', profileError);
          }

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

          const { clientSecret: secret, customerId } = await response.json();
          setClientSecret(secret);

          await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', authData.user.id);

          setStep('payment');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeRef.current || !elementsRef.current) {
      setError('Payment system not initialized');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: submitError } = await elementsRef.current.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: confirmError } = await stripeRef.current.confirmSetup({
        elements: elementsRef.current,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (signupUserId) {
        await supabase
          .from('profiles')
          .update({ payment_method_set: true })
          .eq('id', signupUserId);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment setup failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {step === 'auth' ? (
          <>
            <h2 className="text-3xl font-bold text-green-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isLogin ? 'Sign in to access your farm data' : 'Join FarmCast today'}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Your name"
                    required={!isLogin}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mobile Phone Number
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
                  Required to prevent multiple free trial registrations
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="your@email.com"
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
          </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Continue to Payment'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-green-700 hover:text-green-800 font-semibold"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-900">Payment Details</h2>
                <p className="text-sm text-gray-600">Secure your account</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">3 Months Free Trial</h3>
              <p className="text-sm text-blue-800 mb-2">
                Your card will <strong>not be charged</strong> until your free trial ends in 3 months.
              </p>
              <p className="text-sm text-blue-800">
                After the trial period, you'll be automatically billed on the day your trial ends. You can cancel anytime before then.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Card Details
                </label>
                <div id="card-element" className="p-3 border border-gray-300 rounded-lg bg-white"></div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Complete Signup'}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
              <Lock className="w-3 h-3" />
              <span>Secured by Stripe. Your payment information is encrypted.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
