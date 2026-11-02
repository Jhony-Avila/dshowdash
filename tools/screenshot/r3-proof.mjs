import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const DIR = '/tmp/claude-0/-root/37e388f6-21e8-479a-8539-85c52043cb4c/scratchpad/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);
const setTheme = async (t) => { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 3 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(600); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } };

const sweep = () => page.evaluate(() => {
  const parse = s => { const m = s && s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a) });
  const th = document.documentElement.getAttribute('data-theme');
  const base = th === 'light' ? { r: 250, g: 250, b: 250 } : { r: 0, g: 0, b: 0 };
  const effBg = el => { const L = []; let n = el; while (n && n !== document.documentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0.01) { L.push(c); if (c.a >= 0.999) break; } n = n.parentElement; } let b = { ...base }; for (let i = L.length - 1; i >= 0; i--) b = over(L[i], b); return b; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const L1 = lum(a), L2 = lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  const sel = el => { let s = el.tagName.toLowerCase(); if (typeof el.className === 'string' && el.className.trim()) s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); return s.slice(0, 60); };
  const regions = ['.site-header', '.navrail', '.nav-rail', '.dsd-sidebar', '.news-ticker-component', '.dsd-container__header', '.dsd-footer', '[class*="footer"]', '.user-menu-dropdown-portal', '[class*="dropdown-portal"]', '[role="menu"]', '[class*="popover"]', '[role="tooltip"]'];
  const roots = []; regions.forEach(r => document.querySelectorAll(r).forEach(e => roots.push(e)));
  const seen = new Set(), out = [];
  for (const root of roots) for (const el of root.querySelectorAll('*')) {
    if (seen.has(el)) continue; seen.add(el);
    if (el.closest('canvas, iframe, [class*="weather"], [class*="panel-home"]')) continue;
    if (!Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const st = getComputedStyle(el), r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || st.visibility === 'hidden' || +st.opacity < 0.1) continue;
    const fg = parse(st.color); if (!fg || fg.a < 0.1) continue;
    const bg = effBg(el), rt = ratio(over(fg, bg), bg);
    if (rt < 3) out.push({ sel: sel(el), text: el.textContent.trim().slice(0, 20), ratio: +rt.toFixed(2) });
  }
  return out.sort((a, b) => a.ratio - b.ratio);
});

// LIGHT + abre o menu do usuário
await setTheme('light'); await page.waitForTimeout(400);
let opened = false;
for (const s of ['.user-menu-trigger', '.user-menu-component', '.user-avatar', '[class*="user-menu"]']) {
  const el = page.locator(s).first();
  if (await el.count() && await el.isVisible().catch(() => false)) { await el.click().catch(() => {}); opened = true; break; }
}
await page.waitForTimeout(900);
await page.screenshot({ path: DIR + 'r3-light-menu.png' });
const menuInfo = await page.evaluate(() => { const d = document.querySelector('.user-menu-dropdown-portal'); return d ? { present: true, bg: getComputedStyle(d).backgroundColor, item: (()=>{const i=d.querySelector('.dropdown-item');return i?getComputedStyle(i).color:'n/a';})() } : { present: false }; });
const surf = await page.evaluate(() => { const g=s=>{const e=document.querySelector(s);return e?getComputedStyle(e).backgroundColor:'n/a';}; return { railBg: g('.nav-rail,.navrail'), footerChip: g('.footer-icon-host') }; });
const badLightMenu = await sweep();
// fecha menu
await page.keyboard.press('Escape').catch(() => {});
await page.mouse.click(700, 400).catch(() => {});
await page.waitForTimeout(300);

// DARK screenshot
await setTheme('dark'); await page.waitForTimeout(400);
await page.screenshot({ path: DIR + 'r3-dark.png' });
const darkBody = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

// stress
await setTheme('light');
for (let i = 0; i < 5; i++) { await page.click('[data-dsd-theme-toggle]', { timeout: 2000 }).catch(() => {}); }
let responsive = true, timerMs = -1;
try { timerMs = await Promise.race([page.evaluate(() => new Promise(r => { const t0 = performance.now(); setTimeout(() => r(performance.now() - t0), 100); })), new Promise((_, j) => setTimeout(() => j(1), 4000))]); } catch { responsive = false; }

await browser.close();
console.log(JSON.stringify({ menuOpened: opened, menuInfo, surfaces: surf, badLightMenuCount: badLightMenu.length, badSample: badLightMenu.slice(0, 12), darkBody, stress: { responsive, timerMs: Math.round(timerMs) } }, null, 2));
