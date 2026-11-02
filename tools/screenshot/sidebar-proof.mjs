import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const DIR = '/tmp/claude-0/-root/37e388f6-21e8-479a-8539-85c52043cb4c/scratchpad/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);
const setTheme = async (t) => { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 3 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(650); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } };
const expand = async () => { for (const g of ['Comercial', 'Compras', 'Recebimento']) { const b = page.locator(`.dsd-sidebar__group-button:has-text("${g}"), .dsd-sidebar__group-title:has-text("${g}")`).first(); if (await b.count()) { const box = await b.boundingBox().catch(() => null); if (box) { await b.click().catch(() => {}); await page.waitForTimeout(350); } } } };

await expand(); await page.waitForTimeout(500);
await setTheme('light'); await page.waitForTimeout(500);
await expand(); await page.waitForTimeout(500);
await page.locator('.dsd-sidebar').screenshot({ path: DIR + 'sidebar-light.png' }).catch(async () => { await page.screenshot({ path: DIR + 'sidebar-light.png' }); });
await setTheme('dark'); await page.waitForTimeout(500);
await page.locator('.dsd-sidebar').screenshot({ path: DIR + 'sidebar-dark.png' }).catch(async () => { await page.screenshot({ path: DIR + 'sidebar-dark.png' }); });

// interação: toggle light->dark->light + colapsar/expandir Comercial
await setTheme('light');
await setTheme('dark');
await setTheme('light');
const grp = page.locator('.dsd-sidebar__group-button:has-text("Comercial"), .dsd-sidebar__group-title:has-text("Comercial")').first();
if (await grp.count()) { await grp.click().catch(() => {}); await page.waitForTimeout(400); await grp.click().catch(() => {}); await page.waitForTimeout(400); }
let responsive = true, timerMs = -1;
try { timerMs = await Promise.race([page.evaluate(() => new Promise(r => { const t0 = performance.now(); setTimeout(() => r(performance.now() - t0), 100); })), new Promise((_, j) => setTimeout(() => j(1), 4000))]); } catch { responsive = false; }
const finalTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
await browser.close();
console.log(JSON.stringify({ finalTheme, interactionResponsive: responsive, timerMs: Math.round(timerMs) }, null, 2));
