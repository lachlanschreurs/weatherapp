import React, { useState, useEffect } from 'react';
import { CreditCard, Check, X, Loader2, Calendar, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubscriptionManagerProps {
  onClose?: () => void;
}

interface SubscriptionInfo {
  status: string;
  startedAt: string | null;
  endsAt: string | null;
  messagesCount: number;
  emailStartedAt: string | null;
  probeReportStartedAt: string | null;
  stripeCustomerId: string | null;
}

export default function SubscriptionManager({ onClose }: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadSubscriptionInfo();

    // Check for redirect from Stripe
    const params = new URLSearchParams(window.location.search);
    const subscriptionStatus = params.get('subscription');

    if (subscriptionStatus === 'success') {
      setMessage({ type: 'success', text: 'Subscription activated successfully! It may take a moment to update.' });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      // Reload subscription info after a brief delay
      setTimeout(() => {
        loadSubscriptionInfo();
      }, 2000);
    } else if (subscriptionStatus === 'cancelled') {
      setMessage({ type: 'error', text: 'Subscription cancelled. You can try again anytime.' });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadSubscriptionInfo = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: 'error', text: 'Please sign in to manage subscriptions' });
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('farmer_joe_subscription_status, farmer_joe_subscription_started_at, farmer_joe_subscription_ends_at, farmer_joe_messages_count, email_subscription_started_at, probe_report_subscription_started_at, stripe_customer_id')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSubscription({
          status: data.farmer_joe_subscription_status || 'none',
          startedAt: data.farmer_joe_subscription_started_at,
          endsAt: data.farmer_joe_subscription_ends_at,
          messagesCount: data.farmer_joe_messages_count || 0,
          emailStartedAt: data.email_subscription_started_at,
          probeReportStartedAt: data.probe_report_subscription_started_at,
          stripeCustomerId: data.stripe_customer_id
        });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setMessage({ type: 'error', text: 'Failed to load subscription information' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateEmailFreeMonthsRemaining = () => {
    if (!subscription?.emailStartedAt) return 3;

    const startDate = new Date(subscription.emailStartedAt);
    const freeEndDate = new Date(startDate);
    freeEndDate.setMonth(freeEndDate.getMonth() + 3);
    const now = new Date();

    if (now >= freeEndDate) return 0;

    const monthsLeft = Math.ceil((freeEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, Math.min(3, monthsLeft));
  };

  const calculateProbeReportFreeMonthsRemaining = () => {
    if (!subscription?.probeReportStartedAt) return 3;

    const startDate = new Date(subscription.probeReportStartedAt);
    const freeEndDate = new Date(startDate);
    freeEndDate.setMonth(freeEndDate.getMonth() + 3);
    const now = new Date();

    if (now >= freeEndDate) return 0;

    const monthsLeft = Math.ceil((freeEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, Math.min(3, monthsLeft));
  };

  const hasActiveSubscription = subscription?.status === 'active' &&
    (!subscription.endsAt || new Date(subscription.endsAt) > new Date());

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: 'error', text: 'Please sign in to subscribe' });
        setIsProcessing(false);
        return;
      }

      const stripePriceId = import.meta.env.VITE_STRIPE_PRICE_ID;
      if (!stripePriceId) {
        setMessage({ type: 'error', text: 'Subscription not configured. Please contact support.' });
        setIsProcessing(false);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const requestBody = {
        priceId: stripePriceId,
        userId: user.id,
        userEmail: user.email,
        successUrl: `${window.location.origin}/?subscription=success`,
        cancelUrl: `${window.location.origin}/?subscription=cancelled`,
      };

      console.log('Sending checkout request:', { apiUrl, ...requestBody, userEmail: 'hidden' });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      }).catch((fetchError) => {
        console.error('Network error:', fetchError);
        throw new Error(`Network error: ${fetchError.message}. Please check your connection and try again.`);
      });

      if (!response) {
        throw new Error('No response from server');
      }

      const data = await response.json().catch(() => ({
        error: 'Invalid response from server'
      }));

      console.log('Checkout response:', { status: response.status, data });

      if (!response.ok) {
        console.error('Checkout error:', data);
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (!data.url) {
        console.error('No URL in response:', data);
        throw new Error('No checkout URL returned from Stripe');
      }

      console.log('Redirecting to:', data.url);
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage({ type: 'error', text: errorMessage });
      setIsProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsProcessing(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: 'error', text: 'Please sign in to manage your subscription' });
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer-portal-session`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          returnUrl: window.location.origin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errorType === 'portal_not_activated') {
          setMessage({
            type: 'error',
            text: 'Stripe billing portal needs to be activated. Please contact support or activate it at: https://dashboard.stripe.com/settings/billing/portal'
          });
        } else {
          throw new Error(data.error || 'Failed to create portal session');
        }
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to open billing portal. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-semibold">Subscription Management</h2>
              <p className="text-xs text-green-100">Manage your Farmer Joe subscription</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="hover:bg-green-800 p-2 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : (
            <>
              {message && (
                <div
                  className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {message.type === 'success' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}

              {/* Subscription Status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Farmer Joe Chat Subscription</h3>

                {hasActiveSubscription ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-600 text-white rounded-full p-2">
                        <Check className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-green-900 mb-1">Active Subscription</p>
                        <p className="text-sm text-green-800 mb-3">
                          You have unlimited access to Farmer Joe chat
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-green-700 font-medium">Started</p>
                            <p className="text-green-900">{formatDate(subscription?.startedAt)}</p>
                          </div>
                          <div>
                            <p className="text-green-700 font-medium">Messages Sent</p>
                            <p className="text-green-900">{subscription?.messagesCount || 0}</p>
                          </div>
                        </div>
                        <button
                          onClick={handleManageSubscription}
                          disabled={isProcessing}
                          className="w-full bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4" />
                              Manage Subscription & Payment
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="bg-gray-400 text-white rounded-full p-2">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">No Active Subscription</p>
                        <p className="text-sm text-gray-700 mb-3">
                          Subscribe to unlock unlimited access to Farmer Joe
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-green-200 rounded-lg p-5 mb-4">
                      <div className="mb-4">
                        <p className="font-semibold text-gray-900 mb-1">Farmer Joe Premium</p>
                        <p className="text-2xl font-bold text-green-600 mb-1">$5.99<span className="text-sm text-gray-600">/month</span></p>
                        <p className="text-xs text-gray-500">3 month free trial • cancel anytime</p>
                      </div>
                      <ul className="space-y-2 mb-4">
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600" />
                          Unlimited AI chat messages
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600" />
                          Personalized farming advice
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600" />
                          Weather-based insights
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600" />
                          Save conversation history
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600" />
                          Image analysis for pests & diseases
                        </li>
                      </ul>
                      <button
                        onClick={handleSubscribe}
                        disabled={isProcessing}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Unlock Farmer Joe Premium'
                        )}
                      </button>
                      <p className="text-xs text-center text-gray-500">
                        Secure payments powered by Stripe
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Email Subscription Status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Alerts</h3>

                {(() => {
                  const freeMonths = calculateEmailFreeMonthsRemaining();
                  const isInFreePeriod = freeMonths > 0;

                  return (
                    <div className={`border-2 rounded-lg p-4 ${
                      hasActiveSubscription
                        ? 'bg-green-50 border-green-200'
                        : isInFreePeriod
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`rounded-full p-2 ${
                          hasActiveSubscription
                            ? 'bg-green-600 text-white'
                            : isInFreePeriod
                            ? 'bg-blue-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}>
                          {hasActiveSubscription || isInFreePeriod ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <Calendar className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          {hasActiveSubscription ? (
                            <>
                              <p className="font-semibold text-green-900 mb-1">Email Alerts Active</p>
                              <p className="text-sm text-green-800">
                                Included with your Farmer Joe subscription
                              </p>
                            </>
                          ) : isInFreePeriod ? (
                            <>
                              <p className="font-semibold text-blue-900 mb-1">Free Trial Active</p>
                              <p className="text-sm text-blue-800">
                                {freeMonths} month{freeMonths !== 1 ? 's' : ''} remaining of free email alerts.
                                Subscribe to Farmer Joe before the trial ends to continue receiving updates.
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-amber-900 mb-1">Trial Expired</p>
                              <p className="text-sm text-amber-800 mb-3">
                                Your 3-month free trial has ended. Subscribe to Farmer Joe to continue receiving email alerts.
                              </p>
                              <button
                                onClick={handleSubscribe}
                                disabled={isProcessing}
                                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  'Subscribe for Email Alerts'
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Weekly Probe Report Status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Probe Reports</h3>

                {(() => {
                  const freeMonths = calculateProbeReportFreeMonthsRemaining();
                  const isInFreePeriod = freeMonths > 0;

                  return (
                    <div className={`border-2 rounded-lg p-4 ${
                      hasActiveSubscription
                        ? 'bg-green-50 border-green-200'
                        : isInFreePeriod
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`rounded-full p-2 ${
                          hasActiveSubscription
                            ? 'bg-green-600 text-white'
                            : isInFreePeriod
                            ? 'bg-blue-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}>
                          {hasActiveSubscription || isInFreePeriod ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <Calendar className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          {hasActiveSubscription ? (
                            <>
                              <p className="font-semibold text-green-900 mb-1">Weekly Reports Active</p>
                              <p className="text-sm text-green-800">
                                Included with your Farmer Joe subscription
                              </p>
                            </>
                          ) : isInFreePeriod ? (
                            <>
                              <p className="font-semibold text-blue-900 mb-1">Free Trial Active</p>
                              <p className="text-sm text-blue-800">
                                {freeMonths} month{freeMonths !== 1 ? 's' : ''} remaining of free weekly probe reports.
                                Subscribe to Farmer Joe before the trial ends to continue receiving reports.
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-amber-900 mb-1">Trial Expired</p>
                              <p className="text-sm text-amber-800 mb-3">
                                Your 3-month free trial has ended. Subscribe to Farmer Joe to continue receiving weekly probe reports.
                              </p>
                              <button
                                onClick={handleSubscribe}
                                disabled={isProcessing}
                                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  'Subscribe for Weekly Reports'
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Manage Payment Details - Show for users with customer ID but no active subscription */}
              {subscription?.stripeCustomerId && !hasActiveSubscription && (
                <div className="mb-6">
                  <button
                    onClick={handleManageSubscription}
                    disabled={isProcessing}
                    className="w-full bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Manage Payment Details
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Pricing Information */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-5">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1 h-5 bg-green-600 rounded"></div>
                  What's Included
                </h4>
                <ul className="space-y-2.5 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Farmer Joe Chat</strong> — Unlimited AI-powered farming advice ($5.99/month after trial)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Daily Email Alerts</strong> — Weather forecasts and spray window notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Weekly Probe Reports</strong> — Comprehensive soil moisture analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Cancel Anytime</strong> — No long-term commitment required</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
