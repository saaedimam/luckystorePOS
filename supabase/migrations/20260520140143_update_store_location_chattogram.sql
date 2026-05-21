-- Migration: Update Store Location to Chattogram (10km radius)
-- Store ID: 00000000-0000-0000-0000-000000000001

-- 1. Update the store location
UPDATE public.stores 
SET location = ST_SetSRID(ST_MakePoint(91.7832, 22.3569), 4326)::geography 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Upsert delivery_zones radius to 10km
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.delivery_zones WHERE store_id = '00000000-0000-0000-0000-000000000001') THEN
        UPDATE public.delivery_zones SET radius_km = 10 WHERE store_id = '00000000-0000-0000-0000-000000000001';
    ELSE
        INSERT INTO public.delivery_zones (store_id, radius_km) VALUES ('00000000-0000-0000-0000-000000000001', 10);
    END IF;
END
$$;
