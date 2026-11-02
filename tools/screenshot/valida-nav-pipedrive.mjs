// Confirma que a API de navegacao serve o item Pipedrive em Favoritos, abaixo do Outlook.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(2500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1500);

const r = await page.evaluate(async () => {
  const res = await fetch('/api/ui/navigation.php', { credentials: 'include', headers: { Accept: 'application/json' } });
  let b = null; try { b = await res.json(); } catch {}
  // procura recursivamente por itens com panel_id pipedrive/outlook
  const achados = [];
  const walk = (node, parent) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(n => walk(n, parent)); return; }
    const key = node.item_key || node.key || node.id;
    const panel = node.panel_id || node.panelId || node.panel;
    const label = node.label || node.title;
    const ord = node.order_index ?? node.order ?? node.sort_order;
    if (panel === 'panel-pipedrive' || panel === 'panel-outlook' || /pipedrive|outlook/i.test(String(key||''))) {
      achados.push({ key, label, panel, ord, parent });
    }
    for (const k of Object.keys(node)) {
      if (Array.isArray(node[k]) || (node[k] && typeof node[k] === 'object')) walk(node[k], key || parent);
    }
  };
  walk(b, null);
  return { status: res.status, achados };
});
await browser.close();
console.log(JSON.stringify(r, null, 2));
