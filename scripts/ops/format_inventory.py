import csv
import re
import os

source_file = 'data/inventory/LS_Inventory_Apr52026.csv'
template_file = 'data/inventory/import_items_template.csv'
output_file = 'data/inventory/LS_Inventory_Apr52026_Formatted.csv'

def generate_handle(name):
    # Lowercase and replace non-alphanumeric with hyphens
    handle = re.sub(r'[^a-z0-9]+', '-', name.lower())
    return handle.strip('-')

def generate_sku(category, item_name):
    # 1. Category (First 3 letters, Upper)
    cat_letters = re.sub(r'[^A-Z]', '', category.upper())
    cat_prefix = (cat_letters + "GEN")[:3]
    
    # Split item name into clean words
    words = [w for w in re.split(r'[^a-zA-Z0-9]+', item_name) if w]
    
    # 2. Brand (First word, 4 letters, Upper)
    brand_prefix = "MISC"
    if words:
        brand_prefix = re.sub(r'[^A-Z]', '', words[0].upper())
        brand_prefix = (brand_prefix + "XXXX")[:4]

    # 3. Product Name (Second word, 4 letters, Upper)
    prod_prefix = "PROD"
    if len(words) > 1:
        prod_prefix = re.sub(r'[^A-Z]', '', words[1].upper())
        prod_prefix = (prod_prefix + "XXXX")[:4]
    
    # 4. Size (Match things like 70g, 500ml, 1L, etc at the end or anywhere)
    # Using a negative lookahead to prevent grabbing numbers that are just parts of words.
    size_match = re.search(r'(\d+(?:\.\d+)?\s*(?:ml|g|kg|l|pack|pcs))', item_name, re.IGNORECASE)
    size_suffix = ""
    if size_match:
        # Remove spaces and uppercase it
        extracted_size = re.sub(r'\s+', '', size_match.group(1)).upper()
        size_suffix = f"-{extracted_size}"

    return f"{cat_prefix}-{brand_prefix}-{prod_prefix}{size_suffix}"

def main():
    # Read the template headers
    try:
        with open(template_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            target_headers = next(reader)
    except FileNotFoundError:
        print(f"Error: Could not find {template_file}")
        return
    
    try:    
        with open(source_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            source_headers = next(reader)
            
            output_rows = []
            seen_skus = set()
            seen_handles = set()
            
            for idx, row in enumerate(reader):
                if not row or not any(row): continue
                
                # Make sure we have the minimum number of cols
                if len(row) < 10:
                    continue
                
                item_name = row[3].strip()
                if not item_name: continue
                
                category = row[4].strip()
                
                # Use our new intelligent SKU generator if there is no SKU
                sku_original = row[1].strip()
                sku = sku_original if sku_original else generate_sku(category, item_name)
                
                original_sku = sku
                counter = 1
                while sku in seen_skus:
                    sku = f"{original_sku}-{counter}"
                    counter += 1
                seen_skus.add(sku)
                
                handle = generate_handle(item_name)
                original_handle = handle
                counter = 1
                while handle in seen_handles:
                    handle = f"{original_handle}-{counter}"
                    counter += 1
                seen_handles.add(handle)
                
                target_row = {
                    'Handle': handle,
                    'SKU': sku,
                    'Name': item_name,
                    'Category': category,
                    'Description': row[5].strip(),
                    'Sold by weight': 'N',
                    'Option 1 name': '',
                    'Option 1 value': '',
                    'Option 2 name': '',
                    'Option 2 value': '',
                    'Option 3 name': '',
                    'Option 3 value': '',
                    'Cost': row[6].strip(),
                    'Barcode': row[2].strip() if len(row) > 2 else '',
                    'SKU of included item': '',
                    'Quantity of included item': '',
                    'Track stock': 'Y',
                    'Available for sale [Lucky Store]': 'Y',
                    'Price [Lucky Store]': row[8].strip() if len(row) > 8 else '',
                    'In stock [Lucky Store]': row[9].strip() if len(row) > 9 and row[9].strip() != '' else '0',
                    'Low stock [Lucky Store]': '5'
                }
                output_rows.append(target_row)
    except FileNotFoundError:
        print(f"Error: Could not find {source_file}")
        return
            
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=target_headers)
        writer.writeheader()
        for row in output_rows:
            writer.writerow(row)
            
    print(f"Successfully generated {output_file} with {len(output_rows)} mapped items using new advanced SKUs.")

if __name__ == '__main__':
    main()
