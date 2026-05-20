import fs from 'fs';
import { globSync } from 'glob';

const files = globSync('src/**/*.tsx');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    // Fix "import from 'react';" -> just delete the line
    if (lines[i].match(/^import\s+from\s+['"]react['"];?/)) {
      lines[i] = '';
      changed = true;
    }
    // Fix "import  from '...'"
    else if (lines[i].match(/^import\s+from\s+['"].*?['"];?/)) {
      lines[i] = '';
      changed = true;
    }
    // Fix "const= React.lazy" or "const = React.lazy"
    else if (lines[i].match(/^const\s*=\s*React\.lazy/)) {
      lines[i] = '';
      changed = true;
    }
    // Fix "const  =" in general if it matches unused stuff? No, just the lazy ones.
  }
  
  if (changed) {
    fs.writeFileSync(file, lines.filter(l => l !== '').join('\n'));
    console.log(`Cleaned up broken syntax in ${file}`);
  }
}
