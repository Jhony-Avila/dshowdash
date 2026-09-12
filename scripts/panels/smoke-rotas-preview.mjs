// scripts/panels/smoke-rotas-preview.mjs — smoke das rotas/painéis tocados pelo lote cleanup-dedup-v2 no SHELL REAL
// autenticado (preview do worktree: scripts/header/preview-shell.mjs; API/bundles reais por proxy). Para cada rota:
// navega, espera o main, mede se o painel esperado montou (data-panel-id / seletor), erros de página, erros de console
// novos e requisições 404 de arquivos do repo. Também confere assets: /components/_shared/geo/br-uf.topo.json (200),
// /assets/animacoes/<lottie>.json (200) e o antigo caminho /components/animacoes/ (404 esperado — comprova o bug corrigido).
// Uso: PREVIEW_BASE=http://127.0.0.1:8904 node scripts/panels/smoke-rotas-preview.mjs --out <dir>
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const TOOLS = process.env.MH2_TOOLS || '/var/www/dshowdash/tools/screenshot';
const pkg = (await import(TOOLS + '/node_modules/playwright/index.js')).default;
const { isLoginPage, loginViaPage } = await import(TOOLS + '/auth.mjs');
const { chromium } = pkg;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] ?? true) : d; };
const OUT = resolve(String(opt('out', '/tmp/smoke-rotas'))); mkdirSync(OUT, { recursive: true });
const BASE = process.env.PREVIEW_BASE || 'http://127.0.0.1:8904';
// rota → como reconhecer o painel montado (qualquer um dos seletores)
const ROTAS = [
  ['#/preferencias', 'panel-user-preferences', '.panel-user-preferences, [data-panel-id="panel-user-preferences"], [data-panel="panel-user-preferences"]'],
  ['#/meu-perfil', 'panel-user-profile', '.panel-user-profile, [data-panel-id="panel-user-profile"], [data-panel="panel-user-profile"]'],
  ['#/panel-cotacao', 'panel-cotacao', '[data-panel-id="panel-cotacao"], .cotacao-panel, .panel-cotacao'],
  ['#/panel-google-analytics', 'panel-google-analytics', '[data-panel-id="panel-google-analytics"], [data-ga-root], .ga-root'],
  ['#/panel-relogio-mundial', 'panel-relogio-mundial', '[data-panel-id="panel-relogio-mundial"], [data-wcm-root], .wcm-root, .world-clock'],
  ['#/panel-lotties-management', 'panel-lotties-management', '[data-panel-id="panel-lotties-management"], .lotties-management, .panel-lotties'],
  ['#/panel-orchestrator-manager', 'panel-orchestrator-manager', '[data-panel-id="panel-orchestrator-manager"], .pom-root, .panel-orchestrator-manager'],
  ['#/panel-gestao-paineis', 'panel-gestao-paineis', '[data-panel-id="panel-gestao-paineis"], .gestao-paineis, .panel-gestao-paineis'],
  ['#/panel-bling', 'panel-bling', '[data-panel-id="panel-bling"], [data-bling-root], .bling-root'],
  ['#/panel-pipedrive', 'panel-pipedrive', '[data-panel-id="panel-pipedrive"], [data-pipedrive-root], .pipedrive-root'],
];
const ASSETS = [
  ['/components/_shared/geo/br-uf.topo.json', 200],
  ['/assets/animacoes/Loading_Cube.json', 200],
  ['/components/animacoes/Loading_Cube.json', 404],
  ['/components/panels/panel-lotties-management/core/lifecycle.js', 200],
  ['/components/router/registry/definitions/routes-dashboard.js', 200],
];
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1, MAP www.dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const perr = []; const cerr = []; const notFound = [];
page.on('pageerror', (e) => perr.push(String(e && e.message || e).slice(0, 160)));
page.on('console', (m) => { if (m.type() === 'error') cerr.push(m.text().slice(0, 160)); });
page.on('response', (r) => { if (r.status() === 404 && /\/components\/|\/app\/|\/assets\//.test(r.url())) notFound.push(r.url().replace(/^https?:\/\/[^/]+/, '')); });
await page.goto(BASE + '/#/', { waitUntil: 'domcontentloaded', timeout: 60000 });
const chegou = await Promise.race([page.waitForSelector('.site-header', { timeout: 25000 }).then(() => 'shell').catch(() => null), page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 25000 }).then(() => 'login').catch(() => null)]);
if (chegou === 'login' || ((await isLoginPage(page)) && await page.isVisible('input[type="password"]').catch(() => false))) await loginViaPage(page);
await page.waitForSelector('[data-region="main"]', { timeout: 30000 });
await page.waitForSelector('.preloader-container', { state: 'hidden', timeout: 20000 }).catch(() => {});
const baseErr = { perr: perr.length, cerr: cerr.length };
const res = [];
for (const [hash, pid, sel] of ROTAS) {
  const p0 = perr.length, c0 = cerr.length, n0 = notFound.length;
  await page.evaluate((h) => { location.hash = h; }, hash);
  const ok = await page.waitForFunction(({ pid, sel }) => !!document.querySelector(sel) || !!document.querySelector(`[data-panel-id="${pid}"]`) || (document.querySelector('#main')?.innerHTML || '').includes(pid), { pid, sel }, { timeout: 30000 }).then(() => true).catch(() => false);
  await page.waitForTimeout(2500);
  const mounted = await page.evaluate(({ pid, sel }) => ({ bySel: !!document.querySelector(sel), byAttr: !!document.querySelector(`[data-panel-id="${pid}"]`), hash: location.hash, mainLen: (document.querySelector('#main')?.innerText || '').length, erroCard: !!document.querySelector('.panel-error, .pom-error, [data-panel-error]') }), { pid, sel });
  const r = { hash, pid, ok, ...mounted, perr: perr.slice(p0), cerr: cerr.slice(c0), notFound: notFound.slice(n0) };
  res.push(r);
  await page.screenshot({ path: resolve(OUT, pid + '.png') }).catch(() => {});
  console.log(`${ok ? 'PASS' : 'FAIL'} ${hash} → ${pid} montado=${ok} texto=${mounted.mainLen} perr=${r.perr.length} cerr=${r.cerr.length} 404=${r.notFound.length}${r.notFound.length ? ' ' + JSON.stringify(r.notFound.slice(0, 3)) : ''}`);
}
const assets = [];
for (const [u, exp] of ASSETS) { const st = await page.evaluate(async (u) => (await fetch(u, { cache: 'no-store' })).status, u); assets.push({ u, exp, st }); console.log(`${st === exp ? 'PASS' : 'FAIL'} asset ${u} → ${st} (esperado ${exp})`); }
await browser.close();
const fails = res.filter((r) => !r.ok || r.perr.length).length + assets.filter((a) => a.st !== a.exp).length;
writeFileSync(resolve(OUT, 'smoke-rotas.json'), JSON.stringify({ base: BASE, at: new Date().toISOString(), baseErr, res, assets }, null, 2));
console.log(fails ? `# ${fails} FAIL` : '# TODOS PASS');
process.exit(fails ? 1 : 0);
