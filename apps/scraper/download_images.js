import fs from 'fs';
import https from 'https';
import http from 'http';
import { execSync } from 'child_process';
import path from 'path';

const urls = JSON.parse(fs.readFileSync('aamaderbazar_urls.json', 'utf8'));
const uniqueUrls = [...new Set(urls)].filter(u => u.includes('/uploads/')); // filter to only get actual product/upload images

const outputDir = path.join(process.cwd(), 'scraped_images');
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
  for (let i = 0; i < uniqueUrls.length; i++) {
    const url = uniqueUrls[i];
    const urlObj = new URL(url);
    const basename = path.basename(urlObj.pathname);
    const nameWithoutExt = path.parse(basename).name || `image_${i}`;
    const ext = path.extname(basename) || '.jpg';
    
    const tempFile = path.join(outputDir, `temp_${i}_${basename}`);
    const finalFile = path.join(outputDir, `${nameWithoutExt}.jpeg`);
    
    try {
      console.log(`Downloading ${url}...`);
      await download(url, tempFile);
      
      // Convert to JPEG using sips
      console.log(`Converting to JPEG...`);
      execSync(`sips -s format jpeg "${tempFile}" --out "${finalFile}" >/dev/null 2>&1`);
      
      // Delete temp file
      if (tempFile !== finalFile) {
        fs.unlinkSync(tempFile);
      }
    } catch (e) {
      console.error(`Error processing ${url}: ${e.message}`);
    }
  }
  console.log(`Done! Downloaded ${uniqueUrls.length} images to ${outputDir} in JPEG format.`);
})();
