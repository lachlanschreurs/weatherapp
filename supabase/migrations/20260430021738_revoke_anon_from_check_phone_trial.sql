/*
  # Revoke all public EXECUTE on check_phone_trial_used

  1. Security Changes
    - Revoke EXECUTE from `anon` role on the SECURITY DEFINER function
      `public.check_phone_trial_used(text)`
    - Only `service_role` and `postgres` retain access
    - The phone trial check is enforced server-side via the
      `record_trial_phone_number` trigger on the profiles table

  2. Notes
    - This resolves the advisory: "Public Can Execute SECURITY DEFINER Function"
    - The client-side RPC call will now fail gracefully for anon users,
      but the server-side trigger still prevents duplicate phone trials
*/

REVOKE EXECUTE ON FUNCTION public.check_phone_trial_used(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_phone_trial_used(text) FROM public;
