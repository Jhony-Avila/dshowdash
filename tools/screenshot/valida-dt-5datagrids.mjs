// valida-dt-5datagrids.mjs — screenshots das 5 telas convertidas em DataGrid.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/eae0bef0-6629-4ab1-8ef8-4e2b9338a6aa/scratchpad';
const TELAS = [
  ['conexoes', '#/panel-datatables/infrastructure/connections'],
  ['servidores', '#/panel-datatables/infrastructure/servers'],
  ['integracoes', '#/panel-datatables/sources/integrations'],
  ['manutencoes', '#/panel-datatables/observability/maintenance'],
  ['busca', '#/panel-datatables/data/search'],
];
const cookies = await getSessionCookies();

async function rodar(tema) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, colorScheme: tema, serviceWorkers: 'block', ignoreHTTPSErrors: true });
  await ctx.addCookies(cookies);
  await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); localStorage.setItem('dt_force_impl', 'react'); } catch (e) {} }, tema);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  const goto = async (h) => {
    await page.goto('https://dshowdash.com.br/' + h, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2400);
    if (await isLoginPage(page)) { await loginViaPage(page).catch(() => {}); await page.goto('https://dshowdash.com.br/' + h).catch(() => {}); await page.waitForTimeout(2400); }
    await page.waitForSelector('[data-dt-react-root]', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1800);
  };
  const res = [];
  for (const [id, hash] of TELAS) {
    await goto(hash);
    if (id === 'busca') { await page.fill('input[type="search"]', 'a').catch(() => {}); await page.fill('input[type="search"]', 'us').catch(() => {}); await page.waitForTimeout(1800); }
    const m = await page.evaluate(() => {
      const root = document.querySelector('[data-dt-react-root]');
      const grids = root ? root.querySelectorAll('[role="table"]').length : 0;
      const rows = root ? root.querySelectorAll('[role="row"]').length : 0;
      const headersOrd = root ? root.querySelectorAll('[role="columnheader"][tabindex="0"]').length : 0;
      return { grids, rows, headersOrd };
    });
    await page.screenshot({ path: `${OUT}/dg-${tema}-${id}.png` }).catch(() => {});
    res.push({ id, tema, ...m });
  }
  await browser.close();
  return { tema, res, errosJs: errors };
}

const dark = await rodar('dark');
const light = await rodar('light');
[...dark.res, ...light.res].forEach(r => console.log(`${r.tema.padEnd(5)} ${r.id.padEnd(12)} grids=${r.grids} rows=${r.rows} headersOrdenaveis=${r.headersOrd}`));
console.log('errosJs dark :', JSON.stringify(dark.errosJs));
console.log('errosJs light:', JSON.stringify(light.errosJs));
