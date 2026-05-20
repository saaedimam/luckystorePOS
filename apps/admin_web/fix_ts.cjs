const fs = require('fs');
const execSync = require('child_process').execSync;

try {
  execSync('npx tsc -b', { stdio: 'pipe' });
} catch (err) {
  const output = err.stdout.toString();
  const lines = output.split('\n');
  const fileFixes = {};

  for (const line of lines) {
    // Match: src/features/purchase/PurchaseHistoryPage.tsx(7,34): error TS6133: 'SkeletonBlock' is declared but its value is never read.
    const match = line.match(/(src\/.*?\.tsx?)\((\d+),(\d+)\): error TS6133: '(.*?)'/);
    if (match) {
      const file = match[1];
      const lineNum = parseInt(match[2]);
      const ident = match[4];
      if (!fileFixes[file]) fileFixes[file] = [];
      fileFixes[file].push({ lineNum, ident });
    }
  }

  for (const [file, fixes] of Object.entries(fileFixes)) {
    let content = fs.readFileSync(file, 'utf8');
    const contentLines = content.split('\n');
    
    // Sort fixes by line number descending so modifying lines doesn't shift others
    fixes.sort((a, b) => b.lineNum - a.lineNum);
    
    for (const fix of fixes) {
      const idx = fix.lineNum - 1;
      let targetLine = contentLines[idx];
      
      // If it's an import, remove the identifier
      if (targetLine.includes('import')) {
        // Try removing "ident," or ", ident" or "ident"
        let newLine = targetLine
          .replace(new RegExp(`\\b${fix.ident}\\s*,\\s*`), '') // ident, 
          .replace(new RegExp(`\\s*,\\s*${fix.ident}\\b`), '') // , ident
          .replace(new RegExp(`\\b${fix.ident}\\b`), '');      // ident
          
        // Clean up empty imports like `import { } from '...'`
        if (newLine.match(/import\s*{\s*}\s*from/)) {
          contentLines.splice(idx, 1); // delete the whole line
        } else {
          contentLines[idx] = newLine;
        }
      }
    }
    fs.writeFileSync(file, contentLines.join('\n'));
    console.log(`Fixed ${file}`);
  }
}
