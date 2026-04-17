/*
  # Add RLS policy for agro_fertilisers table

  Enables read access to fertilisers data for all authenticated users.
  The fertilisers table contains reference data (product registrations) that
  should be accessible to all users, similar to the other agronomy tables.

  1. Enable RLS on agro_fertilisers (if not already enabled)
  2. Add a SELECT policy for authenticated users
*/

ALTER TABLE agro_fertilisers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'agro_fertilisers' AND policyname = 'Authenticated users can read fertilisers'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can read fertilisers"
        ON agro_fertilisers
        FOR SELECT
        TO authenticated
        USING (true)
    $policy$;
  END IF;
END $$;
