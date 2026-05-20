const fs = require('fs');
const { execSync } = require('child_process');

const run = () => {
  try {
    execSync('npm run lint', { stdio: 'pipe' });
  } catch (err) {
    const output = err.stdout.toString();
    const lines = output.split('\n');
    let currentFile = '';
    const fileFixes = {};

    for (const line of lines) {
      if (line.startsWith('/')) {
        currentFile = line.trim();
        if (!fileFixes[currentFile]) fileFixes[currentFile] = [];
      } else if (line.includes('no-unused-vars') || line.includes('never used')) {
        const matchLine = line.match(/^\s*(\d+):(\d+)\s+(error|warning)\s+'(.*?)'/);
        if (matchLine) {
          fileFixes[currentFile].push({
            lineNum: parseInt(matchLine[1]),
            colNum: parseInt(matchLine[2]),
            ident: matchLine[4]
          });
        }
      }
    }

    for (const [file, fixes] of Object.entries(fileFixes)) {
      if (fixes.length === 0) continue;
      let contentLines = fs.readFileSync(file, 'utf8').split('\n');
      fixes.sort((a, b) => b.lineNum - a.lineNum); // reverse order
      
      for (const fix of fixes) {
        const idx = fix.lineNum - 1;
        let line = contentLines[idx];
        
        if (line.includes('import ')) {
          line = line.replace(new RegExp(`\\b${fix.ident}\\s*,\\s*`), '');
          line = line.replace(new RegExp(`,\\s*${fix.ident}\\b`), '');
          line = line.replace(new RegExp(`{\\s*${fix.ident}\\s*}`), '{}');
          
          if (line.match(/import\s*{\s*}\s*from/) || line.match(/import\s+type\s*{\s*}\s*from/)) {
            contentLines.splice(idx, 1);
          } else {
            contentLines[idx] = line;
          }
        } 
        else if (line.includes(fix.ident)) {
          const rx = new RegExp(`\\b${fix.ident}\\b`, 'g');
          contentLines[idx] = line.replace(rx, `_${fix.ident}`);
        }
      }
      fs.writeFileSync(file, contentLines.join('\n'));
      console.log(`Cleaned ${file}`);
    }
  }
};
run();
