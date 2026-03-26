import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SubscriptionManager from './SubscriptionManager';

interface EmailSubscriptionsProps {
  location?: string;
}

export default function EmailSubscriptions({ location }: EmailSubscriptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [dailyForecast, setDailyForecast] = useState(true);
  const [weeklyProbeReport, setWeeklyProbeReport] = useState(true);
  const [subscriptionLocation, setSubscriptionLocation] = useState('');
  const [timezone, setTimezone] = useState('Australia/Sydney');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isInFreePeriod, setIsInFreePeriod] = useState(true);
  const [freeMonthsRemaining, setFreeMonthsRemaining] = useState(3);
  const [hasActiveFarmerJoeSubscription, setHasActiveFarmerJoeSubscription] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSubscription();
    }
  }, [isOpen]);

  const loadSubscription = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: 'error', text: 'Please sign in to manage email subscriptions' });
        return;
      }

      setEmail(user.email || '');

      // Check subscription status
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_subscription_started_at, farmer_joe_subscription_status, farmer_joe_subscription_ends_at')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        // Check if user has active Farmer Joe subscription
        const hasActiveSub = profile.farmer_joe_subscription_status === 'active' &&
          (!profile.farmer_joe_subscription_ends_at || new Date(profile.farmer_joe_subscription_ends_at) > new Date());
        setHasActiveFarmerJoeSubscription(hasActiveSub);

        // Calculate free period for email subscriptions
        if (profile.email_subscription_started_at) {
          const startDate = new Date(profile.email_subscription_started_at);
          const freeEndDate = new Date(startDate);
          freeEndDate.setMonth(freeEndDate.getMonth() + 3);
          const now = new Date();

          if (now < freeEndDate) {
            setIsInFreePeriod(true);
            const monthsLeft = Math.ceil((freeEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
            setFreeMonthsRemaining(monthsLeft);
          } else {
            setIsInFreePeriod(false);
            setFreeMonthsRemaining(0);
          }
        } else {
          // Never started, so it's free
          setIsInFreePeriod(true);
          setFreeMonthsRemaining(3);
        }
      }

      const { data, error } = await supabase
        .from('email_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setHasSubscription(true);
        setDailyForecast(data.daily_forecast_enabled);
        setWeeklyProbeReport(data.weekly_probe_report_enabled);
        setSubscriptionLocation(data.location || location || '');
        setTimezone(data.timezone || 'Australia/Sydney');
      } else {
        setHasSubscription(false);
        setSubscriptionLocation(location || '');
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setMessage({ type: 'error', text: 'Failed to load subscription settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSubscription = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: 'error', text: 'Please sign in to save subscription settings' });
        return;
      }

      // Check if user can enable email subscriptions
      if (!isInFreePeriod && !hasActiveFarmerJoeSubscription) {
        setMessage({
          type: 'error',
          text: 'Your 3-month free trial for email alerts has ended. Subscribe to Farmer Joe ($5.99/month) to continue receiving email updates.'
        });
        setIsSaving(false);
        return;
      }

      // If first time enabling, set the start date in profile
      if (!hasSubscription) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ email_subscription_started_at: new Date().toISOString() })
          .eq('id', user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }

      const subscriptionData = {
        user_id: user.id,
        email: user.email,
        daily_forecast_enabled: dailyForecast,
        weekly_probe_report_enabled: weeklyProbeReport,
        location: subscriptionLocation || location || 'Sydney, Australia',
        timezone: timezone,
      };

      if (hasSubscription) {
        const { error } = await supabase
          .from('email_subscriptions')
          .update(subscriptionData)
          .eq('user_id', user.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Subscription updated successfully!' });
      } else {
        const { error } = await supabase
          .from('email_subscriptions')
          .insert(subscriptionData);

        if (error) throw error;
        setHasSubscription(true);
        setMessage({ type: 'success', text: 'Subscription created successfully!' });
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
      setMessage({ type: 'error', text: 'Failed to save subscription settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const unsubscribeAll = async () => {
    if (!confirm('Are you sure you want to unsubscribe from all email notifications?')) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('email_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setHasSubscription(false);
      setDailyForecast(true);
      setWeeklyProbeReport(true);
      setMessage({ type: 'success', text: 'Successfully unsubscribed from all emails' });
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setMessage({ type: 'error', text: 'Failed to unsubscribe' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Mail className="w-4 h-4" />
        <span className="text-sm font-medium">Email Reports</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-6 h-6" />
                  <h2 className="text-xl font-semibold">Email Subscriptions</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-green-800 p-2 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location for Weather Reports
                    </label>
                    <input
                      type="text"
                      value={subscriptionLocation}
                      onChange={(e) => setSubscriptionLocation(e.target.value)}
                      placeholder="e.g., Sydney, Australia"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="Australia/Sydney">Australia/Sydney</option>
                      <option value="Australia/Melbourne">Australia/Melbourne</option>
                      <option value="Australia/Brisbane">Australia/Brisbane</option>
                      <option value="Australia/Perth">Australia/Perth</option>
                      <option value="Australia/Adelaide">Australia/Adelaide</option>
                      <option value="Pacific/Auckland">New Zealand</option>
                    </select>
                  </div>

                  {/* Subscription Status Banner */}
                  {!isInFreePeriod && !hasActiveFarmerJoeSubscription && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-medium text-amber-900 mb-2">Email Subscription Required</p>
                      <p className="text-xs text-amber-800 mb-3">
                        Your 3-month free trial for email alerts has ended. Subscribe to Farmer Joe for $5.99/month to continue receiving email updates.
                      </p>
                      <button
                        onClick={() => setShowSubscriptionManager(true)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
                      >
                        Subscribe Now - $5.99/month
                      </button>
                    </div>
                  )}

                  {isInFreePeriod && !hasActiveFarmerJoeSubscription && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">Free Email Alerts Trial</p>
                      <p className="text-xs text-blue-800">
                        {freeMonthsRemaining} month{freeMonthsRemaining !== 1 ? 's' : ''} remaining. After that, email alerts require a Farmer Joe subscription ($5.99/month).
                      </p>
                    </div>
                  )}

                  {hasActiveFarmerJoeSubscription && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-900 mb-1">Active Subscription</p>
                      <p className="text-xs text-green-800">
                        You have full access to email alerts with your Farmer Joe subscription.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    <h3 className="font-medium text-gray-900">Subscription Options</h3>

                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={dailyForecast}
                        onChange={(e) => setDailyForecast(e.target.checked)}
                        className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Daily Weather Forecast</div>
                        <p className="text-sm text-gray-600 mt-1">
                          Receive daily weather forecasts and spray conditions at 7:00 AM
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={weeklyProbeReport}
                        onChange={(e) => setWeeklyProbeReport(e.target.checked)}
                        className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Weekly Soil Health Report</div>
                        <p className="text-sm text-gray-600 mt-1">
                          Receive weekly summaries of your moisture probe data and soil health metrics
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={saveSubscription}
                      disabled={isSaving}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save Preferences</span>
                        </>
                      )}
                    </button>
                    {hasSubscription && (
                      <button
                        onClick={unsubscribeAll}
                        disabled={isSaving}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Unsubscribe
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    You can update your preferences or unsubscribe at any time
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showSubscriptionManager && (
        <SubscriptionManager onClose={() => setShowSubscriptionManager(false)} />
      )}
    </>
  );
}
