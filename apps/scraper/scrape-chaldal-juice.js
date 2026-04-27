import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  console.log("Navigating to https://chaldal.com/juice ...");
  
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
  
  await page.goto('https://chaldal.com/juice', { waitUntil: 'networkidle2', timeout: 60000 });
  
  // scroll to load lazy images
  await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;
              if (totalHeight >= scrollHeight || totalHeight > 10000) {
                  clearInterval(timer);
                  resolve();
              }
          }, 100);
      });
  });
  
  await new Promise(r => setTimeout(r, 2000)); // wait for images to load
  
  const products = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div.productV2Catalog'));
      return items.map(item => {
          const nameEl = item.querySelector('div.pvName p.nameTextWithEllipsis') || item.querySelector('div.pvName');
          const imgEl = item.querySelector('div.imageWrapperWrapper > img') || item.querySelector('img');
          
          if (nameEl && imgEl) {
              let imageUrl = imgEl.src || imgEl.getAttribute('data-src') || '';
              try {
                const u = new URL(imageUrl);
                const src = u.searchParams.get('src');
                if (src) imageUrl = decodeURIComponent(src); // raw original image
              } catch (_) {}
              
              return {
                  name: (nameEl.textContent || '').trim().replace(/[^a-zA-Z0-9 _-]/g, ''),
                  url: imageUrl
              };
          }
          return null;
      }).filter(p => p !== null && p.url && p.url.startsWith('http'));
  });
  
  console.log(`Found ${products.length} products`);
  fs.writeFileSync('chaldal_juice_products.json', JSON.stringify(products, null, 2));
  
  await browser.close();
})();
