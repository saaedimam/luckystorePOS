-- =============================================================================
-- Migration: Upgraded Core POS Schema (LuckyStorePOS)
-- Based on Production Architecture Review
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Customers Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name            text        NOT NULL,
    phone_whatsapp  text,
    credit_limit    numeric(12,2) DEFAULT 0,
    balance         numeric(12,2) DEFAULT 0,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2) Products Table (Standardized POS naming)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category_id     uuid        REFERENCES public.categories(id) ON DELETE SET NULL,
    name_en         text        NOT NULL,
    name_bn         text,
    sku             text,
    price           numeric(12,2) NOT NULL DEFAULT 0,
    cost            numeric(12,2) DEFAULT 0,
    stock_qty       integer     DEFAULT 0,
    reorder_point   integer     DEFAULT 10,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    UNIQUE(tenant_id, sku)
);

-- ---------------------------------------------------------------------------
-- 3) Enhanced Sales Table
-- ---------------------------------------------------------------------------
ALTER TABLE public.sales
    ADD COLUMN IF NOT EXISTS customer_id       uuid REFERENCES public.customers(id),
    ADD COLUMN IF NOT EXISTS total             numeric(12,2),
    ADD COLUMN IF NOT EXISTS discount          numeric(12,2),
    ADD COLUMN IF NOT EXISTS payment_method     text,
    ADD COLUMN IF NOT EXISTS invoice_sent_via   text,
    ADD COLUMN IF NOT EXISTS invoice_sent_at    timestamptz,
    ADD COLUMN IF NOT EXISTS offline_created_at timestamptz,
    ADD COLUMN IF NOT EXISTS synced_at          timestamptz;

-- ---------------------------------------------------------------------------
-- 4) Sale Items Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sale_items (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id         uuid        NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id      uuid        NOT NULL REFERENCES public.products(id),
    qty             integer     NOT NULL,
    unit_price      numeric(12,2) NOT NULL,
    discount        numeric(12,2) DEFAULT 0,
    created_at      timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5) Payments Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id         uuid        REFERENCES public.sales(id) ON DELETE CASCADE,
    method          text        NOT NULL, -- 'cash', 'bkash', 'nagad', 'card'
    amount          numeric(12,2) NOT NULL,
    reference       text,
    status          text        DEFAULT 'completed',
    created_at      timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 6) Credit Ledger (Append-only for Customer Credit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_ledger (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     uuid        NOT NULL REFERENCES public.customers(id),
    sale_id         uuid        REFERENCES public.sales(id),
    amount          numeric(12,2) NOT NULL, -- positive for credit increase, negative for payment
    type            text        NOT NULL, -- 'sale', 'payment', 'adjustment'
    note            text,
    created_at      timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 7) Expenses Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid        REFERENCES public.tenants(id) ON DELETE CASCADE,
    category        text        NOT NULL,
    amount          numeric(12,2) NOT NULL,
    note            text,
    created_by      uuid        REFERENCES public.users(id),
    created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 8) Inventory Adjustments Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      uuid        NOT NULL REFERENCES public.products(id),
    delta           integer     NOT NULL, -- change in qty
    reason          text,
    created_by      uuid        REFERENCES public.users(id),
    created_at      timestamptz DEFAULT now()
);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Customer Policies
-- ---------------------------------------------------------------------------
CREATE POLICY "customers_select_all" ON public.customers
    FOR SELECT TO authenticated USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "customers_insert_all" ON public.customers
    FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_current_user_tenant_id());

-- ---------------------------------------------------------------------------
-- Product Policies
-- ---------------------------------------------------------------------------
CREATE POLICY "products_select_all" ON public.products
    FOR SELECT TO authenticated USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "products_write_manager_owner" ON public.products
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.auth_id = auth.uid() 
            AND u.role IN ('owner', 'manager', 'admin')
        )
    );

-- ---------------------------------------------------------------------------
-- Expense Policies
-- ---------------------------------------------------------------------------
CREATE POLICY "expenses_select_all" ON public.expenses
    FOR SELECT TO authenticated USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "expenses_write_manager_owner" ON public.expenses
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.auth_id = auth.uid() 
            AND u.role IN ('owner', 'manager', 'admin')
        )
    );

-- ---------------------------------------------------------------------------
-- Sales & Payments (Cashier can insert)
-- ---------------------------------------------------------------------------
CREATE POLICY "sales_insert_cashier" ON public.sales
    FOR INSERT TO authenticated WITH CHECK (true); -- Tenant check usually in complete_sale RPC

CREATE POLICY "payments_insert_cashier" ON public.payments
    FOR INSERT TO authenticated WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Inventory Adjustments (Manager/Owner only)
-- ---------------------------------------------------------------------------
CREATE POLICY "adj_write_manager_owner" ON public.inventory_adjustments
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.auth_id = auth.uid() 
            AND u.role IN ('owner', 'manager', 'admin')
        )
    );
