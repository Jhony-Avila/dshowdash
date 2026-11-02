// VARREDURA DE CONTRASTE — percorre textos visíveis do chrome, calcula ratio efetivo, lista <3:1.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const THEME = process.env.SWEEP_THEME || 'light';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);
// set theme
let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
for (let i = 0; i < 3 && c !== THEME; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(600); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
await page.waitForTimeout(500);

const bad = await page.evaluate((theme) => {
  const parse = s => { const m = s && s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) });
  const base = theme === 'light' ? { r: 250, g: 250, b: 250 } : { r: 0, g: 0, b: 0 };
  const effBg = el => { const layers = []; let n = el; while (n && n !== document.documentElement) { const col = parse(getComputedStyle(n).backgroundColor); if (col && col.a > 0.01) { layers.push(col); if (col.a >= 0.999) break; } n = n.parentElement; } let b = { ...base }; for (let i = layers.length - 1; i >= 0; i--) b = over(layers[i], b); return b; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const L1 = lum(a), L2 = lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  const sel = el => { let s = el.tagName.toLowerCase(); if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); return s.slice(0, 60); };
  const regions = ['.site-header', '.navrail', '.nav-rail', '.dsd-sidebar', '.sidebar', '.news-ticker-component', '.dsd-container__header', '.features-toolbar', '.dsd-footer', '[class*="footer"]'];
  const roots = []; regions.forEach(r => document.querySelectorAll(r).forEach(e => roots.push(e)));
  const seen = new Set(), out = [];
  for (const root of roots) {
    for (const el of root.querySelectorAll('*')) {
      if (seen.has(el)) continue; seen.add(el);
      if (el.closest('canvas, iframe, [class*="weather"], [class*="panel-home"]')) continue;
      const hasText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
      if (!hasText) continue;
      const st = getComputedStyle(el); const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || st.visibility === 'hidden' || st.display === 'none' || parseFloat(st.opacity) < 0.1) continue;
      const fg = parse(st.color); if (!fg || fg.a < 0.1) continue;
      const bg = effBg(el); const rt = ratio(over(fg, bg), bg);
      if (rt < 3) out.push({ sel: sel(el), text: el.textContent.trim().slice(0, 24), color: st.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, ratio: +rt.toFixed(2) });
    }
  }
  out.sort((a, b) => a.ratio - b.ratio);
  return out;
}, THEME);

await browser.close();
console.log(JSON.stringify({ theme: THEME, badPairsCount: bad.length, pairs: bad.slice(0, 40) }, null, 2));
