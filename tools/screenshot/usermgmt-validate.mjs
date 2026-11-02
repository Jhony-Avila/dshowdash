import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/d641198f-64da-4c9b-bc01-71cbb2c0a93a/scratchpad';
const URL = 'https://dshowdash.com.br/';

async function run(theme) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch(e){} }, theme);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0,160)); });
  page.on('pageerror', (e) => errors.push('PAGEERR: ' + e.message));
  const R = { theme };
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await page.waitForTimeout(3500);
    if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(3000); }

    // 1) Clicar no item da sidebar
    await page.evaluate(() => { location.hash = '#/'; });
    await page.waitForTimeout(1200);
    R.clicked = await page.evaluate(() => {
      const li = Array.from(document.querySelectorAll('.dsd-sidebar__item')).find(x => /usu[aá]rio/i.test(x.textContent));
      if (!li) return 'NAO-ACHOU';
      (li.querySelector('a')||li).click();
      return 'href=' + (li.querySelector('a')?.getAttribute('href')||'?');
    });
    await page.waitForTimeout(4500);
    R.afterClick = await page.evaluate(() => {
      const pum = document.querySelector('.panel-user-management,[data-module-id*="user-management"]');
      const title = document.querySelector('.dsd-container__title')?.textContent?.trim();
      return { hash: location.hash, hasPUM: !!pum, title, rows: document.querySelectorAll('[data-user-id],[class*="user-card"],[class*="user-row"]').length };
    });
    await page.screenshot({ path: `${OUT}/uv-${theme}-users.png` });

    // artefato visual: bbox do item na sidebar
    R.iconArtifact = await page.evaluate(() => {
      const li = Array.from(document.querySelectorAll('.dsd-sidebar__item')).find(x => /usu[aá]rio/i.test(x.textContent));
      if (!li) return null;
      const icon = li.querySelector('.dsd-sidebar__item-icon');
      const svg = icon?.querySelector('svg');
      return { dataIcon: icon?.getAttribute('data-icon'), hasSvg: !!svg, svgViewBox: svg?.getAttribute('viewBox')||null, iconHTML: (icon?.innerHTML||'').slice(0,60) };
    });

    // 2) Regressão: Gestão de Sessões
    R.session = await page.evaluate(() => {
      const li = Array.from(document.querySelectorAll('.dsd-sidebar__item')).find(x => /sess[õo]es/i.test(x.textContent));
      if (!li) return 'NAO-ACHOU';
      (li.querySelector('a')||li).click();
      return 'ok';
    });
    await page.waitForTimeout(3500);
    R.afterSession = await page.evaluate(() => ({ hash: location.hash, hasPSA: !!document.querySelector('.psa,[data-module-id*="session-admin"]'), title: document.querySelector('.dsd-container__title')?.textContent?.trim() }));

    // 3) Volta para Usuários
    await page.evaluate(() => {
      const li = Array.from(document.querySelectorAll('.dsd-sidebar__item')).find(x => /usu[aá]rio/i.test(x.textContent));
      (li?.querySelector('a')||li)?.click();
    });
    await page.waitForTimeout(3500);
    R.backToUsers = await page.evaluate(() => ({ hash: location.hash, hasPUM: !!document.querySelector('.panel-user-management,[data-module-id*="user-management"]') }));

    R.errors = errors.slice(0,10);
  } catch (e) {
    R.fail = e.message;
    await page.screenshot({ path: `${OUT}/uv-${theme}-fail.png` }).catch(()=>{});
  } finally { await browser.close(); }
  return R;
}

const dark = await run('dark');
console.log('DARK:', JSON.stringify(dark, null, 1));
const light = await run('light');
console.log('LIGHT:', JSON.stringify(light, null, 1));
