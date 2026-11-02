// READ-ONLY inventário: navega painéis reais no LIGHT, mede bg do container + textos, classifica.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const DIR = '/tmp/claude-0/-root/37e388f6-21e8-479a-8539-85c52043cb4c/scratchpad/';
const TARGETS = [ // {group, label} — painéis reais (não-stub)
  { g: null, l: 'Geral', panel: 'panel-dashboard' },
  { g: 'Comercial', l: 'Orcamentos', panel: 'panel-06' },
  { g: 'Compras', l: 'Compras', panel: 'panel-01' },
  { g: 'Administracao', l: 'Navegacao', panel: 'panel-nav-admin' },
  { g: 'Administracao', l: 'Gestao Sessoes', panel: 'panel-session-admin' },
  { g: 'Administracao', l: 'Auditoria', panel: 'panel-audit-trail' },
  { g: 'Administracao', l: 'Gestao Paineis', panel: 'panel-gestao-paineis' },
  { g: 'Administracao', l: 'UI Orchestrator', panel: 'panel-orchestrator-manager' },
  { g: 'Administracao', l: 'Gestao Usuarios', panel: 'panel-user-management' },
  { g: 'Automacoes', l: 'Instagram', panel: 'panel-17' },
  { g: 'Dashboards', l: 'Dash Servidores', panel: 'panel-observability' },
  { g: 'Comercial', l: 'Leads', panel: 'panel-stub-dev(amostra)' },
];
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text().slice(0, 160)); });
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);
// LIGHT
let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
for (let i = 0; i < 3 && c !== 'light'; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(650); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
// expande grupos
for (const g of ['Comercial', 'Compras', 'Administracao', 'Dashboards']) { const b = page.locator(`.dsd-sidebar__group-button:has-text("${g}"), .dsd-sidebar__group-title:has-text("${g}")`).first(); if (await b.count()) { await b.click().catch(() => {}); await page.waitForTimeout(300); } }
await page.waitForTimeout(500);

const measurePanel = () => page.evaluate(() => {
  const parse = s => { const m = s && s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const lum = c => c ? (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) : null;
  const content = document.querySelector('.dsd-container__content, .dsd-container__body') || document.querySelector('.main-content');
  if (!content) return { err: 'no-content' };
  // maior elemento-filho (o "card" do painel)
  const kids = Array.from(content.querySelectorAll('*')).filter(e => { const r = e.getBoundingClientRect(); return r.width > 300 && r.height > 100; });
  let panelBg = null, panelEl = null;
  for (const e of kids) { const bg = parse(getComputedStyle(e).backgroundColor); if (bg && bg.a > 0.5) { panelBg = bg; panelEl = e; break; } }
  // textos visíveis
  const texts = Array.from(content.querySelectorAll('h1,h2,h3,h4,p,span,div,td,label,strong')).filter(e => Array.from(e.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 1));
  const textLums = texts.slice(0, 60).map(e => ({ t: e.textContent.trim().slice(0, 18), l: lum(parse(getComputedStyle(e).color)) })).filter(x => x.l !== null);
  const whiteTexts = textLums.filter(x => x.l > 180).length;
  const darkTexts = textLums.filter(x => x.l < 90).length;
  return {
    contentBg: getComputedStyle(content).backgroundColor,
    panelBg: panelBg ? `rgb(${Math.round(panelBg.r)},${Math.round(panelBg.g)},${Math.round(panelBg.b)})` : 'transparent/none',
    panelBgLum: panelBg ? Math.round(lum(panelBg)) : null,
    textSamples: textLums.length, whiteTexts, darkTexts,
    sample2: textLums.slice(0, 2),
  };
});

const results = [];
for (const t of TARGETS) {
  errors.length = 0;
  const link = page.locator(`.dsd-sidebar__link:has-text("${t.l}"), .dsd-sidebar__item:has-text("${t.l}")`).first();
  let clicked = false;
  if (await link.count()) { await link.click().catch(() => {}); clicked = true; await page.waitForTimeout(2500); }
  const m = clicked ? await measurePanel() : { err: 'nav-not-found' };
  // classificação
  let cls = 'OK';
  if (m.err) cls = 'ERRO/' + m.err;
  else if (m.panelBgLum !== null && m.panelBgLum < 70) cls = 'S1-dark-completo';
  else if (m.whiteTexts > 0) cls = 'S2-misto-texto-branco';
  results.push({ panel: t.panel, label: t.l, group: t.g, class: cls, ...m, errs: errors.slice(0, 2) });
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
