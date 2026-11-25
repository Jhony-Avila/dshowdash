// P9 · Codex DSHOW-114 (CIMA, 24/11) — teste DECISIVO do "Entrar novamente" no navegador, com o logout REAL da P7 (79c54870) na 8112:
// três estados de sessão — só a saída CONFIRMADA libera /login; o DESCONHECIDO (check 503, rede, CSRF, 5xx) mantém o aviso e permite tentar
// de novo; "Continuar" só retoma depois de um LOGIN REAL (sessão nova), nunca com a identidade antiga; foto incerta mantém a chave e não é
// reenviada sozinha. Banco fora SÓ para a 8112 (tmpfs em /run/mysqld no namespace dela). O proxy de fotos é simulado (contrato v1.0).
// Uso: W=2200 H=1470 PORTA=8112 node teste-entrar-novamente-desconhecido.cjs   (cwd = pasta de saída)
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const { execFileSync } = require('child_process'); const fs = require('fs');
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const W = Number(process.env.W || 2200), H = Number(process.env.H || 1470);
const CAP = `capturas-entrar-${W}`; fs.mkdirSync(CAP, { recursive: true });
const PIDF = '/srv/dshow-modularizacao/atributos-web/validacao/shell/instancia.pid';
const CRED = '/srv/dshow-modularizacao/atributos-web/validacao/credenciais/atrweb_val.ini';
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + String(x).slice(0, 300) : '')); } };
const pid = () => fs.readFileSync(PIDF, 'utf8').trim(); let fora = false;
const derrubar = () => { execFileSync('nsenter', ['-t', pid(), '-m', 'mount', '-t', 'tmpfs', '-o', 'size=1m,mode=0755', 'tmpfs', '/run/mysqld']); fora = true; };
const restaurar = () => { if (!fora) return; execFileSync('nsenter', ['-t', pid(), '-m', 'umount', '/run/mysqld']); fora = false; };
const sql = (q) => execFileSync('mysql', [`--defaults-extra-file=${CRED}`, '-N', '-B', 'ATRWEB_VAL_DASH', '-e', q]).toString().trim();
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const png = (n) => Buffer.concat([PNG, Buffer.alloc(n, 7)]);
const P = 550; const dlg = '.at-portal-modal [role="dialog"]';
const ok200 = (data, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify({ ok: true, data, error: null }) });
const erro = (status, code, meta) => ({ status, contentType: 'application/json', body: JSON.stringify({ ok: false, data: null, error: code, meta }) });
// a "aba nova" é falsa: registramos [url inicial, alvo, para onde foi depois, fechada?]
const ABRIR = `window.__abertos = []; window.open = (u, t) => { const reg = { u: String(u), t: String(t), foi: null, fechada: false }; window.__abertos.push(reg); return { get closed() { return reg.fechada; }, opener: window, close() { reg.fechada = true; }, location: { set href(v) { reg.foi = String(v); }, get href() { return reg.foi || String(u); } } }; };`;

