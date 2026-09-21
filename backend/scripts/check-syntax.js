const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const files = walk(path.resolve(__dirname, '../src')).filter((file) => file.endsWith('.js'));
for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
console.log(`${files.length} fichiers JavaScript valides.`);
