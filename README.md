# Lucky Store

Lucky Store monorepo containing the POS frontend, scraper, and Supabase edge functions.

## Repo structure

- `apps/frontend` - React + Vite POS frontend (Vercel target)
- `apps/scraper` - scraping utilities
- `supabase/functions` - Supabase Edge Functions

## Local setup

1. Install frontend dependencies:

```bash
npm --prefix apps/frontend install
```

1. Create frontend env file:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

1. Fill values in `apps/frontend/.env.local`.

## Deploy to Vercel

This repo includes `vercel.json` configured to build and deploy `apps/frontend`.

In the Vercel project dashboard, set these environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CREATE_SALE_EDGE_URL` (optional)
- `VITE_PROCESS_SALE_EDGE_URL` (optional fallback)

Then deploy:

```bash
vercel
```

or connect the GitHub repo in Vercel for automatic deployments.
