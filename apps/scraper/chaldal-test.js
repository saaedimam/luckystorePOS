import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
    console.log("Launching browser for diagnostic...");
    const defaultChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const hasChrome = fs.existsSync(defaultChromePath);
    const browser = await puppeteer.launch({ 
        headless: false, 
        executablePath: hasChrome ? defaultChromePath : undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log("Navigating to Chaldal...");
    await page.goto("https://chaldal.com/fresh-vegetable", { waitUntil: 'domcontentloaded' });
    
    console.log("Waiting 5 seconds for React to load...");
    await new Promise(r => setTimeout(r, 5000));
    
    console.log("Extracting raw DOM structure...");
    const dump = await page.evaluate(() => {
        // Find the first element that looks like a product wrapper by looking for '৳'
        const moneyElements = Array.from(document.querySelectorAll('*')).filter(el => el.textContent && el.textContent.includes('৳') && el.children.length === 0);
        let best = moneyElements[moneyElements.length - 1]; // deeply nested inner element
        
        let containerHTML = "No money symbol found.";
        if (best) {
            let p = best.parentElement;
            // Go up 6 levels to get the entire product card
            for(let i=0; i<6; i++) { if(p.parentElement && p.parentElement !== document.body) p = p.parentElement; }
            containerHTML = "RAW CARD HTML:\n" + p.outerHTML;
        }
        
        return "ALL CLASSES ON DIVS:\n" + 
            Array.from(new Set(Array.from(document.querySelectorAll('div')).map(d => d.className).filter(c => c))).join("\n") +
            "\n\n\n" + containerHTML;
    });
    
    fs.writeFileSync(path.join(__dirname, 'chaldal-dump.txt'), dump);
    console.log("Diagnostic complete! Saved to chaldal-dump.txt");
    
    await browser.close();
})();
