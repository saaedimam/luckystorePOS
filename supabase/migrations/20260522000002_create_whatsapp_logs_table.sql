-- =============================================================================
-- Migration: Create WhatsApp Logs Table
-- Description: Audit and tracking table for WhatsApp message delivery
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.online_orders(id) ON DELETE SET NULL,
    recipient VARCHAR(20) NOT NULL,
    template VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    response JSONB,
    message_id VARCHAR(100),
    error_code VARCHAR(50),
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_whatsapp_logs_tenant ON public.whatsapp_logs(tenant_id);
CREATE INDEX idx_whatsapp_logs_order ON public.whatsapp_logs(order_id);
CREATE INDEX idx_whatsapp_logs_created ON public.whatsapp_logs(created_at DESC);
CREATE INDEX idx_whatsapp_logs_status ON public.whatsapp_logs(status);

-- Enable RLS
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_whatsapp_logs_isolation ON public.whatsapp_logs
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Allow service_role full access for edge functions
CREATE POLICY service_role_whatsapp_logs ON public.whatsapp_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Comments
COMMENT ON TABLE public.whatsapp_logs IS 'Audit log for WhatsApp message delivery attempts';
COMMENT ON COLUMN public.whatsapp_logs.template IS 'Message template type: confirmed, preparing, out_for_delivery, delivered, cancelled';
COMMENT ON COLUMN public.whatsapp_logs.message_id IS 'WhatsApp Business API message ID for tracking';
