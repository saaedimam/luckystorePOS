-- =============================================================================
-- Phase 7: POS Security (Cashier PIN)
-- =============================================================================
-- Adds a 4-digit PIN column to the users table for POS authentication.
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS pos_pin text;

-- Comment on column for documentation
COMMENT ON COLUMN public.users.pos_pin IS '4-digit PIN for POS cashier login (e.g., 1234)';

-- Optional: Set a default for existing users if needed, 
-- though it's better to let staff set their own.
-- UPDATE public.users SET pos_pin = '1234' WHERE pos_pin IS NULL;
