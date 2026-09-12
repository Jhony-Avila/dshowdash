// scripts/panels/smoke-lotties.mjs — smoke REAL do panel-lotties-management no shell autenticado (preview do worktree ou
// produção): rota canônica pelo router (#/panel-lotties-management e aliases #/lotties, #/animacoes), estado pronto com
// os itens do catálogo canônico (/assets/animacoes/index.js → info().availableAnimations), arquivos 200 na origem
// /assets/animacoes/, preview abre (svg do lottie-web) e fecha por Esc, unmount ao navegar para outro painel (sem
// listeners/assinaturas/instância sobrando), remount, desktop × mobile, tema claro × escuro, 0 pageerror e 0 erro de
// console do painel. Exit 1 se algum gate falhar.
// Uso: PREVIEW_BASE=http://127.0.0.1:8904 node scripts/panels/smoke-lotties.mjs --out <dir>
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const TOOLS = process.env.MH2_TOOLS || '/var/www/dshowdash/tools/screenshot';
const pkg = (await import(TOOLS + '/node_modules/playwright/index.js')).default;
const { isLoginPage, loginViaPage } = await import(TOOLS + '/auth.mjs');
const { chromium } = pkg;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] ?? true) : d; };
const OUT = resolve(String(opt('out', '/tmp/smoke-lotties'))); mkdirSync(OUT, { recursive: true });
const BASE = process.env.PREVIEW_BASE || 'http://127.0.0.1:8904';
const PANEL = 'panel-lotties-management';
const gates = []; const G = (nome, ok, det) => { gates.push(`${ok ? 'PASS' : 'FAIL'} ${nome} — ${det}`); return ok; };
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1, MAP www.dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
let cookies = null;
const SCEN = [['1440x900', 'dark'], ['1440x900', 'light'], ['390x844', 'dark'], ['390x844', 'light']];
const results = [];
for (const [vp, theme] of SCEN) {
  const [w, h] = vp.split('x').map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, ignoreHTTPSErrors: true });
  if (cookies) await ctx.addCookies(cookies);
  await ctx.addInitScript((theme) => { try { localStorage.setItem('cm_theme', theme); localStorage.setItem('dshowdash_theme_prefs', JSON.stringify({ theme, density: 'comfortable' })); localStorage.removeItem('lotties-assignments'); } catch {} }, theme);
  const page = await ctx.newPage();
  const perr = []; const cerr = []; const notFound = [];
  page.on('pageerror', (e) => perr.push(String(e && e.message || e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') cerr.push(m.text().slice(0, 200)); });
  page.on('response', (r) => { if (r.status() >= 400 && /lotties|animacoes/.test(r.url())) notFound.push(r.status() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '')); });
  const r = { vp, theme };
  try {
    await page.goto(BASE + '/#/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const chegou = await Promise.race([page.waitForSelector('.site-header', { timeout: 25000 }).then(() => 'shell').catch(() => null), page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 25000 }).then(() => 'login').catch(() => null)]);
    if (chegou === 'login' || ((await isLoginPage(page)) && await page.isVisible('input[type="password"]').catch(() => false))) { await loginViaPage(page); try { cookies = await ctx.cookies(); } catch {} }
    await page.waitForSelector('[data-region="main"]', { timeout: 30000 }); await page.waitForSelector('.preloader-container', { state: 'hidden', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000); perr.length = 0; cerr.length = 0;
    r.themeGot = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    // catálogo canônico (verdade do servidor)
    r.catalogo = await page.evaluate(async () => { const m = await import('/assets/animacoes/index.js'); const i = (m.info ? m : m.default).info(); return Object.keys(i.availableAnimations || {}); });
    // 1) mount pela rota canônica
    await page.evaluate(() => { location.hash = '#/panel-lotties-management'; });
    r.mounted = await page.waitForSelector('.lotties-panel[data-state="pronto"], .lotties-panel[data-state="vazio"], .lotties-panel[data-state="erro"]', { timeout: 30000 }).then(() => true).catch(() => false);
    r.state = await page.evaluate(() => document.querySelector('.lotties-panel')?.getAttribute('data-state') || null);
    r.cards = await page.evaluate(() => document.querySelectorAll('.lottie-card').length);
    r.missing = await page.evaluate(() => document.querySelectorAll('.lottie-card.is-missing').length);
    r.rows = await page.evaluate(() => document.querySelectorAll('.component-row').length);
    r.overflowX = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
    r.status1 = await page.evaluate(async () => { const m = await import('/components/panels/panel-lotties-management/index.js'); const s = m.getStatus(); return { init: s.initialized, mountCount: s.metrics.mountCount, unmountCount: s.metrics.unmountCount, catalogo: s.catalogo, health: m.healthCheck().status }; });
    await page.screenshot({ path: resolve(OUT, `${vp}-${theme}-pronto.png`), fullPage: false }).catch(() => {});
    // 2) preview abre (svg) e fecha por Esc
    await page.click('.lottie-card:not(.is-missing) [data-action="preview"]').catch(() => {});
    r.previewSvg = await page.waitForSelector('[data-preview-modal].active [data-preview-container] svg', { timeout: 20000 }).then(() => true).catch(() => false);
    await page.screenshot({ path: resolve(OUT, `${vp}-${theme}-preview.png`), fullPage: false }).catch(() => {});
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    r.previewClosed = await page.evaluate(() => !document.querySelector('[data-preview-modal].active'));
    // 3) atribuição persiste e re-render sem erro
    await page.selectOption('.component-row:first-child .lottie-select', { index: 1 }).catch(() => {});
    await page.waitForTimeout(300);
    r.assigned = await page.evaluate(() => !!document.querySelector('.component-row.has-lottie') && !!localStorage.getItem('lotties-assignments'));
    // 4) unmount por navegação → sem sobras; 5) remount
    await page.evaluate(() => { location.hash = '#/panel-gestao-paineis'; });
    await page.waitForSelector('.lotties-panel', { state: 'detached', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);
    r.afterUnmount = await page.evaluate(async () => { const m = await import('/components/panels/panel-lotties-management/index.js'); const ev = await import('/components/panels/panel-lotties-management/ui/events.js'); const st = await import('/components/panels/panel-lotties-management/state/store.js'); const s = m.getStatus(); return { init: s.initialized, mountCount: s.metrics.mountCount, unmountCount: s.metrics.unmountCount, listeners: ev.info().cleanupCount, hasInstance: ev.info().hasInstance, subscribers: st.info().subscriberCount, domLeft: document.querySelectorAll('.lotties-panel, body [data-panel="panel-lotties-management"]').length /* o <link data-panel> do CSS no <head> permanece por design (cache do loadCSS) */ }; });
    await page.evaluate(() => { location.hash = '#/lotties'; }); // alias: só resolve após rebuild do bundle main (registro na fonte) — informativo
    r.aliasResolved = await page.waitForSelector('.lotties-panel[data-state="pronto"]', { timeout: 6000 }).then(() => true).catch(() => false);
    await page.evaluate(() => { location.hash = '#/panel-lotties-management'; }); // rota canônica → remount
    r.remounted = await page.waitForSelector('.lotties-panel[data-state="pronto"]', { timeout: 30000 }).then(() => true).catch(() => false);
    r.status2 = await page.evaluate(async () => { const m = await import('/components/panels/panel-lotties-management/index.js'); const s = m.getStatus(); return { init: s.initialized, mountCount: s.metrics.mountCount, unmountCount: s.metrics.unmountCount }; });
    r.assignmentKept = await page.evaluate(() => !!document.querySelector('.component-row.has-lottie'));
    await page.evaluate(() => { location.hash = '#/panel-gestao-paineis'; }); await page.waitForTimeout(1500);
  } catch (e) { r.erro = String(e && e.message || e).slice(0, 300); }
  r.perr = perr.slice(); r.cerr = cerr.filter((t) => /lotties|animacoes|lottie/i.test(t)); r.cerrAll = cerr.length; r.notFound = notFound.slice();
  results.push(r);
  console.log(`[${vp} ${theme}] ` + JSON.stringify({ mounted: r.mounted, state: r.state, cards: r.cards, cat: r.catalogo && r.catalogo.length, missing: r.missing, preview: r.previewSvg, closed: r.previewClosed, after: r.afterUnmount, remounted: r.remounted, perr: r.perr.length, cerr: r.cerr.length, notFound: r.notFound.length, erro: r.erro }));
  await ctx.close();
}
await browser.close();
const all = (f) => results.every(f);
G('ROUTE_MOUNTS_CANONICAL', all((r) => r.mounted && r.state === 'pronto'), results.map((r) => `${r.vp}/${r.theme}: ${r.state}`).join(' · '));
G('CATALOG_FROM_CANONICAL_MODULE', all((r) => r.catalogo && r.cards === r.catalogo.length && r.cards > 0), results.map((r) => `${r.vp}/${r.theme}: cards=${r.cards} módulo=${r.catalogo && r.catalogo.length}`).join(' · '));
G('FILES_AVAILABLE_AT_ASSETS_ANIMACOES', all((r) => r.missing === 0 && r.notFound.length === 0), results.map((r) => `${r.vp}/${r.theme}: ausentes=${r.missing} 4xx=${r.notFound.length}`).join(' · '));
G('PREVIEW_OPENS_AND_CLOSES', all((r) => r.previewSvg && r.previewClosed), results.map((r) => `${r.vp}/${r.theme}: svg=${r.previewSvg} fechado=${r.previewClosed}`).join(' · '));
G('ASSIGNMENT_PERSISTS', all((r) => r.assigned && r.assignmentKept), results.map((r) => `${r.vp}/${r.theme}: ${r.assigned}/${r.assignmentKept}`).join(' · '));
G('UNMOUNT_NO_LEAKS', all((r) => r.afterUnmount && !r.afterUnmount.init && r.afterUnmount.listeners === 0 && !r.afterUnmount.hasInstance && r.afterUnmount.subscribers === 0 && r.afterUnmount.domLeft === 0), results.map((r) => `${r.vp}/${r.theme}: ${JSON.stringify(r.afterUnmount)}`).join(' · '));
G('REMOUNT_OK', all((r) => r.remounted && r.status2 && r.status2.init && r.status2.mountCount >= 2), results.map((r) => `${r.vp}/${r.theme}: ${JSON.stringify(r.status2)}`).join(' · '));
G('NO_PAGE_ERRORS', all((r) => r.perr.length === 0), results.map((r) => `${r.vp}/${r.theme}: ${r.perr.length}${r.perr.length ? ' ' + JSON.stringify(r.perr.slice(0, 2)) : ''}`).join(' · '));
G('NO_PANEL_CONSOLE_ERRORS', all((r) => r.cerr.length === 0), results.map((r) => `${r.vp}/${r.theme}: ${r.cerr.length}${r.cerr.length ? ' ' + JSON.stringify(r.cerr.slice(0, 2)) : ''} (console total ${r.cerrAll})`).join(' · '));
G('NO_HORIZONTAL_OVERFLOW', all((r) => (r.overflowX || 0) === 0), results.map((r) => `${r.vp}/${r.theme}: ${r.overflowX}`).join(' · '));
gates.push('INFO ALIAS_#/lotties_RESOLVES_BEFORE_BUNDLE_REBUILD — ' + results.map((r) => `${r.vp}/${r.theme}: ${r.aliasResolved}`).join(' · ') + ' (esperado false até o rebuild do lote main — aliases vivem no registro da fonte)');
G('THEME_APPLIED', all((r) => r.themeGot === r.theme), results.map((r) => `${r.vp}: pedido=${r.theme} html=${r.themeGot}`).join(' · '));
const fails = gates.filter((g) => g.startsWith('FAIL')).length;
const txt = `# SMOKE panel-lotties-management — ${new Date().toISOString()} — base=${BASE}\n` + gates.join('\n') + `\n# ${fails ? fails + ' FAIL' : 'TODOS PASS'} (${gates.length} gates)\n`;
writeFileSync(resolve(OUT, 'smoke-lotties.json'), JSON.stringify(results, null, 2)); writeFileSync(resolve(OUT, 'SMOKE-LOTTIES.txt'), txt);
console.log(txt); process.exit(fails ? 1 : 0);
