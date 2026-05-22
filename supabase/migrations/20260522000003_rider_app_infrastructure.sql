-- =============================================================================
-- Migration: Rider App Infrastructure (B002)
-- Description: Complete rider management system with race condition protection
-- Critical Fixes Applied:
--   1. pg_advisory_xact_lock for atomic rider assignment
--   2. Proper operation_id idempotency with INSERT-only design
--   3. auth_user_id linking for proper RLS JWT support
-- =============================================================================

-- Enable PostGIS for location tracking
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- RIDERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Profile
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    photo_url TEXT,

    -- Authentication (PIN-based with auth_user_id fallback)
    pin_hash TEXT, -- pgcrypto crypt() output

    -- Status
    status VARCHAR(20) DEFAULT 'offline'
        CHECK (status IN ('offline', 'online', 'busy', 'on_leave')),

    -- Location (PostGIS)
    current_location GEOGRAPHY(POINT, 4326),
    location_updated_at TIMESTAMPTZ,

    -- Vehicle
    vehicle_type VARCHAR(20) CHECK (vehicle_type IN ('bicycle', 'motorcycle', 'van')),
    vehicle_plate VARCHAR(20),

    -- Ledger-based earnings (total_earnings removed - calculated from rider_earnings)
    -- Use view or RPC to calculate: SELECT SUM(amount) FROM rider_earnings WHERE rider_id = ?

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, phone),
    UNIQUE(tenant_id, auth_user_id)
);

-- Indexes
CREATE INDEX idx_riders_tenant ON public.riders(tenant_id);
CREATE INDEX idx_riders_status ON public.riders(status) WHERE status = 'online';
CREATE INDEX idx_riders_auth_user ON public.riders(auth_user_id);
CREATE INDEX idx_riders_location ON public.riders USING GIST(current_location) WHERE status = 'online';

-- =============================================================================
-- RIDER ASSIGNMENTS (Append-Only Ledger Pattern)
-- Each status change = new row. No UPDATES allowed.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.rider_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,

    -- Assignment linking
    order_id UUID REFERENCES public.online_orders(id) ON DELETE RESTRICT NOT NULL,
    rider_id UUID REFERENCES public.riders(id) ON DELETE RESTRICT NOT NULL,

    -- Status tracking (append-only)
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled')),

    -- Idempotency key (UNIQUE across entire table)
    operation_id VARCHAR(64) NOT NULL UNIQUE,

    -- Metadata
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    notes TEXT,

    -- Location at assignment (for analytics)
    rider_location_at_assign GEOGRAPHY(POINT, 4326),

    created_at TIMESTAMPTZ DEFAULT now()
);

-- Critical indexes
CREATE INDEX idx_rider_assignments_order ON public.rider_assignments(order_id);
CREATE INDEX idx_rider_assignments_rider ON public.rider_assignments(rider_id);
CREATE INDEX idx_rider_assignments_tenant_status ON public.rider_assignments(tenant_id, status);
CREATE INDEX idx_rider_assignments_operation_id ON public.rider_assignments(operation_id);

-- =============================================================================
-- RIDER EARNINGS (Ledger Table)
-- Immutable - only INSERTs allowed
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.rider_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,

    rider_id UUID REFERENCES public.riders(id) ON DELETE RESTRICT NOT NULL,
    assignment_id UUID REFERENCES public.rider_assignments(id) ON DELETE RESTRICT,

    -- Earnings breakdown
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    tip_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    bonus_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- Payment tracking
    payment_status VARCHAR(20) DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'disputed')),
    paid_at TIMESTAMPTZ,

    -- Idempotency
    operation_id VARCHAR(64) NOT NULL UNIQUE,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rider_earnings_rider ON public.rider_earnings(rider_id);
CREATE INDEX idx_rider_earnings_payment ON public.rider_earnings(rider_id, payment_status) WHERE payment_status = 'pending';

-- =============================================================================
-- RIDER LOCATION HISTORY (Time-series optimized)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.rider_location_history (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    rider_id UUID REFERENCES public.riders(id) ON DELETE CASCADE NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy_meters DECIMAL(5,2),
    battery_level INTEGER CHECK (battery_level BETWEEN 0 AND 100),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Partitioning support for high-volume tracking
    tenant_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,

    -- Composite PK must include the partition key (recorded_at) per PostgreSQL requirement.
    -- No separate UNIQUE(id) allowed on partitioned tables unless it includes all partition cols.
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);


