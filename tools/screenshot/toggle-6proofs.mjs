// 6 PROVAS do toggle v3.1.0 na pagina REAL. Login sancionado (bot). Screenshots em /scratchpad.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { isLoginPage, loginViaPage } from './auth.mjs';

const DIR = '/tmp/claude-0/-root/37e388f6-21e8-479a-8539-85c52043cb4c/scratchpad/';
const errors = [], fuseLogs = [];
const R = {}; // resultados

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
page.on('console', m => { const t = m.text(); if (/FUSIVEL|theme-toggle/i.test(t)) fuseLogs.push(t.slice(0, 160)); });

// probe de responsividade: evaluate com timeout -> se travar, "unresponsive"
async function threadFreeMs() {
  const started = Date.now();
  try {
    const ms = await Promise.race([
      page.evaluate(() => new Promise(res => { const t0 = performance.now(); setTimeout(() => res(performance.now() - t0), 100); })),
      new Promise((_, rej) => setTimeout(() => rej(new Error('UNRESPONSIVE')), 4000)),
    ]);
    return { ok: true, timerMs: Math.round(ms), wallMs: Date.now() - started };
  } catch (e) { return { ok: false, err: String(e).slice(0, 60), wallMs: Date.now() - started }; }
}
async function snap() {
  return await page.evaluate(() => {
    const H = document.documentElement, cs = getComputedStyle(H);
    return {
      dataTheme: H.getAttribute('data-theme'),
      cls: H.className,
      bgPrimary: cs.getPropertyValue('--bg-primary').trim(),
      textPrimary: cs.getPropertyValue('--text-primary').trim(),
      bodyBg: getComputedStyle(document.body).backgroundColor,
    };
  });
}

// ── PROVA 1: carrega ate o fim + login ──
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => errors.push('goto:' + e));
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page).catch(e => errors.push('login:' + e));
await page.waitForTimeout(3500); // window.load + injecao do botao
const btn = await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 10000 }).catch(() => null);
const p1probe = await threadFreeMs();
R.P1_loadOK = { rendered: (await snap()).dataTheme !== undefined, toggleButton: !!btn, responsive: p1probe.ok, ...p1probe };
await page.screenshot({ path: DIR + 'p1-loaded.png' }).catch(() => {});

// ── PROVA 2: clica -> tema muda + estilo computado muda -> screenshot ──
const before = await snap();
if (btn) await btn.click();
await page.waitForTimeout(700);
const after = await snap();
R.P2_click = {
  before: before.dataTheme, after: after.dataTheme,
  themeChanged: before.dataTheme !== after.dataTheme,
  bgPrimaryChanged: before.bgPrimary !== after.bgPrimary,
  bodyBgChanged: before.bodyBg !== after.bodyBg,
  bgPrimary: `${before.bgPrimary} -> ${after.bgPrimary}`,
};
const lightShot = after.dataTheme === 'light' ? 'p2-light.png' : 'p2-after1.png';
await page.screenshot({ path: DIR + lightShot }).catch(() => {});

// ── PROVA 3: clica de novo -> volta ──
if (btn) await btn.click();
await page.waitForTimeout(700);
const back = await snap();
R.P3_clickBack = { theme: back.dataTheme, returnedToStart: back.dataTheme === before.dataTheme };
await page.screenshot({ path: DIR + 'p3-back.png' }).catch(() => {});

// ── PROVA 4: STRESS 10 cliques rapidos -> responsivo, sem fusivel indevido ──
await page.evaluate(() => {
  const b = document.querySelector('[data-dsd-theme-toggle]');
  for (let i = 0; i < 10; i++) { b.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })); b.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
});
const p4probe = await threadFreeMs();
// ainda responde a um clique normal depois do stress? (respeita o debounce de 250ms antes de confirmar)
await page.waitForTimeout(400);
const beforeAfterStress = (await snap()).dataTheme;
if (btn) await btn.click();
await page.waitForTimeout(700);
const afterStressClick = (await snap()).dataTheme;
R.P4_stress10 = {
  responsiveAfterBurst: p4probe.ok, timerMs: p4probe.timerMs, threadFree_lt500: p4probe.ok && p4probe.timerMs < 500,
  stillTogglesAfterBurst: beforeAfterStress !== afterStressClick,
  fuseTrippedUnexpectedly: fuseLogs.length > 0,
};

// ── PROVA 5: espera 30s -> NAO reverte sozinho E pagina viva ──
const t5before = (await snap()).dataTheme;
await page.waitForTimeout(30000);
const p5probe = await threadFreeMs();
const t5after = (await snap()).dataTheme;
R.P5_wait30s = { themeBefore: t5before, themeAfter: t5after, noAutoRevert: t5before === t5after, aliveAfter30s: p5probe.ok, timerMs: p5probe.timerMs };

// ── PROVA 6: reload -> tema persistiu ──
// Forca DARK (nao-default) antes do reload -> teste significativo de persistencia.
let pc = (await snap()).dataTheme;
for (let i = 0; i < 3 && pc !== 'dark'; i++) { if (btn) await btn.click(); await page.waitForTimeout(700); pc = (await snap()).dataTheme; }
const chosen = (await snap()).dataTheme;
await page.waitForTimeout(1200); // deixa o POST/cm_theme assentar
await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => errors.push('reload:' + e));
// F5 REAL: NAO re-loga; espera o SINAL POSITIVO do dashboard autenticado (botao do toggle).
const reBtn = await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 15000 }).catch(() => null);
await page.waitForTimeout(3500); // boot autenticado (theme-manager-v2 e o ultimo a aplicar)
const afterReload = await snap();
R.P6_reloadPersist = { chosen, authenticatedAfterReload: !!reBtn, afterReload: afterReload.dataTheme, persisted: !!reBtn && chosen === 'dark' && afterReload.dataTheme === 'dark' };
await page.screenshot({ path: DIR + 'p6-reload.png' }).catch(() => {});

await browser.close();

const pass = {
  P1: R.P1_loadOK.toggleButton && R.P1_loadOK.responsive,
  P2: R.P2_click.themeChanged && (R.P2_click.bgPrimaryChanged || R.P2_click.bodyBgChanged),
  P3: R.P3_clickBack.returnedToStart,
  P4: R.P4_stress10.threadFree_lt500 && R.P4_stress10.stillTogglesAfterBurst && !R.P4_stress10.fuseTrippedUnexpectedly,
  P5: R.P5_wait30s.noAutoRevert && R.P5_wait30s.aliveAfter30s,
  P6: R.P6_reloadPersist.persisted && R.P6_reloadPersist.authenticatedAfterReload,
};
console.log(JSON.stringify({ pass, allPass: Object.values(pass).every(Boolean), R, pageErrors: errors, fuseLogs }, null, 2));
