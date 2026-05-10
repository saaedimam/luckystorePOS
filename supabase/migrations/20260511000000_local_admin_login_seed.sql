-- Local dev auth seed for the admin portal.
-- Creates one idempotent admin user/profile pair plus the minimum tenant/store rows
-- needed for local auth + RLS-dependent code paths.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_tenant_id uuid := '11111111-1111-1111-1111-111111111111';
  v_store_id uuid := '22222222-2222-2222-2222-222222222222';
  v_user_id uuid := '33333333-3333-3333-3333-333333333333';
  v_identity_id uuid := '44444444-4444-4444-4444-444444444444';
  v_email text := 'admin@luckystore.com';
  v_password text := 'TempPassword123!';
  v_display_name text := 'System Admin';
BEGIN
  SELECT id
  INTO v_tenant_id
  FROM public.tenants
  WHERE slug = 'lucky-store-local'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    v_tenant_id := '11111111-1111-1111-1111-111111111111';
    INSERT INTO public.tenants (id, name, slug, plan)
    VALUES (v_tenant_id, 'Lucky Store Local', 'lucky-store-local', 'free');
  ELSE
    UPDATE public.tenants
    SET
      name = 'Lucky Store Local',
      plan = 'free'
    WHERE id = v_tenant_id;
  END IF;

  SELECT id
  INTO v_store_id
  FROM public.stores
  WHERE code = 'LOCAL'
    AND tenant_id = v_tenant_id
  LIMIT 1;

  IF v_store_id IS NULL THEN
    v_store_id := '22222222-2222-2222-2222-222222222222';
    INSERT INTO public.stores (id, tenant_id, name, code, address, phone, is_active)
    VALUES (
      v_store_id,
      v_tenant_id,
      'Lucky Store Local',
      'LOCAL',
      'Local development store',
      NULL,
      true
    );
  ELSE
    UPDATE public.stores
    SET
      name = 'Lucky Store Local',
      address = 'Local development store',
      phone = NULL,
      is_active = true
    WHERE id = v_store_id;
  END IF;

  IF to_regclass('auth.users') IS NOT NULL THEN
    SELECT id
    INTO v_user_id
    FROM auth.users
    WHERE email = v_email
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_user_id IS NULL THEN
      v_user_id := '33333333-3333-3333-3333-333333333333';
      INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      )
      VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', v_display_name, 'full_name', v_display_name, 'role', 'admin'),
        now(),
        now()
      );
    ELSE
      UPDATE auth.users
      SET
        encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = jsonb_build_object('name', v_display_name, 'full_name', v_display_name, 'role', 'admin'),
        updated_at = now()
      WHERE id = v_user_id;
    END IF;

    IF to_regclass('auth.identities') IS NOT NULL THEN
      SELECT id
      INTO v_identity_id
      FROM auth.identities
      WHERE user_id = v_user_id
        AND provider = 'email'
      ORDER BY created_at DESC
      LIMIT 1;

      IF v_identity_id IS NULL THEN
        v_identity_id := '44444444-4444-4444-4444-444444444444';
        INSERT INTO auth.identities (
          id,
          user_id,
          provider_id,
          identity_data,
          provider,
          last_sign_in_at,
          created_at,
          updated_at
        )
        VALUES (
          v_identity_id,
          v_user_id,
          v_user_id::text,
          jsonb_build_object('sub', v_user_id::text, 'email', v_email),
          'email',
          now(),
          now(),
          now()
        );
      ELSE
        UPDATE auth.identities
        SET
          provider_id = v_user_id::text,
          identity_data = jsonb_build_object('sub', v_user_id::text, 'email', v_email),
          updated_at = now()
        WHERE id = v_identity_id;
      END IF;
    END IF;

    INSERT INTO public.users (
      id,
      tenant_id,
      store_id,
      auth_id,
      name,
      full_name,
      email,
      role,
      pin,
      is_active
    )
    VALUES (
      v_user_id,
      v_tenant_id,
      v_store_id,
      v_user_id,
      v_display_name,
      v_display_name,
      v_email,
      'admin',
      '0000',
      true
    )
    ON CONFLICT (auth_id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      store_id = EXCLUDED.store_id,
      name = EXCLUDED.name,
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      pin = EXCLUDED.pin,
      is_active = EXCLUDED.is_active,
      updated_at = now();

    EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'users'
        AND policyname = 'Users can read own profile'
    ) THEN
      EXECUTE 'CREATE POLICY "Users can read own profile" ON public.users FOR SELECT TO authenticated USING (auth_id = auth.uid())';
    END IF;
  END IF;
END
$$;