-- Create initial partition (current month)
CREATE TABLE IF NOT EXISTS public.rider_location_history_current
    PARTITION OF public.rider_location_history
    DEFAULT;

CREATE INDEX idx_rider_location_history_rider ON public.rider_location_history(rider_id, recorded_at DESC);

-- =============================================================================
-- RPC: ASSIGN RIDER TO ORDER (Race Condition Protected)
-- Critical Fix #1: Uses pg_advisory_xact_lock for atomic assignment
-- Critical Fix #2: INSERT-only idempotency check
-- =============================================================================
CREATE OR REPLACE FUNCTION public.assign_rider_to_order(
    p_order_id UUID,
    p_rider_id UUID,
    p_assigned_by UUID,
    p_operation_id VARCHAR(64)
) RETURNS JSONB AS $$
DECLARE
    v_tenant_id UUID;
    v_order_number VARCHAR(20);
    v_assignment_id UUID;
    v_rider_location GEOGRAPHY(POINT, 4326);
BEGIN
    -- Idempotency check first (cheap operation)
    SELECT id INTO v_assignment_id
    FROM public.rider_assignments
    WHERE operation_id = p_operation_id;

    IF v_assignment_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_processed', true,
            'assignment_id', v_assignment_id,
            'message', 'Assignment already exists for this operation'
        );
    END IF;

    -- CRITICAL FIX #1: Acquire advisory lock on rider to prevent race conditions
    -- Two dispatchers cannot assign the same rider simultaneously
    PERFORM pg_advisory_xact_lock(hashtext('rider_' || p_rider_id::text));

    -- Verify rider is available (re-check after lock)
    IF NOT EXISTS (
        SELECT 1 FROM public.riders
        WHERE id = p_rider_id
        AND status = 'online'
        FOR UPDATE  -- Additional row lock
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Rider is not available',
            'code', 'RIDER_UNAVAILABLE'
        );
    END IF;

    -- Get order details
    SELECT tenant_id, order_number
    INTO v_tenant_id, v_order_number
    FROM public.online_orders
    WHERE id = p_order_id;

    IF v_tenant_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Order not found',
            'code', 'ORDER_NOT_FOUND'
        );
    END IF;

    -- Get rider's current location
    SELECT current_location INTO v_rider_location
    FROM public.riders WHERE id = p_rider_id;

    -- CRITICAL FIX #2: INSERT-only append pattern (no UPDATES)
    INSERT INTO public.rider_assignments (
        tenant_id,
        order_id,
        rider_id,
        status,
        operation_id,
        assigned_by,
        rider_location_at_assign
    ) VALUES (
        v_tenant_id,
        p_order_id,
        p_rider_id,
        'assigned',
        p_operation_id,
        p_assigned_by,
        v_rider_location
    ) RETURNING id INTO v_assignment_id;

    -- Update rider status to busy
    UPDATE public.riders
    SET status = 'busy', updated_at = now()
    WHERE id = p_rider_id;

    -- Update order
    UPDATE public.online_orders
    SET
        rider_id = p_rider_id,
        rider_assigned_at = now(),
        status = 'confirmed',
        updated_at = now()
    WHERE id = p_order_id;

    -- Notify rider via realtime
    PERFORM pg_notify('rider_assignments', jsonb_build_object(
        'rider_id', p_rider_id,
        'order_id', p_order_id,
        'assignment_id', v_assignment_id
    )::text);

    RETURN jsonb_build_object(
        'success', true,
        'assignment_id', v_assignment_id,
        'order_number', v_order_number,
        'message', 'Rider assigned successfully'
    );

