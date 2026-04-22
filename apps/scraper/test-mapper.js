function extractSpecs(name) {
    if (!name) return null;
    const text = name.toLowerCase();
    const match = text.match(/([\d\.]+)\s*(kg|g|gm|ml|l|ltr|liter|pc|pcs|pack)\b/);
    if (!match) return null;
    let val = parseFloat(match[1]);
    let unit = match[2];
    
    if (unit === 'gm') unit = 'g';
    if (unit === 'kg') { val *= 1000; unit = 'g'; }
    if (unit === 'ltr' || unit === 'liter') { val *= 1000; unit = 'ml'; }
    if (unit === 'l') { val *= 1000; unit = 'ml'; }
    
    return { val, unit, raw: match[0] };
}

function getTokens(name) {
    if (!name) return [];
    const text = name.toLowerCase()
        .replace(/[^a-z0-9]/g, ' ') 
        .replace(/\b[\d\.]+\s*(kg|g|gm|ml|l|ltr|liter|pc|pcs|pack)\b/g, ' ') 
        .replace(/\s+/g, ' ')
        .trim();
        
    return text.split(' ').filter(w => w.length > 2 && !['and', 'for', 'with', 'the'].includes(w));
}

function calculateTokenScore(tokensA, tokensB) {
    if (tokensA.length === 0 || tokensB.length === 0) return 0;
    
    let matches = 0;
    for (const w of tokensA) {
        if (tokensB.includes(w)) matches++;
    }
    return (2.0 * matches) / (tokensA.length + tokensB.length);
}

const n1 = "Pepsodent Advanced Salt 70g";
const n2 = "Pepsodent Tooth Paste Advanced Salt 70g";

const s1 = extractSpecs(n1);
const s2 = extractSpecs(n2);
const t1 = getTokens(n1);
const t2 = getTokens(n2);

console.log("Tokens 1:", t1);
console.log("Tokens 2:", t2);
console.log("Specs 1:", s1);
console.log("Specs 2:", s2);
console.log("Score:", calculateTokenScore(t1, t2));
