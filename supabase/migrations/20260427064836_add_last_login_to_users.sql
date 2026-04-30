-- Add last_login tracking to users table.
-- Uses IF NOT EXISTS / DO NOTHING guards for safe re-runs.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_last_login_at
  ON public.users (last_login_at DESC);

-- Trigger: update last_login_at on each successful Supabase auth sign-in.
CREATE OR REPLACE FUNCTION public.update_user_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.users
  SET last_login_at = NOW()
  WHERE auth_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Hook into auth.users table (fires after each login event).
DROP TRIGGER IF EXISTS trg_update_last_login ON auth.users;
CREATE TRIGGER trg_update_last_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_last_login();
