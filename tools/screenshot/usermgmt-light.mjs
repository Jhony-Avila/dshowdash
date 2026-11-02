import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/d641198f-64da-4c9b-bc01-71cbb2c0a93a/scratchpad';
const URL = 'https://dshowdash.com.br/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
await ctx.addInitScript(() => { try { localStorage.setItem('cm_theme','light'); } catch(e){} });
const page = await ctx.newPage();
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3500);
  if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(3000); }

  let theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log('theme inicial:', theme);
  if (theme !== 'light') {
    // tenta clicar num toggle de tema
    const clicked = await page.evaluate(() => {
      const cands = ['[data-theme-toggle]','[data-action="toggle-theme"]','[aria-label*="tema" i]','[title*="tema" i]','.theme-toggle','[class*="theme-toggle"]'];
      for (const s of cands) { const el = document.querySelector(s); if (el) { el.click(); return s; } }
      return null;
    });
    console.log('toggle clicado:', clicked);
    await page.waitForTimeout(1500);
    // fallback: força via API do theme manager se existir
    await page.evaluate(() => { try { localStorage.setItem('cm_theme','light'); (window.ThemeManager?.setTheme||window.themeManager?.setTheme||function(){}).call(window.ThemeManager||window.themeManager||window,'light'); document.documentElement.setAttribute('data-theme','light'); } catch(e){} });
    await page.waitForTimeout(1000);
    theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log('theme apos toggle:', theme);
  }

  await page.evaluate(() => {
    const li = Array.from(document.querySelectorAll('.dsd-sidebar__item')).find(x => /usu[aá]rio/i.test(x.textContent));
    (li?.querySelector('a')||li)?.click();
  });
  await page.waitForTimeout(5000);
  const st = await page.evaluate(() => {
    const pum = document.querySelector('.panel-user-management,[data-module-id*="user-management"]');
    const cs = pum ? getComputedStyle(pum) : null;
    return { dataTheme: document.documentElement.getAttribute('data-theme'), hasPUM: !!pum, bg: cs?.backgroundColor, color: cs?.color, rows: document.querySelectorAll('[data-user-id],[class*="user-card"],[class*="user-row"]').length };
  });
  console.log('ESTADO:', JSON.stringify(st));
  await page.screenshot({ path: `${OUT}/uv-light-real.png` });
} catch (e) { console.log('FAIL', e.message); } finally { await browser.close(); }
