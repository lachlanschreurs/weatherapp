import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Phone, Check } from 'lucide-react';
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
      setError(null);
      setSuccessMessage(null);
      setEmail('');
      setPassword('');
      setName('');
      setPhoneNumber('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('========================================');
    console.log('CONTINUE TO PAYMENT CLICKED');
    console.log('========================================');

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      console.log('1. Starting signup process...');
      console.log('Form data:', { email, name, phoneLength: phoneNumber.length });

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!phoneNumber || phoneNumber.length < 10) {
        throw new Error('Please enter a valid phone number');
      }

      const normalizedPhone = phoneNumber.replace(/\D/g, '');

      // Check if phone number is already in use
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', normalizedPhone)
        .maybeSingle();

      if (existingProfile) {
        throw new Error('This phone number is already registered.');
      }

      console.log('Creating account...');

      // Create the account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (signUpError) {
        console.error('2. SIGNUP ERROR:', signUpError);
        throw signUpError;
      }

      if (!authData.user) {
        console.error('2. SIGNUP FAILED - No user returned');
        throw new Error('Failed to create account');
      }

      console.log('2. ✓ SIGNUP SUCCESS - User created:', {
        userId: authData.user.id,
        email: authData.user.email,
        hasSession: !!authData.session
      });

      console.log('3. Updating profile with phone number...');

      // Wait for profile to be created by trigger, then update it
      let retries = 0;
      const maxRetries = 5;
      let profileUpdated = false;

      while (retries < maxRetries && !profileUpdated) {
        if (retries > 0) {
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
          console.log('3. ✓ PROFILE UPDATED successfully');
        } else if (retries === maxRetries - 1) {
          console.error('3. PROFILE UPDATE ERROR after retries:', updateError);
          throw new Error('Failed to save user profile. Please try again.');
        }

        retries++;
      }

      console.log('4. Getting session for checkout...');

      // Now redirect to Square Checkout
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('4. SESSION ERROR - No session found');
        throw new Error('Session not found');
      }

      console.log('4. ✓ SESSION RETRIEVED:', {
        hasAccessToken: !!session.access_token,
        tokenLength: session.access_token?.length,
        expiresAt: session.expires_at
      });

      console.log('5. Preparing Square checkout request...');

      const checkoutUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-square-checkout`;

      console.log('6. Sending checkout request to:', checkoutUrl);

      const response = await fetch(checkoutUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          }
      });

      console.log('7. CHECKOUT RESPONSE RECEIVED:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        console.error('7. CHECKOUT ERROR - Response not OK');
        let errorData;
        try {
          const text = await response.text();
          console.error('7. Error response text:', text);

          try {
            errorData = JSON.parse(text);
            console.error('7. Parsed error data:', errorData);
          } catch (parseError) {
            console.error('7. Failed to parse error response:', parseError);
            throw new Error(`Server error: ${response.status}. Please try again or contact support.`);
          }
        } catch (e) {
          console.error('7. Failed to read error response:', e);
          throw new Error(`Failed to initialize checkout: ${response.status} ${response.statusText}`);
        }

        const errorMessage = errorData?.error || errorData?.message || 'Failed to initialize checkout';
        console.error('7. Final error message:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Checkout response:', data);

      if (data?.url) {
        console.log('Redirecting to checkout URL:', data.url);
        window.location.href = data.url;
      } else {
        console.error('Missing checkout URL', data);
        throw new Error('No checkout URL returned from server');
      }
    } catch (err: any) {
      console.error('========================================');
      console.error('ERROR OCCURRED:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('========================================');
      setError(err.message || 'An error occurred');
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

          <form onSubmit={isForgotPassword ? handleForgotPassword : isLogin ? handleLogin : handleDetailsSubmit} className="space-y-4">
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
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3.5 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? (isLogin || isForgotPassword ? 'Please wait...' : 'Setting up your account...') : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Continue to Payment'}
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
