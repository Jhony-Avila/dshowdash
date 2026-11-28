// teste-identidade-consumida.mjs — ROXO (CIMA), 27/11 (INTEGRADO-01 · item 8). O navigation-model-loader REAL (empacotado com esbuild; só a porta
// /core/runtime/ports-profiles.js simulada), com fetch simulado: (1) aplica e REGISTRA a identidade (html[data-menu-*] + __dshowMenuConsumido);
// (2) resposta ANTIGA retida e liberada DEPOIS da nova (pedido superado) é descartada; (3) resposta de geração MENOR é rejeitada e o estado fica;
// (4) geração maior (restauração publicada como nova revisão) é aceita. Uso: node teste-identidade-consumida.mjs <raiz-do-repo> [esbuild-package.json]
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os'; import { createRequire } from 'node:module'; import { pathToFileURL } from 'node:url';
const [RAIZ, ESB] = process.argv.slice(2); const esbuild = createRequire(ESB || path.join(RAIZ, 'public/react/package.json'))('esbuild');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sid-')); const stub = path.join(tmp, 'portas.mjs');
fs.writeFileSync(stub, `const reg = globalThis.__regPortas || (globalThis.__regPortas = new Map()); const p = () => ({ init() {}, inject(o) { for (const [k, v] of Object.entries(o || {})) reg.set(k, v); }, get: (k) => reg.get(k), snapshot: () => Object.fromEntries(reg), isInitialized: () => true });
export const createCorePorts = p, createUiPorts = p, createPanelPorts = p;`);
const out = path.join(tmp, 'loader.mjs');
await esbuild.build({ entryPoints: [path.join(RAIZ, 'public/components/sidebar/integration/navigation-model-loader/index.ts')], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
  plugins: [{ name: 'p', setup(b) { b.onResolve({ filter: /^\/core\/runtime\/ports-profiles\.js$/ }, () => ({ path: stub })); b.onResolve({ filter: /^\.\.?\// }, (a) => { const f = path.resolve(a.resolveDir, a.path); for (const c of [f.replace(/\.js$/, '.ts'), f]) if (fs.existsSync(c)) return { path: c }; return null; }); } }] });
// ambiente mínimo: document.documentElement com atributos, storage em memória
globalThis.window = globalThis; const swCaches = new Map([['dshow-v9', new Map([['http://127.0.0.1:8112/api/ui/navigation.php?action=manifest', 1], ['http://127.0.0.1:8112/api/admin/users', 1], ['http://127.0.0.1:8112/components/main/dist/main.bundle.js', 1]])]]); globalThis.caches = { keys: async () => [...swCaches.keys()], open: async (n) => { const m = swCaches.get(n); return { keys: async () => [...m.keys()].map((url) => ({ url })), delete: async (r) => m.delete(r.url) }; } }; const ouvPagina = []; globalThis.addEventListener = (t, h) => { if (t === 'pageshow') ouvPagina.push(h); }; const attrs = new Map(); globalThis.document = { documentElement: { setAttribute: (k, v) => attrs.set(k, String(v)), removeAttribute: (k) => attrs.delete(k), hasAttribute: (k) => attrs.has(k) }, addEventListener(t, h) { (globalThis.__ouvDoc ??= {})[t] = [...((globalThis.__ouvDoc ?? {})[t] ?? []), h]; }, createElement: () => ({ style: {} }) };
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear(), key: () => null, length: 0 }; };
globalThis.localStorage = mem(); globalThis.sessionStorage = mem();
const corpo = (g, rotulo) => ({ ok: true, data: { sections: [{ id: 'sec-x', label: rotulo, items: [{ id: 'sidebar.x', label: rotulo, route: '/x' }] }], items: [{ id: 1, item_key: 'sidebar.x', label: rotulo, route_path: '/x', parent_key: null, item_type: 'item', is_active: 1, is_visible: 1, order_index: 1 }], tree: [{ id: 1, item_key: 'sidebar.x', label: rotulo, route_path: '/x', children: [] }] },
  meta: { menu: { revision: 'rev-' + g, generation: g, checksum: 'ck-' + g } } });
const fila = []; globalThis.fetch = () => new Promise((resolve) => fila.push(resolve));
const responder = (i, g, rotulo) => fila[i]({ ok: true, status: 200, json: async () => corpo(g, rotulo) });
const espera = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const L = (await import(pathToFileURL(out).href)).default; let ok = 0, f = 0; const af = (n, c, d) => { console.log((c ? 'ok    ' : 'FALHA ') + n + (c ? '' : ' · ' + JSON.stringify(d).slice(0, 220))); c ? ok++ : f++; };
const gModelo = () => L.getModel()?.metadata?.menuConsumido?.generation ?? null;
const rotuloAtual = () => JSON.stringify(L.getModel ? L.getModel() : null).match(/"(Rótulo[^"]*)"/)?.[1] ?? null;
// (1) primeira carga: geração 2
const p1 = L.reload(true); await espera(); responder(0, 2, 'Rótulo g2'); await p1;
af(`(1) aplica e REGISTRA a identidade consumida: html[data-menu-generation]=${attrs.get('data-menu-generation')}, revisão ${attrs.get('data-menu-revision')}`, attrs.get('data-menu-generation') === '2' && attrs.get('data-menu-revision') === 'rev-2' && globalThis.__dshowMenuConsumido?.generation === 2, Object.fromEntries(attrs));
// (2) duas recargas concorrentes: a 1ª (ANTIGA, g2) fica retida; a 2ª (NOVA, g3) chega antes; depois a antiga é liberada → descartada
const pa = L.reload(true); await espera(); const pb = L.reload(true); await espera(); responder(2, 3, 'Rótulo g3'); await pb; responder(1, 2, 'Rótulo g2 ANTIGO'); const ra = await pa;
af(`(2) resposta antiga retida e liberada DEPOIS da nova: descartada (${ra.reason}); a Sidebar fica na geração ${attrs.get('data-menu-generation')}`, ra.reason === 'superseded' && attrs.get('data-menu-generation') === '3' && gModelo() === 3 && /Rótulo g3/.test(JSON.stringify(L.getModel())) && !/ANTIGO/.test(JSON.stringify(L.getModel())), { ra, g: attrs.get('data-menu-generation') });
// (3) uma carga que traz geração MENOR que a consumida (ex.: cache/servidor atrasado) → rejeitada, estado confirmado fica
const pc = L.load({ force: true, skipCache: true }); await espera(); responder(3, 1, 'Rótulo g1 OBSOLETO'); const rc = await pc;
af(`(3) geração menor (1 < 3): REJEITADA (staleRejected=${rc.staleRejected}); o modelo e a identidade continuam na 3`, rc.staleRejected === true && attrs.get('data-menu-generation') === '3' && gModelo() === 3 && /Rótulo g3/.test(JSON.stringify(L.getModel())) && !/OBSOLETO/.test(JSON.stringify(L.getModel())), { rc: { ...rc, model: undefined }, g: attrs.get('data-menu-generation') });
// (4) geração maior (a restauração vira NOVA revisão publicada) → aceita
const pd = L.reload(true); await espera(); responder(4, 4, 'Rótulo g4 restaurado'); await pd;
af(`(4) geração maior (restauração = nova revisão): aceita, Sidebar na ${attrs.get('data-menu-generation')}`, attrs.get('data-menu-generation') === '4' && gModelo() === 4 && /restaurado/.test(JSON.stringify(L.getModel())), Object.fromEntries(attrs));
// (5–8) INTEGRADO-01 · P1 do QI do AZUL (item 10): o cache do modelo é do USUÁRIO dono; logout limpa. Cada import com ?p=N = uma página nova no mesmo navegador.
const ouvintes = new Map(); const bus = { on: (e, h) => { (ouvintes.get(e) ?? ouvintes.set(e, []).get(e)).push(h); }, off() {}, emit: (e, d) => (ouvintes.get(e) ?? []).forEach((h) => h(d)) };
let usuario = { id: 990075 }; globalThis.__regPortas.set('eventBus', bus); globalThis.__regPortas.set('auth', { getUser: () => usuario });
const pagina = async (n) => (await import(pathToFileURL(out).href + '?p=' + n)).default;
const pendentes = () => fila.length; const ultimo = (g, r) => fila[fila.length - 1]({ ok: true, status: 200, json: async () => corpo(g, r) });
{ const A = await pagina(1); const pr = A.reload(true); await espera(); ultimo(5, 'Rótulo g5 de 990075'); await pr;
  const n0 = pendentes(); const A2 = await pagina(2); const r2 = await A2.load(); await espera(); const reval = pendentes() - n0; if (reval) ultimo(5, 'Rótulo g5 de 990075');
  await espera(); af(`(5) mesmo usuário (990075), página nova: serve o cache dele já (fonte ${r2.source}) e revalida em segundo plano (${reval} pedido); mesma geração = nada muda`, /session|local/.test(r2.source) && reval === 1 && A2.getModel()?.metadata?.menuConsumido?.generation === 5, { src: r2.source, reval }); }
{ usuario = { id: 990090 }; const n0 = pendentes(); const B = await pagina(3); const pb2 = B.load(); await espera(); const pediu = pendentes() > n0; if (pediu) ultimo(5, 'Rótulo g5 de 990090'); const rb = await pb2;
  af(`(6) OUTRO usuário (990090) no mesmo navegador: NÃO herda o cache de 990075 (pediu à API: ${pediu}, fonte ${rb.source})`, pediu && rb.source === 'api', { src: rb.source }); }
{ usuario = null; const n0 = pendentes(); const C = await pagina(4); const pc2 = C.load(); await espera(); const pediu = pendentes() > n0; if (pediu) ultimo(5, 'Rótulo sem dono'); const rc2 = await pc2;
  af(`(7) usuário desconhecido: o cache não é usado (pediu: ${pediu}) nem gravado (${sessionStorage.getItem('dshow_nav_session_v3') === null ? 'nada gravado' : 'GRAVOU'})`, pediu && sessionStorage.getItem('dshow_nav_session_v3') === null, { src: rc2.source }); }
{ usuario = { id: 990075 }; const D = await pagina(5); const pd2 = D.reload(true); await espera(); ultimo(6, 'Rótulo g6'); await pd2; const antes = sessionStorage.getItem('dshow_nav_session_v3') !== null;
  bus.emit('auth.logout', {}); const depois = sessionStorage.getItem('dshow_nav_session_v3') === null && localStorage.getItem('dshow_nav_model_v3') === null;
  af(`(8) logout limpa o cache do modelo (havia: ${antes}; limpo: ${depois})`, antes && depois, { antes, depois }); }
{ usuario = { id: 990075 }; const E = await pagina(6); const pe = E.reload(true); await espera(); ultimo(7, 'Rótulo g7 do Dono'); await pe;
  const havia = sessionStorage.getItem('dshow_nav_session_v3') !== null; usuario = null; const n0 = pendentes();   // logout em OUTRA aba/sem evento; depois "voltar" restaura esta página do BFCache
  const hp = ouvPagina[ouvPagina.length - 1]; if (hp) hp({ persisted: true }); await espera(); const limpou = sessionStorage.getItem('dshow_nav_session_v3') === null; const releu = pendentes() > n0; if (releu) fila[fila.length - 1]({ ok: false, status: 401, json: async () => ({ ok: false }) });
  af(`(9) voltar pelo histórico (BFCache) depois do logout: limpa o cache (${limpou}) e relê o modelo (${releu})`, havia && limpou && releu, { havia, limpou, releu }); await espera(); }
{ usuario = { id: 990075 }; const F = await pagina(7); const pf = F.reload(true); await espera(); ultimo(7, 'Rótulo g7 antes de publicar'); await pf;
  const F2 = await pagina(8); const rf = await F2.load(); await espera(); const servido = F2.getModel()?.metadata?.menuConsumido?.generation; ultimo(8, 'Rótulo g8 publicado'); await espera(60);
  const g = F2.getModel()?.metadata?.menuConsumido?.generation; const txt = JSON.stringify(F2.getModel());
  af(`(10) cache-hit depois de publicar: serve a ${servido} (cache) e TROCA para a ${g} quando a revalidação traz geração maior`, rf.source !== 'api' && servido === 7 && g === 8 && /g8 publicado/.test(txt), { src: rf.source, servido, g }); }
{ usuario = { id: 990075 }; const G1 = await pagina(9); const pg1 = G1.reload(true); await espera(); ultimo(9, 'Rótulo g9 COM item X'); await pg1;
  const G2 = await pagina(10); await G2.load(); await espera(); ultimo(9, 'Rótulo g9 SEM o item'); await espera(60); const t = JSON.stringify(G2.getModel());
  af(`(11) revogação sem mudar a geração (9 → 9): a revalidação ACEITA a mesma geração e o item revogado some`, /SEM o item/.test(t) && !/COM item X/.test(t), { t: t.slice(0, 160) }); }
{ usuario = { id: 990075 }; const H1 = await pagina(11); const ph = H1.reload(true); await espera(); ultimo(10, 'Rótulo g10'); await ph;
  const H2 = await pagina(12); await H2.load(); await espera(); fila[fila.length - 1]({ ok: false, status: 401, json: async () => ({ ok: false }) }); await espera(60);
  const vazio = sessionStorage.getItem('dshow_nav_session_v3') === null && localStorage.getItem('dshow_nav_model_v3') === null; const m = H2.getModel();
  af(`(12) 401 na revalidação: cache vazio (${vazio}) e o modelo retirado (${!m || !/g10/.test(JSON.stringify(m))})`, vazio && (!m || !/g10/.test(JSON.stringify(m))), { vazio, m: JSON.stringify(m).slice(0, 120) }); }
{ usuario = { id: 990075 }; const K = await pagina(13); const pk = K.reload(true); await espera(); ultimo(11, 'Rótulo g11'); await pk; const havia = sessionStorage.getItem('dshow_nav_session_v3') !== null;
  bus.emit('auth:logout', {}); await espera(60); const m = swCaches.get('dshow-v9'); const apiFora = ![...m.keys()].some((u) => u.includes('/api/')); const assetFica = [...m.keys()].some((u) => u.includes('main.bundle.js'));
  af(`(13) logout ('auth:logout'): cache do menu limpo (${havia && sessionStorage.getItem('dshow_nav_session_v3') === null}) e respostas /api/ do service worker apagadas (${apiFora}; assets ficam: ${assetFica})`, havia && sessionStorage.getItem('dshow_nav_session_v3') === null && apiFora && assetFica, { chaves: [...m.keys()] }); }
{ usuario = { id: 990075 }; const Q = await pagina(14); const pq = Q.reload(true); await espera(); ultimo(12, 'Rótulo g12'); await pq; const havia = sessionStorage.getItem('dshow_nav_session_v3') !== null;
  const alvo = { closest: (sel) => (/data-action="logout"/.test(sel) ? {} : null) }; for (const h of (globalThis.__ouvDoc?.click ?? [])) h({ target: alvo }); await espera(30);
  af(`(14) clique no "Sair" ([data-action="logout"]) limpa o cache do menu SEM barramento (${havia} → ${sessionStorage.getItem('dshow_nav_session_v3') === null})`, havia && sessionStorage.getItem('dshow_nav_session_v3') === null && localStorage.getItem('dshow_nav_model_v3') === null, null); }
{ usuario = { id: 990075 }; const R1 = await pagina(15); const pr = R1.reload(true); await espera();   // pedido do Dono EM ANDAMENTO
  bus.emit('auth.logout.success', {}); usuario = null; ultimo(13, 'Rótulo g13 do Dono ATRASADO'); await pr; await espera(30);
  const t = JSON.stringify(R1.getModel()); const gravou = sessionStorage.getItem('dshow_nav_session_v3') !== null || localStorage.getItem('dshow_nav_model_v3') !== null;
  af(`(15) item 16 · logout com pedido em andamento: a resposta atrasada NÃO se aplica (modelo: ${/ATRASADO/.test(t) ? 'APLICOU' : 'não'}) nem é gravada (${gravou ? 'GRAVOU' : 'nada'})`, !/ATRASADO/.test(t) && !gravou, { t: t.slice(0, 120), gravou }); }
{ usuario = { id: 990075 }; const R2 = await pagina(16); const pr2 = R2.reload(true); await espera();   // pedido do Dono em andamento; a sessão vira a da equipe SEM evento
  usuario = { id: 990050 }; ultimo(14, 'Rótulo g14 do Dono para a EQUIPE'); await pr2; await espera(30);
  const t2 = JSON.stringify(R2.getModel()); const s2 = sessionStorage.getItem('dshow_nav_session_v3') || '';
  af(`(16) item 16 · resposta do Dono chega com a EQUIPE logada (sem evento): descartada (modelo: ${/para a EQUIPE/.test(t2) ? 'APLICOU' : 'não'}; cache: ${/990075|para a EQUIPE/.test(s2) ? 'GRAVOU' : 'limpo'})`, !/para a EQUIPE/.test(t2) && !/para a EQUIPE/.test(s2), { t2: t2.slice(0, 120) }); }
if (process.env.DUMP) console.log(JSON.stringify(L.getModel()).slice(0, 600)); fs.rmSync(tmp, { recursive: true, force: true }); console.log(`SIDEBAR-IDENTIDADE: ${ok} ok / ${f} falhas`); process.exit(f ? 1 : 0);
