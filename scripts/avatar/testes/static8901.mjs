import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname, resolve } from 'node:path';
const ROOT = resolve(process.argv[2] || '.');
const PORT = 8901;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif', '.glb':'model/gltf-binary', '.gltf':'model/gltf+json', '.wasm':'application/wasm', '.woff2':'font/woff2', '.woff':'font/woff', '.ttf':'font/ttf', '.map':'application/json', '.ico':'image/x-icon', '.txt':'text/plain' };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const full = resolve(join(ROOT, normalize(p)));
    if (!full.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
    const st = await stat(full).catch(() => null);
    if (!st || !st.isFile()) { res.writeHead(404); res.end('not found'); return; }
    const data = await readFile(full);
    res.writeHead(200, { 'Content-Type': MIME[extname(full).toLowerCase()] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch (e) { try { res.writeHead(500); res.end('err'); } catch (_) {} }
});
server.on('clientError', (e, sock) => { try { sock.destroy(); } catch (_) {} });
server.keepAliveTimeout = 60000;
server.listen(PORT, '127.0.0.1', () => console.log('static8901 up port=' + PORT + ' root=' + ROOT));