EXCEPTION
    WHEN unique_violation THEN
        -- Another transaction beat us to it
        SELECT id INTO v_assignment_id
        FROM public.rider_assignments
        WHERE operation_id = p_operation_id;

        RETURN jsonb_build_object(
            'success', true,
            'already_processed', true,
            'assignment_id', v_assignment_id,
            'message', 'Assignment created by concurrent transaction'
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'code', 'ASSIGNMENT_FAILED'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RPC: UPDATE ASSIGNMENT STATUS (Append-Only - Creates new row)
-- Each status change is a new assignment record with unique operation_id
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_rider_assignment_status(
    p_assignment_id UUID,
    p_new_status VARCHAR(20),
    p_operation_id VARCHAR(64),
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_existing_assignment RECORD;
    v_tenant_id UUID;
    v_new_assignment_id UUID;
BEGIN
    -- Idempotency check
    IF EXISTS (SELECT 1 FROM public.rider_assignments WHERE operation_id = p_operation_id) THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_processed', true,
            'message', 'Status update already recorded'
        );
    END IF;

    -- Get existing assignment
    SELECT * INTO v_existing_assignment
    FROM public.rider_assignments
    WHERE id = p_assignment_id;

    IF v_existing_assignment IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Assignment not found',
            'code', 'ASSIGNMENT_NOT_FOUND'
        );
    END IF;

    -- Create new assignment record (append-only)
    INSERT INTO public.rider_assignments (
        tenant_id,
        order_id,
        rider_id,
        status,
        operation_id,
        assigned_by,
        notes,
        created_at
    ) VALUES (
        v_existing_assignment.tenant_id,
        v_existing_assignment.order_id,
        v_existing_assignment.rider_id,
        p_new_status,
        p_operation_id,
        v_existing_assignment.assigned_by,
        COALESCE(p_notes, 'Status updated to: ' || p_new_status),
        now()
    ) RETURNING id INTO v_new_assignment_id;

    -- Handle status-specific side effects
    IF p_new_status = 'delivered' THEN
        -- Record earnings
        INSERT INTO public.rider_earnings (
            tenant_id,
            rider_id,
            assignment_id,
            delivery_fee,
            total_amount,
            operation_id
        )
        SELECT
            v_existing_assignment.tenant_id,
            v_existing_assignment.rider_id,
            v_new_assignment_id,
            COALESCE(oo.delivery_fee, 40),
            COALESCE(oo.delivery_fee, 40),
            p_operation_id || '_earnings'
        FROM public.online_orders oo
        WHERE oo.id = v_existing_assignment.order_id;

        -- Update order
        UPDATE public.online_orders
        SET status = 'delivered', delivered_at = now()
        WHERE id = v_existing_assignment.order_id;

        -- Free up rider
        UPDATE public.riders
        SET status = 'online', updated_at = now()
        WHERE id = v_existing_assignment.rider_id;

    ELSIF p_new_status = 'cancelled' THEN
        -- Free up rider
        UPDATE public.riders
        SET status = 'online', updated_at = now()
        WHERE id = v_existing_assignment.rider_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'new_assignment_id', v_new_assignment_id,
        'status', p_new_status,
        'order_id', v_existing_assignment.order_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RPC: RIDER LOGIN (With auth_user_id JWT support)
-- Critical Fix #3: Links to Supabase Auth for proper RLS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.rider_login(
    p_phone VARCHAR(20),
    p_pin TEXT,
    p_device_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_rider RECORD;
    v_token TEXT;
