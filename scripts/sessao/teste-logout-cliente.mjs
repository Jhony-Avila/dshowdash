// DSHOW-110 — o cliente ÚNICO de logout (public/core/auth/logout-client.js, o .js servido) com fetch FALSO, sem rede e sem navegador.
// + a ordem do "Sair" do menu (user-data.ts): o servidor confirma ANTES de avisar os outros e de ir para /login.
// + (24/11) o erro ao sair é VISÍVEL na tela e continua anunciado ao leitor de tela.
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
  const ck = corpo('checkSession'); const a = ck.indexOf('if (!result.ok) {'), b = a > 0 ? a + ck.slice(a).search(/estado: ["']desconhecido["']/) : -1;
  const ramo = a > 0 && b > a ? ck.slice(a, ck.indexOf('}', b) + 1) : null;   // do teste de erro até o return do ramo de erro (Codex DSHOW-114)
  afirma(`${nome}: check indisponível não limpa identidade, tokens nem cookie`, ramo !== null && !/sessionStore\.clear|TokenManager\.clearAll|clearInvalidSessionCookie/.test(ramo), ramo ? ramo.replace(/\s+/g, ' ').slice(0, 160) : 'sem o ramo de erro');
  afirma(`${nome}: check indisponível = estado DESCONHECIDO, sem SESSION_CHECKED (Codex DSHOW-114)`, ramo !== null && !/emitAuthEvent|SESSION_CHECKED/.test(ramo.replace(/\/\*[\s\S]*?\*\//g, '')), ramo ? ramo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').slice(0, 160) : 'sem o ramo de erro');
}
// Decisão do Jhony (24/11): "Erro ao sair. Tente novamente." aparece NA TELA (não só no anunciador sr-only) e o anúncio continua.
// (a) o aviso visível (ui/aviso-erro.js, o .js servido) com um DOM falso mínimo; (b) o .catch do handleLogout (.ts e .js) chama os DOIS;
// (c) o bundle do cabeçalho versionado já leva o aviso (bundle velho = reprova).
const MSG = 'Erro ao sair. Tente novamente.';
function domFalso() {
  const mk = (doc, tag) => { const el = { tagName: tag.toUpperCase(), ownerDocument: doc, children: [], parent: null, attrs: {}, style: { cssText: '' }, className: '', textContent: '', ouvintes: {},
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    addEventListener(t, f) { (this.ouvintes[t] ||= []).push(f); }, appendChild(c) { c.parent = this; this.children.push(c); return c; },
    remove() { if (this.parent) { this.parent.children = this.parent.children.filter((x) => x !== this); this.parent = null; } },
    todos() { return this.children.flatMap((c) => [c, ...c.todos()]); },
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; },
    querySelectorAll(sel) { return this.todos().filter((e) => sel === '.user-menu-trigger' ? e.className === 'user-menu-trigger' : sel === '[data-aviso-erro="user-menu"]' ? e.attrs['data-aviso-erro'] === 'user-menu' : false); },
    getBoundingClientRect() { return this.className === 'user-menu-trigger' ? { top: 10, bottom: 50, left: 1000, right: 1200, width: 200, height: 40 } : { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }; } };
    return el; };
  const doc = { defaultView: { innerWidth: 1440 }, createElement: (t) => mk(doc, t) };
  const raiz = mk(doc, 'div'); raiz.className = 'user-menu-component'; const gat = mk(doc, 'button'); gat.className = 'user-menu-trigger'; raiz.appendChild(gat);
  return raiz;
}
const css = (el) => Object.fromEntries(el.style.cssText.split(';').filter(Boolean).map((d) => { const i = d.indexOf(':'); return [d.slice(0, i).trim(), d.slice(i + 1).trim()]; }));
const visivelFalso = (el) => { const c = css(el); return !!el.parent && el.textContent === MSG && c.position === 'fixed' && c.display !== 'none' && c.visibility !== 'hidden' && !/clip/.test(el.style.cssText) && !/(^|\s)sr-only(\s|$)/.test(el.className) && !('width' in c && parseFloat(c.width) <= 2); };
{
  const aviso = await import(pathToFileURL(path.join(RAIZ, 'public/components/header/components/user-menu/ui/aviso-erro.js')).href);
  const raiz = domFalso(); const el = aviso.mostrarAvisoErro(raiz, MSG, 0); const c = el ? css(el) : {};
  afirma('aviso de erro: aparece na tela (fixo, sem sr-only/clip, com o texto) dentro do componente', !!el && visivelFalso(el) && raiz.querySelectorAll(aviso.SELETOR_AVISO).length === 1, el ? el.style.cssText : 'nulo');
  afirma('aviso de erro: logo abaixo do botão do usuário (top = base do botão + 8; right alinhado)', c.top === '58px' && c.right === '240px', JSON.stringify(c));
  afirma('aviso de erro: aria-hidden (o leitor de tela já recebe pelo anunciador; sem leitura dupla)', !!el && el.getAttribute('aria-hidden') === 'true');
  aviso.mostrarAvisoErro(raiz, MSG, 0);
  afirma('aviso de erro: um segundo erro não empilha (um aviso só)', raiz.querySelectorAll(aviso.SELETOR_AVISO).length === 1);
  aviso.esconderAvisoErro(raiz);
  afirma('aviso de erro: nova tentativa de sair esconde o aviso anterior', raiz.querySelectorAll(aviso.SELETOR_AVISO).length === 0);
  const e2 = aviso.mostrarAvisoErro(raiz, MSG, 0); e2.ouvintes.click.forEach((f) => f());
  afirma('aviso de erro: clique fecha', raiz.querySelectorAll(aviso.SELETOR_AVISO).length === 0);
  afirma('aviso de erro: sem elemento do componente → não quebra', aviso.mostrarAvisoErro(null, MSG) === null);
}
for (const arq of ['public/components/header/components/user-menu/core/user-data.ts', 'public/components/header/components/user-menu/core/user-data.js']) {
  const s = readFileSync(path.join(RAIZ, arq), 'utf8'); const f = s.slice(s.indexOf('function handleLogout'), s.indexOf('function healthCheck'));
  const ct = f.slice(f.indexOf('.catch('));
  const msgOk = new RegExp(`MSG_ERRO_SAIR = ["']${MSG.replace(/\./g, '\\.')}["']`).test(s);
  afirma(`${path.basename(arq)}: no erro, ANUNCIA (leitor de tela) e MOSTRA na tela a mesma mensagem`, msgOk && f.indexOf('.catch(') > 0 && /_announce\(MSG_ERRO_SAIR\)/.test(ct) && /mostrarAvisoErro\(component\.element, MSG_ERRO_SAIR\)/.test(ct), ct.replace(/\s+/g, ' ').slice(0, 200));
  afirma(`${path.basename(arq)}: ao tentar sair de novo, esconde o aviso anterior antes de chamar o servidor`, f.indexOf('esconderAvisoErro(component.element)') > 0 && f.indexOf('esconderAvisoErro(component.element)') < f.indexOf('api.logout()'));
}
{
  const b = readFileSync(path.join(RAIZ, 'public/components/header/components/dist/header-components.bundle.js'), 'utf8');
  afirma('header-components.bundle.js: leva o aviso visível (bundle recompilado depois da mudança)', b.includes('data-aviso-erro') && b.includes('user-menu-aviso-erro') && b.includes(MSG));
}
console.log(`LOGOUT CLIENTE: ${ok} ok, ${falhas} falhas`); process.exit(falhas ? 1 : 0);
