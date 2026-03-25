# Shwapno Product Scraper

This scraper extracts product data from all Food subcategories on Shwapno website and generates an Excel file ready for import into Lucky Store.

## Method 1: Browser Console (Recommended - No Installation Required)

1. Open any Shwapno category page in your browser (e.g., https://www.shwapno.com/eggs)
2. Open browser console (F12 or Right-click → Inspect → Console)
3. Copy and paste the contents of `scrape-browser-console.js` into the console
4. Run: `const products = scrapeCurrentPage('Eggs');`
5. Export: `exportToCSV(products);`
6. Repeat for each category, then combine the CSV files

## Method 2: Node.js with Puppeteer (Requires Installation)

### Installation

1. Install Node.js (if not already installed): https://nodejs.org/

2. Install dependencies:
```bash
npm install
```

### Usage

Run the scraper:
```bash
npm run scrape
```

Or directly:
```bash
npm run scrape
```

**Note:** If Puppeteer fails to launch Chrome, you may need to install Chrome/Chromium separately or use Method 1 (Browser Console).

## Output

The scraper will:
1. Navigate through all 14 Food subcategories
2. Extract product information (name, price, category, image URL)
3. Generate `shwapno-products.xlsx` in the project directory

## Excel Format

The output Excel file matches Lucky Store's import format:
- Column A: Barcode (empty, can be filled later)
- Column B: Name (product name)
- Column C: Category (subcategory name)
- Column D: Cost (empty, can be filled later)
- Column E: Price (extracted from Shwapno)
- Column F: Image URL (product image URL)

## Categories Scraped

- Eggs
- Frozen
- Ice Cream
- Candy & Chocolate
- Baking Needs
- Fruits & Vegetables
- Meat & Fish
- Sauces & Pickles
- Cooking
- Canned Food
- Breakfast
- Dairy
- Drinks
- Snacks

## Notes

- The scraper waits 3 seconds between page loads to avoid overwhelming the server
- Products are deduplicated based on name and price
- Only products with valid names and prices are included
- The scraper handles dynamic content loading

## Troubleshooting

If the scraper fails:
1. Check your internet connection
2. Ensure Shwapno website is accessible
3. Try running again (some pages may need retry)
4. Check browser console for errors

