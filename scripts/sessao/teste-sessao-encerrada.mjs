// Codex DSHOW-115B (P7 + P9): o validador ÚNICO de "sessão encerrada" (public/core/auth/sessao-encerrada.js) e o seu consumidor na P7
// (public/core/auth/logout-client.js). Defeito: a consulta alternativa ao check.php aceitava `authenticated:false` com envelope de ERRO
// ({ok:false,…}) — e também fora do `data`, sem Content-Type JSON etc. Agora só prova saída: HTTP 200 + JSON válido + envelope de sucesso
// do check.php (ok:true, error:null, data objeto) + data.authenticated === false (+ user null). O resto = desconhecido.
// Executa os .js SERVIDOS (os que o navegador carrega). Uso: node scripts/sessao/teste-sessao-encerrada.mjs [raiz]
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const RAIZ = path.resolve(process.argv[2] || new URL('../..', import.meta.url).pathname);
const url = (f) => pathToFileURL(path.join(RAIZ, f)).href + '?t=' + Date.now();
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };

const CT = 'application/json; charset=utf-8';
const ENCERRADA = { ok: true, data: { authenticated: false, user: null, session: { csrf_token: 'c0' } }, error: null };
const ATIVA = { ok: true, data: { authenticated: true, user: { id: 75 }, session: { token: 'tok-antigo', csrf_token: 'csrf-vivo' } }, error: null };
const ERRO_COM_FALSE = { ok: false, data: { authenticated: false }, error: 'QUALQUER' };

// ── 1. o validador (matriz) ────────────────────────────────────────────────────────────────────────────────────────────────────────
const temValidador = fs.existsSync(path.join(RAIZ, 'public/core/auth/sessao-encerrada.js'));
afirma('existe o validador único public/core/auth/sessao-encerrada.js', temValidador);
if (temValidador) {
  const { lerCheckSessao, sessaoEncerradaProvada } = await import(url('public/core/auth/sessao-encerrada.js'));
  const casos = [
    ['envelope exato de sessão encerrada', 200, CT, ENCERRADA, 'encerrada'],
    ['envelope exato de sessão ativa', 200, CT, ATIVA, 'ativa'],
    ['ativa com user null (getUser sem cadastro) continua ativa', 200, CT, { ...ATIVA, data: { ...ATIVA.data, user: null } }, 'ativa'],
    ['contraprova (1): 200 com ok:false e authenticated:false', 200, CT, ERRO_COM_FALSE, 'desconhecido'],
    ['ok ausente', 200, CT, { data: { authenticated: false, user: null }, error: null }, 'desconhecido'],
    ['ok:"true" (texto)', 200, CT, { ...ENCERRADA, ok: 'true' }, 'desconhecido'],
    ['ok:1', 200, CT, { ...ENCERRADA, ok: 1 }, 'desconhecido'],
    ['error preenchido', 200, CT, { ...ENCERRADA, error: 'X' }, 'desconhecido'],
    ['error ausente', 200, CT, { ok: true, data: ENCERRADA.data }, 'desconhecido'],
    ['authenticated FORA do data', 200, CT, { ok: true, authenticated: false, data: {}, error: null }, 'desconhecido'],
    ['data null', 200, CT, { ok: true, data: null, error: null }, 'desconhecido'],
    ['data é lista', 200, CT, { ok: true, data: [], error: null }, 'desconhecido'],
    ['authenticated "false" (texto)', 200, CT, { ...ENCERRADA, data: { ...ENCERRADA.data, authenticated: 'false' } }, 'desconhecido'],
    ['authenticated 0', 200, CT, { ...ENCERRADA, data: { ...ENCERRADA.data, authenticated: 0 } }, 'desconhecido'],
    ['authenticated ausente', 200, CT, { ok: true, data: { user: null }, error: null }, 'desconhecido'],
    ['authenticated:false COM usuário', 200, CT, { ...ENCERRADA, data: { ...ENCERRADA.data, user: { id: 75 } } }, 'desconhecido'],
    ['503 SESSION_CHECK_UNAVAILABLE', 503, CT, { ok: false, data: null, error: 'SESSION_CHECK_UNAVAILABLE' }, 'desconhecido'],
    ['401 de proxy com o corpo de encerrada', 401, CT, ENCERRADA, 'desconhecido'],
    ['204 com o corpo de encerrada', 204, CT, ENCERRADA, 'desconhecido'],
    ['500 com o corpo de encerrada', 500, CT, ENCERRADA, 'desconhecido'],
    ['200 text/html com o corpo de encerrada', 200, 'text/html', ENCERRADA, 'desconhecido'],
    ['200 sem Content-Type', 200, null, ENCERRADA, 'desconhecido'],
    ['200 text/plain;application/json (truque)', 200, 'text/plain; x=application/json', ENCERRADA, 'desconhecido'],
    ['200 application/json-patch+json (nit da ACIMA_ESQUERDA)', 200, 'application/json-patch+json', ENCERRADA, 'desconhecido'],
    ['200 application/json-seq', 200, 'application/json-seq', ENCERRADA, 'desconhecido'],
    ['200 APPLICATION/JSON;charset=UTF-8 (controle: maiúsculas e sem espaço)', 200, 'APPLICATION/JSON;charset=UTF-8', ENCERRADA, 'encerrada'],
    ['JSON inválido', 200, CT, '{"ok":true,"data":{"authenticated":fal', 'desconhecido'],
    ['corpo vazio', 200, CT, '', 'desconhecido'],
    ['JSON "null"', 200, CT, 'null', 'desconhecido'],
    ['HTML de proxy', 200, CT, '<html>ok</html>', 'desconhecido'],
  ];
  for (const [n, st, ct, corpo, esp] of casos) {
    const txt = typeof corpo === 'string' ? corpo : JSON.stringify(corpo);
    const r = lerCheckSessao(st, ct, txt);
    afirma(`validador: ${n} → ${esp}`, r.estado === esp, JSON.stringify(r));
    afirma(`validador: ${n} → prova de saída ${esp === 'encerrada' ? 'SIM' : 'NÃO'}`, sessaoEncerradaProvada(st, ct, txt) === (esp === 'encerrada'));
  }
  const a = lerCheckSessao(200, CT, JSON.stringify(ATIVA));
  afirma('ativa devolve o token da sessão (para provar depois que o novo login é OUTRA sessão) e o CSRF', a.token === 'tok-antigo' && a.csrf === 'csrf-vivo', JSON.stringify(a));
}

