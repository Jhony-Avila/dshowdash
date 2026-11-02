// valida-dt-infra-17.mjs — confirma a organização dos 17 na Infraestrutura.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/eae0bef0-6629-4ab1-8ef8-4e2b9338a6aa/scratchpad';

const cookies = await getSessionCookies();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'] });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, colorScheme: 'dark', serviceWorkers: 'block', ignoreHTTPSErrors: true });
await ctx.addCookies(cookies);
await ctx.addInitScript(() => { try { localStorage.setItem('cm_theme', 'dark'); localStorage.setItem('dt_force_impl', 'react'); } catch (e) {} });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 140)));

const goto = async (h) => {
  await page.goto('https://dshowdash.com.br/' + h, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2600);
  if (await isLoginPage(page)) { await loginViaPage(page).catch(() => {}); await page.goto('https://dshowdash.com.br/' + h).catch(() => {}); await page.waitForTimeout(2600); }
  await page.waitForSelector('[data-dt-react-root]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2200);
};

for (const [id, hash] of [['servidores', '#/panel-datatables/infrastructure/servers'], ['conexoes', '#/panel-datatables/infrastructure/connections']]) {
  await goto(hash);
  await page.screenshot({ path: `${OUT}/infra17-${id}.png`, fullPage: true }).catch(() => {});
}

// mede: o servidor displaysolutions aparece? quantos cards de conexão com badge de ambiente?
const info = await page.evaluate(() => {
  const txt = document.querySelector('[data-dt-react-root]')?.innerText || '';
  return { temDisplaySolutions: txt.includes('displaysolutions'), amostra: txt.slice(0, 200) };
});
console.log(JSON.stringify({ info, errosJs: errors }, null, 2));
await browser.close();
