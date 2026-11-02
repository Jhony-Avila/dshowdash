// READ-ONLY (Fase 1) — screenshot da COLUNA INTEIRA da sidebar com item admin ativo.
// Não altera nenhum arquivo da app. DSD_THEME=light|dark ALVO=texto.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const ALVO = process.env.ALVO || 'Gest';
const THEME = process.env.DSD_THEME || 'dark';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1.5 });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch (e) {} }, THEME);
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2000);

// expandir grupos + ativar ALVO
await page.evaluate(() => document.querySelectorAll('.dsd-sidebar__group-button').forEach(b => { try { b.click(); } catch (e) {} }));
await page.waitForTimeout(700);
await page.evaluate((alvo) => {
  const links = [...document.querySelectorAll('.dsd-sidebar__link, .dsd-sidebar__item a, .dsd-sidebar__item button')];
  const el = links.find(l => new RegExp(alvo, 'i').test(l.textContent || ''));
  if (el) el.click();
}, ALVO);
await page.waitForTimeout(900);

// screenshot da sidebar inteira (element)
const sb = page.locator('.dsd-sidebar').first();
const shot = `/var/www/dshowdash/tools/screenshot/out-fullcol-${ALVO}-${THEME}.png`.replace(/\s+/g, '_');
try { await sb.screenshot({ path: shot }); console.log('SHOT OK', shot); }
catch (e) { console.log('SHOT ERR', e.message); await page.screenshot({ path: shot, fullPage: false }); }
await browser.close();
