// DSHOW-110 — o cliente ÚNICO de logout (public/core/auth/logout-client.js, o .js servido) com fetch FALSO, sem rede e sem navegador.
// + a ordem do "Sair" do menu (user-data.ts): o servidor confirma ANTES de avisar os outros e de ir para /login.
// Uso: node scripts/sessao/teste-logout-cliente.mjs [raiz]
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const RAIZ = path.resolve(process.argv[2] || new URL('../..', import.meta.url).pathname);
const { encerrarSessao } = await import(pathToFileURL(path.join(RAIZ, 'public/core/auth/logout-client.js')).href);
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const resp = (status, corpo) => ({ ok: status >= 200 && status < 300, status, json: async () => corpo, text: async () => JSON.stringify(corpo) });
const CSRF_FALSO = 'teste-' + randomUUID();   // gerado na hora: nenhum valor de token fixo no código
const CHECK_AUT = { ok: true, data: { authenticated: true, session: { csrf_token: CSRF_FALSO } } };
function cenario(roteiro) { const pedidos = []; globalThis.fetch = async (url, op = {}) => { pedidos.push({ url, metodo: op.method || 'GET', csrf: (op.headers || {})['X-CSRF-Token'] }); return roteiro(url, op, pedidos); }; return pedidos; }

let p = cenario((u) => u.includes('check') ? resp(200, CHECK_AUT) : resp(200, { ok: true }));
let r = await encerrarSessao();
afirma('logout confirmado (2xx) → ok:true', r.ok === true && r.status === 200);
afirma('POST /api/auth/logout.php com X-CSRF-Token relido do check.php', p.some((x) => x.url.endsWith('/api/auth/logout.php') && x.metodo === 'POST' && x.csrf === CSRF_FALSO));

cenario((u) => u.includes('check') ? resp(200, CHECK_AUT) : Promise.reject(new TypeError('Failed to fetch')));
r = await encerrarSessao();
afirma('falha de REDE no POST → ok:false (nunca sucesso)', r.ok === false && r.motivo === 'rede', JSON.stringify(r));

cenario(() => Promise.reject(new TypeError('Failed to fetch')));
r = await encerrarSessao();
afirma('falha de rede já no check → ok:false', r.ok === false && r.motivo === 'rede');

cenario((u) => u.includes('check') ? resp(200, CHECK_AUT) : resp(403, { ok: false, error: 'INVALID_CSRF_TOKEN' }));
r = await encerrarSessao();
afirma('CSRF recusado (403) → ok:false motivo csrf', r.ok === false && r.motivo === 'csrf');

cenario((u) => u.includes('check') ? resp(200, CHECK_AUT) : resp(503, {}));
r = await encerrarSessao();
afirma('erro do servidor (5xx) → ok:false', r.ok === false && r.motivo === 'servidor');

p = cenario((u) => u.includes('check') ? resp(200, { ok: true, data: { authenticated: false, session: { csrf_token: 'x' } } }) : resp(403, {}));
r = await encerrarSessao();
afirma('já sem sessão no servidor (outra aba saiu) → ok:true sem POST', r.ok === true && r.motivo === 'sem-sessao' && !p.some((x) => x.metodo === 'POST'));

// P2-1 (24/11): banco fora → o check.php responde 503 SESSION_CHECK_UNAVAILABLE; o logout NÃO pode virar "sem-sessao" (sucesso)
p = cenario((u) => u.includes('check') ? resp(503, { ok: false, data: null, error: 'SESSION_CHECK_UNAVAILABLE' }) : resp(403, { ok: false, error: 'INVALID_CSRF_TOKEN' }));
r = await encerrarSessao();
afirma('check 503 (banco fora) → segue para o POST sem CSRF → 403 → ok:false ("Erro ao sair")', r.ok === false && r.motivo === 'csrf' && p.some((x) => x.metodo === 'POST' && !x.csrf), JSON.stringify(r));

p = cenario(async (u) => { await new Promise((s) => setTimeout(s, 30)); return u.includes('check') ? resp(200, CHECK_AUT) : resp(200, {}); });
const [a, b] = await Promise.all([encerrarSessao(), encerrarSessao()]);
afirma('dois cliques: UMA chamada ao servidor, o mesmo resultado', a === b && p.filter((x) => x.metodo === 'POST').length === 1);

