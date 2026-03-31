/*
  # Fix RLS Performance Issues

  1. Changes
    - Update all RLS policies to use (select auth.uid()) instead of auth.uid()
    - This prevents re-evaluation of auth.uid() for each row, significantly improving query performance at scale
    - Affects policies on: profiles, saved_locations, email_subscriptions, probe_apis, probe_data, chat_messages, notifications

  2. Performance Impact
    - Reduces query execution time for large datasets
    - auth.uid() is evaluated once per query instead of once per row
*/

-- profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- saved_locations table policies
DROP POLICY IF EXISTS "Users can manage own locations" ON saved_locations;

CREATE POLICY "Users can view own locations"
  ON saved_locations FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own locations"
  ON saved_locations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own locations"
  ON saved_locations FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own locations"
  ON saved_locations FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- email_subscriptions table policies
DROP POLICY IF EXISTS "Users can view own email subscription" ON email_subscriptions;
DROP POLICY IF EXISTS "Users can update own email subscription" ON email_subscriptions;

CREATE POLICY "Users can view own email subscription"
  ON email_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own email subscription"
  ON email_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- probe_apis table policies
DROP POLICY IF EXISTS "Users can manage own probe APIs" ON probe_apis;

CREATE POLICY "Users can view own probe APIs"
  ON probe_apis FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own probe APIs"
  ON probe_apis FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own probe APIs"
  ON probe_apis FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own probe APIs"
  ON probe_apis FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- probe_data table policies
DROP POLICY IF EXISTS "Users can view own probe data" ON probe_data;
DROP POLICY IF EXISTS "Users can insert own probe data" ON probe_data;

CREATE POLICY "Users can view own probe data"
  ON probe_data FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own probe data"
  ON probe_data FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- chat_messages table policies
DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can create own chat messages" ON chat_messages;

CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- notifications table policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
