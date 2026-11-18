// Acesso ao painel (index.js): três estados com fetch FALSO. Uso: node scripts/atributos/testes/acesso-painel.test.mjs
// Prova: 200/false = "não liberado"; 200/true = monta; 500, timeout, aborto, rede, JSON inválido, source=error = "Não foi possível
// verificar o acesso." + "Tentar novamente" (NUNCA "não liberado" e NUNCA monta); 1 nova tentativa automática; "Carregando…" primeiro.
import { verificarFlag, mount } from '../../../public/components/panels/panel-atributos/index.js';
let ok = 0, falhas = 0;
const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const resp = (status, corpo) => ({ status, ok: status >= 200 && status < 300, json: async () => (typeof corpo === 'string' ? JSON.parse(corpo) : corpo) });
const flag = (enabled, extra = {}) => resp(200, { ok: true, data: { flag: { key: 'panel_atributos_enabled', enabled, payload: { a: 1 }, ...extra } }, error: null });
const seq = (...rs) => { let i = 0; const f = async (_u, o) => { f.n++; const r = rs[Math.min(i++, rs.length - 1)]; return typeof r === 'function' ? r(o) : r; }; f.n = 0; return f; };
const pendura = (o) => new Promise((_, rej) => o.signal.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
const rapido = { timeoutMs: 50, pausaMs: 0 };

let f, r;
f = seq(flag(false)); r = await verificarFlag(f, rapido); afirma('200 + enabled:false → desligada (definitiva, 1 tentativa)', r.estado === 'desligada' && f.n === 1, JSON.stringify(r));
f = seq(flag(true)); r = await verificarFlag(f, rapido); afirma('200 + enabled:true → ligada, com payload', r.estado === 'ligada' && r.payload.a === 1 && f.n === 1);
f = seq(resp(500, {})); r = await verificarFlag(f, rapido); afirma('500 → falha depois de 2 tentativas', r.estado === 'falha' && f.n === 2, JSON.stringify(r));
f = seq(resp(500, {}), flag(true)); r = await verificarFlag(f, rapido); afirma('500 e depois 200/true → ligada (nova tentativa automática)', r.estado === 'ligada' && f.n === 2);
f = seq(pendura, pendura); const t0 = Date.now(); r = await verificarFlag(f, rapido); afirma('timeout (servidor não responde) → falha após 2 tentativas, sem pendurar', r.estado === 'falha' && f.n === 2 && Date.now() - t0 < 1000, JSON.stringify(r));
f = seq(pendura, flag(false)); r = await verificarFlag(f, rapido); afirma('timeout e depois 200/false → desligada', r.estado === 'desligada');
f = seq(async () => { throw Object.assign(new Error('x'), { name: 'AbortError' }); }); r = await verificarFlag(f, rapido); afirma('aborto → falha (nunca "desligada")', r.estado === 'falha');
f = seq(async () => { throw new TypeError('Failed to fetch'); }); r = await verificarFlag(f, rapido); afirma('erro de rede → falha', r.estado === 'falha');
f = seq(resp(200, 'not json')); r = await verificarFlag(f, rapido); afirma('JSON inválido → falha', r.estado === 'falha');
f = seq(resp(200, { ok: true, data: {} })); r = await verificarFlag(f, rapido); afirma('formato inesperado (sem flag) → falha', r.estado === 'falha');
f = seq(flag(false, { source: 'error' })); r = await verificarFlag(f, rapido); afirma('200 com source=error → falha (não é "não liberado")', r.estado === 'falha');
f = seq(resp(403, {})); r = await verificarFlag(f, rapido); afirma('403 → falha (só 200 válido decide)', r.estado === 'falha');
f = seq(resp(200, { ok: false, data: { flag: { enabled: false } } })); r = await verificarFlag(f, rapido); afirma('envelope ok:false → falha', r.estado === 'falha');

// mount() com DOM mínimo
const el = () => { const e = { html: [], _h: '', listeners: [], get innerHTML() { return this._h; }, set innerHTML(v) { this._h = v; this.html.push(v); },
  querySelector(sel) { return sel === '[data-at-tentar]' && this._h.includes('data-at-tentar') ? { addEventListener: (_t, fn) => e.listeners.push(fn) } : null; } }; return e; };
const comFetch = async (fake, fn) => { const o = globalThis.fetch; globalThis.fetch = fake; try { return await fn(); } finally { globalThis.fetch = o; } };
let c = el(); r = await comFetch(seq(flag(false)), () => mount(c, { __acesso: rapido }));
afirma('mount 200/false: "Carregando…" primeiro, depois "não foi liberado"; não monta', c.html[0].includes('Carregando…') && c.innerHTML.includes('não foi liberado') && r.impl === 'disabled');
c = el(); r = await comFetch(seq(resp(500, {})), () => mount(c, { __acesso: rapido }));
afirma('mount 500: "Não foi possível verificar o acesso." + "Tentar novamente"; nunca "não liberado"; não monta',
  c.innerHTML.includes('Não foi possível verificar o acesso.') && c.innerHTML.includes('Tentar novamente') && !c.html.some((h) => h.includes('não foi liberado')) && r.impl === 'acesso-indeterminado');
c = el(); r = await comFetch(seq(pendura), () => mount(c, { __acesso: rapido }));
afirma('mount timeout: falha com "Tentar novamente"; não monta', c.innerHTML.includes('Tentar novamente') && r.impl === 'acesso-indeterminado');
const fk = seq(resp(500, {}), resp(500, {}), flag(false)); c = el();
await comFetch(fk, async () => { await mount(c, { __acesso: rapido }); c.listeners[0](); await new Promise((ok) => setTimeout(ok, 50)); });
afirma('"Tentar novamente" verifica de novo (3ª chamada) e mostra a resposta definitiva', fk.n === 3 && c.innerHTML.includes('não foi liberado'));
c = el(); const ab = new AbortController(); ab.abort(); r = await comFetch(seq(flag(false)), () => mount(c, { __acesso: rapido, signal: ab.signal }));
afirma('painel trocado durante a verificação (signal abortado): não pinta resultado', r === undefined && !c.innerHTML.includes('não foi liberado'));
console.log(`ACESSO AO PAINEL: ${ok} ok, ${falhas} falha(s)`); process.exit(falhas ? 1 : 0);
