DO $$
DECLARE
    v_store_id uuid;
BEGIN
    -- Find your active store
    SELECT id INTO v_store_id FROM public.stores LIMIT 1;
    
    IF v_store_id IS NOT NULL THEN
        -- 1. Update store location to Chattogram
        UPDATE public.stores 
        SET location = ST_SetSRID(ST_MakePoint(91.7832, 22.3569), 4326)::geography 
        WHERE id = v_store_id;

        -- 2. Upsert delivery radius to 10km    
        IF EXISTS (SELECT 1 FROM public.delivery_zones WHERE store_id = v_store_id) THEN  
            UPDATE public.delivery_zones SET radius_km = 10 WHERE store_id = v_store_id;       
        ELSE
            INSERT INTO public.delivery_zones (store_id, radius_km) VALUES (v_store_id, 10);    
        END IF;
    END IF;
END
$$;
