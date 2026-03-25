# Repo layout history

## Pass 1 — 2026-03-25 (symlink compatibility)

The first pass moved code under `apps/` and `scripts/` and added **root and `scripts/` symlinks** so old paths kept working. That map is superseded by pass 2 below.

## Pass 2 — 2026-03-25 (canonical paths only)

Symlinks were **removed from git** to avoid duplicate path entries and Windows friction. Use these locations directly:

### Applications

- Frontend: `apps/frontend/` (Vercel: see root `vercel.json`)
- Scraper: `apps/scraper/scrape-shwapno.js`, `apps/scraper/scrape-browser-console.js`
- Legacy HTML import tool: `apps/import-tools/legacy/lucky-store-stock.html`

### Scripts

- Deploy: `scripts/deploy/deploy-edge-function.sh`, `scripts/deploy/deploy-create-sale.sh`, `scripts/deploy/import-via-edge-function.sh`
- Tests: `scripts/test/test-function-curl.sh`, `scripts/test/test-import-function.sh`
- Ops: `scripts/ops/*.js`
- DB snippets: `scripts/db/*.sql`
- Data helpers: `scripts/data/categorize-products.py`
- Runbooks: `docs/runbooks/*.md` (import/setup notes; formerly `scripts/docs/`)

### Data

- Competitor CSVs: `data/competitors/shwapno/`
- Sample inventory files: `data/inventory/`
- Local-only samples (gitignored): `data/samples/` (optional root symlinks may exist locally but are not tracked)

### docs / archive

- Next.js reference snippets and old edge-function snapshot: `docs/_archive/2026-03-25/`
- Untracked local archives: `archive/` (see root `.gitignore`)

### Tooling cleanup

- `supabase/.temp/` — removed from version control (Supabase CLI local state; stays ignored)
- `skills-lock.json` — ignored (local Cursor metadata)

## Commands (root `package.json`)

- `npm run scrape`
- `npm run import-competitor`
- `npm run remove-duplicates` / `npm run remove-duplicates:dry-run`
