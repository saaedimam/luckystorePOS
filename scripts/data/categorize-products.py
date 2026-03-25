#!/usr/bin/env python3
"""
Script to categorize products in the Shwapno CSV file logically
"""

import csv
import re
from pathlib import Path
from typing import Dict, List

_REPO_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_CSV = _REPO_ROOT / "data" / "competitors" / "shwapno" / "shwapno-products (1).csv"

def categorize_product(name: str) -> str:
    """
    Categorize a product based on its name
    Order matters - more specific categories should be checked first
    """
    name_lower = name.lower()
    
    # Soup & Instant Mix (check before vegetables)
    if any(keyword in name_lower for keyword in ['soup', 'knorr', 'kent']):
        return "Soup & Instant Mix"
    
    # Sauces & Ketchup (check before spices to catch mayonnaise)
    if any(keyword in name_lower for keyword in ['ketchup', 'mayonnaise', 'mustard', 'bbq sauce', 'soya sauce', 'tomato sauce', 'chili sauce', 'umami', 'raju', 'american garden', 'mj\'s', 'herman']):
        return "Sauces & Ketchup"
    
    # Seafood & Fish (check before other categories)
    if any(keyword in name_lower for keyword in ['fish', 'chingri', 'golda', 'rupchanda', 'bata', 'bagda', 'baila', 'boal', 'gulsha', 'horina', 'kachki', 'meni', 'poa', 'puti', 'tatkini', 'koi', 'tengra', 'pabda', 'rui', 'carpu', 'faisha', 'katla', 'koral', 'mola', 'pangas', 'silver carp', 'telapiya', 'sarputi', 'pomfret', 'deshi mix']):
        return "Seafood & Fish"
    
    # Rice & Grains
    if any(keyword in name_lower for keyword in ['rice', 'chinigura', 'nazirshail', 'miniket', 'kalijira', 'basmati', 'jeerashail', 'suji', 'khichuri']):
        return "Rice & Grains"
    
    # Eggs & Dairy
    if any(keyword in name_lower for keyword in ['egg', 'butter', 'milk', 'yogurt', 'curd', 'doi', 'laban', 'cheese', 'powder milk', 'marks active', 'marks gold', 'marks diet']):
        return "Eggs & Dairy"
    
    # Meat & Poultry
    if any(keyword in name_lower for keyword in ['chicken', 'broiler', 'beef', 'mutton', 'khashir', 'mangsho', 'nuggets', 'keema', 'drumstick', 'thigh', 'leg', 'roast', 'shonalika', 'duck']):
        return "Meat & Poultry"
    
    # Vegetables (but not soup)
    if any(keyword in name_lower for keyword in ['beetroot', 'carrot', 'cucumber', 'shosha', 'mint', 'lemon', 'cauliflower', 'fulcopy', 'mushroom', 'corn', 'baby corn']) and 'soup' not in name_lower:
        return "Vegetables"
    
    # Fruits
    if any(keyword in name_lower for keyword in ['apple', 'banana', 'kola', 'dates', 'khezur', 'grape', 'mango', 'orange', 'strawberry', 'pineapple', 'litchi', 'plum', 'bokhara']):
        return "Fruits"
    
    # Beverages
    if any(keyword in name_lower for keyword in ['coca cola', 'pepsi', 'sprite', 'fanta', 'mirinda', '7 up', 'mountain dew', 'drink', 'juice', 'soda', 'tonic', 'clemon', 'mojo', 'googly', 'fresh up', 'fresh cola', 'club soda', 'kinley', 'schweppes', 'float', 'frooto', 'starship', 'frutika', 'latina', 'dolphin', 'american harvest', 'basil seed', 'electrolyte', 'taaqa', 'aktive', 'jussvina', 'a&w', 'wild brew', 'speed', 'root beer', 'sarsaparilla', 'horlicks', 'boost', 'gluco']):
        return "Beverages"
    
    # Tea & Coffee
    if any(keyword in name_lower for keyword in ['tea', 'coffee', 'nescafe', 'lipton', 'twinings', 'tata tea', 'brooke bond', 'ispahani', 'kazi & kazi', 'seylon', 'tetley', 'davidoff', 'bengal classic']):
        return "Tea & Coffee"
    
    # Cooking Oil
    if any(keyword in name_lower for keyword in ['olive oil', 'soyabean oil', 'soybean oil', 'spanisha', 'olio orolio', 'saffola', 'sunflower oil', 'sesame seed oil', 'sesame oil']) or ('oil' in name_lower and 'cooking' in name_lower):
        return "Cooking Oil"
    
    # Spices & Condiments (but not sauces)
    if any(keyword in name_lower for keyword in ['turmeric', 'holud', 'pepper', 'morich', 'spice', 'cumin', 'cinnamon', 'cardamom', 'clove', 'ginger', 'garlic', 'onion powder', 'chili powder', 'chilly powder', 'masala', 'salt', 'pink salt', 'bit salt']):
        if 'sauce' not in name_lower and 'mayonnaise' not in name_lower:
            return "Spices & Condiments"
    
    # Noodles & Pasta
    if any(keyword in name_lower for keyword in ['noodle', 'pasta', 'maggi', 'vermicelli', 'semai', 'lachcha', 'chow mein', 'thai noodle', 'ramen', 'mama', 'wai wai', 'chopstick', 'doodles', 'nissin', 'abc', 'prosperity', 'dekko', 'kishwan', 'kolson']):
        return "Noodles & Pasta"
    
    # Snacks & Chips
    if any(keyword in name_lower for keyword in ['chip', 'chips', 'chanachur', 'chanchur', 'dalmoth', 'bhujia', 'twist', 'nachoz', 'alooz', 'ring chips', 'potato cracker', 'lays', 'pringles', 'act ii', 'popcorn']):
        return "Snacks & Chips"
    
    # Biscuits & Cookies
    if any(keyword in name_lower for keyword in ['biscuit', 'cookie', 'cracker', 'wafer', 'oreo', 'marie', 'nankhatai', 'toast', 'hup seng', 'julie\'s', 'danisa', 'well food', 'ifad', 'pusti', 'olympic', 'goldmark', 'dan cake']):
        return "Biscuits & Cookies"
    
    # Chocolate & Candy
    if any(keyword in name_lower for keyword in ['chocolate', 'candy', 'cadbury', 'kitkat', 'snickers', 'm&m', 'mars', 'bounty', 'kinder', 'haribo', 'mentos', 'ginnou', 'oddie', 'cherir', 'cho cho', 'toi-moi', 'yupi']):
        return "Chocolate & Candy"
    
    # Bakery & Cakes
    if any(keyword in name_lower for keyword in ['cake', 'muffin', 'brownie', 'swiss roll', 'pound cake', 'bakorkhani', 'funtastic', 'yum']):
        return "Bakery & Cakes"
    
    # Pulses & Lentils
    if any(keyword in name_lower for keyword in ['dal', 'lentil', 'mung', 'moshur', 'chola', 'boot', 'anchor', 'dabli', 'mashkalai', 'moog']):
        return "Pulses & Lentils"
    
    # Nuts & Dry Fruits
    if any(keyword in name_lower for keyword in ['nut', 'almond', 'badam', 'cashew', 'kaju', 'pistachio', 'pestacio', 'pesta', 'peanut', 'walnut', 'nut walker', 'nutcandy', 'sunkist', 'fresh garden', 'chia seed']):
        return "Nuts & Dry Fruits"
    
    # Sugar & Sweeteners
    if any(keyword in name_lower for keyword in ['sugar', 'zerocal', 'sweetener', 'honey', 'dabur honey', 'saffola honey']):
        return "Sugar & Sweeteners"
    
    # Jam & Jelly
    if any(keyword in name_lower for keyword in ['jam', 'jelly']):
        return "Jam & Jelly"
    
    # Traditional Snacks
    if any(keyword in name_lower for keyword in ['muri', 'chira', 'naru', 'vaza', 'papri', 'nimki', 'monaka', 'murali', 'zhuri', 'khurma', 'papar', 'fuchka', 'fuska', 'sagudana', 'moa', 'chirar', 'jhinuk', 'shahi']):
        return "Traditional Snacks"
    
    # Food Essence & Color
    if any(keyword in name_lower for keyword in ['essence', 'food colour', 'food color', 'flavour', 'flavor', 'foster clark', 'haiko', 'dreem', 'rose water', 'kewra', 'biryani scent']):
        return "Food Essence & Color"
    
    # Frozen Food
    if any(keyword in name_lower for keyword in ['frozen', 'french fries']):
        return "Frozen Food"
    
    # Canned Food
    if any(keyword in name_lower for keyword in ['hosen', 'swiss garden', 'american natural', 'clariss']) or ('can' in name_lower and any(keyword in name_lower for keyword in ['mushroom', 'corn'])):
        return "Canned Food"
    
    # Health & Nutrition
    if any(keyword in name_lower for keyword in ['isubgul', 'psyllium', 'husk', 'vushi']):
        return "Health & Nutrition"
    
    # Chocolate & Candy (check for candy-like items)
    if any(keyword in name_lower for keyword in ['tayas', 'damla', 'sour tubes', 'tubes']):
        return "Chocolate & Candy"
    
    # Default category
    return "Other Food Items"

def process_csv(input_file: str, output_file: str):
    """
    Process the CSV file and update categories
    """
    rows = []
    
    # Read the CSV file
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row in reader:
            # Get the product name
            name = row.get('Name', '').strip('"')
            
            # Categorize the product
            category = categorize_product(name)
            row['Category'] = category
            
            rows.append(row)
    
    # Write the updated CSV file
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"Processed {len(rows)} products")
    print(f"Output written to {output_file}")
    
    # Print category distribution
    category_counts = {}
    for row in rows:
        cat = row['Category']
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    print("\nCategory Distribution:")
    for cat, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {cat}: {count}")

if __name__ == "__main__":
    process_csv(str(_DEFAULT_CSV), str(_DEFAULT_CSV))

