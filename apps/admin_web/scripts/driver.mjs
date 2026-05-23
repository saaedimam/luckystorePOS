import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const command = args[0] || 'screenshot';
const url = args[1] || 'http://localhost:5173/admin/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    if (command === 'screenshot') {
      const screenshotPath = args[2] || '/tmp/admin-web-screenshot.png';
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log('Screenshot saved to:', screenshotPath);
    } else if (command === 'eval') {
      const result = await page.evaluate(args[2]);
      console.log('Result:', result);
    } else if (command === 'click') {
      await page.click(args[2]);
      await page.waitForTimeout(1000);
      console.log('Clicked:', args[2]);
    } else if (command === 'type') {
      await page.fill(args[2], args[3] || '');
      console.log('Typed into:', args[2]);
    }
    
    console.log('Page title:', await page.title());
    console.log('URL:', page.url());
  } catch (e) {
    console.error('Error:', e.message);
    const screenshotPath = '/tmp/admin-web-error.png';
    await page.screenshot({ path: screenshotPath });
    console.log('Error screenshot saved to:', screenshotPath);
  } finally {
    await browser.close();
  }
})();
