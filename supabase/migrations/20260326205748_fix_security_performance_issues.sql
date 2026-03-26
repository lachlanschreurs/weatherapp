/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add missing indexes for foreign keys:
      - chat_messages.user_id
      - profiles.default_location_id
      - user_notifications.user_id
    - Optimize RLS policies to use (select auth.uid()) instead of auth.uid()
    - Remove duplicate/redundant RLS policies

  2. Security Fixes
    - Fix function search_path mutability issues
    - Consolidate multiple permissive policies
    
  3. Changes Made
    - Added indexes on foreign key columns for better query performance
    - Updated email_subscriptions RLS policies to use subqueries
    - Removed duplicate RLS policies on user_notifications table
    - Fixed search_path for all functions to be immutable
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_default_location_id ON public.profiles(default_location_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);

-- Drop and recreate email_subscriptions RLS policies with optimized auth checks
DROP POLICY IF EXISTS "Users can view own email subscription" ON public.email_subscriptions;
DROP POLICY IF EXISTS "Users can create own email subscription" ON public.email_subscriptions;
DROP POLICY IF EXISTS "Users can update own email subscription" ON public.email_subscriptions;
DROP POLICY IF EXISTS "Users can delete own email subscription" ON public.email_subscriptions;

CREATE POLICY "Users can view own email subscription"
  ON public.email_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own email subscription"
  ON public.email_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own email subscription"
  ON public.email_subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own email subscription"
  ON public.email_subscriptions
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Remove duplicate policies on user_notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.user_notifications;

-- Fix function search_path issues by recreating functions with SECURITY DEFINER and explicit search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_email_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_email_subscription_free()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_has_subscription boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.email_subscriptions
    WHERE user_id = auth.uid()
      AND stripe_subscription_id IS NOT NULL
      AND subscription_status = 'active'
  ) INTO user_has_subscription;
  
  RETURN NOT user_has_subscription;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_active_farmer_joe_subscription()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND stripe_subscription_id IS NOT NULL
      AND subscription_status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_email_subscription_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.email_subscriptions (user_id, email, daily_forecast, weekly_probe_report)
  VALUES (NEW.id, NEW.email, true, false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;