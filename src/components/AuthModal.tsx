import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Phone, Check, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'signup';
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
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const waitForProfile = async (userId: string, maxRetries = 10): Promise<boolean> => {
    for (let i = 0; i < maxRetries; i++) {
      console.log(`[Auth] Checking for profile... attempt ${i + 1}/${maxRetries}`);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, farmer_joe_subscription_status, email_subscription_started_at')
        .eq('id', userId)
        .maybeSingle();

      if (data && data.farmer_joe_subscription_status) {
        console.log('[Auth] ✓ Profile found and ready:', data);
        return true;
      }

      if (error) {
        console.log('[Auth] Profile check error:', error);
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('[Auth] Profile not found after retries, will create manually');
    return false;
  };

  const ensureProfileExists = async (userId: string, userEmail: string, fullName: string) => {
    console.log('[Auth] Ensuring profile exists for user:', userId);

    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
          full_name: fullName,
          farmer_joe_subscription_status: 'active',
          farmer_joe_subscription_started_at: new Date().toISOString(),
          email_subscription_started_at: new Date().toISOString(),
          probe_report_subscription_started_at: new Date().toISOString(),
        });

      if (error) {
        if (error.code === '23505') {
          console.log('[Auth] ✓ Profile already exists (conflict)');
          return true;
        }
        console.error('[Auth] Error creating profile:', error);
        return false;
      }

      console.log('[Auth] ✓ Profile created successfully');
      return true;
    } catch (err) {
      console.error('[Auth] Exception creating profile:', err);
      return false;
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      console.log('[Auth] === Starting Signup Process ===');

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

      console.log('[Auth] Creating account...');
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name,
            full_name: name,
          },
        },
      });

      if (signUpError) {
        console.error('[Auth] Signup error:', signUpError);
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      console.log('[Auth] ✓ Account created successfully');
      console.log('[Auth] User ID:', authData.user.id);

      console.log('[Auth] Waiting for session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('[Auth] Session error:', sessionError);
        throw new Error('Session not available. Please try signing in.');
      }

      console.log('[Auth] ✓ Session obtained');

      console.log('[Auth] Waiting for profile to be created by trigger...');
      const profileExists = await waitForProfile(authData.user.id);

      if (!profileExists) {
        console.log('[Auth] Profile not found, creating manually...');
        await ensureProfileExists(authData.user.id, email.trim(), name);
      }

      if (normalizedPhone) {
        console.log('[Auth] Updating phone number...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            phone_number: normalizedPhone,
            full_name: name,
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('[Auth] Phone update error:', updateError);
        } else {
          console.log('[Auth] ✓ Phone number updated');
        }
      }

      console.log('[Auth] ✓ Signup complete - user is ready');
      console.log('[Auth] === Signup Process Complete ===');

      setSuccessMessage('Account created successfully! Setting up payment...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setShowPaymentStep(true);
      setLoading(false);
    } catch (err: any) {
      console.error('[Auth] Signup error:', err);

      let errorMessage = 'An error occurred. Please try again.';

      if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.error_description) {
        errorMessage = err.error_description;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      console.log('[Auth] === Starting Login Process ===');
      console.log('[Auth] Email:', email);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('[Auth] Login error:', error);
        throw error;
      }

      console.log('[Auth] ✓ Login successful');
      console.log('[Auth] User ID:', data.user?.id);

      if (data.user) {
        console.log('[Auth] Verifying profile exists...');
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!profile) {
          console.log('[Auth] Profile missing, creating...');
          await ensureProfileExists(
            data.user.id,
            data.user.email || email.trim(),
            data.user.user_metadata?.name || data.user.user_metadata?.full_name || 'User'
          );
        } else {
          console.log('[Auth] ✓ Profile verified');
        }
      }

      console.log('[Auth] === Login Process Complete ===');

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      const errorMessage = err?.message || err?.error_description || 'Invalid email or password. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    setError(null);
    setLoading(true);

    try {
      console.log('[Auth] Initializing Stripe checkout...');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Session not available. Please sign in again.');
      }

      console.log('[Auth] Calling Stripe checkout session...');
      const checkoutUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;

      const response = await fetch(checkoutUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[Auth] Stripe checkout error:', text);
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(errorData?.error || 'Failed to initialize checkout');
      }

      const data = await response.json();

      if (data?.url) {
        console.log('[Auth] Redirecting to Stripe...');
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('[Auth] Payment setup error:', err);
      setError(err?.message || 'Failed to set up payment. Please try again.');
      setLoading(false);
    }
  };

  const handleSkipPayment = () => {
    console.log('[Auth] User skipped payment setup');
    onSuccess();
    onClose();
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
      setSuccessMessage('Password reset link sent! Check your email inbox.');
      setEmail('');
    } catch (err: any) {
      const errorMessage = err?.message || err?.error_description || 'Failed to send reset link. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            {showPaymentStep
              ? 'Complete Your Setup'
              : isForgotPassword
                ? 'Reset Password'
                : isLogin
                  ? 'Welcome Back'
                  : 'Get Started with FarmCast'}
          </h2>
          <p className="text-gray-600 mb-6">
            {showPaymentStep
              ? 'Start your free 1-month trial today'
              : isForgotPassword
                ? 'Enter your email to receive a password reset link'
                : isLogin
                  ? 'Sign in to access your farm data'
                  : 'Start your free 1-month trial'}
          </p>

          {showPaymentStep && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-green-600 text-white rounded-full p-1.5 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-2">Account Created Successfully</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Add payment details to start your free 1-month trial
                  </p>
                  <div className="bg-white border border-green-100 rounded-md p-3 mb-3">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-green-900">$2.99</span>
                      <span className="text-sm text-gray-600">per month</span>
                    </div>
                    <p className="text-xs text-gray-500">After 1-month free trial</p>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1.5">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>Free for 1 month starting today</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>Then $2.99/month, cancel anytime</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>No charges during trial period</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>Secure payment with Stripe</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!isLogin && !isForgotPassword && !showPaymentStep && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-green-600 text-white rounded-full p-1.5 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">1-Month Free Trial</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-lg font-bold text-green-900">$2.99/month</span>
                    <span className="text-xs text-gray-600">after trial</span>
                  </div>
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
                      <span>Cancel anytime</span>
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

          {successMessage && !showPaymentStep && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {successMessage}
            </div>
          )}

          {showPaymentStep ? (
            <div className="space-y-4">
              <button
                onClick={handleStripeCheckout}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3.5 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redirecting to Stripe...
                  </>
                ) : (
                  'Continue to Free 1 Month Trial'
                )}
              </button>

              <button
                onClick={handleSkipPayment}
                disabled={loading}
                className="w-full text-gray-600 py-2 rounded-lg font-medium hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
            </div>
          ) : (
          <form onSubmit={isForgotPassword ? handleForgotPassword : isLogin ? handleLogin : handleSignup} className="space-y-4">
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
                    For account verification
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
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3.5 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin || isForgotPassword ? 'Please wait...' : 'Creating account...'}
                </>
              ) : (
                isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Free Account'
              )}
            </button>
          </form>
          )}

          {!showPaymentStep && (
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
                {isLogin ? "Don't have an account? Sign up free" : 'Already have an account? Sign in'}
              </button>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
