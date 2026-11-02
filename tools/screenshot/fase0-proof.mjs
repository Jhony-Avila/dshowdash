// PROVA Fase 0 (light total, só o CASCO) via injecao — sem deploy. Screenshots dark vs light.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const DIR = '/tmp/claude-0/-root/37e388f6-21e8-479a-8539-85c52043cb4c/scratchpad/';

const FASE0_CSS = `
:root[data-theme="light"]{ color-scheme:light; }
:root[data-theme="light"] html,
:root[data-theme="light"] body { background: var(--bg-primary) !important; color: var(--text-primary) !important; }
:root[data-theme="light"] .main-content,
:root[data-theme="light"] [class*="container-main"] { background: var(--bg-primary) !important; color: var(--text-primary) !important; }
:root[data-theme="light"] .site-header,
:root[data-theme="light"] .main-header { background: var(--bg-secondary) !important; color: var(--text-primary) !important; border-color: var(--border-color) !important; }
:root[data-theme="light"] .navrail,
:root[data-theme="light"] .nav-rail,
:root[data-theme="light"] .sidebar { background: var(--bg-secondary) !important; color: var(--text-primary) !important; border-color: var(--border-color) !important; }
:root[data-theme="light"] .ticker { background: var(--bg-tertiary) !important; color: var(--text-primary) !important; }
`;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);

// DARK baseline
await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
await page.waitForTimeout(400);
await page.screenshot({ path: DIR + 'fase0-dark.png' });

// LIGHT sem Fase 0 (estado atual = inerte)
await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'light'); });
await page.waitForTimeout(400);
await page.screenshot({ path: DIR + 'fase0-light-atual.png' });

// LIGHT com Fase 0 injetada (casco tematizado)
await page.evaluate((css) => {
  const s = document.createElement('style'); s.id = 'fase0'; s.textContent = css; document.head.appendChild(s);
}, FASE0_CSS);
await page.waitForTimeout(500);
await page.screenshot({ path: DIR + 'fase0-light-casco.png' });

// mede o casco
const m = await page.evaluate(() => {
  const cs = s => { const el = document.querySelector(s); return el ? getComputedStyle(el).backgroundColor : 'n/a'; };
  return { body: getComputedStyle(document.body).backgroundColor, header: cs('.site-header,.main-header'), sidebar: cs('.navrail,.sidebar,.nav-rail'), main: cs('.main-content') };
});
await browser.close();
console.log(JSON.stringify({ cascoBackgrounds: m }, null, 2));
