// READ-ONLY (Fase 1) — Quais folhas/regras SERVIDAS estilizam o ::before / active do link.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2000);

const out = await page.evaluate(() => {
  const hits = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { hits.push({ href: sheet.href, error: 'CORS/blocked' }); continue; }
    if (!rules) continue;
    const walk = (rulesList, media) => {
      for (const r of rulesList) {
        if (r.cssRules && r.type === CSSRule.MEDIA_RULE) { walk(r.cssRules, r.conditionText); continue; }
        const sel = r.selectorText || '';
        if (/sidebar__link/.test(sel) && (/::?before|::?after/.test(sel) || /--active/.test(sel) || /:hover/.test(sel) === false && /--active/.test(sel))) {
          if (/::?before|::?after/.test(sel) || /--active/.test(sel)) {
            hits.push({
              href: sheet.href ? sheet.href.split('/').slice(-2).join('/') : '(inline/style-tag)',
              media: media || undefined,
              sel,
              css: r.cssText.replace(sel, '').slice(0, 220),
            });
          }
        }
      }
    };
    walk(rules);
  }
  return hits;
});

// também: valor computado das variáveis-chave no link ativo e no grupo
const vars = await page.evaluate(() => {
  const link = document.querySelector('.dsd-sidebar__item--active .dsd-sidebar__link');
  if (!link) return null;
  const cs = getComputedStyle(link);
  const names = ['--sidebar-active-indicator','--sidebar-active-bg','--accent-primary','--accent-secondary','--accent-tertiary','--sidebar-accent-primary','--group-color','--sidebar-active-color'];
  const res = {};
  for (const n of names) res[n] = cs.getPropertyValue(n).trim() || '(vazio)';
  return res;
});

await browser.close();
console.log('=== REGRAS SERVIDAS (link active / ::before / ::after) ===');
console.log(JSON.stringify(out, null, 1));
console.log('=== VARIAVEIS no link ativo ===');
console.log(JSON.stringify(vars, null, 1));
