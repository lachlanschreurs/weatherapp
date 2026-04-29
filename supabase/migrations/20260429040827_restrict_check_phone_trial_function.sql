/*
  # Restrict EXECUTE on check_phone_trial_used function

  1. Security Changes
    - Revoke EXECUTE from `public` role (which covers anon + authenticated by default)
    - Revoke EXECUTE explicitly from `authenticated` role
    - Grant EXECUTE only to `anon` role, since the function is called during signup
      before the user is authenticated
    - The function remains SECURITY DEFINER because anon cannot read the
      underlying `used_trial_phone_numbers` table directly
    - It only returns a boolean, so data exposure is minimal

  2. Notes
    - This addresses the advisory: "Public Can Execute SECURITY DEFINER Function"
    - Authenticated users no longer need this function; the check only happens at signup
*/

REVOKE EXECUTE ON FUNCTION public.check_phone_trial_used(text) FROM public;
REVOKE EXECUTE ON FUNCTION public.check_phone_trial_used(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.check_phone_trial_used(text) FROM anon;

-- Grant back only to anon since the function is used during signup
GRANT EXECUTE ON FUNCTION public.check_phone_trial_used(text) TO anon;
