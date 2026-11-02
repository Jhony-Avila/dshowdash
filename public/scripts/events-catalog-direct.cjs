'use strict';
const fs = require('fs');
const path = require('path');

const bundlePath = process.argv[2];
if (!bundlePath) {
  console.error('Usage: node events-catalog-direct.js <bundle.js>');
  process.exit(1);
}

const fullPath = path.resolve(bundlePath);
let content = fs.readFileSync(fullPath, 'utf8');
const original = content;
let count = 0;

// Target: replace /core/runtime/events/catalog/X.events.js
// with /core/runtime/events/catalog/dist/events-catalog.bundle.js
const bundleTarget = '/core/runtime/events/catalog/dist/events-catalog.bundle.js';

// Match ALL .events.js files in the catalog directory
// Pattern: "/core/runtime/events/catalog/ANYTHING.events.js" (with quotes)
const regex = /(["'])\/core\/runtime\/events\/catalog\/[a-z0-9_-]+\.events\.js\1/g;

content = content.replace(regex, function(match, quote) {
  count++;
  return quote + bundleTarget + quote;
});

if (content !== original) {
  fs.writeFileSync(fullPath, content);
  console.log('Events-catalog-direct: ' + count + ' replacements in ' + path.basename(fullPath));
} else {
  console.log('Events-catalog-direct: NO CHANGE in ' + path.basename(fullPath));
}
