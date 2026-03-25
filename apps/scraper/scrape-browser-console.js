// Browser Console Scraper for Shwapno
// Copy and paste this entire script into the browser console on any Shwapno category page
// Then run: scrapeCurrentPage('CategoryName')

function scrapeCurrentPage(categoryName) {
  const products = [];
  const productMap = new Map();
  
  // Find all divs that contain both image and price
  const allDivs = Array.from(document.querySelectorAll('div'));
  
  allDivs.forEach(div => {
    try {
      const hasImage = div.querySelector('img');
      const text = div.textContent || '';
      const hasPrice = text.includes('৳') && text.match(/৳\s*(\d+[.,]?\d*)/);
      
      if (hasImage && hasPrice) {
        // Extract price
        const priceMatch = text.match(/৳\s*(\d+[.,]?\d*)/);
        const price = priceMatch ? priceMatch[1].replace(/,/g, '') : '';
        
        // Extract product name
        let name = '';
        const links = div.querySelectorAll('a[href^="/"]');
        for (const link of links) {
          const linkText = link.textContent.trim();
          const href = link.getAttribute('href');
          
          if (href && !href.includes('contact') && !href.includes('about') && 
              !href.includes('Office') && !href.includes('Shipping') &&
              !href.includes('deals') && !href.includes('brands') &&
              linkText.length > 2 && linkText.length < 200 &&
              !linkText.includes('Delivery') && !linkText.includes('Per') &&
              !linkText.includes('Add to Bag') && !linkText.includes('Min.')) {
            name = linkText;
            break;
          }
        }
        
        // If no name from link, extract from text
        if (!name || name.length < 2) {
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          for (const line of lines) {
            if (line.length > 2 && line.length < 200 && 
                !line.includes('৳') && !line.includes('Delivery') && 
                !line.includes('Per') && !line.includes('Add to Bag') &&
                !line.includes('Min.') && !line.includes('Sort By') &&
                !line.includes('Price Range') && !line.includes('Express Delivery')) {
              name = line;
              break;
            }
          }
        }
        
        // Extract image URL
        let imageUrl = '';
        const img = div.querySelector('img');
        if (img) {
          imageUrl = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = 'https://www.shwapno.com' + (imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl);
          }
        }
        
        // Validate and add
        if (name && name.length > 2 && name.length < 200 && price && parseFloat(price) > 0) {
          const key = `${name}_${price}`;
          if (!productMap.has(key)) {
            productMap.set(key, {
              name: name,
              price: parseFloat(price),
              category: categoryName,
              imageUrl: imageUrl || ''
            });
          }
        }
      }
    } catch (e) {
      // Skip errors
    }
  });
  
  const result = Array.from(productMap.values());
  console.log(`Found ${result.length} products in ${categoryName}`);
  return result;
}

// Function to export as CSV
function exportToCSV(products) {
  const header = 'Barcode,Name,Category,Cost,Price,Image URL\n';
  const rows = products.map(p => 
    `,"${p.name.replace(/"/g, '""')}","${p.category}","",${p.price},"${p.imageUrl}"`
  ).join('\n');
  
  const csv = header + rows;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shwapno-products.csv';
  a.click();
  URL.revokeObjectURL(url);
  console.log('CSV file downloaded!');
}

// Usage example:
// 1. Navigate to a category page (e.g., https://www.shwapno.com/eggs)
// 2. Open browser console (F12)
// 3. Paste this entire script
// 4. Run: const products = scrapeCurrentPage('Eggs');
// 5. Export: exportToCSV(products);

console.log('Shwapno scraper loaded!');
console.log('Usage: const products = scrapeCurrentPage("CategoryName");');
console.log('Then: exportToCSV(products);');

