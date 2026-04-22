import pandas as pd
import re
import os
import glob
from rapidfuzz import process, fuzz

def clean_price(price_str):
    if pd.isna(price_str):
        return 0.0
    if isinstance(price_str, (int, float)):
        return float(price_str)
    # Extract numbers from "95 BDT" or similar strings
    match = re.search(r'([\d,.]+)', str(price_str))
    if match:
        clean_val = match.group(1).replace(',', '')
        try:
            return float(clean_val)
        except ValueError:
            return 0.0
    return 0.0

def clean_description(desc):
    if pd.isna(desc):
        return ""
    # Strip ". Premium quality ... available at Lucky Store." boilerplate
    desc = str(desc)
    desc = re.sub(r'\.?\s*Premium quality.*?available at Lucky Store\.?', '', desc, flags=re.IGNORECASE)
    return desc.strip()

def load_shwapno_images(shwapno_dir):
    print(f"Loading Shwapno image sources from {shwapno_dir}...")
    image_pool = {}
    csv_files = glob.glob(os.path.join(shwapno_dir, "*.csv"))
    
    for file in csv_files:
        try:
            df = pd.read_csv(file, encoding='utf-8-sig')
            if 'Name' in df.columns and 'Image URL' in df.columns:
                for _, row in df.iterrows():
                    name = str(row['Name']).strip()
                    url = str(row['Image URL']).strip()
                    if url and url != 'nan':
                        if name not in image_pool:
                            image_pool[name] = url
        except Exception as e:
            print(f"  Warning: Could not read {file}: {e}")
            
    print(f"  Loaded {len(image_pool)} unique product images from Shwapno sources.")
    return image_pool

def load_chaldal_images(catalog_file):
    print(f"Loading Chaldal image source from {catalog_file}...")
    image_pool = {}
    try:
        import json
        with open(catalog_file, 'r') as f:
            data = json.load(f)
            for item in data:
                name = item['name'].strip()
                url = item['image'].strip()
                if name not in image_pool:
                    image_pool[name] = url
        print(f"  Loaded {len(image_pool)} unique product images from Chaldal catalog.")
    except Exception as e:
        print(f"  Warning: Could not read {catalog_file}: {e}")
    return image_pool

