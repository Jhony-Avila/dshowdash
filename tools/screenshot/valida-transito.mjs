// valida-transito.mjs — valida indicador no header + painel no main (dark e light).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/28fb90a7-db93-4420-a07b-70b677e76c69/scratchpad';
const cookies = await getSessionCookies();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'] });

async function run(theme) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme === 'light' ? 'light' : 'dark', serviceWorkers: 'block', ignoreHTTPSErrors: true });
  await ctx.addCookies(cookies);
  await ctx.addInitScript((t) => { try {
    localStorage.setItem('dshowdash-theme', t); localStorage.setItem('cm_theme', t);
    localStorage.setItem('dshowdash_theme_prefs', JSON.stringify({ theme: t, density: 'comfortable' }));
  } catch(e){} }, theme);
  const page = await ctx.newPage();
  const errors = [], reqFail = [];
  page.on('pageerror', e => errors.push(String(e).slice(0,160)));
  page.on('requestfailed', r => { const u=r.url(); if(u.includes('/api/traffic')||u.includes('leaflet')||u.includes('panel-transito')) reqFail.push(r.method()+' '+u.slice(-70)+' :: '+(r.failure()?.errorText)); });

  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(()=>{});
  await page.waitForTimeout(3000);
  if (await isLoginPage(page)) await loginViaPage(page).catch(()=>{});
  // espera o header + indicador
  await page.waitForSelector('[data-traffic-indicator]', { timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(2500);

  const ind = await page.evaluate(() => {
    const b = document.querySelector('[data-traffic-indicator]');
    return b ? { present:true, status:b.getAttribute('data-status'), value:(b.querySelector('.ti-value')||{}).textContent, aria:b.getAttribute('aria-label') } : { present:false };
  });
  await page.screenshot({ path: `${OUT}/transito-${theme}-header.png` }).catch(()=>{});

  // clica no indicador → abre painel
  await page.click('[data-traffic-indicator]').catch(()=>{});
  await page.waitForSelector('.transit-panel', { timeout: 15000 }).catch(()=>{});
  await page.waitForTimeout(4500); // leaflet + fetch dashboard

  const panel = await page.evaluate(() => {
    const p = document.querySelector('.transit-panel'); if (!p) return { present:false };
    return {
      present:true,
      title: (p.querySelector('.tp-head__title h1')||{}).textContent,
      situation: (p.querySelector('.tp-situation .txt')||{}).textContent,
      cards: p.querySelectorAll('.tp-card').length,
      indexCard: (p.querySelector('.tp-card--index .tp-card__value')||{}).textContent,
      hasMap: !!p.querySelector('.leaflet-container'),
      flowLines: document.querySelectorAll('.leaflet-overlay-pane path').length,
      incidentMarkers: document.querySelectorAll('.tp-inc-marker').length,
      roadRows: p.querySelectorAll('.tp-list--roads .tp-row').length,
      incRows: p.querySelectorAll('.tp-list--incidents .tp-row').length,
    };
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/transito-${theme}-panel.png` }).catch(()=>{});
  await ctx.close();
  return { theme, ind, panel, errors: errors.slice(0,8), reqFail: reqFail.slice(0,8) };
}

const dark = await run('dark');
const light = await run('light');
await browser.close();
console.log(JSON.stringify({ dark, light }, null, 2));
