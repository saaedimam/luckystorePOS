"""
patch_quantity.py
-----------------
Patches the `quantity` column into inventory_chunks CSVs by fuzzy-matching
product names from the source Batch001 CSV.
"""

import csv
import glob
import os
import re
from thefuzz import process

# ── Paths ──────────────────────────────────────────────────────────────────
BASE = "/Users/mac.alvi/Desktop/Projects/Lucky Store/data/inventory"
SOURCE_CSV = os.path.join(BASE, "15thApril_Lucky Store Inventory Batch001.csv")
CHUNKS_DIR = os.path.join(BASE, "inventory_chunks")
MATCH_THRESHOLD = 70   # minimum fuzzy score to accept a match

# ── Load source: Item Name → Quantity ──────────────────────────────────────
source_qty = {}  # {normalized_name: (quantity, original_name)}

with open(SOURCE_CSV, encoding="utf-8-sig", newline="") as f:
    for row in csv.DictReader(f):
        name = row["Item Name"].strip()
        try:
            qty = int(float(row["Quantity"].strip()))
        except (ValueError, KeyError):
            qty = 0
        name_key = re.sub(r"\s+", " ", name.lower())
        source_qty[name_key] = (qty, name)

source_keys = list(source_qty.keys())
print(f"Loaded {len(source_keys)} products from source CSV\n")

# ── Process each chunk ─────────────────────────────────────────────────────
CHUNK_OUTPUT_COL = "quantity"
INSERT_AFTER = "availability"   # insert quantity right after availability

total_matched = 0
total_unmatched = 0
unmatched_items = []

chunk_paths = sorted(glob.glob(os.path.join(CHUNKS_DIR, "inventory_chunk_*.csv")))

for chunk_path in chunk_paths:
    chunk_name = os.path.basename(chunk_path)

    with open(chunk_path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        original_fields = reader.fieldnames[:]
        rows = list(reader)

    # Build new fieldnames with quantity inserted after availability
    if CHUNK_OUTPUT_COL in original_fields:
        print(f"[SKIP] {chunk_name} already has 'quantity' column")
        continue

    if INSERT_AFTER in original_fields:
        idx = original_fields.index(INSERT_AFTER)
        new_fields = original_fields[: idx + 1] + [CHUNK_OUTPUT_COL] + original_fields[idx + 1 :]
    else:
        new_fields = original_fields + [CHUNK_OUTPUT_COL]

    # Match and patch each row
    patched_rows = []
    for row in rows:
        desc = row.get("description", "").strip()
        desc_key = re.sub(r"\s+", " ", desc.lower())

        match_result = process.extractOne(desc_key, source_keys, score_cutoff=MATCH_THRESHOLD)

        if match_result:
            matched_key, score = match_result
            qty, orig_name = source_qty[matched_key]
            row[CHUNK_OUTPUT_COL] = str(qty)
            total_matched += 1
            if score < 90:
                print(f"  [~{score}] '{desc}' → '{orig_name}' (qty={qty})")
        else:
            row[CHUNK_OUTPUT_COL] = "0"
            total_unmatched += 1
            unmatched_items.append(f"{chunk_name}: '{desc}'")

        patched_rows.append(row)

    # Write back
    with open(chunk_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=new_fields)
        writer.writeheader()
        writer.writerows(patched_rows)

    print(f"[OK] {chunk_name} — {len(patched_rows)} rows patched")

# ── Summary ────────────────────────────────────────────────────────────────
print(f"\n{'='*60}")
print(f"✅  Matched:   {total_matched}")
print(f"⚠️   Unmatched: {total_unmatched} (quantity set to 0)")
if unmatched_items:
    print("\nUnmatched items (check manually):")
    for item in unmatched_items:
        print(f"  • {item}")
