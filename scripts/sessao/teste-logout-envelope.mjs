// R7 (resíduo apontado pela CIMA no DSHOW-115, P9 8d10efbf): o cliente ÚNICO de logout (core/auth/logout-client.js, o que o
// session-manager e o menu do cabeçalho chamam) aceitava QUALQUER 2xx como saída confirmada. 2xx com HTML (página de erro de proxy),
// JSON inválido ou {ok:false} NÃO confirma: só o envelope de ApiResponse::success (JSON com ok === true) — ou a PROVA do check.php
// (authenticated:false). Sem prova = falha (motivo 'desconhecido'): a tela mostra "Erro ao sair" e não finge que saiu.
// Executa o .js SERVIDO (o que o navegador carrega) com um fetch falso. Uso: node scripts/sessao/teste-logout-envelope.mjs [raiz]
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const RAIZ = path.resolve(process.argv[2] || new URL('../..', import.meta.url).pathname);
const { encerrarSessao } = await import(pathToFileURL(path.join(RAIZ, 'public/core/auth/logout-client.js')).href + '?t=' + Date.now());
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const json = (status, corpo) => ({ status, ok: status >= 200 && status < 300, headers: { get: (h) => (/content-type/i.test(h) ? 'application/json; charset=utf-8' : null) }, json: async () => corpo, text: async () => JSON.stringify(corpo) });
const html = (status, corpo) => ({ status, ok: status >= 200 && status < 300, headers: { get: (h) => (/content-type/i.test(h) ? 'text/html' : null) }, json: async () => { throw new SyntaxError('html'); }, text: async () => corpo });
const bruto = (status, ct, corpo) => ({ status, ok: status >= 200 && status < 300, headers: { get: (h) => (/content-type/i.test(h) ? ct : null) }, json: async () => JSON.parse(corpo), text: async () => corpo });
const logado = json(200, { ok: true, data: { authenticated: true, session: { csrf_token: 'csrf-sintetico-teste' } } });
const saiu = json(200, { ok: true, data: { authenticated: false } });
async function cenario(nome, respostas, esperado) {
  const chamadas = []; let i = 0;
  globalThis.fetch = async (url, op = {}) => { chamadas.push(`${op.method || 'GET'} ${url}`); const r = respostas[i++]; if (r instanceof Error) throw r; if (!r) throw new Error('chamada a mais: ' + url); return r; };
  const r = await encerrarSessao(2000);
  const bate = Object.entries(esperado).every(([k, v]) => r[k] === v);
  afirma(`${nome} → ${JSON.stringify(esperado)}`, bate, JSON.stringify({ r, chamadas }));
  return { r, chamadas };
}
await cenario('logout 200 com o envelope {ok:true} (ApiResponse::success)', [logado, json(200, { ok: true, data: null, error: null })], { ok: true });
await cenario('logout 200 com HTML (página de erro de proxy) e a sessão ainda viva no check → NÃO confirma', [logado, html(200, '<html>502 do proxy</html>'), logado], { ok: false, motivo: 'desconhecido' });
await cenario('logout 200 com HTML, mas o check PROVA authenticated:false → saída confirmada', [logado, html(200, '<html>ok</html>'), saiu], { ok: true, motivo: 'sem-sessao' });
await cenario('logout 200 com JSON {ok:false} → NÃO confirma', [logado, json(200, { ok: false, error: { code: 'X' } }), logado], { ok: false, motivo: 'desconhecido' });
await cenario('logout 200 com JSON inválido → NÃO confirma', [logado, bruto(200, 'application/json', '{"ok":tr'), logado], { ok: false, motivo: 'desconhecido' });
await cenario('logout 204 sem corpo → NÃO confirma sem prova', [logado, bruto(204, '', ''), logado], { ok: false, motivo: 'desconhecido' });
await cenario('logout 200 ambíguo e o check também falha (rede) → NÃO confirma', [logado, html(200, 'x'), new TypeError('rede')], { ok: false, motivo: 'desconhecido' });
await cenario('logout 403 (CSRF) → falha csrf', [logado, json(403, { ok: false })], { ok: false, motivo: 'csrf' });
await cenario('logout 500 → falha servidor', [logado, json(500, { ok: false })], { ok: false, motivo: 'servidor' });
// revisão da ACIMA_ESQUERDA (DSHOW-115B): o check.php NUNCA emite 401 (só 200 authenticated:true/false ou 503) — um 401 vem de proxy/WAF e NÃO prova nada
const s = await cenario('check 401 de proxy no INÍCIO → não é prova: segue o POST (sem CSRF); 403 → falha csrf', [json(401, { ok: false }), json(403, { ok: false })], { ok: false, motivo: 'csrf' });
afirma('check 401 no início: o POST de logout é enviado (não "saiu" sem servidor)', s.chamadas.some((c) => c.startsWith('POST')), JSON.stringify(s.chamadas));
await cenario('logout 200 com HTML de proxy + check 401 do proxy → NÃO confirma (sonda da ACIMA_ESQUERDA)', [logado, html(200, '<html>proxy</html>'), json(401, { ok: false })], { ok: false, motivo: 'desconhecido' });
await cenario('check 401 de proxy no início + logout com o envelope {ok:true} → confirmado pelo servidor', [json(401, { ok: false }), json(200, { ok: true })], { ok: true });
await cenario('rede fora no check → falha rede', [new TypeError('rede')], { ok: false, motivo: 'rede' });
const t = await cenario('envelope {ok:true}: manda o X-CSRF-Token relido', [logado, json(200, { ok: true })], { ok: true });
afirma('POST único', t.chamadas.filter((c) => c.startsWith('POST')).length === 1, JSON.stringify(t.chamadas));
console.log(`LOGOUT ENVELOPE (R7): ${ok} ok, ${falhas} falhas`); process.exit(falhas ? 1 : 0);
