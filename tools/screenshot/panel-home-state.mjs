// PROBE read-only: estado atual do card panel-home (emoji visivel? saudacao? fundo weather).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const DIR = '/tmp/claude-0/-root/bc74aab5-11d1-4120-9f90-0c27ab1f1966/scratchpad/';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('.ph-wrapper, [id$="-primary"]', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(3000);

const state = await page.evaluate(() => {
  const icon = document.querySelector('.ph-message-icon');
  const primary = document.querySelector('.ph-message-primary');
  const secondary = document.querySelector('.ph-message-secondary');
  const canvas = document.querySelector('canvas');
  return {
    iconExists: !!icon,
    iconTextContent: icon ? icon.textContent : null,
    iconDisplay: icon ? getComputedStyle(icon).display : null,
    iconVisible: icon ? (getComputedStyle(icon).display !== 'none' && icon.offsetHeight > 0) : false,
    greeting: primary ? primary.textContent : null,
    subtitle: secondary ? secondary.textContent : null,
    hasWeatherCanvas: !!canvas,
    hourNow: new Date().getHours(),
  };
});
console.log(JSON.stringify(state, null, 2));
await page.screenshot({ path: DIR + 'panel-home-now.png' });
await browser.close();