// ── 2. o consumidor da P7 (logout-client) ─────────────────────────────────────────────────────────────────────────────────────────
const { encerrarSessao } = await import(url('public/core/auth/logout-client.js'));
const resp = (status, corpo, ct = CT) => ({ status, ok: status >= 200 && status < 300, headers: { get: (h) => (/content-type/i.test(h) ? ct : null) }, json: async () => (typeof corpo === 'string' ? JSON.parse(corpo) : corpo), text: async () => (typeof corpo === 'string' ? corpo : JSON.stringify(corpo)) });
async function cenario(nome, respostas, esperado) {
  const chamadas = []; let i = 0;
  globalThis.fetch = async (u, op = {}) => { chamadas.push(`${op.method || 'GET'} ${u}${op.headers && op.headers['X-CSRF-Token'] ? ' +csrf' : ''}`); const r = respostas[i++]; if (r instanceof Error) throw r; if (!r) throw new Error('chamada a mais: ' + u); return r; };
  const r = await encerrarSessao(2000);
  afirma(`P7: ${nome} → ${JSON.stringify(esperado)}`, Object.entries(esperado).every(([k, v]) => r[k] === v), JSON.stringify({ r, chamadas }));
  return { r, chamadas };
}
// (1) sessão VIVA e o check responde 200 {ok:false, authenticated:false}: não é "já saiu"; segue o POST (sem CSRF) e o servidor recusa → erro
const c1 = await cenario('contraprova (1): check 200 {ok:false, authenticated:false} com a sessão viva → NÃO é sem-sessão', [resp(200, ERRO_COM_FALSE), resp(403, { ok: false })], { ok: false, motivo: 'csrf' });
afirma('P7: contraprova (1): o POST de logout foi enviado (nada de "saiu" sem o servidor)', c1.chamadas.some((c) => c.startsWith('POST')), JSON.stringify(c1.chamadas));
// (2) POST de logout ambíguo (200 HTML) e a prova responde 200 {ok:false, authenticated:false} → desconhecido
await cenario('contraprova (2): logout ambíguo + check {ok:false, authenticated:false} → desconhecido', [resp(200, ATIVA), resp(200, '<html>proxy</html>', 'text/html'), resp(200, ERRO_COM_FALSE)], { ok: false, motivo: 'desconhecido' });
await cenario('contraprova (2b): logout ambíguo + check encerrada SEM Content-Type JSON → desconhecido', [resp(200, ATIVA), resp(200, '<html>proxy</html>', 'text/html'), resp(200, ENCERRADA, 'text/html')], { ok: false, motivo: 'desconhecido' });
await cenario('contraprova (2c): logout ambíguo + check com authenticated fora do data → desconhecido', [resp(200, ATIVA), resp(204, ''), resp(200, { ok: true, authenticated: false, data: {}, error: null })], { ok: false, motivo: 'desconhecido' });
// (3) resposta VÁLIDA de sessão encerrada
await cenario('(3): check com o envelope exato de encerrada no início → sem-sessao, sem POST', [resp(200, ENCERRADA)], { ok: true, motivo: 'sem-sessao' });
await cenario('(3b): logout ambíguo + check com o envelope exato de encerrada → saída confirmada', [resp(200, ATIVA), resp(200, '<html>ok</html>', 'text/html'), resp(200, ENCERRADA)], { ok: true, motivo: 'sem-sessao' });
const c4 = await cenario('logout com o envelope {ok:true} confirma, com o CSRF relido do check ativo', [resp(200, ATIVA), resp(200, { ok: true, data: null, error: null })], { ok: true });
afirma('P7: o POST leva o X-CSRF-Token do envelope ativo', c4.chamadas.some((c) => c.startsWith('POST') && c.endsWith('+csrf')), JSON.stringify(c4.chamadas));
console.log(`SESSÃO ENCERRADA (validador único, DSHOW-115B): ${ok} ok, ${falhas} falhas`); process.exit(falhas ? 1 : 0);
