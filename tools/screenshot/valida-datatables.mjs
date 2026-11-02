// valida-datatables.mjs — valida o painel DataTables no main (dark e light).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/700a9e7d-2830-4fec-a39f-5b02b7bd1074/scratchpad';
const cookies = await getSessionCookies();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'] });

async function run(theme) {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, colorScheme: theme === 'light' ? 'light' : 'dark', serviceWorkers: 'block', ignoreHTTPSErrors: true });
  await ctx.addCookies(cookies);
  await ctx.addInitScript((t) => { try {
    localStorage.setItem('dshowdash-theme', t); localStorage.setItem('cm_theme', t);
  } catch(e){} }, theme);
  const page = await ctx.newPage();
  const errors = [], apiCalls = [];
  page.on('pageerror', e => errors.push(String(e).slice(0,200)));
  page.on('response', r => { const u=r.url(); if (u.includes('/api/datatables')) apiCalls.push(r.status()+' '+u.replace(/^https:\/\/[^/]+/,'')); });

  await page.goto('https://dshowdash.com.br/#/panel-datatables', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(()=>{});
  await page.waitForTimeout(3000);
  if (await isLoginPage(page)) { await loginViaPage(page).catch(()=>{}); await page.goto('https://dshowdash.com.br/#/panel-datatables').catch(()=>{}); await page.waitForTimeout(3000); }

  await page.waitForSelector('.dt-root', { timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(3000);

  const dash = await page.evaluate(() => {
    const r = document.querySelector('.dt-root'); if (!r) return { present:false };
    const kpis = [...r.querySelectorAll('.dt-kpi')].map(k => ({
      label: (k.querySelector('.dt-kpi__label')||{}).textContent,
      value: (k.querySelector('.dt-kpi__value')||{}).textContent }));
    const cs = getComputedStyle(r);
    return { present:true, tabs: r.querySelectorAll('.dt-tab').length, kpis: kpis.slice(0,8),
             envs: r.querySelectorAll('.dt-env').length,
             color: cs.color, bgOfCard: getComputedStyle(r.querySelector('.dt-kpi')||r).backgroundColor };
  });
  await page.screenshot({ path: `${OUT}/dt-${theme}-1-dashboard.png` }).catch(()=>{});

  // Aba Tabelas
  await page.click('.dt-tab[data-tab="tables"]').catch(()=>{});
  await page.waitForTimeout(2500);
  const tables = await page.evaluate(() => {
    const r = document.querySelector('.dt-root'); if(!r) return {};
    return { rows: r.querySelectorAll('.dt-table tbody tr').length,
             pager: (r.querySelector('.dt-pager span')||{}).textContent,
             firstRow: [...(r.querySelectorAll('.dt-table tbody tr')[0]||{cells:[]}).cells||[]].slice(0,4).map(c=>c.textContent.trim()) };
  });
  await page.screenshot({ path: `${OUT}/dt-${theme}-2-tabelas.png` }).catch(()=>{});

  // Ordenar por tamanho
  await page.click('th[data-col="size_bytes"]').catch(()=>{});
  await page.waitForTimeout(2000);
  const sorted = await page.evaluate(() => {
    const rows=[...document.querySelectorAll('.dt-table tbody tr')].slice(0,3);
    return rows.map(r=>[...r.cells].slice(0,4).map(c=>c.textContent.trim()).join(' | '));
  });

  // Aba Campos sensíveis
  await page.click('.dt-tab[data-tab="sensitive"]').catch(()=>{});
  await page.waitForTimeout(2000);
  const sens = await page.evaluate(() => ({
    rows: document.querySelectorAll('.dt-table tbody tr').length,
    weak: document.querySelectorAll('.dt-badge--weak').length,
    note: !!document.querySelector('.dt-note') }));
  await page.screenshot({ path: `${OUT}/dt-${theme}-3-sensiveis.png` }).catch(()=>{});

  // Aba Qualidade
  await page.click('.dt-tab[data-tab="quality"]').catch(()=>{});
  await page.waitForTimeout(2400);
  const quality = await page.evaluate(() => ({
    rows: document.querySelectorAll('.dt-table tbody tr').length,
    kpis: [...document.querySelectorAll('.dt-kpi')].map(k=>((k.querySelector('.dt-kpi__label')||{}).textContent||'')+'='+((k.querySelector('.dt-kpi__value')||{}).textContent||'')),
    scores: [...document.querySelectorAll('.dt-env')].map(e=>e.textContent.replace(/\s+/g,' ').trim()) }));
  await page.screenshot({ path: `${OUT}/dt-${theme}-6-qualidade.png` }).catch(()=>{});

  // Aba Integracoes
  await page.click('.dt-tab[data-tab="sources"]').catch(()=>{});
  await page.waitForTimeout(1800);
  const sources = await page.evaluate(() => ({
    rows: document.querySelectorAll('.dt-table tbody tr').length,
    empty: (document.querySelector('.dt-state')||{}).textContent||'' }));
  await page.screenshot({ path: `${OUT}/dt-${theme}-7-integracoes.png` }).catch(()=>{});

  // Aba Alertas
  await page.click('.dt-tab[data-tab="alerts"]').catch(()=>{});
  await page.waitForTimeout(2200);
  const alerts = await page.evaluate(() => ({
    rows: document.querySelectorAll('.dt-table tbody tr').length,
    kpis: [...document.querySelectorAll('.dt-kpi')].map(k=>((k.querySelector('.dt-kpi__label')||{}).textContent||'')+'='+((k.querySelector('.dt-kpi__value')||{}).textContent||'')),
    note: !!document.querySelector('.dt-note') }));
  await page.screenshot({ path: `${OUT}/dt-${theme}-5-alertas.png` }).catch(()=>{});

  // Busca global
  await page.click('.dt-tab[data-tab="search"]').catch(()=>{});
  await page.waitForTimeout(1200);
  await page.fill('[data-dt-q]', 'email').catch(()=>{});
  await page.click('[data-dt-go]').catch(()=>{});
  await page.waitForTimeout(2200);
  const search = await page.evaluate(() => ({
    sections: document.querySelectorAll('.dt-section__title').length,
    rows: document.querySelectorAll('.dt-table tbody tr').length }));
  await page.screenshot({ path: `${OUT}/dt-${theme}-4-busca.png` }).catch(()=>{});

  await ctx.close();
  return { theme, dash, tables, sorted, sens, quality, sources, alerts, search, errors: errors.slice(0,6), apiCalls: [...new Set(apiCalls)].slice(0,10) };
}

const dark = await run('dark');
const light = await run('light');
await browser.close();
console.log(JSON.stringify({ dark, light }, null, 2));