def enrich_inventory(main_file, cost_file, shwapno_dir, chaldal_file):
    print(f"Loading main inventory: {main_file}")
    df_main = pd.read_csv(main_file, encoding='utf-8-sig')
    
    print(f"Loading cost data: {cost_file}")
    df_costs = pd.read_csv(cost_file, encoding='utf-8-sig')
    
    shwapno_images_pool = load_shwapno_images(shwapno_dir)
    shwapno_names = list(shwapno_images_pool.keys())
    
    chaldal_images_pool = load_chaldal_images(chaldal_file)
    chaldal_names = list(chaldal_images_pool.keys())
    
    # 1. Clean Main Data
    df_main['price'] = df_main['price'].apply(clean_price)
    if 'sale price' in df_main.columns:
        df_main['sale_price'] = df_main['sale price'].apply(clean_price)
    else:
        df_main['sale_price'] = 0.0
        
    df_main['description'] = df_main['description'].apply(clean_description)
    
    # 2. Fuzzy Matching for Costs and Images
    print("Beginning fuzzy matching phase...")
    
    cost_names = df_costs['Item Name'].tolist()
    
    # Matching Results
    matched_costs = []
    matched_categories = []
    matched_suppliers = []
    cost_confidences = []
    
    premium_images = []
    image_confidences = []
    
    for idx, row in df_main.iterrows():
        name = str(row['title'])
        
        # --- A) Cost Match (>95) ---
        cost_match = process.extractOne(name, cost_names, scorer=fuzz.token_sort_ratio)
        if cost_match and cost_match[1] > 95:
            match_name = cost_match[0]
            cost_row = df_costs[df_costs['Item Name'] == match_name].iloc[0]
            matched_costs.append(cost_row.get('Cost', 0.0))
            matched_categories.append(cost_row.get('Category', 'General'))
            matched_suppliers.append(cost_row.get('Supplier', ''))
            cost_confidences.append(cost_match[1])
        else:
            matched_costs.append(None)
            matched_categories.append('General')
            matched_suppliers.append(None)
            cost_confidences.append(cost_match[1] if cost_match else 0)
            
        # --- B) Image Match (Priority: Shwapno > Chaldal > Original) ---
        original_image_url = str(row.get('image link', ''))
        
        # 1. Try Shwapno
        sh_match = process.extractOne(name, shwapno_names, scorer=fuzz.token_set_ratio)
        if sh_match and sh_match[1] > 85:
            premium_images.append(shwapno_images_pool[sh_match[0]])
            image_confidences.append(sh_match[1])
            source = "shwapno"
        else:
            # 2. Try Chaldal
            ch_match = process.extractOne(name, chaldal_names, scorer=fuzz.token_set_ratio)
            if ch_match and ch_match[1] > 85:
                premium_images.append(chaldal_images_pool[ch_match[0]])
                image_confidences.append(ch_match[1])
                source = "chaldal"
            else:
                # 3. Fallback
                premium_images.append(original_image_url if (original_image_url != 'nan' and original_image_url != '') else '')
                image_confidences.append(max(sh_match[1] if sh_match else 0, ch_match[1] if ch_match else 0))
                source = "google"
            
    df_main['cost'] = matched_costs
    df_main['category'] = matched_categories
    df_main['supplier'] = matched_suppliers
    df_main['image_url'] = premium_images
    
    # 3. Barcode & Search Metadata
    print("Generating barcodes and search metadata...")
    # UPDATED FORMAT: LS-XXXXXX (confirmed by user feedback)
    df_main['barcode'] = [f"LS-{i+1:06d}" for i in range(len(df_main))]
    
    # Create a searchable text field
    df_main['search_text'] = df_main['title'].astype(str) + " " + \
                             df_main['brand'].astype(str).replace('nan', '') + " " + \
                             df_main['category'].astype(str)
    df_main['search_text'] = df_main['search_text'].str.lower().str.strip()

    # 4. Final Formatting & Cleanup
    cols_to_keep = [
        'sku', 'name', 'description', 'brand', 'group_tag', 'gtin',
        'barcode', 'price', 'sale_price', 'cost', 'category', 'supplier',
        'image_url', 'availability', 'search_text'
    ]
    
    # Filter to columns that exist
    existing_cols = [c for c in cols_to_keep if c in df_main.columns or c in ['cost', 'category', 'supplier', 'barcode', 'image_url', 'search_text']]
    df_final = df_main[existing_cols].copy()
    
    # Rename for POS compatibility
    rename_map = {
        'id': 'sku',
        'title': 'name',
        'item group id': 'group_tag'
    }
    df_final.rename(columns=rename_map, inplace=True)

    # 5. Export for Review
    report_file = 'data/inventory/enrichment_report.csv'
    df_main['cost_confidence'] = cost_confidences
    df_main['image_confidence'] = image_confidences
    df_main.to_csv(report_file, index=False)
    print(f"Full enrichment report saved to {report_file}")

    # 6. Chunking and Export
    chunk_size = 100
    output_dir = 'data/inventory/inventory_chunks'
    os.makedirs(output_dir, exist_ok=True)
    
    for i in range(0, len(df_final), chunk_size):
        chunk = df_final.iloc[i:i+chunk_size]
        chunk_num = (i // chunk_size) + 1
        chunk.to_csv(f'{output_dir}/inventory_chunk_{chunk_num:02d}.csv', index=False)
        print(f"Generated chunk {chunk_num}: {len(chunk)} rows")

    print("\n--- Phase 3 Enrichment Summary ---")
    print(f"Total items processed: {len(df_main)}")
    print(f"Cost matches (>95%): {sum(1 for c in cost_confidences if c > 95)}")
    print(f"Premium image matches (>85%): {sum(1 for c in image_confidences if c > 85)}")
    print(f"Barcode format: LS-000001 (Final)")

if __name__ == "__main__":
    enrich_inventory(
        'data/inventory/Google Inventory - Apr20th.csv',
        'data/inventory/15thApril_Lucky Store Inventory Batch001.csv',
        'data/competitors/shwapno',
        'data/inventory/chaldal_catalog.json'
    )
