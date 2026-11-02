var fs = require('fs');
var files = process.argv.slice(2);
var prefixes = ['core/','components/','assets/','boot/','platform/','app/','modules/','bootstrap-v2/'];
files.forEach(function(file) {
  var code = fs.readFileSync(file, 'utf8');
  var original = code;
  prefixes.forEach(function(pfx) {
    var escaped = pfx.replace(/\//g, '\\/');
    code = code.replace(new RegExp('from "\\.\\/(' + escaped + ')', 'g'), 'from "/$1');
    code = code.replace(new RegExp("from '\\.\\/(" + escaped + ")", 'g'), "from '/$1");
    code = code.replace(new RegExp('import\\("\\.\\/(' + escaped + ')', 'g'), 'import("/$1');
  });
  if (code !== original) {
    fs.writeFileSync(file, code, 'utf8');
    console.log('FIXED: ' + file);
  } else {
    console.log('NO CHANGE: ' + file);
  }
});
