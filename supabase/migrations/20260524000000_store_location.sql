-- =============================================================================
-- Migration: Store Location & Radius Support
-- =============================================================================

-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add location to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS location geography(point);

-- 3. Function to check if a point is within range of a store
CREATE OR REPLACE FUNCTION public.is_within_delivery_range(
    p_store_id uuid,
    p_customer_lat numeric,
    p_customer_lng numeric
) RETURNS boolean AS $$
DECLARE
    v_store_location geography(point);
    v_radius_km numeric;
    v_distance_meters numeric;
BEGIN
    -- Get store location
    SELECT location INTO v_store_location FROM public.stores WHERE id = p_store_id;
    
    -- Get store radius (default to 5km if not specified in delivery_zones)
    SELECT radius_km INTO v_radius_km FROM public.delivery_zones WHERE store_id = p_store_id;
    IF v_radius_km IS NULL THEN v_radius_km := 5; END IF;

    -- If store has no location, we can't check, so we assume out of range or return true?
    -- For safety, if no store location is set, we return false.
    IF v_store_location IS NULL THEN RETURN false; END IF;

    -- Calculate distance
    v_distance_meters := ST_Distance(
        v_store_location,
        ST_SetSRID(ST_MakePoint(p_customer_lng, p_customer_lat), 4326)::geography
    );

    RETURN v_distance_meters <= (v_radius_km * 1000);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
