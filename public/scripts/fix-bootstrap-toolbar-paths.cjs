// Fix Bootstrap Toolbar Paths — Reverte 3 redirects incorretos do Lote 9
// features-toolbar, features-integration e toolbar-wiring devem apontar
// para seus index.js originais, NÃO para main.bundle.js
var fs = require('fs');

var file = process.argv[2];
if (!file) { console.error('Usage: node fix-bootstrap-toolbar-paths.js <bootstrap-bundle>'); process.exit(1); }

var code = fs.readFileSync(file, 'utf8');
var original = code;
var count = 0;

var fixes = [
  {
    from: 'import("/components/main/dist/main.bundle.js").then(function(FeaturesToolbar)',
    to:   'import("/components/main/ui/container-main/utils/features-toolbar/index.js").then(function(FeaturesToolbar)',
    label: 'features-toolbar'
  },
  {
    from: 'import("/components/main/dist/main.bundle.js").then(function(wiringModule)',
    to:   'import("/components/main/ui/container-main/utils/toolbar-wiring/index.js").then(function(wiringModule)',
    label: 'toolbar-wiring'
  },
  {
    from: 'import("/components/main/dist/main.bundle.js").then(function(FeaturesIntegration)',
    to:   'import("/components/main/ui/container-main/utils/features-integration/index.js").then(function(FeaturesIntegration)',
    label: 'features-integration'
  }
];

for (var i = 0; i < fixes.length; i++) {
  var fix = fixes[i];
  if (code.indexOf(fix.from) !== -1) {
    code = code.replace(fix.from, fix.to);
    count++;
    console.log('  FIXED: ' + fix.label);
  } else {
    console.log('  SKIP (not found): ' + fix.label);
  }
}

if (code !== original) {
  fs.writeFileSync(file, code, 'utf8');
  console.log('APPLIED: ' + count + ' fixes to ' + file);
} else {
  console.log('NO CHANGES: ' + file);
}
