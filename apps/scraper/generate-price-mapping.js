import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INVENTORY_PATH = path.resolve(__dirname, '../../data/inventory/LS InventoryApr10th.csv');
const SHWAPNO_DATA_PATH = path.resolve(__dirname, 'shwapno-products.xlsx');
const CHALDAL_DATA_PATH = path.resolve(__dirname, 'chaldal-products.xlsx');
const OUTPUT_PATH = path.resolve(__dirname, 'lucky-store-competitor-prices.xlsx');

// 1. Helper: Extract pure numeric size + unit to enforce strict size matching
function extractSpecs(name) {
    if (!name) return null;
    const text = name.toLowerCase();
    // Common e-commerce patterns like '500g', '1 kg', '500 ml', '2 ltr', '75 gm', '8 pcs'
    const match = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|gm|ml|l|ltr|liter|pc|pcs|pack)\b/);
    if (!match) return null;
    let val = parseFloat(match[1]);
    let unit = match[2];
    
    // Normalize units
    if (unit === 'gm') unit = 'g';
    if (unit === 'kg') { val *= 1000; unit = 'g'; }
    if (unit === 'ltr' || unit === 'liter') { val *= 1000; unit = 'ml'; }
    if (unit === 'l') { val *= 1000; unit = 'ml'; }
    
    return { val, unit, raw: match[0] };
}

// 2. Helper: Extract meaningful keyword tokens (ignoring sizes and stop words)
function getTokens(name) {
    if (!name) return [];
    const text = name.toLowerCase()
        .replace(/[^a-z0-9]/g, ' ') // Strip special chars
        .replace(/\b\d+(?:\.\d+)?\s*(kg|g|gm|ml|l|ltr|liter|pc|pcs|pack)\b/g, ' ') // Remove weights
        .replace(/\s+/g, ' ')
        .trim();
        
    return text.split(' ').filter(w => w.length > 2 && !['and', 'for', 'with', 'the', 'pack', 'of', 'free', 'offer'].includes(w));
}

// 3. Helper: Calculate Jaccard similarity of two token sets
function calculateTokenScore(tokensA, tokensB) {
    if (tokensA.length === 0 || tokensB.length === 0) return 0;
    
    let matches = 0;
    for (const w of tokensA) {
        if (tokensB.includes(w)) matches++;
    }
    
    // Dice's Coefficient based on tokens
    return (2.0 * matches) / (tokensA.length + tokensB.length);
}

function findBestMatch(myProduct, competitorList) {
    const mySpecs = extractSpecs(myProduct.name);
    const myTokens = getTokens(myProduct.name);
    
    let bestMatch = null;
    let bestScore = 0.0;

    for (const comp of competitorList) {
        const compSpecs = extractSpecs(comp.Name || comp.name);
        
        // STRICT SIZE CHECK: If BOTH have sizes, they MUST match.
        if (mySpecs && compSpecs) {
            if (mySpecs.val !== compSpecs.val || mySpecs.unit !== compSpecs.unit) {
                continue; // Instant skip: mismatched sizes!
            }
        }
        
        const compTokens = getTokens(comp.Name || comp.name);
        const score = calculateTokenScore(myTokens, compTokens);
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = comp;
        }
    }

    // Minimum confidence threshold to consider it a real match is ~50% Token Overlap
    if (bestScore >= 0.5) {
        return {
            matchObj: bestMatch,
            score: bestScore
        };
    }
    
    return null; // No good match found
}

