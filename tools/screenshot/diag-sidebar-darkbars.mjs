// READ-ONLY (Fase 1) — varredura AMPLA: qualquer elemento/pseudo ESCURO ou em forma de BARRA
// em TODA a sidebar (não só o item ativo). DSD_THEME, ALVO opcionais.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const ALVO = process.env.ALVO || 'Gest';
const THEME = process.env.DSD_THEME || 'light';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1.5 });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch (e) {} }, THEME);
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2000);
await page.evaluate(() => document.querySelectorAll('.dsd-sidebar__group-button').forEach(b => { try { b.click(); } catch (e) {} }));
await page.waitForTimeout(700);
await page.evaluate((alvo) => {
  const el = [...document.querySelectorAll('.dsd-sidebar__link')].find(x => new RegExp(alvo, 'i').test(x.textContent || ''));
  if (el) el.click();
}, ALVO);
await page.waitForTimeout(800);

const res = await page.evaluate(() => {
  const darkSolid = c => { const m = (c || '').match(/[\d.]+/g); if (!m) return false; const [R, G, B, A = '1'] = m; return +R < 85 && +G < 85 && +B < 85 && +A > 0.35; };
  // gradiente com PELO MENOS UM stop escuro de alpha real (>0.35)
  const darkGradVisible = s => {
    if (!s || s === 'none') return false;
    const stops = s.match(/rgba?\([^)]*\)/g) || [];
    return stops.some(st => { const m = st.match(/[\d.]+/g); if (!m) return false; const [R, G, B, A = '1'] = m; return +R < 85 && +G < 85 && +B < 85 && +A > 0.35; });
  };
  const visible = (el, cs) => {
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    if (parseFloat(cs.opacity) < 0.05) return false;
    // pseudo/elemento sem tamanho não pinta
    return true;
  };
  const hits = [];
  const push = (el, ps) => {
    const cs = getComputedStyle(el, ps);
    if (!visible(el, cs)) return;
    // opacidade efetiva: se pseudo herdando opacity do host, checar host tb
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 1) return;
    const darkBg = darkSolid(cs.backgroundColor);
    const darkTop = darkSolid(cs.borderTopColor) && cs.borderTopWidth !== '0px';
    const darkBottom = darkSolid(cs.borderBottomColor) && cs.borderBottomWidth !== '0px';
    const darkGradient = darkGradVisible(cs.backgroundImage);
    const barLike = r.width > 40 && r.height > 0 && r.height <= 8;
    if (darkBg || darkTop || darkBottom || darkGradient || (barLike && darkBg)) {
      hits.push({
        sel: (el.className || el.tagName).toString().slice(0, 55) + (ps || ''),
        y: Math.round(r.y), h: Math.round(r.height), w: Math.round(r.width),
        opacity: cs.opacity,
        bg: darkBg ? cs.backgroundColor : undefined,
        bTop: darkTop ? `${cs.borderTopWidth} ${cs.borderTopColor}` : undefined,
        bBot: darkBottom ? `${cs.borderBottomWidth} ${cs.borderBottomColor}` : undefined,
        bgImg: darkGradient ? cs.backgroundImage.slice(0, 80) : undefined,
        content: ps ? cs.content : undefined,
      });
    }
  };
  document.querySelectorAll('.dsd-sidebar, .dsd-sidebar *').forEach(el => { push(el); push(el, '::before'); push(el, '::after'); });
  hits.sort((a, b) => a.y - b.y);
  return hits;
});
console.log('THEME', THEME, 'ALVO', ALVO, '— total escuros/barras:', res.length);
console.log(JSON.stringify(res, null, 2));
await browser.close();
