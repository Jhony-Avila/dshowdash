#!/usr/bin/env node
// scripts/header/preview-shell.mjs — preview do SHELL REAL a partir de um worktree.
// @version 1.0.0  @created 2026-09-11 (lote as6.mobile_header_v2)
//
// Serve os arquivos do `public/` do worktree quando existem (index.html, módulo, CSS,
// dist do painel recém-buildado) e faz PROXY de todo o resto (api/, php, bundles que
// só existem no servidor) para o origin nginx local (https://127.0.0.1, Host
// dshowdash.com.br). Cookies de sessão são reescritos (sem Domain/Secure) para o
// navegador conversar com http://127.0.0.1:<porta>. Assim o candidato é exercitado
// com header+ticker+main reais, autenticação real e a MESMA API — sem tocar no webroot.
//
// Uso:  node scripts/header/preview-shell.mjs [--root /root/mh2/wt/public] [--port 8902]
import http from 'node:http';
import https from 'node:https';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ROOT = resolve(opt('root', resolve(import.meta.dirname, '..', '..', 'public')));
const PORT = Number(opt('port', 8902));
const UPSTREAM_HOST = opt('upstream-host', 'dshowdash.com.br');
const UPSTREAM_IP = opt('upstream-ip', '127.0.0.1');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.txt': 'text/plain', '.map': 'application/json', '.mp4': 'video/mp4' };

const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

function proxy(req, res) {
  const headers = { ...req.headers, host: UPSTREAM_HOST };
  delete headers['accept-encoding'];
  const up = https.request({ host: UPSTREAM_IP, port: 443, servername: UPSTREAM_HOST, method: req.method, path: req.url, headers, agent }, (ur) => {
    const h = { ...ur.headers };
    if (h['set-cookie']) h['set-cookie'] = h['set-cookie'].map((c) => c.replace(/;\s*Domain=[^;]*/i, '').replace(/;\s*Secure/i, ''));
    delete h['content-security-policy'];
    delete h['strict-transport-security'];
    h['cache-control'] = 'no-store';
    if (h.location) h.location = String(h.location).replace(new RegExp(`https://(www\\.)?${UPSTREAM_HOST.replace(/\./g, '\\.')}`), `http://127.0.0.1:${PORT}`);
    res.writeHead(ur.statusCode || 502, h);
    ur.pipe(res);
  });
  up.on('error', (e) => { try { res.writeHead(502); res.end('upstream: ' + e.message); } catch {} });
  req.pipe(up);
}

const server = http.createServer(async (req, res) => {
  try {
    const p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (req.method === 'GET' || req.method === 'HEAD') {
      let rel = p.endsWith('/') ? p + 'index.html' : p;
      const full = resolve(join(ROOT, normalize(rel)));
      if (full.startsWith(ROOT)) {
        const st = await stat(full).catch(() => null);
        if (st && st.isFile()) {
          const data = await readFile(full);
          res.writeHead(200, { 'Content-Type': MIME[extname(full).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Preview-Source': 'worktree' });
          res.end(req.method === 'HEAD' ? undefined : data);
          return;
        }
      }
    }
    proxy(req, res);
  } catch (e) { try { res.writeHead(500); res.end('err: ' + e.message); } catch {} }
});
server.on('clientError', (e, s) => { try { s.destroy(); } catch {} });
server.keepAliveTimeout = 60000;
server.listen(PORT, '127.0.0.1', () => console.log(`preview-shell up http://127.0.0.1:${PORT} root=${ROOT} upstream=${UPSTREAM_HOST}@${UPSTREAM_IP}`));