async function runMappingPipeline() {
  console.log("🚀 Starting the Highly-Optimized Token & Size Mapping Engine (Local Script)...");

  let shwapnoRaw = [];
  let chaldalRaw = [];

  try {
    const shwb = XLSX.read(fs.readFileSync(SHWAPNO_DATA_PATH));
    shwapnoRaw = XLSX.utils.sheet_to_json(shwb.Sheets[shwb.SheetNames[0]]).filter(p => p.Name);
    console.log(`✅ Loaded ${shwapnoRaw.length} Shwapno products.`);

    const chwb = XLSX.read(fs.readFileSync(CHALDAL_DATA_PATH));
    chaldalRaw = XLSX.utils.sheet_to_json(chwb.Sheets[chwb.SheetNames[0]]).filter(p => p.Name);
    console.log(`✅ Loaded ${chaldalRaw.length} Chaldal products.`);
  } catch (error) {
    console.error("❌ Data load failed.", error.message);
    process.exit(1);
  }

  let myLuckyStoreProducts = [];
  try {
    const csvData = fs.readFileSync(INVENTORY_PATH, 'utf-8');
    const lines = csvData.split('\n');
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const columns = line.split(',');
        const itemName = columns[3]; 
        if (itemName && itemName !== 'Item Name') {
            myLuckyStoreProducts.push({
                sku: columns[1] || columns[0], 
                name: itemName.trim(),
                my_price: parseFloat(columns[9]) || 0 
            });
        }
    }
    console.log(`✅ Loaded ${myLuckyStoreProducts.length} internal products.\n`);
  } catch (error) {
    console.error("❌ CSV load failed.", error.message);
    process.exit(1);
  }

  const finalMappings = [];
  console.log("⚡ Executing Logic-Based Inference Mapping...");

  for (const item of myLuckyStoreProducts) {
      const shwapnoResult = findBestMatch(item, shwapnoRaw);
      const chaldalResult = findBestMatch(item, chaldalRaw);

      let sMatchName = "";
      let sMatchPrice = 0;
      if (shwapnoResult) {
          sMatchName = `${shwapnoResult.matchObj.Name} (৳${shwapnoResult.matchObj.Price})`;
          sMatchPrice = shwapnoResult.matchObj.Price;
      }

      let cMatchName = "";
      let cMatchPrice = 0;
      if (chaldalResult) {
          cMatchName = `${chaldalResult.matchObj.Name} (৳${chaldalResult.matchObj.Price})`;
          cMatchPrice = chaldalResult.matchObj.Price;
      }

      const hasMatch = shwapnoResult || chaldalResult;
      
      finalMappings.push({
          'SKU': item.sku,
          'Lucky Store Name': item.name,
          'LS Price': item.my_price,
          'Shwapno Match': sMatchName,
          'Shwapno Price': sMatchPrice || '',
          'Chaldal Match': cMatchName,
          'Chaldal Price': cMatchPrice || '',
          'Chaldal Diff': cMatchPrice ? (cMatchPrice - item.my_price).toFixed(2) : '',
          'Shwapno Diff': sMatchPrice ? (sMatchPrice - item.my_price).toFixed(2) : '',
          'Confidence': hasMatch ? 'High Confidence (Size+Token)' : 'No match found'
      });
  }

  const matchStats = { S: 0, C: 0, Both: 0 };
  for(const m of finalMappings) {
      if (m['Shwapno Match']) matchStats.S++;
      if (m['Chaldal Match']) matchStats.C++;
      if (m['Shwapno Match'] && m['Chaldal Match']) matchStats.Both++;
  }
  
  console.log(`\n📊 Mapping Results:`);
  console.log(`   - Matched in Shwapno: ${matchStats.S}`);
  console.log(`   - Matched in Chaldal: ${matchStats.C}`);
  console.log(`   - Matched in Both: ${matchStats.Both}`);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(finalMappings);
  
  worksheet['!cols'] = [{ wch: 15 }, { wch: 35 }, { wch: 10 }, { wch: 35 }, { wch: 10 }, { wch: 35 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Price Analysis');
  XLSX.writeFile(workbook, OUTPUT_PATH);
  
  console.log(`\n🎉 DONE IN SECONDS! True analytical file saved to: ${OUTPUT_PATH}`);
}

runMappingPipeline();
