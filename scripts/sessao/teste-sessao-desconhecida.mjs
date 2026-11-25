// Codex DSHOW-114 (P7) — três estados de sessão: autenticado confirmado · não autenticado confirmado · DESCONHECIDO (consulta indisponível).
// Executa o código dos BUNDLES SERVIDOS (o que o navegador roda), extraído do arquivo e ligado a dependências falsas:
//   session-manager.bundle.js → a função checkSession (Qs)        global-state.bundle.js → o tratador de SESSION_CHECKED
// Uso: node scripts/sessao/teste-sessao-desconhecida.mjs [raiz]   (sai 1 com qualquer falha)
import { readFileSync } from 'node:fs';
import path from 'node:path';
const RAIZ = path.resolve(process.argv[2] || new URL('../..', import.meta.url).pathname);
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const ler = (r) => readFileSync(path.join(RAIZ, r), 'utf8');

// ── session-manager: checkSession ──
const sm = ler('public/components/session-manager/dist/session-manager.bundle.js');
const i0 = sm.indexOf('function Qs(e) {'), i1 = sm.indexOf('\nfunction ', i0 + 10);
afirma('session-manager: achei checkSession no bundle', i0 > 0 && i1 > i0);
const fonteQs = sm.slice(i0, i1);
function cenarioSM(respostaCheck) {
  const ev = [], ops = [];
  const dep = { b: { sessionChecks: 0 }, m: { SESSION_CHECKED: 'auth:session:checked' }, K: (n, d) => ev.push([n, d]),
    ce: { checkSession: () => Promise.resolve(respostaCheck) },
    i: { update: (x) => ops.push(['update', x]), clear: () => ops.push(['clear']), setToken: () => ops.push(['setToken']) },
    E: { clearAll: () => ops.push(['clearAll']), setToken: () => {}, setCsrf: () => {} },
    Kt: (u) => u, Et: () => 0, ve: () => true, zt: () => ops.push(['cookie']), k: { warn: () => {} } };
  const Qs = new Function(...Object.keys(dep), fonteQs + '\nreturn Qs;')(...Object.values(dep));
  return Qs({}).then((r) => ({ r, ev, ops, b: dep.b }));
}
{
  const { r, ev, ops, b } = await cenarioSM({ ok: false, error: 'SESSION_CHECK_UNAVAILABLE' });
  afirma('SM · 503/indisponível → estado DESCONHECIDO (ok:false, estado:"desconhecido")', r.ok === false && r.estado === 'desconhecido', JSON.stringify(r));
  afirma('SM · 503/indisponível → NENHUM SESSION_CHECKED (nada para a guarda do roteador nem para a identidade global)', ev.length === 0, JSON.stringify(ev));
  afirma('SM · 503/indisponível → nada limpo (store, tokens, cookie)', ops.length === 0, JSON.stringify(ops));
  afirma('SM · 503/indisponível → contado como consulta desconhecida', b.sessionChecksUnknown === 1);
}
{
  const { r, ev, ops } = await cenarioSM({ ok: true, authenticated: false });
  afirma('SM · não autenticado CONFIRMADO → limpa e emite SESSION_CHECKED {authenticated:false}', r.authenticated === false && ops.some((o) => o[0] === 'clear') && ev.length === 1 && ev[0][1].authenticated === false && !('error' in ev[0][1]), JSON.stringify({ ev, ops }));
}
{
  const { r, ev } = await cenarioSM({ ok: true, authenticated: true, user: { id: 75 } });
  afirma('SM · autenticado CONFIRMADO → SESSION_CHECKED {authenticated:true}', r.authenticated === true && ev.length === 1 && ev[0][1].authenticated === true);
}

// ── global-state: tratador de SESSION_CHECKED ──
const gs = ler('public/modules/global-state/dist/global-state.bundle.js');
const j0 = gs.indexOf('const E = (f) => {'), j1 = gs.indexOf('}, O = t.on(v.SES', j0);
afirma('global-state: achei o tratador de SESSION_CHECKED no bundle', j0 > 0 && j1 > j0);
const fonteE = gs.slice(j0, j1 + 1) + ';';
function cenarioGS(evento) {
  const ops = [];
  const dep = { n: { aborted: false }, v: { SESSION_CHECKED_RECEIVED: 'x' }, k: { SESSION_SYNCED: 'synced', SESSION_CLEARED: 'cleared' },
    e: { telemetry: { track: () => {} }, setSession: () => ops.push('setSession'), clearSession: () => ops.push('clearSession') }, F: (_m, nome) => ops.push('emit:' + nome) };
  new Function(...Object.keys(dep), fonteE + '\nreturn E;')(...Object.values(dep))(evento);
  return ops;
}
let o = cenarioGS({ authenticated: false, error: 'SESSION_CHECK_UNAVAILABLE' });
afirma('GS · {authenticated:false, error} (evento do bundle antigo) → NÃO limpa a identidade global, NÃO emite SESSION_CLEARED', o.length === 0, JSON.stringify(o));
o = cenarioGS({ estado: 'desconhecido' });
afirma('GS · {estado:"desconhecido"} → NÃO limpa', o.length === 0, JSON.stringify(o));
o = cenarioGS({});
afirma('GS · evento sem authenticated → NÃO limpa', o.length === 0, JSON.stringify(o));
o = cenarioGS({ authenticated: false });
afirma('GS · não autenticado CONFIRMADO → limpa e emite SESSION_CLEARED', o.join(',') === 'clearSession,emit:cleared', JSON.stringify(o));
o = cenarioGS({ authenticated: true, user: { id: 75 } });
afirma('GS · autenticado CONFIRMADO → setSession + SESSION_SYNCED', o.join(',') === 'setSession,emit:synced', JSON.stringify(o));

// ── fontes (.ts de referência e o .js servido do session-manager) com a mesma regra ──
const ai = ler('public/modules/global-state/core/auth-integration.ts');
afirma('fonte auth-integration.ts: limpa só com authenticated === false, sem erro e sem estado desconhecido', /d\?\.authenticated === false && !d\?\.error && d\?\.estado !== 'desconhecido'/.test(ai));
for (const arq of ['public/components/session-manager/core/auth.ts', 'public/components/session-manager/core/auth.js']) {
  const s = ler(arq); const k0 = s.indexOf('if (!result.ok) {', s.indexOf('function checkSession(')), k1 = s.indexOf('}', s.slice(k0).search(/estado: ["']desconhecido["']/) + k0);
  const ramo = k0 > 0 && k1 > k0 ? s.slice(k0, k1).replace(/\/\*[\s\S]*?\*\//g, '') : '';
  afirma(`${path.basename(arq)}: ramo indisponível = desconhecido, sem emitir nem limpar`, ramo && !/emitAuthEvent|sessionStore\.clear|TokenManager\.clearAll|clearInvalidSessionCookie/.test(ramo), ramo.replace(/\s+/g, ' ').slice(0, 140));
}
console.log(`SESSÃO DESCONHECIDA (DSHOW-114): ${ok} ok, ${falhas} falhas`); process.exit(falhas ? 1 : 0);
