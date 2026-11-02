// READ-ONLY: varredura de contraste por BLOCO nos painéis (LIGHT). Flag: contraste<4.5 ou bg-dark no light.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const DIR = '/tmp/claude-0/-root/37e388f6-21e8-479a-8539-85c52043cb4c/scratchpad/';
const TARGETS = [ // {group,label,panel}
  { g: 'Administracao', l: 'Navegacao', panel: 'panel-nav-admin' },
  { g: 'Administracao', l: 'Auditoria', panel: 'panel-audit-trail' },
  { g: 'Compras', l: 'Compras', panel: 'panel-01' },
];
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);
let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
for (let i = 0; i < 3 && c !== 'light'; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(650); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
for (const g of ['Administracao', 'Compras']) { const b = page.locator(`.dsd-sidebar__group-button:has-text("${g}")`).first(); if (await b.count()) { await b.click().catch(() => {}); await page.waitForTimeout(300); } }
await page.waitForTimeout(500);

const scan = () => page.evaluate(() => {
  const parse = s => { const m = s && s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a) });
  const base = { r: 250, g: 250, b: 250 };
  const effBg = el => { const L = []; let n = el; while (n && n !== document.documentElement) { const col = parse(getComputedStyle(n).backgroundColor); if (col && col.a > 0.01) { L.push(col); if (col.a >= 0.999) break; } n = n.parentElement; } let b = { ...base }; for (let i = L.length - 1; i >= 0; i--) b = over(L[i], b); return b; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const L1 = lum(a), L2 = lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  const sel = el => { let s = el.tagName.toLowerCase(); if (typeof el.className === 'string' && el.className.trim()) s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); return s.slice(0, 48); };
  const content = document.querySelector('.dsd-container__content') || document.querySelector('.main-content');
  if (!content) return { err: 'no-content' };
  const lowContrast = [], darkResidue = [], seen = new Set();
  for (const el of content.querySelectorAll('*')) {
    const st = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || st.visibility === 'hidden' || +st.opacity < 0.1) continue;
    // dark residue: elemento grande com bg escuro OPACO no light
    const ownBg = parse(st.backgroundColor);
    if (ownBg && ownBg.a > 0.6 && r.width > 120 && r.height > 24 && lum(ownBg) < 0.30) { const k = 'D' + sel(el); if (!seen.has(k)) { seen.add(k); darkResidue.push({ sel: sel(el), bg: `rgb(${Math.round(ownBg.r)},${Math.round(ownBg.g)},${Math.round(ownBg.b)})`, lum: +lum(ownBg).toFixed(2), w: Math.round(r.width) }); } }
    // low contrast text
    const hasText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (hasText) { const fg = parse(st.color); if (fg && fg.a > 0.1) { const bg = effBg(el); const rt = ratio(over(fg, bg), bg); if (rt < 4.5) { const k = 'L' + sel(el) + Math.round(rt * 10); if (!seen.has(k)) { seen.add(k); lowContrast.push({ sel: sel(el), text: el.textContent.trim().slice(0, 16), color: st.color, ratio: +rt.toFixed(2) }); } } } }
  }
  return { darkResidue: darkResidue.slice(0, 15), lowContrastCount: lowContrast.length, lowContrast: lowContrast.sort((a, b) => a.ratio - b.ratio).slice(0, 15) };
});

const out = {};
for (const t of TARGETS) {
  const link = page.locator(`.dsd-sidebar__link:has-text("${t.l}")`).first();
  if (await link.count()) { await link.click().catch(() => {}); await page.waitForTimeout(3000); }
  out[t.panel] = await scan();
  await page.screenshot({ path: DIR + 'scan-' + t.panel + '-light.png' });
}
await browser.close();
console.log(JSON.stringify(out, null, 2));
