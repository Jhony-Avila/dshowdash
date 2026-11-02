const fs = require('fs');
const path = require('path');
const bundlePath = process.argv[2];
if (!bundlePath) { console.error('Usage: node middlemen-direct-imports.js <bundle.js>'); process.exit(1); }
const fullPath = path.resolve(bundlePath);
let content = fs.readFileSync(fullPath, 'utf8');
const original = content;
let count = 0;

const mappings = [
  ['/assets/js/core/logger-global/index.js', '/assets/js/core/logger-global/dist/logger-global.bundle.js'],
  ['/assets/js/core/telemetry-core/index.js', '/assets/js/core/telemetry-core/dist/telemetry-core.bundle.js'],
  ['/components/security/csrf-token-manager/index.js', '/components/security/csrf-token-manager/dist/csrf-token-manager.bundle.js'],
  ['/components/session-manager/index.js', '/components/session-manager/dist/session-manager.bundle.js'],
  ['/components/toast/service/index.js', '/components/toast/service/dist/toast-service.bundle.js'],
  ['/core/js/enterprise-loader/index.js', '/core/js/enterprise-loader/dist/enterprise-loader.bundle.js'],
  ['/core/js/event-bus/index.js', '/core/js/event-bus/dist/event-bus.bundle.js'],
  ['/core/kernel/ui/index.js', '/core/kernel/ui/dist/kernel-ui.bundle.js'],
  ['/core/kernel/index.js', '/core/kernel/dist/kernel.bundle.js']
];

for (const [oldPath, newPath] of mappings) {
  const patterns = ['"' + oldPath + '"', "'" + oldPath + "'"];
  for (const pattern of patterns) {
    const replacement = pattern[0] + newPath + pattern[0];
    if (content.includes(pattern)) {
      content = content.split(pattern).join(replacement);
      count++;
    }
  }
}

if (content !== original) {
  fs.writeFileSync(fullPath, content);
  console.log('Middlemen direct: ' + count + ' replacements in ' + path.basename(fullPath));
} else {
  console.log('Middlemen direct: NO CHANGE in ' + path.basename(fullPath));
}
