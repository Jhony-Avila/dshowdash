'use strict';
const fs = require('fs');
const path = require('path');

const bundlePath = process.argv[2];
if (!bundlePath) {
  console.error('Usage: node revert-events-direct.js <bundle.js>');
  process.exit(1);
}

const fullPath = path.resolve(bundlePath);
const backupDir = '/backup';

// Find the .bak-lote10-events backup for this bundle
function findBackup(filePath) {
  const encoded = filePath.replace(/\//g, '__') + '.bak-lote10-events';
  const bkPath = path.join(backupDir, encoded);
  if (fs.existsSync(bkPath)) return bkPath;
  return null;
}

const backupPath = findBackup(fullPath);
if (!backupPath) {
  console.log('NO BACKUP for ' + path.basename(fullPath) + ' — skipping');
  process.exit(0);
}

const backup = fs.readFileSync(backupPath, 'utf8');
let current = fs.readFileSync(fullPath, 'utf8');
const originalCurrent = current;

// Extract ALL import/export { ... } from "PATH" statements from the BACKUP
// where PATH contains events/catalog or /app/events/
const stmtRegex = /(?:import|export)\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g;

// Build map: sorted_named_exports -> original_path
const backupMap = {};
let m;
while ((m = stmtRegex.exec(backup)) !== null) {
  const rawExports = m[1];
  const importPath = m[2];
  
  // Only map paths that events-direct would have replaced
  if (importPath.includes('/core/runtime/events/catalog/') || importPath.includes('/app/events/')) {
    const normalized = rawExports
      .split(',')
      .map(function(e) { return e.trim().replace(/\s+as\s+\S+/, ''); })
      .filter(function(e) { return e.length > 0; })
      .sort()
      .join(',');
    backupMap[normalized] = importPath;
  }
}

// Now scan current file for import/export from runtime.bundle.js and replace
const runtimeRegex = /((?:import|export)\s*\{([^}]+)\}\s*from\s*)(["'])\/core\/runtime\/dist\/runtime\.bundle\.js\3/g;

let count = 0;
current = current.replace(runtimeRegex, function(fullMatch, prefix, namedExports, quote) {
  var normalized = namedExports
    .split(',')
    .map(function(e) { return e.trim().replace(/\s+as\s+\S+/, ''); })
    .filter(function(e) { return e.length > 0; })
    .sort()
    .join(',');
  
  if (backupMap[normalized]) {
    count++;
    return prefix + quote + backupMap[normalized] + quote;
  }
  
  // Not in backup map — this is a legitimate runtime.bundle.js import, leave it
  return fullMatch;
});

if (current !== originalCurrent) {
  fs.writeFileSync(fullPath, current);
  console.log('Reverted: ' + count + ' imports in ' + path.basename(fullPath));
} else {
  console.log('NO CHANGE in ' + path.basename(fullPath));
}
