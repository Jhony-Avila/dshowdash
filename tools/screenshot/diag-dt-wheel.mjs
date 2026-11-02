// diag-dt-wheel.mjs — rola com WHEEL real (como usuário) e mede quem move e se o header fixa.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/eae0bef0-6629-4ab1-8ef8-4e2b9338a6aa/scratchpad';

const cookies = await getSessionCookies();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 620 }, colorScheme: 'dark', serviceWorkers: 'block', ignoreHTTPSErrors: true });
await ctx.addCookies(cookies);
await ctx.addInitScript(() => { try { localStorage.setItem('cm_theme', 'dark'); localStorage.setItem('dt_force_impl', 'react'); } catch (e) {} });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 160)));

const goto = async (h) => {
  await page.goto('https://dshowdash.com.br/' + h, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2600);
  if (await isLoginPage(page)) { await loginViaPage(page).catch(() => {}); await page.goto('https://dshowdash.com.br/' + h).catch(() => {}); await page.waitForTimeout(2600); }
  await page.waitForSelector('[data-dt-react-root]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
};

await goto('#/panel-datatables/infrastructure/servers');

const snap = () => page.evaluate(() => {
  const topo = document.querySelector('[data-dt-react-root] [class*="topoFixo"]');
  const dump = [];
  let el = topo;
  while (el && el !== document.documentElement) { dump.push({ cls: (el.className || '').toString().slice(0, 40) || el.tagName.toLowerCase(), st: el.scrollTop }); el = el.parentElement; }
  return {
    topoTop: topo ? Math.round(topo.getBoundingClientRect().top) : null,
    docScroll: document.scrollingElement ? document.scrollingElement.scrollTop : null,
    bodyScroll: document.body.scrollTop,
    ancestrais: dump.filter(d => d.st > 0),
  };
});

await page.screenshot({ path: `${OUT}/wheel-antes.png` }).catch(() => {});
const antes = await snap();
// move o mouse para o meio do conteúdo e rola com wheel real
await page.mouse.move(700, 400);
await page.mouse.wheel(0, 500);
await page.waitForTimeout(500);
await page.mouse.wheel(0, 400);
await page.waitForTimeout(700);
const depois = await snap();
await page.screenshot({ path: `${OUT}/wheel-depois.png` }).catch(() => {});

// quem moveu?
const movimento = await page.evaluate(() => {
  const topo = document.querySelector('[data-dt-react-root] [class*="topoFixo"]');
  let el = topo, quem = [];
  while (el && el !== document.documentElement) { if (el.scrollTop > 0) quem.push({ cls: (el.className || '').toString().slice(0, 40) || el.tagName.toLowerCase(), st: el.scrollTop }); el = el.parentElement; }
  const scRect = (() => { let e = topo.parentElement; while (e) { const s = getComputedStyle(e); if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 4) return { cls: (e.className || '').toString().slice(0, 40), top: Math.round(e.getBoundingClientRect().top), st: e.scrollTop }; e = e.parentElement; } return null; })();
  return { headerTop: Math.round(topo.getBoundingClientRect().top), quemRolou: quem, scroller: scRect };
});

console.log(JSON.stringify({ antes, depois, movimento, errosJs: errors }, null, 2));
await browser.close();
