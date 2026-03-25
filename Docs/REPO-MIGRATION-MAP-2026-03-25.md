# Repo Migration Map (Safe Pass)

Date: 2026-03-25

This migration was **non-destructive**:

- Files were moved to clearer locations.
- Legacy paths were preserved with symlinks for compatibility.
- No files were deleted.

## Before -> After

### App folders

- `frontend/` -> `apps/frontend/` (legacy `frontend` symlink kept)
- `lucky-store-stock.html` -> `apps/import-tools/legacy/lucky-store-stock.html` (legacy root symlink kept)

### Scraper files

- `scrape-shwapno.js` -> `apps/scraper/scrape-shwapno.js` (legacy root symlink kept)
- `scrape-browser-console.js` -> `apps/scraper/scrape-browser-console.js` (legacy root symlink kept)

### Root deploy/test scripts

- `deploy-edge-function.sh` -> `scripts/deploy/deploy-edge-function.sh` (legacy root symlink kept)
- `deploy-create-sale.sh` -> `scripts/deploy/deploy-create-sale.sh` (legacy root symlink kept)
- `test-function-curl.sh` -> `scripts/test/test-function-curl.sh` (legacy root symlink kept)
- `test-import-function.sh` -> `scripts/test/test-import-function.sh` (legacy root symlink kept)

### Scripts folder normalization

- `scripts/import-competitor-data.js` -> `scripts/ops/import-competitor-data.js` (legacy symlink kept)
- `scripts/remove-duplicate-items.js` -> `scripts/ops/remove-duplicate-items.js` (legacy symlink kept)
- `scripts/create-storage-bucket.js` -> `scripts/ops/create-storage-bucket.js` (legacy symlink kept)
- `scripts/setup-pos-data.sql` -> `scripts/db/setup-pos-data.sql` (legacy symlink kept)
- `scripts/categorize-products.py` -> `scripts/data/categorize-products.py` (legacy symlink kept)
- `scripts/import-via-edge-function.sh` -> `scripts/deploy/import-via-edge-function.sh` (legacy symlink kept)
- `scripts/IMPORT-INSTRUCTIONS.md` -> `scripts/docs/IMPORT-INSTRUCTIONS.md` (legacy symlink kept)
- `scripts/REMOVE-DUPLICATES-GUIDE.md` -> `scripts/docs/REMOVE-DUPLICATES-GUIDE.md` (legacy symlink kept)
- `scripts/SETUP-SERVICE-KEY.md` -> `scripts/docs/SETUP-SERVICE-KEY.md` (legacy symlink kept)
- `scripts/setup-storage.md` -> `scripts/docs/setup-storage.md` (legacy symlink kept)

### Sample data

- `test-import-comprehensive.csv` -> `data/samples/test-import-comprehensive.csv` (legacy root symlink kept)
- `test-sample.csv` -> `data/samples/test-sample.csv` (legacy root symlink kept)

## Compatibility Notes

- Existing docs/commands that reference old paths continue to work because symlinks remain in place.
- Canonical paths are now under:
  - `apps/` for application code
  - `scripts/{deploy,test,ops,db,data,docs}` for scripts
  - `data/samples/` for sample input files
- Root `package.json` now points to canonical script locations.

## New Canonical Commands

- `npm run scrape`
- `npm run import-competitor`
- `npm run remove-duplicates`
- `npm run remove-duplicates:dry-run`

## Follow-up (Optional)

- Gradually update documentation to canonical paths.
- After docs are updated, legacy symlinks can be removed in a future cleanup pass.
