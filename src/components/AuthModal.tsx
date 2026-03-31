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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const cardElementRef = useRef<any>(null);
  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const [stripeInitialized, setStripeInitialized] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === 'login');
      setIsForgotPassword(false);
      setShowPaymentStep(false);
      setError(null);
      setSuccessMessage(null);
      setEmail('');
      setPassword('');
      setName('');
      setPhoneNumber('');
      setNewUserId(null);
    }

    return () => {
      if (cardElementRef.current) {
        cardElementRef.current.destroy();
        cardElementRef.current = null;
      }
    };
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (showPaymentStep && isOpen && !stripeInitialized) {
      initializeStripe();
    }
  }, [showPaymentStep, isOpen]);

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
        setupFutureUsage: 'off_session',
        paymentMethodCreation: 'manual',
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
        const paymentElement = elements.create('payment', {
          layout: 'tabs',
          wallets: {
            applePay: 'auto',
            googlePay: 'auto'
          }
        });
        const container = document.getElementById('card-element');
        if (container) {
          paymentElement.mount('#card-element');
          cardElementRef.current = paymentElement;
          setStripeInitialized(true);
        }
      }, 100);
    } catch (err) {
      console.error('Error initializing Stripe:', err);
    }
  };

  if (!isOpen) return null;

  const handleAccountCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

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
        // Wait for profile to be created by trigger, then update it
        let retries = 0;
        const maxRetries = 5;
        let profileUpdated = false;

        while (retries < maxRetries && !profileUpdated) {
          if (retries > 0) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 200 * retries));
          }

          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              phone_number: normalizedPhone,
              full_name: name,
            })
            .eq('id', authData.user.id);

          if (!updateError) {
            profileUpdated = true;
          } else if (retries === maxRetries - 1) {
            console.error('Error updating profile after retries:', updateError);
            throw new Error('Failed to save user profile. Please try again.');
          }

          retries++;
        }

        setNewUserId(authData.user.id);
        setShowPaymentStep(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!stripeRef.current || !elementsRef.current) {
        throw new Error('Payment system not ready. Please wait a moment and try again.');
      }

      const { error: submitError } = await elementsRef.current.submit();
      if (submitError) {
        throw new Error(submitError.message);
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

      const { clientSecret, customerId } = await response.json();

      const { error: paymentMethodError, paymentMethod } = await stripeRef.current.createPaymentMethod({
        elements: elementsRef.current,
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      const { error: confirmError } = await stripeRef.current.confirmSetup({
        clientSecret,
        confirmParams: {
          payment_method: paymentMethod.id,
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      const trialEndDate = new Date();
      trialEndDate.setMonth(trialEndDate.getMonth() + 1);

      // Retry logic for profile update
      let retries = 0;
      const maxRetries = 3;
      let updateSuccess = false;

      while (retries < maxRetries && !updateSuccess) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 300 * retries));
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            trial_end_date: trialEndDate.toISOString(),
            stripe_customer_id: customerId,
            payment_method_set: true
          })
          .eq('id', newUserId);

        if (!updateError) {
          updateSuccess = true;
        } else if (retries === maxRetries - 1) {
          console.error('Error updating profile after retries:', updateError);
          throw new Error('Failed to save payment information. Please try again.');
        }

        retries++;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
        options: {
          persistSession: rememberMe,
        },
      });
      if (error) throw error;
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}`,
      });
      if (error) throw error;
      setSuccessMessage('Password reset link sent! Check your email inbox. Click the link to set a new password.');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (showPaymentStep) {
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
            <div className="text-center mb-6">
              <div className="bg-green-100 text-green-600 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-green-900 mb-2">
                Account Created!
              </h2>
              <p className="text-gray-600">
                Now let's set up your payment method to start your free trial
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-green-600 text-white rounded-full p-1.5 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">No Charge Today</h3>
                  <p className="text-sm text-gray-700">
                    Your card won't be charged for 1 month. Cancel anytime during your trial.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handlePaymentSetup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Details
                </label>
                <div id="card-element" className="p-3 border border-gray-300 rounded-lg bg-white min-h-[44px]"></div>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-3.5 h-3.5 text-green-600" />
                  <span>Secured by Stripe. No charge during your 1-month trial.</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3.5 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Complete Setup'}
              </button>

              <p className="text-xs text-center text-gray-500">
                After 1 month, you'll be charged $5.99/month recurring until you cancel.
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
            {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Get Started with FarmCast'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isForgotPassword
              ? 'Enter your email to receive a password reset link'
              : isLogin ? 'Sign in to access your farm data' : 'Start your 1-month free trial today'}
          </p>

          {!isLogin && !isForgotPassword && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-green-600 text-white rounded-full p-1.5 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">1 Month Free Trial</h3>
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

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={isForgotPassword ? handleForgotPassword : isLogin ? handleLogin : handleAccountCreation} className="space-y-4">
            {!isLogin && !isForgotPassword && (
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
                      required
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
                      required
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

            {!isForgotPassword && (
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
            )}

            {isLogin && !isForgotPassword && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-sm text-green-700 hover:text-green-800 font-semibold"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3.5 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Continue to Payment'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {isForgotPassword ? (
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-green-700 hover:text-green-800 font-semibold text-sm"
              >
                Back to sign in
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-green-700 hover:text-green-800 font-semibold text-sm"
              >
                {isLogin ? "Don't have an account? Start free trial" : 'Already have an account? Sign in'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