BEGIN
    -- Find rider by phone
    SELECT * INTO v_rider
    FROM public.riders
    WHERE phone = p_phone
    AND pin_hash IS NOT NULL;

    IF v_rider IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid credentials',
            'code', 'AUTH_FAILED'
        );
    END IF;

    -- Verify PIN using pgcrypto
    IF NOT (v_rider.pin_hash = crypt(p_pin, v_rider.pin_hash)) THEN
        -- Log failed attempt
        INSERT INTO public.audit_logs (table_name, action, details)
        VALUES ('riders', 'LOGIN_FAILED', jsonb_build_object('rider_id', v_rider.id, 'phone', p_phone));

        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid credentials',
            'code', 'AUTH_FAILED'
        );
    END IF;

    -- Update rider status
    UPDATE public.riders
    SET status = 'online', updated_at = now()
    WHERE id = v_rider.id;

    -- Note: In production, use Supabase Auth signInWithPassword here
    -- This requires the rider to have an auth.users record
    -- For now, return success with rider details
    -- The client should then use the JWT from auth.users login

    RETURN jsonb_build_object(
        'success', true,
        'rider_id', v_rider.id,
        'auth_user_id', v_rider.auth_user_id, -- CRITICAL: Frontend uses this for JWT
        'full_name', v_rider.full_name,
        'phone', v_rider.phone,
        'tenant_id', v_rider.tenant_id,
        'message', 'Login successful. Use auth_user_id to authenticate with Supabase Auth.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RPC: PING RIDER LOCATION (With rate limiting)
-- Medium Fix: 10 second minimum interval
-- =============================================================================
CREATE OR REPLACE FUNCTION public.ping_rider_location(
    p_rider_id UUID,
    p_latitude DECIMAL(10,8),
    p_longitude DECIMAL(11,8),
    p_accuracy DECIMAL(5,2) DEFAULT NULL,
    p_battery INTEGER DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_last_ping TIMESTAMPTZ;
    v_min_interval INTERVAL := '10 seconds';
    v_location GEOGRAPHY(POINT, 4326);
BEGIN
    -- Rate limiting check
    SELECT MAX(recorded_at) INTO v_last_ping
    FROM public.rider_location_history
    WHERE rider_id = p_rider_id;

    IF v_last_ping IS NOT NULL AND (now() - v_last_ping) < v_min_interval THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Rate limit exceeded. Minimum 10 seconds between pings.',
            'code', 'RATE_LIMITED',
            'retry_after', EXTRACT(EPOCH FROM (v_min_interval - (now() - v_last_ping)))::INTEGER
        );
    END IF;

    -- Create location point
    v_location := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY;

    -- Update rider current location
    UPDATE public.riders
    SET
        current_location = v_location,
        location_updated_at = now(),
        updated_at = now()
    WHERE id = p_rider_id
    RETURNING tenant_id;

    -- Insert location history
    INSERT INTO public.rider_location_history (
        rider_id,
        location,
        accuracy_meters,
        battery_level,
        tenant_id
    )
    SELECT
        p_rider_id,
        v_location,
        p_accuracy,
        p_battery,
        tenant_id
    FROM public.riders WHERE id = p_rider_id;

    RETURN jsonb_build_object(
        'success', true,
        'recorded_at', now(),
        'rider_id', p_rider_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RPC: GET NEAREST AVAILABLE RIDERS (Spatial Query)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_nearest_available_riders(
    p_store_lat DECIMAL(10,8),
    p_store_lng DECIMAL(11,8),
    p_limit INTEGER DEFAULT 10,
    p_max_distance_km DECIMAL(6,2) DEFAULT 10.0
) RETURNS TABLE (
    rider_id UUID,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    distance_km DECIMAL(6,2),
    vehicle_type VARCHAR(20),
    location_updated_at TIMESTAMPTZ
) AS $$
DECLARE
    v_store_location GEOGRAPHY;
BEGIN
    v_store_location := ST_SetSRID(ST_MakePoint(p_store_lng, p_store_lat), 4326)::GEOGRAPHY;

    RETURN QUERY
    SELECT
        r.id AS rider_id,
        r.full_name,
        r.phone,
        ROUND((ST_Distance(r.current_location, v_store_location) / 1000.0)::numeric, 2) AS distance_km,
        r.vehicle_type,
        r.location_updated_at
    FROM public.riders r
    WHERE r.status = 'online'
    AND r.current_location IS NOT NULL
    AND ST_Distance(r.current_location, v_store_location) <= p_max_distance_km * 1000
    ORDER BY ST_Distance(r.current_location, v_store_location)
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- RLS POLICIES (Critical Fix #3: Uses auth_user_id)
-- =============================================================================

-- Enable RLS
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_location_history ENABLE ROW LEVEL SECURITY;

-- Riders can view/update their own data (via auth_user_id)
CREATE POLICY riders_self_access ON public.riders
    FOR ALL
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- Tenants can manage their riders
CREATE POLICY riders_tenant_isolation ON public.riders
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Service role full access
CREATE POLICY riders_service_role ON public.riders
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Rider assignments
CREATE POLICY rider_assignments_rider_view ON public.rider_assignments
    FOR SELECT
    USING (rider_id IN (
        SELECT id FROM public.riders WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY rider_assignments_tenant ON public.rider_assignments
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Rider earnings
CREATE POLICY rider_earnings_rider_view ON public.rider_earnings
    FOR SELECT
    USING (rider_id IN (
        SELECT id FROM public.riders WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY rider_earnings_tenant ON public.rider_earnings
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Location history (riders can only see their own)
CREATE POLICY rider_location_self ON public.rider_location_history
    FOR SELECT
    USING (rider_id IN (
        SELECT id FROM public.riders WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY rider_location_tenant ON public.rider_location_history
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE public.riders IS 'Delivery riders linked to Supabase Auth via auth_user_id';
COMMENT ON TABLE public.rider_assignments IS 'Append-only assignment history. Each status change creates new row.';
COMMENT ON TABLE public.rider_earnings IS 'Immutable earnings ledger. Only INSERTs allowed.';
COMMENT ON FUNCTION public.assign_rider_to_order IS 'Atomic rider assignment with advisory locking and idempotency';
COMMENT ON COLUMN public.riders.auth_user_id IS 'Links to auth.users for JWT-based RLS (Critical Fix #3)';
