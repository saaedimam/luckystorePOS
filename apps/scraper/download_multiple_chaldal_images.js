import fs from 'fs';
import https from 'https';
import http from 'http';
import { execSync } from 'child_process';
import path from 'path';

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

const processCategory = async (jsonFile, outputFolder) => {
    console.log(`\nProcessing ${jsonFile} ...`);
    if (!fs.existsSync(jsonFile)) {
        console.log(`File ${jsonFile} not found.`);
        return;
    }
    
    const products = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    const downloadedNames = new Set();
    const uniqueProducts = [];

    for (const p of products) {
      if (!downloadedNames.has(p.name)) {
        downloadedNames.add(p.name);
        uniqueProducts.push(p);
      }
    }

    const outputDir = path.join(process.cwd(), outputFolder);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    for (let i = 0; i < uniqueProducts.length; i++) {
        const product = uniqueProducts[i];
        const url = product.url;
        const safeName = product.name.replace(/[/\\?%*:|"<>]/g, '-').trim();
        
        const tempFile = path.join(outputDir, `temp_${i}.tmp`);
        const finalFile = path.join(outputDir, `${safeName}.jpeg`);
        
        try {
          console.log(`Downloading ${safeName}...`);
          await download(url, tempFile);
          
          execSync(`sips -s format jpeg "${tempFile}" --out "${finalFile}" >/dev/null 2>&1`);
          
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        } catch (e) {
          console.error(`Error processing ${safeName}: ${e.message}`);
        }
    }
    console.log(`Done! Downloaded ${uniqueProducts.length} images to ${outputDir} in JPEG format.`);
};

(async () => {
    await processCategory('chaldal_energy-boosters_products.json', 'chaldal_energy-boosters_images');
})();
