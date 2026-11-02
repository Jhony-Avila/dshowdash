// READ-ONLY: valida o painel Pipedrive Analytics (Fase 1) no navegador autenticado.
// Hita o ORIGIN (host-resolver-rules MAP -> 127.0.0.1) p/ bundle fresco, sem CF.
// Prova: botao header abre o painel -> React monta -> tela Configuracoes renderiza
// -> GET /status devolve a conta conectada (Dshow Led / Jhony).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox', '--disable-dev-shm-usage',
    '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1',
    '--ignore-certificate-errors'
  ]
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { log('[warn] cookie:', e.message); }
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(1500);

// --- 1) Prova crua da API /status (fetch autenticado no contexto da pagina) ---
const statusApi = await page.evaluate(async () => {
  try {
    const r = await fetch('/api/pipedrive/status', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    const j = await r.json().catch(() => null);
    return { http: r.status, ok: j?.ok, data: j?.data ?? null, error: j?.error ?? null };
  } catch (e) { return { erro: String(e) }; }
});
log('API /status =>', JSON.stringify(statusApi));

// --- 2) Abrir o painel pelo botao do header ---
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]');
log('botao header presente:', !!trigger);
if (trigger) {
  await trigger.click();
} else {
  // fallback: navega direto por hash
  await page.evaluate(() => { location.hash = '#/panel-pipedrive/config'; });
}

// --- 3) Espera o React montar dentro do container-main ---
let mounted = false;
try {
  await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 20000 });
  mounted = true;
} catch { /* trata abaixo */ }
log('React montou (.pp-shell):', mounted);

if (mounted) {
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const root = document.querySelector('[data-pp-react-root]');
    const h1 = root?.querySelector('.pp-h1')?.textContent?.trim();
    const navItems = [...(root?.querySelectorAll('.pp-navitem') || [])].map(b => b.textContent.trim());
    // linhas de status na tela Configuracoes
    const rows = {};
    root?.querySelectorAll('.pp-card .pp-row').forEach(r => {
      const k = r.querySelector('.pp-k')?.textContent?.trim();
      const v = r.querySelector('.pp-v')?.textContent?.trim();
      if (k) rows[k] = v;
    });
    const badge = root?.querySelector('.pp-badge')?.textContent?.trim();
    const dotBg = (() => { const d = root?.querySelector('.pp-badge .pp-dot'); return d ? getComputedStyle(d).backgroundColor : null; })();
    return { h1, navItems, badge, dotBg, rows };
  });
  log('tela:', JSON.stringify(info, null, 2));

  // --- 4) Screenshots dark + light ---
  const setTheme = async (t) => {
    let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    for (let i = 0; i < 4 && c !== t; i++) {
      const tog = await page.$('[data-dsd-theme-toggle]');
      if (!tog) break;
      await tog.click(); await page.waitForTimeout(700);
      c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    }
    return c;
  };
  for (const t of ['dark', 'light']) {
    const got = await setTheme(t);
    await page.waitForTimeout(800);
    const el = await page.$('[data-pp-react-root]') || await page.$('#container-main') || page;
    await el.screenshot({ path: `${OUT}/pipedrive-config-${t}.png` });
    log(`shot: ${OUT}/pipedrive-config-${t}.png (theme=${got})`);
  }

  // --- 5) Navegar para Visao Geral e voltar ---
  await page.evaluate(() => { location.hash = '#/panel-pipedrive/geral'; });
  await page.waitForTimeout(1200);
  const geralH1 = await page.evaluate(() => document.querySelector('[data-pp-react-root] .pp-h1')?.textContent?.trim());
  log('Visao Geral h1:', geralH1);
}

log('CONSOLE ERRORS:', errors.length, errors.slice(0, 10));
await browser.close();
log('=== FIM ===');
