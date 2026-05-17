// Fix curly/smart quotes in constellation-forge.html
const fs = require('fs');
const path = 'C:/Users/kusal.f/projects/agent-hub-mockup/constellation-forge.html';
let c = fs.readFileSync(path, 'utf8');
const before = (c.match(/[“”]/g) || []).length;
c = c.replace(/[“”]/g, '"');
const after = (c.match(/[“”]/g) || []).length;
fs.writeFileSync(path, c, 'utf8');
console.log('Fixed', before, 'curly quotes. Remaining:', after);
