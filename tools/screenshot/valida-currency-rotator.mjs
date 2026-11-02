// READ-ONLY: valida a pill rotativa unificada (currency-rotator) no header.
// Hita o ORIGIN (host-resolver-rules MAP -> 127.0.0.1) p/ bundle fresco, sem CF.
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

// Espera a pill montar (loader lê o banco -> currency-rotator ativo)
await page.waitForSelector('.currency-rotator-component', { timeout: 20000 });
log('OK: .currency-rotator-component montou');

const readState = () => page.evaluate(() => {
  const el = document.querySelector('.currency-rotator-component');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const track = el.querySelector('.cr-track');
  const slides = [...el.querySelectorAll('.cr-slide')].map(s => ({
    asset: s.dataset.asset,
    val: s.querySelector('.currency-value')?.textContent,
    trend: s.querySelector('.currency-trend')?.textContent,
    trendClass: s.querySelector('.currency-trend')?.className
  }));
  return { title: el.title, transform: track ? getComputedStyle(track).transform : null, width: Math.round(r.width), count: slides.length, slides };
});

// contagem de pills antigas (deve ser 0)
const oldPills = await page.evaluate(() => document.querySelectorAll('.currency-usd-brl-component,.currency-usd-cny-component,.currency-btc-component').length);
log('pills antigas no DOM (esperado 0):', oldPills);

const setTheme = async (t) => {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
  return c;
};

await page.waitForTimeout(3000); // deixa os fetches iniciais popularem os valores
const s0 = await readState();
log('estado inicial:', JSON.stringify(s0));

// --- ROTAÇÃO: transform deve mudar ao longo de ~6s ---
const t0 = (await readState()).transform;
await page.waitForTimeout(6000);
const t1 = (await readState()).transform;
log('ROTAÇÃO transform', t0, '->', t1, '=>', t0 !== t1 ? 'MUDOU (ok)' : 'NÃO mudou (FALHA)');

// --- LARGURA estável ao longo de 3 leituras (durante rotação) ---
const widths = [];
for (let i = 0; i < 3; i++) { widths.push((await readState()).width); await page.waitForTimeout(2500); }
log('LARGURAS:', widths, '=>', (Math.max(...widths) - Math.min(...widths) <= 1) ? 'ESTÁVEL (ok)' : 'VARIOU (FALHA)');

// --- HOVER pausa: transform não muda enquanto o mouse está sobre a pill ---
await page.hover('.currency-rotator-component');
const h0 = (await readState()).transform;
await page.waitForTimeout(7000);
const h1 = (await readState()).transform;
log('HOVER-PAUSE transform', h0, '->', h1, '=>', h0 === h1 ? 'PAUSOU (ok)' : 'NÃO pausou (FALHA)');
await page.mouse.move(10, 10); // sai do hover

// --- Screenshots dark + light ---
for (const t of ['dark', 'light']) {
  const got = await setTheme(t);
  await page.waitForTimeout(800);
  const el = await page.$('.site-header') || await page.$('header');
  if (el) { await el.screenshot({ path: `${OUT}/rotator-header-${t}.png` }); log(`shot: ${OUT}/rotator-header-${t}.png (theme=${got})`); }
  const pel = await page.$('.currency-rotator-component');
  if (pel) { await pel.screenshot({ path: `${OUT}/rotator-pill-${t}.png` }); }
}

// --- CLIQUE abre o painel do ativo exibido ---
await setTheme('dark');
await page.waitForTimeout(500);
const before = await readState();
await page.click('.currency-rotator-component');
await page.waitForTimeout(1500);
const hash = await page.evaluate(() => location.hash);
const ss = await page.evaluate(() => { try { return sessionStorage.getItem('cotacao:asset'); } catch { return null; } });
const panelOpen = await page.evaluate(() => !!document.querySelector('[data-panel-id="panel-cotacao"], .cp-panel, .cotacao-panel, #panel-cotacao'));
log('CLIQUE => hash:', hash, '| sessionStorage cotacao:asset:', ss, '| painel presente:', panelOpen);
log('  (ativo exibido no clique, title):', before.title);

log('CONSOLE ERRORS:', errors.length, errors.slice(0, 8));
await browser.close();
log('=== FIM ===');
