// PROBE (read-only): impacto real do header CSS injetado como data:text/css;base64.
// Mede: (1) violacoes CSP no console (report-only), (2) POSTs para /csp-report.php,
// (3) double-load das ~8 CSS do header (data: nao entra em rede; conta via console/coverage),
// (4) qtd de stylesheets adotadas com href data: no documento vivo.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();

const cspViolations = [];
const cspReportPosts = [];
const dataCssRequests = [];
const consoleErrors = [];

page.on('console', (msg) => {
  const t = msg.text();
  if (/content security policy|csp|report only/i.test(t)) cspViolations.push(t.slice(0, 240));
  if (msg.type() === 'error') consoleErrors.push(t.slice(0, 200));
});
page.on('request', (req) => {
  const u = req.url();
  if (u.includes('/csp-report.php')) cspReportPosts.push(req.method() + ' ' + u);
  if (u.startsWith('data:text/css')) dataCssRequests.push(u.slice(0, 60));
});
// Violacoes CSP tambem chegam via CDP como securityPolicyViolation em alguns casos; capturamos pageerror
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + String(e).slice(0, 200)));

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(3000);

// Inspecionar as stylesheets vivas do documento: quantas tem href data:, e duplicatas de conteudo
const sheetInfo = await page.evaluate(() => {
  const out = { total: document.styleSheets.length, dataHref: 0, byHref: {}, adopted: 0 };
  for (const s of document.styleSheets) {
    const h = s.href || '(inline/adopted)';
    if (h.startsWith('data:')) out.dataHref++;
    out.byHref[h.slice(0, 40)] = (out.byHref[h.slice(0, 40)] || 0) + 1;
  }
  // adoptedStyleSheets (Constructable) no documento e no header host
  try { out.adopted = (document.adoptedStyleSheets || []).length; } catch (e) {}
  // procurar <link> com href data: no header
  const dataLinks = [...document.querySelectorAll('link[rel="stylesheet"]')].filter(l => (l.href||'').startsWith('data:')).length;
  out.dataLinks = dataLinks;
  // header CSS reais carregadas 2x? conta ocorrencias de "header-base" em href de qualquer sheet
  let headerBaseCount = 0;
  for (const s of document.styleSheets) { if ((s.href||'').includes('header-base')) headerBaseCount++; }
  out.headerBaseSheets = headerBaseCount;
  return out;
});

// Boot chegou ao fim? (nós montados)
const nodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
const themeToggle = await page.$('[data-dsd-theme-toggle]') ? 'presente' : 'AUSENTE';

console.log(JSON.stringify({
  nodeCount, themeToggle,
  cspViolationsCount: cspViolations.length,
  cspViolationsSample: cspViolations.slice(0, 4),
  cspReportPostsCount: cspReportPosts.length,
  cspReportPostsSample: cspReportPosts.slice(0, 3),
  dataCssRequestsCount: dataCssRequests.length,
  consoleErrorsCount: consoleErrors.length,
  consoleErrorsSample: consoleErrors.slice(0, 5),
  sheetInfo,
}, null, 2));

await browser.close();
