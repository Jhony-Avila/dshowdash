// READ-ONLY: valida o painel Ads Intelligence (mock) — 22 telas em dark+light.
// Valida os 2 pontos de entrada: (1) icone Google Ads no header, (2) botao "Ads" na sidebar.
// Origin autenticado (host-resolver MAP -> 127.0.0.1). Nao dispara nada destrutivo (so mock).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = process.env.ADS_OUT || '/tmp/claude-0/-root/5a545447-8152-4236-820b-4c9775d9d709/scratchpad/ads-shots';
import { mkdirSync } from 'fs';
mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);

const AREAS = [
  'visao-geral','diretoria','campanhas','grupos','anuncios','palavras','termos',
  'landing-pages','conversoes','publicos','localizacoes','dispositivos','horarios',
  'orcamentos','qualidade','funil','ia','alertas','relatorios','historico','contas','config'
];

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors']
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { log('[warn] cookie:', e.message); }
const page = await ctx.newPage();

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
let statusResp = null;
page.on('response', async (r) => {
  if (r.url().includes('/api/ads/status')) { let b = null; try { b = await r.json(); } catch {} statusResp = { http: r.status(), provider: b?.data?.provider ?? b?.provider }; }
});

async function setTheme(t) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) {
    await page.click('[data-dsd-theme-toggle]').catch(() => {});
    await page.waitForTimeout(600);
    c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  }
  return c;
}
async function shotShell(name) {
  const el = await page.$('[data-ads-react-root]') || page;
  await el.screenshot({ path: `${OUT}/${name}.png` }).catch(e => log('  [shot falhou]', name, e.message));
}
async function waitMount(tag) {
  try { await page.waitForSelector('[data-ads-react-root] .ads-shell', { timeout: 30000 }); log(`  OK montou (${tag})`); return true; }
  catch { log(`  FALHA nao montou (${tag})`); return false; }
}

// ── BOOT + LOGIN ───────────────────────────────────────────
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('.site-header, header', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2500);

// ── PROOF 1: ICONE GOOGLE ADS NO HEADER ────────────────────
log('\n=== PROOF 1: icone Google Ads (header) ===');
const headerTrigger = await page.$('[data-panel-trigger="panel-adwords"]');
log('  trigger header presente:', !!headerTrigger);
let mountedHeader = false;
if (headerTrigger) {
  await headerTrigger.click().catch(() => {});
  mountedHeader = await waitMount('header');
  await page.waitForTimeout(1500);
  const hashH = await page.evaluate(() => location.hash);
  log('  hash apos clique header:', hashH);
  await shotShell('ads-entrada-header');
}

// ── PROOF 2: BOTAO "Ads" NA SIDEBAR ────────────────────────
log('\n=== PROOF 2: botao Ads (sidebar) ===');
// volta ao inicio para forcar re-navegacao pela sidebar
await page.evaluate(() => { location.hash = '#/'; });
await page.waitForTimeout(1500);
const sbInfo = await page.evaluate(() => {
  const cand = document.querySelector('[data-panel-id="panel-ads"]')
    || [...document.querySelectorAll('.sidebar a, .sidebar button, [class*="sidebar"] a, [class*="sidebar"] button')]
        .find(el => el.textContent.trim() === 'Ads');
  if (!cand) return { found: false };
  return { found: true, text: cand.textContent.trim().slice(0, 30), panelId: cand.getAttribute('data-panel-id') };
});
log('  item sidebar Ads:', JSON.stringify(sbInfo));
let mountedSidebar = false;
if (sbInfo.found) {
  await page.evaluate(() => {
    const cand = document.querySelector('[data-panel-id="panel-ads"]')
      || [...document.querySelectorAll('.sidebar a, .sidebar button, [class*="sidebar"] a, [class*="sidebar"] button')]
          .find(el => el.textContent.trim() === 'Ads');
    cand?.click();
  });
  mountedSidebar = await waitMount('sidebar');
  await page.waitForTimeout(1200);
  const hashS = await page.evaluate(() => location.hash);
  log('  hash apos clique sidebar:', hashS);
  await shotShell('ads-entrada-sidebar');
}

// posicao relativa na sidebar (Ads deve vir logo abaixo de Outlook)
const ordem = await page.evaluate(() => {
  const labels = ['Outlook', 'Ads', 'Pipedrive', 'DataTables'];
  const found = [...document.querySelectorAll('[data-panel-id]')]
    .map(el => ({ pid: el.getAttribute('data-panel-id'), txt: el.textContent.trim() }))
    .filter(x => labels.some(l => x.txt === l));
  return found.map(x => x.txt);
});
log('  ordem sidebar (favoritos, filtrada):', JSON.stringify(ordem));

// garante painel montado para o loop de telas
if (!mountedHeader && !mountedSidebar) {
  await page.evaluate(() => { location.hash = '#/panel-ads'; });
  await waitMount('hash-direto');
}

// ── LOOP: 22 TELAS em dark + light ─────────────────────────
log('\n=== CAPTURA: 22 telas x 2 temas ===');
const resultado = [];
for (const area of AREAS) {
  await page.evaluate((a) => {
    const btns = [...document.querySelectorAll('.ads-navitem')];
    const lbl = document.querySelector(`.ads-navitem[title]`); // no-op guard
    // clica pelo id via hash (fonte da verdade do irPara)
    location.hash = `#/panel-ads/${a}`;
  }, area);
  await page.waitForTimeout(900);
  const info = await page.evaluate(() => {
    const head = document.querySelector('.ads-main .ads-pagehead')?.textContent?.trim()?.slice(0, 60)
      || document.querySelector('.ads-main h1, .ads-main h2')?.textContent?.trim()?.slice(0, 60) || null;
    const empty = !!document.querySelector('.ads-main .ads-empty');
    const grid = document.querySelectorAll('.ads-tablescroll tbody tr').length;
    const bignums = document.querySelectorAll('.ads-bignum').length;
    const svg = document.querySelectorAll('.ads-main svg').length;
    return { head, empty, grid, bignums, svg };
  });
  resultado.push({ area, ...info });
  for (const t of ['dark', 'light']) {
    await setTheme(t); await page.waitForTimeout(500);
    await shotShell(`ads-${area}-${t}`);
  }
  log(`  [${area}] head=${JSON.stringify(info.head)} empty=${info.empty} grid=${info.grid} bignums=${info.bignums} svg=${info.svg}`);
}

log('\n=== RESUMO ===');
log(JSON.stringify({
  statusApi: statusResp,
  mountedHeader, mountedSidebar,
  ordemSidebar: ordem,
  telasCapturadas: resultado.length,
  telasVazias: resultado.filter(r => r.empty).map(r => r.area),
  telasComGrid: resultado.filter(r => r.grid > 0).map(r => r.area),
  telasComSvg: resultado.filter(r => r.svg > 0).length,
  consoleErrorsAds: errors.filter(e => /ads|adwords/i.test(e)).slice(0, 8),
  consoleErrorsTotal: errors.length,
}, null, 2));
await browser.close();
log('=== FIM ===  imagens em:', OUT);
