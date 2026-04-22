import fs from 'fs';
import puppeteer from 'puppeteer';
import * as XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SHWAPNO_DATA_PATH = path.resolve(__dirname, 'shwapno-products.xlsx');

const urls = [
  'https://www.shwapno.com/deals-on-unilever',
  'https://www.shwapno.com/Unilever-3'
];

async function scrapeUnilever() {
  const defaultChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const hasChrome = fs.existsSync(defaultChromePath);
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: hasChrome ? defaultChromePath : undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const allProducts = [];

  for (const url of urls) {
    console.log(`Scraping: ${url}`);
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 4000));
        
        await page.evaluate(async () => {
             for(let i=0; i<3; i++) {
                 window.scrollBy(0, window.innerHeight);
                 await new Promise(r => setTimeout(r, 1000));
             }
        });

        const products = await page.evaluate(() => {
          const productMap = new Map();
          const allDivs = Array.from(document.querySelectorAll('div'));
          
          allDivs.forEach(div => {
            try {
              const text = div.textContent || '';
              if (!text.includes('৳')) return;
              
              const img = div.querySelector('img');
              if (!img) return;
              
              let name = '';
              const links = div.querySelectorAll('a[href^="/"]');
              for (const link of links) {
                const linkText = link.textContent.trim();
                if (linkText.length > 5 && linkText.length < 150 && !linkText.includes('Delivery')) {
                  name = linkText;
                  break;
                }
              }
              
              const priceMatch = text.match(/৳\s*(\d+[.,]?\d*)/);
              if (name && priceMatch) {
                const price = parseFloat(priceMatch[1].replace(/,/g, ''));
                if (price > 0 && name.length > 3) {
                    productMap.set(`${name}_${price}`, { name, price });
                }
              }
            } catch(e) {}
          });
          return Array.from(productMap.values());
        });
        
        console.log(`Found ${products.length} products here.`);
        allProducts.push(...products);
    } catch (e) {
        console.log("Error loading", url, e);
    }
  }
  await browser.close();
  
  console.log(`\nExtracted ${allProducts.length} Unilever products total.`);
  console.log(`Appending to ${SHWAPNO_DATA_PATH}...`);

  // Load existing Shwapno products
  let existingData = [];
  try {
      const shwb = XLSX.read(fs.readFileSync(SHWAPNO_DATA_PATH));
      existingData = XLSX.utils.sheet_to_json(shwb.Sheets[shwb.SheetNames[0]]);
  } catch (e) {
      console.log("Could not load existing shwapno-products.xlsx, creating new array.");
  }

  // Map of existing names to avoid duplicates
  const existingNames = new Set(existingData.map(p => p.Name));
  let added = 0;

  for (const p of allProducts) {
      if (!existingNames.has(p.name)) {
          existingData.push({
              Barcode: '',
              Name: p.name,
              Category: 'Unilever Campaign',
              Cost: '',
              Price: p.price,
              'Image URL': ''
          });
          existingNames.add(p.name);
          added++;
      }
  }

  console.log(`Added ${added} NEW products to Shwapno dataset!`);

  // Save back to Excel
  const newWb = XLSX.utils.book_new();
  const newWs = XLSX.utils.json_to_sheet(existingData);
  XLSX.utils.book_append_sheet(newWb, newWs, 'Products');
  XLSX.writeFile(newWb, SHWAPNO_DATA_PATH);

  console.log(`✅ Update complete! Run generate-price-mapping.js to reflect new links against inventory.`);
}

scrapeUnilever();
