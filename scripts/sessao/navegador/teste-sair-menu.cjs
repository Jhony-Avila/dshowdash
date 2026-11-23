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
  await b.close(); console.log(`SAIR MENU (código novo): ${ok} ok, ${falhas} falhas`); process.exit(falhas ? 1 : 0);
})();
