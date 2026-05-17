# 🛠️ Lucky Store POS: Local Developer & Troubleshooting Runbook

This document houses all the comprehensive internal development setups, database replication protocols, Docker requirements, PWA configuration steps, and safety guidelines required to develop and test the **Lucky Store POS** ecosystem locally.

---

## 🧭 Local vs Remote Supabase

This project supports two primary developer execution modes:

### 1. Remote Supabase Mode (Ground Truth)
Used to read and write against the live pre-production database. The web admin app and mobile client communicate directly with the hosted staging environment.
* **Remote project URL**: `https://hvmyxyccfnkrbxqbhlnm.supabase.co`
* **Local Configuration**:
  ```env
  VITE_SUPABASE_URL=https://hvmyxyccfnkrbxqbhlnm.supabase.co
  VITE_SUPABASE_ANON_KEY=<remote_anon_public_key>
  ```
* **Location**: Put this inside `apps/admin_web/.env` or `.env.local`. Do **not** commit this file if it contains secret keys.

### 2. Local Supabase Mode (Replay Validation)
Used to run local migrations, verify schema replay determinism, and test edge functions locally using Docker.
* **Local default URL**: `http://127.0.0.1:54321`
* **Local DB Port**: `5432`
* **Dashboard Studio**: `http://127.0.0.1:54323`

---

## 🐳 Do I Need Docker?

* **For Remote Supabase Data**: **No**. The apps talk directly to the cloud project.
* **For Local Supabase**: **Yes**. Running the Supabase local stack requires Docker to host PostgreSQL, Auth, PostgREST, Studio, and Inbucket containers.

### Local DB Commands
```bash
# Start local Supabase containers
supabase start

# Reset local database (applies migrations and seed.sql)
supabase db reset

# Apply pending local migrations only
supabase migration up --local --yes
```

---

## 🔧 Detailed Environment Setup

Create the following files locally inside the respective apps:

### 1. Root Directory Environment (`.env`)
```bash
cp .env.example .env
```

### 2. Mobile App Environment (`apps/mobile_app/.env`)
```bash
cp apps/mobile_app/.env.example apps/mobile_app/.env
```

### 3. Admin Web Environment (`apps/admin_web/.env` or `apps/admin_web/.env.local`)
```env
# For Local Supabase Mode
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key

# For Remote Staging Mode
VITE_SUPABASE_URL=https://hvmyxyccfnkrbxqbhlnm.supabase.co
VITE_SUPABASE_ANON_KEY=your_remote_anon_key
```

> [!WARNING]
> **Strict Security Rule:** Never check `.env`, `.env.local`, service-role keys, access tokens, database passwords, or auth cookies into version control.

---

## 🔐 Authentication & Seed Model

The admin dashboard authentication model depends on both a user account in `auth.users` and a matching profile link in `public.users` containing matching identifiers:
* `auth_id`
* `tenant_id`
* `store_id`
* `role`
* `is_active`

### Local Development Seed Account
To make local login reproducible, a local admin seed migration was added:
* **Seed SQL Path**: `supabase/migrations/20260511000000_local_admin_login_seed.sql`
* **Local Staging Email**: `admin@luckystore.com`
* **Local Staging Password**: `TempPassword123!`
* *Note: This local account exists for local Supabase Docker development only and does not apply to the remote database.*

---

## 🧯 Developer Troubleshooting Guide

### 1. App shows empty/demo data
Check whether your local frontend configuration is pointing to the local emulator: `VITE_SUPABASE_URL=http://127.0.0.1:54321`. Point it back to `https://hvmyxyccfnkrbxqbhlnm.supabase.co` and restart Vite.

### 2. Login works locally but not on remote
The local seeded admin (`admin@luckystore.com` / `TempPassword123!`) only exists in the local emulator's database. Remote authentication requires an account created in the remote Supabase Auth project.

### 3. Dashboard says "Failed to load data"
Open your browser DevTools (Network tab) and inspect the failing PostgREST RPC call. Common reasons:
* RPC function not found or parameter mismatch (`PGRST202`).
* Row-Level Security policy blocking lookup.
* Authenticated profile row missing `tenant_id` or `store_id`.

### 4. Vite build fails with `ENOTEMPTY`
Stale generated assets are locked in disk memory. Clean output cache:
```bash
rm -rf apps/admin_web/dist
npm run build
```

---

## 🛡️ Safety & Quality Guardrails

1. **Production Safety**: Never run destructive commands like `supabase db reset` or `supabase db push` against the live remote instance.
2. **Access Token Safety**: Never expose access tokens, JWTs, database connection strings, or cookies in any public logs or screenshots.
3. **Commit Validations**: Always verify compilation before committing code:
   ```bash
   npm run typecheck
   npm run build
   ```
