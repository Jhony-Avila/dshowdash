import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const DIR = '/tmp/claude-0/-root/37e388f6-21e8-479a-8539-85c52043cb4c/scratchpad/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);

const dashTheme = () => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
const setDash = async (t) => { let c = await dashTheme(); for (let i = 0; i < 3 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(700); c = await dashTheme(); } };
const koalaFrame = () => page.frames().find(f => /\/koala/.test(f.url()));
const koalaTheme = async () => { const f = koalaFrame(); if (!f) return 'no-frame'; try { return await f.evaluate(() => document.documentElement.getAttribute('data-theme')); } catch (e) { return 'err'; } };

// abre Koala Docs (carrega o iframe)
await setDash('light'); await page.waitForTimeout(300);
const koalaLink = page.locator('text="Koala Docs"').first();
let opened = false;
if (await koalaLink.count()) { await koalaLink.click().catch(() => {}); opened = true; }
await page.waitForTimeout(4000); // iframe carregar

const steps = {};
steps['1_afterOpen'] = { dash: await dashTheme(), koala: await koalaTheme() };
await page.screenshot({ path: DIR + 'sync-1-light.png' });

// toggle dashboard -> DARK ; koala deve acompanhar ao vivo
await setDash('dark'); await page.waitForTimeout(1200);
steps['2_dashDark'] = { dash: await dashTheme(), koala: await koalaTheme() };
await page.screenshot({ path: DIR + 'sync-2-dark.png' });

// toggle -> LIGHT de novo
await setDash('light'); await page.waitForTimeout(1200);
steps['3_backLight'] = { dash: await dashTheme(), koala: await koalaTheme() };
await page.screenshot({ path: DIR + 'sync-3-light.png' });

// stress 5 cliques -> thread livre nos DOIS contextos
for (let i = 0; i < 5; i++) { await page.click('[data-dsd-theme-toggle]', { timeout: 2000 }).catch(() => {}); }
let dashResp = true, koalaResp = true, dashMs = -1;
try { dashMs = await Promise.race([page.evaluate(() => new Promise(r => { const t0 = performance.now(); setTimeout(() => r(performance.now() - t0), 100); })), new Promise((_, j) => setTimeout(() => j(1), 4000))]); } catch { dashResp = false; }
try { const f = koalaFrame(); await Promise.race([f.evaluate(() => new Promise(r => setTimeout(r, 100))), new Promise((_, j) => setTimeout(() => j(1), 4000))]); } catch { koalaResp = false; }

await browser.close();
console.log(JSON.stringify({ koalaOpened: opened, steps, stress: { dashResp, dashMs: Math.round(dashMs), koalaResp } }, null, 2));
