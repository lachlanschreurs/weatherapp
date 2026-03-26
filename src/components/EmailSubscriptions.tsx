import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
    </>
  );
}
