import psycopg2
import csv
import uuid

def run_import():
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres.hvmyxyccfnkrbxqbhlnm",
            password="FsmHPpbIU4SYVPk2", 
            host="aws-1-ap-northeast-1.pooler.supabase.com",
            port="5432"
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # 1. Truncate tables (cascade might wipe sales, which is fine since it's a test environment)
        print("Truncating items table (and descending dependencies)...")
        cur.execute("TRUNCATE TABLE items CASCADE;")
        cur.execute("TRUNCATE TABLE categories CASCADE;")
        
        # 2. Get store_id for MAIN branch
        cur.execute("SELECT id FROM stores WHERE code = 'MAIN' LIMIT 1;")
        store_res = cur.fetchone()
        if not store_res:
            print("MAIN store not found! Aborting.")
            return
        store_id = store_res[0]
        
        # 3. Read CSV
        categories_dict = {}
        items_to_insert = []
        stock_to_insert = []
        
        print("Reading CSV...")
        with open('data/inventory/Google Inventory - Apr20th.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                sku = row.get('id', '').strip()
                name = row.get('title', '').strip()
                description = row.get('description', '').strip()
                image_url = row.get('image link', '').strip()
                
                # Price extraction
                price_str = row.get('price', '').strip().replace(' BDT', '')
                price = float(price_str) if price_str else 0.0
                
                # Cost extraction (using sale price or derived)
                cost_str = row.get('sale price', '').strip().replace(' BDT', '')
                cost = float(cost_str) if cost_str else price * 0.8
                
                brand = row.get('brand', '').strip()
                barcode_raw = row.get('gtin', '').strip()
                barcode = barcode_raw if barcode_raw else None
                
                group_tag_raw = row.get('item group id', '').strip()
                group_tag = group_tag_raw if group_tag_raw else None
                
                # We need a category. Google MC format doesn't have an explicit 'category' column here.
                # Let's derive it from the product type or just set a default if not found.
                # Or try to extract from description.
                # Or we can just use "General" or base it on Brand.
                category_name = brand if brand else "General"
                
                if category_name not in categories_dict:
                    cat_id = str(uuid.uuid4())
                    categories_dict[category_name] = cat_id
                    cur.execute("INSERT INTO categories (id, name) VALUES (%s, %s)", (cat_id, category_name))
                else:
                    cat_id = categories_dict[category_name]
                    
                item_id = str(uuid.uuid4())
                
                items_to_insert.append((
                    item_id, sku, barcode, name, description, brand,
                    cat_id, price, cost, image_url, group_tag, True
                ))
                
                stock_to_insert.append((store_id, item_id, 100)) # Default 100 stock
                
        print(f"Inserting {len(items_to_insert)} items...")
        
        # Insert items
        from psycopg2.extras import execute_values
        
        insert_items_query = """
            INSERT INTO items (id, sku, barcode, name, description, brand, category_id, price, cost, image_url, group_tag, active)
            VALUES %s
        """
        execute_values(cur, insert_items_query, items_to_insert)
        
        insert_stock_query = """
            INSERT INTO stock_levels (store_id, item_id, qty)
            VALUES %s
        """
        execute_values(cur, insert_stock_query, stock_to_insert)
        
        # Also add stock for the other store BR01 just in case
        cur.execute("SELECT id FROM stores WHERE code = 'BR01' LIMIT 1;")
        store2_res = cur.fetchone()
        if store2_res:
            store2_id = store2_res[0]
            stock_to_insert_2 = [(store2_id, item[0], 50) for item in items_to_insert]
            execute_values(cur, insert_stock_query, stock_to_insert_2)
        
        print("Import complete!")
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

run_import()
