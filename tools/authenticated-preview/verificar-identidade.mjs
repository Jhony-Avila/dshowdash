// verificar-identidade.mjs — gate de identidade do bundle do VC (zero-edit; config-driven).
// Compara o bundle CONSTRUIDO e o SERVIDO contra a identidade esperada versionada (audit.config.json + vc-dist.sha256).
// Modos:
//   node verificar-identidade.mjs build  --config <cfg> --dist <distDir>
//   node verificar-identidade.mjs served --config <cfg> --base <url> [--prefix </components/.../dist>]
// SOURCE fica no bash (git rev-parse <cand>:<painel> == identity.vcSourceTree).
// Fail-closed: divergencia em qualquer arquivo CRITICO (.js/.css) -> exit != 0.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const args = process.argv.slice(2);
const mode = args[0];
function opt(name, def) { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; }
if (!['build', 'served'].includes(mode)) { console.error('uso: build|served --config <cfg> ...'); process.exit(2); }

const CFG = opt('config'); if (!CFG || !fs.existsSync(CFG)) { console.error('FAIL: --config invalido'); process.exit(2); }
const cfg = JSON.parse(fs.readFileSync(CFG, 'utf8'));
const idc = cfg.identity || {};
const mapFile = path.resolve(path.dirname(CFG), idc.distMapFile || 'vc-dist.sha256');
if (!fs.existsSync(mapFile)) { console.error('FAIL: mapa ' + mapFile + ' ausente'); process.exit(2); }
// mapa: linhas "sha256  relpath"
const MAP_RAW = fs.readFileSync(mapFile);
const MAP = MAP_RAW.toString('utf8').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
  const sp = l.indexOf('  '); return { sha: l.slice(0, sp), rel: l.slice(sp + 2) };
});
const isCritical = (rel) => /\.(js|css)$/.test(rel) && !/\.map$/.test(rel);
const soft = (rel) => /(^|\/)\.vite\/manifest\.json$|\.map$/.test(rel);
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

// identidade canonica = sha256 do PROPRIO arquivo de mapa (mesma definicao do vcBundleIdentity).
const MAP_IDENTITY = sha256(MAP_RAW);

let bad = 0, miss = 0, okc = 0; const problems = [];

if (mode === 'build') {
  const dist = opt('dist'); if (!dist || !fs.existsSync(dist)) { console.error('FAIL: --dist invalido'); process.exit(2); }
  const built = [];
  for (const { sha, rel } of MAP) {
    const fp = path.join(dist, rel);
    if (!fs.existsSync(fp)) { if (isCritical(rel)) { problems.push('AUSENTE(critico) ' + rel); bad++; } else { miss++; } continue; }
    const got = sha256(fs.readFileSync(fp)); built.push({ sha: got, rel });
    if (got !== sha) { problems.push('DIVERGE ' + rel + ' esperado=' + sha.slice(0, 12) + ' obtido=' + got.slice(0, 12)); if (isCritical(rel)) bad++; } else okc++;
  }
  console.log('BUILD_FILES_OK=' + okc + ' CRITICOS_RUINS=' + bad + ' SOFT_AUSENTES=' + miss);
  console.log('EXPECTED_BUNDLE_IDENTITY=' + (idc.vcBundleIdentity || '(sem)'));
  console.log('MAP_IDENTITY=' + MAP_IDENTITY + (MAP_IDENTITY === idc.vcBundleIdentity ? ' (==config)' : ' (!=config: mapa versionado difere do esperado!)'));
  if (MAP_IDENTITY !== idc.vcBundleIdentity) bad++;
  if (problems.length) console.log(problems.slice(0, 20).join('\n'));
  console.log('BUILD_IDENTITY_MATCH=' + (bad === 0 ? 'YES' : 'NO'));
  process.exit(bad === 0 ? 0 : 1);
}

if (mode === 'served') {
  const base = (opt('base') || '').replace(/\/$/, '');
  const prefix = opt('prefix', '/components/panels/panel-avatar-studio/dist');
  if (!base) { console.error('FAIL: --base ausente'); process.exit(2); }
  const results = [];
  for (const { sha, rel } of MAP) {
    const url = base + prefix + '/' + rel;
    try {
      const r = await fetch(url, { redirect: 'manual' });
      if (!r.ok) { if (isCritical(rel)) { problems.push('HTTP ' + r.status + ' (critico) ' + rel); bad++; } else miss++; continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      const got = sha256(buf);
      results.push({ sha: got, rel });
      if (got !== sha) { problems.push('DIVERGE ' + rel + ' esperado=' + sha.slice(0, 12) + ' servido=' + got.slice(0, 12)); if (isCritical(rel)) bad++; } else okc++;
    } catch (e) { if (isCritical(rel)) { problems.push('ERRO fetch (critico) ' + rel + ' :: ' + e); bad++; } else miss++; }
  }
  console.log('SERVED_FILES_OK=' + okc + ' CRITICOS_RUINS=' + bad + ' SOFT_AUSENTES=' + miss);
  if (problems.length) console.log(problems.slice(0, 20).join('\n'));
  console.log('SERVED_IDENTITY_MATCH=' + (bad === 0 ? 'YES' : 'NO'));
  process.exit(bad === 0 ? 0 : 1);
}
