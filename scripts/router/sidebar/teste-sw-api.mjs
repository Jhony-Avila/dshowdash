// teste-sw-api.mjs — ROXO (CIMA), 27/11 (CACHE-MENU-P1 · R45). O public/sw.js REAL numa VM: (1) GET /api/ NÃO é interceptado (sem respondWith → o
// navegador vai à rede; nada de API no Cache Storage, offline = erro, nunca a resposta de outra sessão); (2) assets continuam com a estratégia do SW;
// (3) a VERSION mudou, para o activate apagar os caches anteriores (com as respostas /api/ já guardadas). Uso: node teste-sw-api.mjs <sw.js> [<sw.js da base>]
import fs from 'node:fs'; import vm from 'node:vm';
const [SW, BASE] = process.argv.slice(2);
let ok = 0, f = 0; const af = (n, c, d) => { console.log((c ? 'ok    ' : 'FALHA ') + n + (c ? '' : ' · ' + JSON.stringify(d))); c ? ok++ : f++; };
function carregar(arq) {
  const ouv = {}; const self = { addEventListener: (t, h) => { ouv[t] = h; }, skipWaiting() {}, clients: { claim: async () => {} }, location: { origin: 'http://127.0.0.1:8112' } };
  const ctx = { self, caches: { open: async () => ({ put: async () => {}, match: async () => null, keys: async () => [], addAll: async () => {} }), match: async () => null, keys: async () => [], delete: async () => true },
    fetch: async () => ({ status: 200, type: 'basic', clone() { return this; } }), Response: class { constructor(b, o) { this.status = o?.status; } }, URL, console: { log() {}, warn() {}, error() {} }, setTimeout, Promise };
  vm.createContext(ctx); vm.runInContext(fs.readFileSync(arq, 'utf8'), ctx, { filename: arq });
  const intercepta = (url) => { let r = false; ouv.fetch({ request: { method: 'GET', url, headers: new Map() }, respondWith: () => { r = true; } }); return r; };
  return { intercepta, versao: ctx.VERSION ?? vm.runInContext('typeof VERSION !== "undefined" ? VERSION : null', ctx) };
}
const c = carregar(SW);
af(`GET /api/ui/navigation.php NÃO é interceptado pelo SW (respondWith: ${c.intercepta('http://127.0.0.1:8112/api/ui/navigation.php?action=manifest')})`, !c.intercepta('http://127.0.0.1:8112/api/ui/navigation.php?action=manifest'), null);
af(`GET /api/admin/users (protegido) NÃO é interceptado`, !c.intercepta('http://127.0.0.1:8112/api/admin/users'), null);
af(`assets seguem com o SW (main.bundle.js interceptado: ${c.intercepta('http://127.0.0.1:8112/components/main/dist/main.bundle.js')})`, c.intercepta('http://127.0.0.1:8112/components/main/dist/main.bundle.js'), null);
if (BASE) { const b = carregar(BASE); af(`VERSION mudou (${b.versao} → ${c.versao}): o activate apaga os caches anteriores`, !!c.versao && c.versao !== b.versao, { base: b.versao, novo: c.versao }); }
console.log(`SW-API: ${ok} ok / ${f} falhas`); process.exit(f ? 1 : 0);
