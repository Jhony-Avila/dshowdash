const fs = require('fs');
const path = require('path');
const bundlePath = process.argv[2];
if (!bundlePath) { console.error('Usage: node events-direct-imports.js <bundle.js>'); process.exit(1); }
const fullPath = path.resolve(bundlePath);
let content = fs.readFileSync(fullPath, 'utf8');
const original = content;
let count = 0;
const events = [
  'action','api','app','asset','audit-trail','auth','boot','component','container',
  'error','feature-flags','footer','governance','header','kernel','layout','lifecycle',
  'log','main','nav','navrail','orchestrator','overlay','panel-loader','panels',
  'performance','permissions','persistence','preloader','router','security','session',
  'shell','sidebar','state','system','telemetry','theme','ticker','ui'
];
for (const evt of events) {
  const oldPath = '/core/runtime/events/catalog/' + evt + '.events.js';
  const newPath = '/core/runtime/dist/runtime.bundle.js';
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
  console.log('Events direct: ' + count + ' replacements in ' + path.basename(fullPath));
} else {
  console.log('Events direct: NO CHANGE in ' + path.basename(fullPath));
}
