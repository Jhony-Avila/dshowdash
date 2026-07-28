// Valida o card "Webhooks & fila" na tela Configuracoes (dark+light).
// Origin autenticado. NAO clica "Registrar" (efeito externo); clica "Drenar fila agora"
// (no-op seguro com fila vazia) para provar o wiring do POST /queue/drain.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors']
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { log('[warn] cookie:', e.message); }
const page = await ctx.newPage();

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
let whResp = null, queueResp = null, drainCalls = 0, registerCalls = 0;
page.on('response', async (r) => {
  const u = r.url();
  if (u.includes('/api/pipedrive/webhooks') && !u.includes('/register')) { let b = null; try { b = await r.json(); } catch {} whResp = { http: r.status(), body: b?.data }; }
  if (u.includes('/api/pipedrive/queue')) { let b = null; try { b = await r.json(); } catch {} queueResp = { http: r.status(), body: b?.data?.stats }; }
});
page.on('request', (r) => {
  if (r.url().includes('/api/pipedrive/queue/drain')) drainCalls++;
  if (r.url().includes('/api/pipedrive/webhooks/register')) registerCalls++;
});

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('.site-header, header', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2500);
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
let mounted = false;
try { await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 }); mounted = true; }
catch { log('FALHA: nao montou'); }
await page.waitForTimeout(2000);

// Navega para Configuracoes
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Configurações'));
  b?.click();
});
await page.waitForSelector('#pp-token', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(2500); // deixa /webhooks e /queue responderem

const card = await page.evaluate(() => {
  const h3s = [...document.querySelectorAll('.pp-card h3')].map(h => h.textContent.trim());
  const whCard = [...document.querySelectorAll('.pp-card')].find(c => c.querySelector('h3')?.textContent.includes('Webhooks'));
  if (!whCard) return { presente: false, h3s };
  const rows = [...whCard.querySelectorAll('.pp-row')].map(r => ({
    k: r.querySelector('.pp-k')?.textContent.trim().slice(0, 40),
    v: r.querySelector('.pp-v')?.textContent.trim().slice(0, 60),
  }));
  const tiles = [...whCard.querySelectorAll('.pp-tile')].map(t => ({
    n: t.querySelector('.pp-tile-n')?.textContent.trim(), l: t.querySelector('.pp-tile-l')?.textContent.trim()
  }));
  const botoes = [...whCard.querySelectorAll('.pp-btn')].map(b => b.textContent.trim());
  const url = whCard.querySelector('code')?.textContent.trim();
  const badge = whCard.querySelector('.pp-badge')?.textContent.trim();
  return { presente: true, url, badge, tiles, botoes, rows };
});
log('CARD WEBHOOKS:', JSON.stringify(card, null, 2));
log('API /webhooks:', JSON.stringify(whResp));
log('API /queue:', JSON.stringify(queueResp));

// Clica "Drenar fila agora" (no-op seguro) e confere mensagem de sucesso
await page.evaluate(() => {
  const whCard = [...document.querySelectorAll('.pp-card')].find(c => c.querySelector('h3')?.textContent.includes('Webhooks'));
  const b = [...whCard.querySelectorAll('.pp-btn')].find(x => x.textContent.includes('Drenar'));
  b?.click();
});
await page.waitForTimeout(2500);
const drainMsg = await page.evaluate(() => {
  const whCard = [...document.querySelectorAll('.pp-card')].find(c => c.querySelector('h3')?.textContent.includes('Webhooks'));
  return whCard?.querySelector('.pp-msg')?.textContent.trim();
});
log('MSG APOS DRENAR:', drainMsg, '| drainCalls:', drainCalls);

// Screenshots dark + light
for (const t of ['dark', 'light']) {
  await setTheme(page, t); await page.waitForTimeout(700);
  const el = await page.$('[data-pp-react-root]') || page;
  await el.screenshot({ path: `${OUT}/pipedrive-webhooks-${t}.png` }).catch(() => {});
  log(`shot webhooks ${t}`);
}

const pipeErrs = errors.filter(e => /pipedrive|webhook|queue/i.test(e));
log('RESUMO =>', JSON.stringify({
  mounted,
  cardPresente: card.presente,
  urlOk: (card.url || '').includes('/api/pipedrive/webhook'),
  badge: card.badge,
  tiles: card.tiles?.map(t => t.l),
  temRegistrar: card.botoes?.some(b => b.includes('Registrar')),
  temDrenar: card.botoes?.some(b => b.includes('Drenar')),
  whHttp: whResp?.http,
  queueHttp: queueResp?.http,
  drenouComSucesso: (drainMsg || '').includes('Fila drenada'),
  registerNaoDisparado: registerCalls === 0, // garantimos: nenhum efeito externo
  consoleErrsPipe: pipeErrs.length,
}, null, 2));
if (pipeErrs.length) log('ERROS PIPE:', pipeErrs.slice(0, 5));
await browser.close();
log('=== FIM ===');

async function setTheme(page, t) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) {
    await page.click('[data-dsd-theme-toggle]').catch(() => {});
    await page.waitForTimeout(700);
    c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  }
  return c;
}
