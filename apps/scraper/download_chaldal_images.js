import fs from 'fs';
import https from 'https';
import http from 'http';
import { execSync } from 'child_process';
import path from 'path';

const products = JSON.parse(fs.readFileSync('chaldal_cookies_products.json', 'utf8'));

// We only need one image per product name, so we can use a Set to track downloaded names
const downloadedNames = new Set();
const uniqueProducts = [];

for (const p of products) {
  if (!downloadedNames.has(p.name)) {
    downloadedNames.add(p.name);
    uniqueProducts.push(p);
  }
}

const outputDir = path.join(process.cwd(), 'chaldal_cookies_images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    }).on('error', reject);
  });
};

(async () => {
  for (let i = 0; i < uniqueProducts.length; i++) {
    const product = uniqueProducts[i];
    const url = product.url;
    // Replace any unsafe characters for filenames just in case
    const safeName = product.name.replace(/[/\\?%*:|"<>]/g, '-').trim();
    
    // We don't know the exact extension beforehand, typically chaldal returns image directly.
    // Let's use a temporary extension
    const tempFile = path.join(outputDir, `temp_${i}.tmp`);
    const finalFile = path.join(outputDir, `${safeName}.jpeg`);
    
    try {
      console.log(`Downloading ${safeName}...`);
      await download(url, tempFile);
      
      // Convert to JPEG using sips
      console.log(`Converting to JPEG...`);
      execSync(`sips -s format jpeg "${tempFile}" --out "${finalFile}" >/dev/null 2>&1`);
      
      // Delete temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (e) {
      console.error(`Error processing ${safeName}: ${e.message}`);
    }
  }
  console.log(`Done! Downloaded ${uniqueProducts.length} images to ${outputDir} in JPEG format.`);
})();
