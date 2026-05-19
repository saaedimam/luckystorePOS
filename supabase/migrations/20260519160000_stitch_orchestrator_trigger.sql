-- =============================================================================
-- Migration: Add DB Trigger to call low stock stitch-orchestrator webhook
-- Date: 2026-05-19
-- Purpose: Asynchronously trigger stitch orchestration via Edge Functions and Stitch MCP
-- =============================================================================

CREATE OR REPLACE FUNCTION public.trigger_stitch_orchestrator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  func_url text;
  anon_key text;
  request_body text;
BEGIN
  -- Retrieve URL and API Key from runtime parameters (configurable per staging/local env)
  func_url := coalesce(
    current_setting('app.settings.stitch_orchestrator_url', true),
    'http://localhost:54321/functions/v1/stitch-orchestrator'
  );
  anon_key := coalesce(
    current_setting('app.settings.anon_key', true),
    ''
  );

  request_body := json_build_object(
    'type', 'INSERT',
    'table', 'stock_ledger',
    'schema', 'public',
    'record', json_build_object(
      'id', NEW.id,
      'store_id', NEW.store_id,
      'product_id', NEW.product_id,
      'previous_quantity', NEW.previous_quantity,
      'new_quantity', NEW.new_quantity,
      'quantity_change', NEW.quantity_change,
      'transaction_type', NEW.transaction_type,
      'reason', NEW.reason,
      'movement_id', NEW.movement_id,
      'created_at', NEW.created_at
    )
  )::text;

  -- Use pg_net extension for async, non-blocking HTTP request
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    PERFORM net.http_post(
      url := func_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', anon_key,
        'Authorization', 'Bearer ' || anon_key
      ),
      body := request_body::jsonb,
      timeout_milliseconds := 5000
    );
  ELSE
    RAISE WARNING 'pg_net extension not found. Webhook to % could not be dispatched.', func_url;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stitch_orchestrator ON public.stock_ledger;
CREATE TRIGGER trg_stitch_orchestrator
  AFTER INSERT ON public.stock_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_stitch_orchestrator();

COMMENT ON FUNCTION public.trigger_stitch_orchestrator() IS 
  'Triggers low stock stitch-orchestrator edge function via non-blocking HTTP post using pg_net when stock ledger gets new entries.';
