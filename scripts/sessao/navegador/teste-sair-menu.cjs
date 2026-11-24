// DSHOW-110 — "Sair" do menu do usuário no NAVEGADOR, instância de validação (PORTA, padrão 8114), código novo.
// A) falha de REDE no logout (rota abortada): a tela NÃO sai, mostra o erro e a sessão continua viva no servidor.
// B) Sair confirmado: POST /api/auth/logout.php NÃO abortado e 2xx; vai para /login; check.php desautenticado; registro INATIVO;
//    a outra aba (mesmo cookie) é recusada na próxima chamada. Uso: flock …/navegador.lock node teste-sair-menu.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const { execFileSync } = require('child_process');
const B = `http://127.0.0.1:${process.env.PORTA || 8114}`;
const CRED = process.env.ATRWEB_CRED || '/srv/dshow-modularizacao/atributos-web/validacao/credenciais/atrweb_val.ini';
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + String(x).slice(0, 300) : '')); } };
const sql = (q) => execFileSync('mysql', [`--defaults-extra-file=${CRED}`, '-N', '-B', '-e', q]).toString().trim();
// o cookie DSHOWSESS é Secure: só a PÁGINA (127.0.0.1 = contexto seguro) o envia; ctx.request por http não manda → conferir de dentro da página
const autenticado = async (pagina) => { const d = await pagina.evaluate(async () => (await fetch('/api/auth/check.php', { credentials: 'include', cache: 'no-store' })).json()).catch(() => ({})); return !!(d.data && d.data.authenticated); };
const abrirMenuESair = async (pg) => { await pg.click('.user-menu-trigger', { timeout: 20000 }); await pg.waitForTimeout(400); await pg.click('[data-action="logout"]', { timeout: 10000 }); };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const ctx = await b.newContext({ viewport: { width: 2200, height: 1470 } }); const pg = await ctx.newPage();
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
  const id = (await ctx.cookies()).find((c) => c.name === 'DSHOWSESS')?.value || '';
  const aut0 = await autenticado(pg), reg0 = sql(`SELECT is_active FROM ATRWEB_VAL_DASH.app_user_sessions WHERE session_token='${id.replace(/[^A-Za-z0-9,-]/g, '')}'`);
  afirma('login falso: autenticado e com REGISTRO ativo (infra de teste)', aut0 && reg0 === '1', `autenticado=${aut0} registro=${reg0} id=${id.slice(0, 6)}…`);

  // A) falha de rede
  await pg.route('**/api/auth/logout.php', (r) => r.abort('failed'));
  await abrirMenuESair(pg); await pg.waitForTimeout(2500);
  afirma('A) falha de rede: a tela NÃO foi para /login', !pg.url().includes('/login'), pg.url());
  afirma('A) falha de rede: a sessão continua viva no servidor (não fingiu que saiu)', await autenticado(pg));
  const aviso = await pg.evaluate(() => document.body.innerText.includes('Erro ao sair') || [...document.querySelectorAll('[aria-live]')].some((e) => /Erro ao sair/.test(e.textContent || '')));
  afirma('A) falha de rede: aviso "Erro ao sair" anunciado', aviso);
  await pg.unroute('**/api/auth/logout.php');

  // B) Sair confirmado
  const pg2 = await ctx.newPage(); await pg2.goto(`${B}/`, { waitUntil: 'networkidle' });   // a OUTRA aba, mesmo cookie
  const reqs = [], abortados = []; let respLogout = null;
  pg.on('request', (r) => reqs.push(`${r.method()} ${r.url().replace(B, '')}`));
  pg.on('requestfailed', (r) => abortados.push(`${r.method()} ${r.url().replace(B, '')} · ${r.failure() && r.failure().errorText}`));
  pg.on('response', (r) => { if (r.url().endsWith('/api/auth/logout.php')) respLogout = r.status(); });
  await pg.reload({ waitUntil: 'networkidle' });
  await abrirMenuESair(pg); await pg.waitForURL(/\/login/, { timeout: 15000 }).catch(() => {}); await pg.waitForTimeout(1500);
  afirma('B) POST /api/auth/logout.php enviado', reqs.some((x) => x.startsWith('POST /api/auth/logout.php')));
  const posts = reqs.filter((x) => x.startsWith('POST /api/auth/logout.php')).length, postsAbortados = abortados.filter((x) => x.includes('/api/auth/logout.php')).length;
  console.log(`      (POSTs de logout: ${posts}; abortados: ${postsAbortados}; resposta do 1º: ${respLogout})`);
  afirma('B) o POST de logout do MENU chegou e foi confirmado ANTES da navegação (1º POST com 2xx)', respLogout !== null && respLogout >= 200 && respLogout < 300);
  afirma('B) nenhum POST de logout abortado (inclui o do session-manager, se houver)', postsAbortados === 0, `${postsAbortados} abortado(s) de ${posts}`);
  afirma('B) o servidor confirmou (2xx)', respLogout !== null && respLogout >= 200 && respLogout < 300, String(respLogout));
  afirma('B) depois da confirmação foi para /login', pg.url().includes('/login'), pg.url());
  afirma('B) check.php: sessão encerrada no servidor', !(await autenticado(pg2)));
  afirma('B) registro INATIVO com motivo logout', sql(`SELECT CONCAT(is_active,'/',IFNULL(logout_reason,'')) FROM ATRWEB_VAL_DASH.app_user_sessions WHERE session_token='${id.replace(/[^A-Za-z0-9,-]/g, '')}'`) === '0/logout');
  const r2 = await pg2.evaluate(async () => (await fetch('/api/auth/check.php', { credentials: 'include', cache: 'no-store' })).json());
  afirma('B) a outra aba reconhece na próxima chamada (desautenticada)', !(r2.data && r2.data.authenticated));

  // C/D) SESSION-MANAGER (o caminho que ainda tinha o logout antigo sem CSRF — usado pelo rodapé/ação 'logout'). No layout v2 o rodapé
  // NÃO desenha o slot de controles (.dsd-footer__controls ausente) → não há botão "Sair" no rodapé para clicar; testa-se o MESMO caminho
  // pela API global do session-manager, exatamente o que o botão chamaria.
  const pg3 = await ctx.newPage(); await pg3.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
  const id3 = (await ctx.cookies()).find((c) => c.name === 'DSHOWSESS')?.value || '';
  afirma('C) rodapé do layout v2: sem slot de controles (não há botão Sair no rodapé)', await pg3.evaluate(() => !document.querySelector('.dsd-footer__controls')));
  const smSair = () => pg3.evaluate(async () => { const mod = await import('/components/session-manager/dist/session-manager.bundle.js'); const sm = mod.default || mod.SessionManager; if (!sm || !sm.logout) return { semApi: true }; try { return await sm.logout(); } catch (e) { return { erro: String(e) }; } });
  const posts3 = [], ab3 = []; let resp3 = null;
  pg3.on('request', (r) => { if (r.url().endsWith('/api/auth/logout.php') && r.method() === 'POST') posts3.push(r.headers()['x-csrf-token'] ? 'com-csrf' : 'SEM-CSRF'); });
  pg3.on('requestfailed', (r) => { if (r.url().endsWith('/api/auth/logout.php')) ab3.push(r.failure() && r.failure().errorText); });
  pg3.on('response', (r) => { if (r.url().endsWith('/api/auth/logout.php')) resp3 = r.status(); });
  await pg3.route('**/api/auth/logout.php', (r) => r.abort('failed'));
  const rc = await smSair(); await pg3.waitForTimeout(1500);
  afirma('C) session-manager, falha de rede: devolve ok:false (antes devolvia ok:true com serverError)', rc && rc.ok === false, JSON.stringify(rc));
  afirma('C) session-manager, falha de rede: sessão viva no servidor', await autenticado(pg3));
  await pg3.unroute('**/api/auth/logout.php'); posts3.length = 0; ab3.length = 0; resp3 = null;
  const rd = await smSair(); await pg3.waitForTimeout(1500);
  console.log(`      (session-manager: POSTs ${posts3.join(',') || 'nenhum'}; abortados ${ab3.length}; resposta ${resp3}; retorno ${JSON.stringify(rd)})`);
  afirma('D) session-manager: o POST de logout leva o X-CSRF-Token (nenhum caminho antigo sem CSRF)', posts3.length > 0 && posts3.every((x) => x === 'com-csrf'), posts3.join(','));
  afirma('D) session-manager: servidor confirmou (2xx), retorno ok:true', resp3 >= 200 && resp3 < 300 && rd && rd.ok === true, `${resp3} ${JSON.stringify(rd)}`);
  afirma('D) session-manager: registro INATIVO com motivo logout', sql(`SELECT CONCAT(is_active,'/',IFNULL(logout_reason,'')) FROM ATRWEB_VAL_DASH.app_user_sessions WHERE session_token='${id3.replace(/[^A-Za-z0-9,-]/g, '')}'`) === '0/logout');
  await b.close(); console.log(`SAIR MENU + RODAPÉ (código novo): ${ok} ok, ${falhas} falhas`); process.exit(falhas ? 1 : 0);
})();