(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const nova = async () => { const ctx = await b.newContext({ viewport: { width: W, height: H } }); await ctx.addInitScript(ABRIR); const pg = await ctx.newPage();
    await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 }); return pg; };
  const simular = async (pg, modo) => {
    const s = { versao: 7, fotos: [{ id: 801, capa: true, posicao: 1, origem: 'precifica', autor_user_id: null, criado_em: '2026-10-01T10:00:00Z', largura: 800, altura: 600, cor: '#dddddd', versao_arquivo: 1 }], leituras: 0, posts: [], plano: [], proxId: 900, modo };
    await pg.route('**/api/midia/index.php?**', async (route) => {
      const u = new URL(route.request().url()); const r = u.searchParams.get('r'); const m = route.request().method();
      if (r === 'imagem') return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
      if (r === 'galeria') { s.leituras++; if (s.modo === 'revogada') return route.fulfill(erro(401, 'SESSION_REVOKED', { message: 'Sessão revogada.' }));
        return route.fulfill(ok200({ produto: { id: P, nome: 'Produto 550', ativo: true, pode_receber_foto: true }, versao_galeria: s.versao, limite_fotos: 30, fotos: s.fotos, removidas: [] })); }
      if (r === 'conferir') return route.fulfill(ok200({ resultado: 'nao_encontrada', reenvio_seguro: true }));
      if (m !== 'POST') return route.continue();
      const chave = route.request().headers()['x-chave-operacao']; s.posts.push({ r, chave });
      const acao = s.plano.length ? s.plano.shift() : 'ok';
      if (acao === 'revogada') return route.fulfill(erro(401, 'SESSION_REVOKED', { message: 'Sessão revogada.' }));
      if (acao === 'perdida') return route.abort('connectionreset');
      s.versao++; const id = s.proxId++; s.fotos.push({ id, capa: false, posicao: s.fotos.length + 1, origem: 'dshow', autor_user_id: 75, criado_em: new Date().toISOString(), largura: 1, altura: 1, cor: null, versao_arquivo: 1 });
      return route.fulfill(ok200({ desfecho: 'aplicada', recibo: { canal: 'dash', chave, confirmado_em: new Date().toISOString(), desfecho: 'aplicada', duplicada: false, foto_id: id, operacao: 'foto_publicar', produto_id: P, versao_nova: s.versao }, repetido: false }, 201));
    });
    return s;
  };
  const abrir = async (pg) => { await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.goto(`${B}/#/panel-atributos/produto/${P}`); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('.at-resumo-v3', { timeout: 40000 }); await pg.waitForTimeout(1000); };
  const espiar = (pg) => { const r = { check: [], logout: [] }; pg.on('response', (x) => { if (/\/api\/auth\/check\.php/.test(x.url())) r.check.push(x.status()); if (/\/api\/auth\/logout\.php/.test(x.url()) && x.request().method() === 'POST') r.logout.push(x.status()); }); return r; };
  const token = (pg) => pg.evaluate(async () => { const j = await (await fetch('/api/auth/check.php', { cache: 'no-store' })).json().catch(() => ({})); return j?.data?.session?.token ?? null; });
  const entrarDeNovo = async (pg) => { const o = await pg.context().newPage(); await o.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'domcontentloaded', timeout: 60000 }); await o.close(); };
  const fase = (pg, raiz) => pg.$eval(`${raiz} [data-at-entrar]`, (x) => x.dataset.atEntrarFase).catch(() => null);
  const AV = '[data-fotos-aviso="sessao"]';
  try {
    // ── A. aviso da página: logout FALHA (banco fora) → desconhecido; volta a comunicação → NÃO retoma; tentar de novo → login real → retoma ──
    { const pg = await nova(); const s = await simular(pg, 'revogada'); await abrir(pg);
      await pg.click('.at-fixo button[role="tab"]:has-text("Fotos")'); await pg.waitForSelector(`${AV} button:has-text("Entrar novamente")`, { timeout: 15000 });
      const tok0 = await token(pg); const esp = espiar(pg);
      derrubar();
      await pg.click(`${AV} button:has-text("Entrar novamente")`); await pg.waitForSelector(`${AV} [data-at-entrar-nao-saiu]`, { timeout: 20000 }).catch(() => {});
      const ab = await pg.evaluate(() => window.__abertos); const t1 = await pg.textContent(AV);
      afirma('A1. banco fora: check 503 → saída DESCONHECIDA: aviso fica, "Não foi possível encerrar a sessão", botão "Tentar de novo"', esp.check.includes(503) && (await fase(pg, AV)) === 'nao_saiu' && /Não foi possível encerrar a sessão/.test(t1) && !!(await pg.$(`${AV} button:has-text("Tentar de novo")`)), JSON.stringify({ c: esp.check, t1 }));
      afirma('A1. nenhum /login: a aba aberta no clique foi FECHADA sem navegar; nenhum logout 2xx', ab.length === 1 && ab[0].fechada === true && ab[0].foi === null && !esp.logout.some((x) => x >= 200 && x < 300), JSON.stringify({ ab, lo: esp.logout }));
      afirma('A1. reautenticação NÃO aparece como concluída: sem "Continuar", sem orientação de retomada', !(await pg.$(`${AV} button:has-text("Continuar")`)) && !(await pg.$(`${AV} [data-at-entrar-retomar]`)));
      await pg.screenshot({ path: `${CAP}/A1-saida-desconhecida.png` });
      restaurar(); await pg.waitForTimeout(1500);
      const l0 = s.leituras;
      afirma('A2. comunicação de volta: a sessão ANTIGA segue ativa e o fluxo NÃO retoma sozinho com ela (sem reler a galeria, sem "Continuar")', sql(`SELECT is_active FROM app_user_sessions WHERE session_token='${tok0}'`) === '1' && s.leituras === l0 && (await fase(pg, AV)) === 'nao_saiu' && !(await pg.$(`${AV} button:has-text("Continuar")`)));
      await pg.click(`${AV} button:has-text("Tentar de novo")`); await pg.waitForSelector(`${AV} [data-at-entrar-retomar]`, { timeout: 20000 }).catch(() => {});
      const ab2 = await pg.evaluate(() => window.__abertos);
      afirma('A3. "Tentar de novo" com a comunicação de volta: logout 200 confirmado e só então /login na outra aba', esp.logout.includes(200) && ab2.length === 2 && ab2[1].foi === '/login' && !ab2[1].fechada && sql(`SELECT CONCAT(is_active,'|',IFNULL(logout_reason,'NULL')) FROM app_user_sessions WHERE session_token='${tok0}'`) === '0|logout', JSON.stringify({ lo: esp.logout, ab2 }));
      const l1 = s.leituras;
      await pg.click(`${AV} button:has-text("Continuar")`); await pg.waitForTimeout(1200);
      const t3 = await pg.textContent(AV);
      afirma('A4. "Continuar" SEM ter entrado: não retoma (nenhuma releitura) e diz que ainda não identificou a entrada', s.leituras === l1 && /Ainda não identificamos a sua entrada/.test(t3), t3);
      await entrarDeNovo(pg); s.modo = 'ok';
      await pg.click(`${AV} button:has-text("Continuar")`); await pg.waitForSelector('.at-fotos-ger', { timeout: 15000 }).catch(() => {});
      afirma('A5. depois do LOGIN REAL (sessão nova): "Continuar" retoma e relê a galeria', s.leituras > l1 && !!(await pg.$('.at-fotos-ger')) && (await token(pg)) !== tok0);
      await pg.screenshot({ path: `${CAP}/A5-retomado.png` });
      await pg.context().close(); }

    // ── B. logout que "deu certo" mas a sessão ANTIGA continua viva → "Continuar" não retoma com a identidade antiga ──
    { const pg = await nova(); const s = await simular(pg, 'revogada'); await abrir(pg);
      await pg.click('.at-fixo button[role="tab"]:has-text("Fotos")'); await pg.waitForSelector(`${AV} button:has-text("Entrar novamente")`, { timeout: 15000 });
      const tok0 = await token(pg);
      await pg.route('**/api/auth/logout.php', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"data":{"message":"ok"}}' }));   // logout que não chegou ao servidor
      await pg.click(`${AV} button:has-text("Entrar novamente")`); await pg.waitForSelector(`${AV} [data-at-entrar-retomar]`, { timeout: 15000 });
      await pg.unroute('**/api/auth/logout.php');
      const l1 = s.leituras; await pg.click(`${AV} button:has-text("Continuar")`); await pg.waitForTimeout(1200);
      const t = await pg.textContent(AV);
      afirma('B. sessão antiga ainda ativa (mesmo token): "Continuar" NÃO retoma e avisa "A sessão anterior ainda está ativa"', s.leituras === l1 && /sessão anterior ainda está ativa/.test(t) && (await token(pg)) === tok0, t);
      await pg.context().close(); }

    // ── D. (DSHOW-115, NO-GO da P9) logout 2xx AMBÍGUO — HTML, JSON inválido, ok:false — com a sessão antiga ATIVA: não é saída confirmada.
    //    O aviso fica, "Tentar de novo" disponível, nenhuma navegação a /login (a aba do clique é fechada), nenhuma foto gravada.
    const AMBIGUOS = [
      ['HTML', { status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><body>Sessão encerrada</body></html>' }],
      ['JSON inválido', { status: 200, contentType: 'application/json', body: '{"ok":tru' }],
      ['ok:false', { status: 200, contentType: 'application/json', body: '{"ok":false,"data":null,"error":"LOGOUT_FAILED"}' }],
    ];
    for (const [nome, resp] of AMBIGUOS) {
      const pg = await nova(); const s = await simular(pg, 'revogada'); await abrir(pg);
      await pg.click('.at-fixo button[role="tab"]:has-text("Fotos")'); await pg.waitForSelector(`${AV} button:has-text("Entrar novamente")`, { timeout: 15000 });
      const tok0 = await token(pg); const navs = []; pg.on('framenavigated', (f) => { if (f === pg.mainFrame()) navs.push(new URL(f.url()).pathname); });
      await pg.route('**/api/auth/logout.php', (r) => r.fulfill(resp));   // 2xx que não encerrou nada no servidor
      await pg.click(`${AV} button:has-text("Entrar novamente")`); await pg.waitForSelector(`${AV} [data-at-entrar-nao-saiu]`, { timeout: 20000 }).catch(() => {});
      const ab = await pg.evaluate(() => window.__abertos); const t = await pg.textContent(AV).catch(() => '');
      afirma(`D. logout 200 com ${nome} e sessão antiga ATIVA: saída DESCONHECIDA — aviso fica com "Tentar de novo", sem "Continuar"`,
        (await fase(pg, AV)) === 'nao_saiu' && !!(await pg.$(`${AV} button:has-text("Tentar de novo")`)) && !(await pg.$(`${AV} button:has-text("Continuar")`)), t.slice(0, 200));
      afirma(`D. ${nome}: nenhuma navegação a /login (aba do clique FECHADA sem destino; esta aba não navegou), nenhuma foto gravada, sessão antiga ainda ativa`,
        ab.length === 1 && ab[0].fechada === true && ab[0].foi === null && !navs.some((x) => x.startsWith('/login')) && s.posts.length === 0
          && sql(`SELECT is_active FROM app_user_sessions WHERE session_token='${tok0}'`) === '1' && (await token(pg)) === tok0, JSON.stringify({ ab, navs, posts: s.posts.length }));
      if (nome === 'HTML') {   // tentar de novo com o logout de verdade: agora confirmado (envelope ok:true) → só então /login
        await pg.unroute('**/api/auth/logout.php');
        await pg.click(`${AV} button:has-text("Tentar de novo")`); await pg.waitForSelector(`${AV} [data-at-entrar-retomar]`, { timeout: 20000 }).catch(() => {});
        const ab2 = await pg.evaluate(() => window.__abertos);
        afirma('D. "Tentar de novo" com o logout real (envelope ok:true): só então /login na outra aba e a sessão antiga encerrada no banco',
          ab2.length === 2 && ab2[1].foi === '/login' && sql(`SELECT CONCAT(is_active,'|',IFNULL(logout_reason,'NULL')) FROM app_user_sessions WHERE session_token='${tok0}'`) === '0|logout', JSON.stringify(ab2));
        await pg.screenshot({ path: `${CAP}/D-logout-ambiguo-${W}.png` });
      }
      await pg.context().close();
    }

    // ── E. (Codex, 115B: validador ESTRITO comum à P7 e à P9) envelope do check.php com ok:false NUNCA prova nada:
    //    E1 · check 200 {ok:false, authenticated:false} ANTES do logout → desconhecido (a b6ede9af aceitava como "encerrada" e ia a /login);
    //    E2 · logout 200 ambíguo + check de prova 200 {ok:false, authenticated:false} → desconhecido;
    //    E3 · depois do login real, check 200 {ok:false, authenticated:true, token novo} → "Continuar" NÃO retoma (só com ok:true).
    const CHECK_OKFALSE_SAIU = { status: 200, contentType: 'application/json', body: JSON.stringify({ ok: false, data: { authenticated: false }, error: 'SESSION_CHECK_FAILED' }) };
    for (const caso of ['E1', 'E2']) {
      const pg = await nova(); const s = await simular(pg, 'revogada'); await abrir(pg);
      await pg.click('.at-fixo button[role="tab"]:has-text("Fotos")'); await pg.waitForSelector(`${AV} button:has-text("Entrar novamente")`, { timeout: 15000 });
      const tok0 = await token(pg); const navs = []; pg.on('framenavigated', (f) => { if (f === pg.mainFrame()) navs.push(new URL(f.url()).pathname); });
      if (caso === 'E1') await pg.route('**/api/auth/check.php', (r) => r.fulfill(CHECK_OKFALSE_SAIU));
      else { let n = 0; await pg.route('**/api/auth/check.php', (r) => (n++ === 0 ? r.continue() : r.fulfill(CHECK_OKFALSE_SAIU)));   // 1º check real (pega o CSRF), o de prova falso
        await pg.route('**/api/auth/logout.php', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false,"data":null,"error":"LOGOUT_FAILED"}' })); }
      await pg.click(`${AV} button:has-text("Entrar novamente")`); await pg.waitForSelector(`${AV} [data-at-entrar-nao-saiu], ${AV} [data-at-entrar-retomar]`, { timeout: 20000 }).catch(() => {});
      const ab = await pg.evaluate(() => window.__abertos); const t = await pg.textContent(AV).catch(() => '');
      afirma(`${caso}. check 200 com ok:false e authenticated:false${caso === 'E2' ? ' (prova depois de logout ambíguo)' : ''}: saída DESCONHECIDA — aviso com "Tentar de novo", sem "Continuar"`,
        (await fase(pg, AV)) === 'nao_saiu' && !!(await pg.$(`${AV} button:has-text("Tentar de novo")`)) && !(await pg.$(`${AV} button:has-text("Continuar")`)), t.slice(0, 200));
      afirma(`${caso}. nenhuma navegação a /login (aba do clique FECHADA), nenhuma foto gravada, a identidade/sessão antiga segue ativa`,
        ab.length === 1 && ab[0].fechada === true && ab[0].foi === null && !navs.some((x) => x.startsWith('/login')) && s.posts.length === 0
          && sql(`SELECT is_active FROM app_user_sessions WHERE session_token='${tok0}'`) === '1', JSON.stringify({ ab, navs, posts: s.posts.length }));
      const tentar = await pg.$(`${AV} button:has-text("Tentar de novo")`);
      if (caso === 'E2' && !tentar) afirma('E3. pulado: sem "Tentar de novo" (a saída não ficou desconhecida no E2)', false);
      if (caso === 'E2' && tentar) {   // E3: saída real, login real, mas o check do "Continuar" vem com ok:false → não retoma; com o check real → retoma
        await pg.unroute('**/api/auth/check.php'); await pg.unroute('**/api/auth/logout.php');
        await pg.click(`${AV} button:has-text("Tentar de novo")`); await pg.waitForSelector(`${AV} [data-at-entrar-retomar]`, { timeout: 20000 }).catch(() => {});
        await entrarDeNovo(pg); s.modo = 'ok'; const l1 = s.leituras;   // como no A5: depois do login real a galeria deixa de responder 401
        await pg.route('**/api/auth/check.php', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: false, data: { authenticated: true, session: { token: 'token-falso-novo', csrf_token: 'x' } }, error: 'X' }) }));
        await pg.click(`${AV} button:has-text("Continuar")`); await pg.waitForTimeout(1500);
        afirma('E3. login real feito, mas o check do "Continuar" vem com ok:false (authenticated:true e token novo): NÃO retoma (sem reler a galeria)', s.leituras === l1 && !!(await pg.$(`${AV} button:has-text("Continuar")`)), String(s.leituras - l1));
        await pg.unroute('**/api/auth/check.php');
        await pg.click(`${AV} button:has-text("Continuar")`); await pg.waitForFunction((n) => !document.querySelector('[data-fotos-aviso="sessao"]'), l1, { timeout: 15000 }).catch(() => {});
        afirma('E3. com o check real (ok:true, sessão NOVA do login real): "Continuar" retoma e relê a galeria', s.leituras > l1 && !!(await pg.$('.at-fotos-ger')) && (await token(pg)) !== tok0, String(s.leituras - l1));
        await pg.screenshot({ path: `${CAP}/E3-retomada-${W}.png` });
      }
      await pg.context().close();
    }

    // ── C. fila: foto INCERTA (resposta perdida) + foto recusada por sessão; saída desconhecida e depois real; a incerta NÃO é reenviada ──
    { const pg = await nova(); const s = await simular(pg, 'ok'); await abrir(pg);
      s.plano = ['perdida', 'revogada'];
      await pg.click('.at-resumo-v3__add'); await pg.setInputFiles('input[data-at-fotos-input]', [{ name: 'incerta.png', mimeType: 'image/png', buffer: png(31) }, { name: 'sessao.png', mimeType: 'image/png', buffer: png(32) }]);
      await pg.click(`${dlg} button:has-text("Publicar 2 fotos")`);
      await pg.waitForFunction(() => [...document.querySelectorAll('.at-fotos-fila__item')].every((x) => !['pronta', 'enviando', 'processando'].includes(x.dataset.atFotoFila)), null, { timeout: 20000 });
      const est0 = await pg.$$eval('.at-fotos-fila__item', (xs) => xs.map((x) => x.dataset.atFotoFila)); const chIncerta = s.posts[0].chave;
      afirma('C0. fila: a 1ª fica INCERTA (desconhecido) e a 2ª recusada por sessão', JSON.stringify(est0) === '["desconhecido","recusada"]', JSON.stringify(est0));
      const L2 = `${dlg} .at-fotos-fila__item:nth-child(2)`;
      derrubar();
      await pg.click(`${L2} button:has-text("Entrar novamente")`); await pg.waitForSelector(`${L2} [data-at-entrar-nao-saiu]`, { timeout: 20000 }).catch(() => {});
      afirma('C1. saída desconhecida na linha: aviso + "Tentar de novo", sem "Continuar envio"', (await fase(pg, L2)) === 'nao_saiu' && !(await pg.$(`${L2} button:has-text("Continuar envio")`)));
      restaurar(); await pg.waitForTimeout(800);
      await pg.click(`${L2} button:has-text("Tentar de novo")`); await pg.waitForSelector(`${L2} [data-at-entrar-retomar]`, { timeout: 20000 }).catch(() => {});
      await entrarDeNovo(pg);
      await pg.click(`${L2} button:has-text("Continuar envio")`); await pg.waitForFunction(() => document.querySelectorAll('.at-fotos-fila__item')[1]?.dataset.atFotoFila === 'publicada', null, { timeout: 15000 }).catch(() => {});
      const est1 = await pg.$$eval('.at-fotos-fila__item', (xs) => xs.map((x) => x.dataset.atFotoFila));
      const envIncerta = s.posts.filter((p) => p.chave === chIncerta).length;
      afirma('C2. depois do login real: só a recusada por sessão é reenviada e publicada', est1[1] === 'publicada', JSON.stringify(est1));
      afirma('C2. a foto INCERTA não foi reenviada sozinha (1 envio só) e segue "a conferir" com "Conferir gravação" e a mesma chave', envIncerta === 1 && est1[0] === 'desconhecido' && !!(await pg.$(`${dlg} .at-fotos-fila__item:nth-child(1) button:has-text("Conferir gravação")`)), JSON.stringify({ envIncerta, est1 }));
      await pg.screenshot({ path: `${CAP}/C2-fila.png` });
      await pg.context().close(); }
  } catch (e) { falhas++; console.log('ERRO ' + (e.message || e).split('\n')[0]); }
  finally { try { restaurar(); } catch (e) { falhas++; console.log('ERRO AO RESTAURAR O BANCO: ' + e.message); } await b.close(); console.log(`ENTRAR NOVAMENTE × SESSÃO DESCONHECIDA (P9, DSHOW-114, ${W}x${H}): ${ok} ok, ${falhas} falhas`); process.exit(falhas ? 1 : 0); }
})();
