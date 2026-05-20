const fs = require('fs');
const path = require('path');
const report = JSON.parse(fs.readFileSync('lint_report.json', 'utf8'));

report.forEach(file => {
  const filePath = file.filePath;
  const messages = file.messages;
  
  if (messages.length === 0) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  let changed = false;
  
  // To avoid messing up line numbers, we sort messages by line descending and delete lines or modify them
  // Actually, for unused-vars on imports, we can use ts-morph. Let's just output the errors to see what we have to fix manually.
  
  messages.forEach(msg => {
    if (msg.ruleId === 'react-hooks/set-state-in-effect') {
      console.log(`SET_STATE_IN_EFFECT: ${filePath}:${msg.line}`);
    } else if (msg.ruleId === 'react-hooks/incompatible-library') {
      console.log(`INCOMPATIBLE_LIBRARY: ${filePath}:${msg.line}`);
    } else if (msg.ruleId === 'react-hooks/exhaustive-deps') {
      console.log(`EXHAUSTIVE_DEPS: ${filePath}:${msg.line}`);
    }
  });
});
