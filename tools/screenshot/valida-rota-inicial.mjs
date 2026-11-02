// valida-rota-inicial.mjs — prova do módulo /app/router/initial-route.js.
// @version 1.0.0  @created 2026-07-30
//
// Uso:  PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright node tools/screenshot/valida-rota-inicial.mjs
//
// O app-shell não honrava o hash no BOOT A FRIO: abrir #/panel-ads direto montava o
// home ("Principal") com a URL certa. Esta suíte trava as duas metades do contrato —
// o painel pedido PASSA a montar, e o que já funcionava NÃO regride.
//
// Mede IDENTIDADE do painel (título do container), nunca presença/bytes: as três
// rotas quebradas montavam 35.722 bytes IDÊNTICOS, e qualquer teste de "montou algo"
// dava verde nelas.
//
// 1) raiz "/" sem hash                  -> tem de continuar no home, e o módulo NÃO age
// 2) "#/" explícito                     -> idem (rota neutra)
// 3) hash inexistente                   -> não pode lançar nem deixar container vazio
// 4) painel com contorno próprio (WCM)  -> módulo NÃO deve agir (evita montagem dupla)
// 5) painel comum                       -> módulo AGE (controle positivo do teste)
//
// O atributo data-initial-route-honrada no <html> diz se o módulo agiu.

import pkg from '/var/www/dshowdash/tools/screenshot/node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from '/var/www/dshowdash/tools/screenshot/auth.mjs';

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage',
         '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1',
         '--ignore-certificate-errors'],
});
const cookies = await getSessionCookies();
let falhas = 0;
const ok = (n, c, extra = '') => { if (!c) falhas++; console.log(`${c ? '  OK  ' : ' FALHA'} │ ${n}${extra ? ' — ' + extra : ''}`); };

async function abrir(sufixo) {
  const ctx = await browser.newContext({ viewport: { width: 1560, height: 940 }, ignoreHTTPSErrors: true });
  await ctx.addCookies(cookies);
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message.slice(0, 120)));
  await page.goto('https://dshowdash.com.br/' + sufixo, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(3000); }
  await page.waitForTimeout(9000);
  const r = await page.evaluate(() => ({
    titulo: (document.querySelector('#main .dsd-container__header')?.textContent || '').split('Voltar ao Inicio')[0].trim(),
    honrada: document.documentElement.getAttribute('data-initial-route-honrada'),
    bytes: (document.querySelector('#main .dsd-container__content')?.innerHTML || '').length,
    hash: location.hash,
  }));
  await ctx.close();
  return { ...r, erros };
}

const raiz = await abrir('');
ok('1) raiz "/" continua no home', raiz.titulo === 'Principal', `título="${raiz.titulo}"`);
ok('1) módulo NÃO age na raiz', raiz.honrada === null, `atributo=${raiz.honrada}`);

const neutra = await abrir('#/');
ok('2) "#/" continua no home', neutra.titulo === 'Principal', `título="${neutra.titulo}"`);
ok('2) módulo NÃO age em rota neutra', neutra.honrada === null, `atributo=${neutra.honrada}`);

const inexistente = await abrir('#/panel-que-nao-existe-xyz');
ok('3) rota inexistente não lança', inexistente.erros.length === 0, `${inexistente.erros.length} pageerror`);
ok('3) rota inexistente não deixa container vazio', inexistente.bytes > 500, `${inexistente.bytes} bytes`);

const wcm = await abrir('#/panel-relogio-mundial');
ok('4) WCM monta a frio', wcm.titulo.startsWith('Relogio'), `título="${wcm.titulo}"`);
ok('4) módulo NÃO age no WCM (contorno próprio)', wcm.honrada === null, `atributo=${wcm.honrada}`);

const ads = await abrir('#/panel-ads');
ok('5) painel comum monta a frio', ads.titulo === 'Ads', `título="${ads.titulo}"`);
ok('5) módulo AGE no painel comum', ads.honrada === '#/panel-ads', `atributo=${ads.honrada}`);

console.log(`\n${falhas === 0 ? 'TODAS PASSARAM' : falhas + ' FALHA(S)'} — 10 asserções`);
await browser.close();
process.exit(falhas ? 1 : 0);
