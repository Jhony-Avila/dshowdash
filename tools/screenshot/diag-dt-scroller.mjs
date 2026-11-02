// diag-dt-scroller.mjs — mapeia a cadeia REAL de ancestrais do .topoFixo,
// identifica quem realmente rola e prova a fixação com viewport curto (força overflow).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/eae0bef0-6629-4ab1-8ef8-4e2b9338a6aa/scratchpad';

const cookies = await getSessionCookies();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'] });
// viewport CURTO p/ forçar overflow vertical do conteúdo
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

const diag = await page.evaluate(() => {
  const topo = document.querySelector('[data-dt-react-root] [class*="topoFixo"]');
  if (!topo) return { erro: 'sem topoFixo' };
  // cadeia de ancestrais até body
  const chain = [];
  let el = topo;
  while (el && el !== document.documentElement) {
    const st = getComputedStyle(el);
    chain.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().slice(0, 60),
      overflowY: st.overflowY,
      sh: el.scrollHeight, ch: el.clientHeight,
      rolavel: (st.overflowY === 'auto' || st.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 4,
    });
    el = el.parentElement;
  }
  // quem responde a scrollTop? testa cada ancestral e o window
  const provas = [];
  let cur = topo.parentElement;
  while (cur && cur !== document.documentElement) {
    const antes = cur.scrollTop;
    cur.scrollTop = 400;
    const depois = cur.scrollTop;
    if (depois !== antes || depois > 0) provas.push({ cls: (cur.className || '').toString().slice(0, 50), aplicou: depois });
    cur.scrollTop = 0;
    cur = cur.parentElement;
  }
  const wy0 = window.scrollY; window.scrollTo(0, 400); const wy1 = window.scrollY; window.scrollTo(0, 0);
  return { chain, provas, windowScroll: { wy0, wy1 }, topoRectTop: Math.round(topo.getBoundingClientRect().top) };
});

// agora rola o PRIMEIRO ancestral rolável de verdade e mede fixação
const prova = await page.evaluate(() => {
  const topo = document.querySelector('[data-dt-react-root] [class*="topoFixo"]');
  let sc = topo.parentElement, scroller = null;
  while (sc) { const st = getComputedStyle(sc); if ((st.overflowY === 'auto' || st.overflowY === 'scroll') && sc.scrollHeight > sc.clientHeight + 4) { scroller = sc; break; } sc = sc.parentElement; }
  if (!scroller) { // fallback: window
    const b0 = topo.getBoundingClientRect().top; window.scrollTo(0, 400); const b1 = topo.getBoundingClientRect().top;
    return { via: 'window', scrollY: window.scrollY, antes: Math.round(b0), depois: Math.round(b1) };
  }
  const scRect = scroller.getBoundingClientRect();
  const b0 = topo.getBoundingClientRect().top;
  scroller.scrollTop = 400;
  const b1 = topo.getBoundingClientRect().top;
  return {
    via: 'scroller', scrollerCls: (scroller.className || '').toString().slice(0, 50),
    scrollTopAplicado: scroller.scrollTop, scrollerTop: Math.round(scRect.top),
    antes: Math.round(b0), depois: Math.round(b1),
    grudou: scroller.scrollTop > 50 && Math.abs(b1 - scRect.top) <= 3,
  };
});
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/diag-scroller-servers-scrolled.png` }).catch(() => {});

console.log(JSON.stringify({ diag, prova, errosJs: errors }, null, 2));
await browser.close();
