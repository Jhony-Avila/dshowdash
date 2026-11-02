// READ-ONLY: mede cor computada dos ícones de ITEM vs GRUPO da sidebar em dark e light.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);

// expandir grupos Comercial, Compras, Recebimento (clica nos cabeçalhos)
for (const g of ['Comercial', 'Compras', 'Recebimento']) {
  const b = page.locator(`.dsd-sidebar__group-button:has-text("${g}"), .dsd-sidebar__group-title:has-text("${g}")`).first();
  if (await b.count()) { await b.click().catch(() => {}); await page.waitForTimeout(400); }
}
await page.waitForTimeout(800);

const setTheme = async (t) => { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 3 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } };

const measure = () => page.evaluate(() => {
  const out = { theme: document.documentElement.getAttribute('data-theme') };
  const sb = document.querySelector('.dsd-sidebar');
  out.resolved_icon_default = sb ? getComputedStyle(sb).getPropertyValue('--sidebar-icon-default').trim() : 'n/a';
  out.resolved_text_muted = sb ? getComputedStyle(sb).getPropertyValue('--sidebar-text-muted').trim() : 'n/a';
  const itemColorByText = (txt) => {
    const items = Array.from(document.querySelectorAll('.dsd-sidebar__link, .dsd-sidebar__item'));
    const it = items.find(el => (el.textContent || '').trim().toLowerCase().includes(txt.toLowerCase()));
    if (!it) return 'not-found';
    const ic = it.querySelector('.dsd-sidebar__item-icon'); if (!ic) return 'no-icon';
    const cs = getComputedStyle(ic); const svg = ic.querySelector('svg');
    return { color: cs.color, opacity: cs.opacity, svgColor: svg ? getComputedStyle(svg).color : 'n/a', svgStroke: svg ? getComputedStyle(svg).stroke : 'n/a', svgFill: svg ? getComputedStyle(svg).fill : 'n/a' };
  };
  out.item_Leads = itemColorByText('Leads');
  out.item_Cotacoes = itemColorByText('Cota');
  out.item_EntradaEstoque = itemColorByText('Entrada');
  // grupo Comercial
  const grp = Array.from(document.querySelectorAll('.dsd-sidebar__group-button, .dsd-sidebar__group')).find(el => (el.textContent || '').includes('Comercial'));
  const gi = grp ? grp.querySelector('.dsd-sidebar__group-icon') : null;
  out.group_Comercial = gi ? { color: getComputedStyle(gi).color } : 'n/a';
  return out;
});

await setTheme('dark'); await page.waitForTimeout(400);
const dark = await measure();
await setTheme('light'); await page.waitForTimeout(400);
const light = await measure();
await browser.close();
console.log(JSON.stringify({ dark, light }, null, 2));