cenario((u, op) => new Promise((_, rej) => op.signal.addEventListener('abort', () => rej(Object.assign(new Error('abortado'), { name: 'AbortError' })))));   // como o fetch real: o abort rejeita
r = await encerrarSessao(50);
afirma('sem resposta → timeout → ok:false', r.ok === false && r.motivo === 'timeout');

// ordem do "Sair" do menu (fonte .ts e o .js servido): a chamada ao servidor vem ANTES da ação 'logout' e do redirect para /login
for (const arq of ['public/components/header/components/user-menu/core/user-data.ts', 'public/components/header/components/user-menu/core/user-data.js']) {
  const s = readFileSync(path.join(RAIZ, arq), 'utf8'); const f = s.slice(s.indexOf('function handleLogout'), s.indexOf('function healthCheck'));
  const iApi = f.indexOf('api.logout()'), iAcao = f.indexOf("emitUIAction(\"logout\"") >= 0 ? f.indexOf("emitUIAction(\"logout\"") : f.indexOf("emitUIAction('logout'"), iRed = f.indexOf("redirect(");
  afirma(`${path.basename(arq)}: servidor primeiro, depois a ação 'logout' e o redirect`, iApi > 0 && iAcao > iApi && iRed > iAcao, `${iApi}/${iAcao}/${iRed}`);
  afirma(`${path.basename(arq)}: sem confirmação, não segue (lança erro → mensagem "Erro ao sair")`, /if \(!confirmado\) throw/.test(f));
}
for (const arq of ['public/components/header/components/user-menu/api/fetch.js', 'public/components/session-manager/api/client.js']) {
  const s = readFileSync(path.join(RAIZ, arq), 'utf8');
  afirma(`${arq.split('/').slice(-3).join('/')}: usa o cliente único (encerrarSessao)`, s.includes('encerrarSessao(') && s.includes('/core/auth/logout-client.js') && !/fetch\(['"]\/api\/auth\/logout\.php/.test(s.replace(/logout-client/g, '')));
}
// Codex DSHOW-113 (3): o session-manager (o .js servido e o .ts) só limpa a identidade e anuncia LOGOUT_SUCCESS DEPOIS de r.ok;
// com a consulta indisponível (check ≠ 2xx/401) ele NÃO limpa store, tokens nem cookie.
for (const arq of ['public/components/session-manager/core/auth.js', 'public/components/session-manager/core/auth.ts']) {
  const s = readFileSync(path.join(RAIZ, arq), 'utf8'); const nome = arq.split('/').slice(-2).join('/');
  const corpo = (fn) => { const i = s.indexOf(`function ${fn}(`); const j = s.indexOf('\nfunction ', i + 10); return s.slice(i, j > i ? j : undefined); };
  const lo = corpo('logout'), iFalha = lo.search(/if \(!r \|\| !r\.ok\) return \{ ok: false/), iLimpa = lo.indexOf('sessionStore.clear()'), iAnuncia = lo.indexOf('LOGOUT_SUCCESS');
  afirma(`${nome}: logout limpa e anuncia só DEPOIS da confirmação (r.ok)`, iFalha > 0 && iLimpa > iFalha && iAnuncia > iLimpa, `${iFalha}/${iLimpa}/${iAnuncia}`);
  const ck = corpo('checkSession'); const a = ck.indexOf('if (!result.ok) {'), b = ck.indexOf('return { ok: false, error: result.error }', a);
  const ramo = a > 0 && b > a ? ck.slice(a, b) : null;   // do teste de erro até o return do ramo de erro
  afirma(`${nome}: check indisponível não limpa identidade, tokens nem cookie`, ramo !== null && !/sessionStore\.clear|TokenManager\.clearAll|clearInvalidSessionCookie/.test(ramo), ramo ? ramo.replace(/\s+/g, ' ').slice(0, 160) : 'sem o ramo de erro');
}
console.log(`LOGOUT CLIENTE: ${ok} ok, ${falhas} falhas`); process.exit(falhas ? 1 : 0);
