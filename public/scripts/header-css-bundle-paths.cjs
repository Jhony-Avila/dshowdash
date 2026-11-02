// Header CSS Bundle Paths — Lote 6
// Replaces individual component.css paths in the header-components JS bundle
// with a single bundle CSS path. The loadCSS dedup check (querySelector) ensures
// only the first component creates the <link>; all others skip.
var fs = require('fs');

var file = process.argv[2];
if (!file) { console.error('Usage: node header-css-bundle-paths.js <header-components-bundle>'); process.exit(1); }

var code = fs.readFileSync(file, 'utf8');
var original = code;

// Replace all individual component.css paths with the bundle CSS path
var BUNDLE_CSS = '/components/header/components/dist/header-components.bundle.css';
var regex = /\/components\/header\/components\/[a-z0-9-]+\/component\.css/g;
var matches = code.match(regex);

if (matches && matches.length > 0) {
  code = code.replace(regex, BUNDLE_CSS);
  console.log('  Replaced ' + matches.length + ' CSS paths → ' + BUNDLE_CSS);
  for (var i = 0; i < matches.length; i++) {
    console.log('    ' + matches[i]);
  }
}

if (code !== original) {
  fs.writeFileSync(file, code, 'utf8');
  console.log('APPLIED: ' + matches.length + ' CSS path replacements to ' + file);
} else {
  console.log('NO CHANGES: ' + file);
}
