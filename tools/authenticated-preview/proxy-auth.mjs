// proxy-auth.mjs — serve o CANDIDATO estatico + proxy autenticado de /api para o backend canonico.
// A autenticacao real e injetada AQUI (server-side): cookies do STORAGE_STATE viram Cookie header no /api.
// A pagina roda em localhost (identidade do candidato) e o backend recebe a sessao real.
// env: PORT, PUBLIC_DIR, API_BASE (https://...), STORAGE_STATE, ALLOWLIST (csv de hosts permitidos)
// Uso: node proxy-auth.mjs --help
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

const HELP = `proxy-auth.mjs — serve o candidato estatico e faz proxy autenticado de /api -> API_BASE.
env:
  PORT           porta local (default 8955)
  PUBLIC_DIR     raiz estatica do candidato (obrigatorio)
  API_BASE       backend canonico https (obrigatorio; host deve estar na ALLOWLIST)
  STORAGE_STATE  storageState.json (cookies injetados server-side; nunca vao para a pagina/log)
  ALLOWLIST      csv de hosts permitidos p/ API_BASE (default: host de API_BASE)
Segredos nunca sao impressos. /api fora da allowlist e recusado.`;
if (process.argv.includes('--help') || process.argv.includes('-h')) { process.stdout.write(HELP + '\n'); process.exit(0); }

const PORT = Number(process.env.PORT || 8955);
const PUBLIC_DIR = process.env.PUBLIC_DIR;
const API_BASE = (process.env.API_BASE || '').replace(/\/$/, '');
const STATE = process.env.STORAGE_STATE;
if (!PUBLIC_DIR || !API_BASE || !STATE) { console.error('faltam env PUBLIC_DIR/API_BASE/STORAGE_STATE'); process.exit(3); }
const apiUrl = new URL(API_BASE);
const ALLOW = (process.env.ALLOWLIST ? process.env.ALLOWLIST.split(',') : [apiUrl.hostname]).map(s => s.trim()).filter(Boolean);
const allowed = (host) => ALLOW.some(a => host === a || host.endsWith('.' + a));
if (!allowed(apiUrl.hostname)) { console.error('API_BASE fora da allowlist: ' + apiUrl.hostname); process.exit(4); }

// perm do storage (nao imprime conteudo)
try { const m = (fs.statSync(STATE).mode & 0o777).toString(8); if (m !== '600' && m !== '400') { console.error('STORAGE_STATE com permissao insegura (' + m + '); exija 600'); process.exit(5); } } catch (e) { console.error('STORAGE_STATE inacessivel'); process.exit(5); }

let cookieHeader = '';
try {
  const stj = JSON.parse(fs.readFileSync(STATE, 'utf8'));
  const cks = (stj.cookies || []).filter(c => !c.domain || apiUrl.hostname.endsWith(c.domain.replace(/^\./, '')));
  cookieHeader = cks.map(c => c.name + '=' + c.value).join('; ');
  console.log('proxy: ' + cks.length + ' cookie(s) para ' + apiUrl.hostname);
} catch (e) { console.error('storageState invalido'); process.exit(5); }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.map': 'application/json', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm' };

function servirEstatico(req, res) {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const fp = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!fp.startsWith(path.normalize(PUBLIC_DIR))) { res.writeHead(403).end('forbidden'); return; }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}

function proxiarApi(req, res) {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const headers = { ...req.headers, host: apiUrl.host };
    if (cookieHeader) headers['cookie'] = cookieHeader;
    delete headers['accept-encoding'];
    const opts = { protocol: apiUrl.protocol, hostname: apiUrl.hostname, port: apiUrl.port || 443, method: req.method, path: req.url, headers };
    const up = https.request(opts, (r2) => { res.writeHead(r2.statusCode || 502, r2.headers); r2.pipe(res); });
    up.on('error', (e) => { res.writeHead(502, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: false, proxy_error: String(e) })); });
    if (body.length) up.write(body); up.end();
  });
}

http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) return proxiarApi(req, res);
  return servirEstatico(req, res);
}).listen(PORT, '127.0.0.1', () => console.log('proxy-auth em http://127.0.0.1:' + PORT + '  (/api -> ' + API_BASE + ')'));
