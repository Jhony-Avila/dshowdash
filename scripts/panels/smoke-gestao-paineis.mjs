// scripts/panels/smoke-gestao-paineis.mjs — smoke REAL do panel-gestao-paineis no shell autenticado (preview do worktree ou
// produção): monta pela rota canônica, desmonta sozinho quando o shell esvazia o container (o bundle main não chama unmount),
// volta a montar ao retornar (antes: "Already mounted" e tela vazia), sem vazamento (mounted=false após sair; timer/assinaturas
// encerrados via unmount) e sem erro de página/console. Exit 1 se algum gate falhar.
// Uso: PREVIEW_BASE=http://127.0.0.1:8904 node scripts/panels/smoke-gestao-paineis.mjs --out <dir>
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const TOOLS = process.env.MH2_TOOLS || '/var/www/dshowdash/tools/screenshot';
const pkg = (await import(TOOLS + '/node_modules/playwright/index.js')).default;
const { isLoginPage, loginViaPage } = await import(TOOLS + '/auth.mjs');
const { chromium } = pkg;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] ?? true) : d; };
const OUT = resolve(String(opt('out', '/tmp/smoke-gestao'))); mkdirSync(OUT, { recursive: true });
const BASE = process.env.PREVIEW_BASE || 'http://127.0.0.1:8904';
const MOD = '/components/panels/panel-gestao-paineis/index.js';
const gates = []; const G = (nome, ok, det) => { gates.push(`${ok ? 'PASS' : 'FAIL'} ${nome} — ${det}`); return ok; };
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1, MAP www.dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const perr = []; const cerr = [];
// O logger do shell usa console.error('%c…', 'color: …; font-weight: …', msg): o text() do Playwright concatena
// os marcadores %c e os argumentos de estilo antes da mensagem real, e o truncamento antigo (200c) cortava
// justamente a parte útil. Remove marcadores e declarações CSS antes de truncar, mantendo a mensagem inteira.
const RE_ESTILO = /\b(?:color|background(?:-color)?|font(?:-weight|-style|-size|-family)?|padding|margin|border(?:-radius)?|text-decoration|display)\s*:[^;]*;?/g;
const limparTextoConsole = (t) => String(t || '').replace(/%c/g, '').replace(RE_ESTILO, '').replace(/\s{2,}/g, ' ').trim();
const LIMITE_CONSOLE = 600;
page.on('pageerror', (e) => perr.push(String(e && e.message || e).slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error' || /Already mounted/.test(m.text())) cerr.push(m.type() + ': ' + limparTextoConsole(m.text()).slice(0, LIMITE_CONSOLE)); });
await page.goto(BASE + '/#/', { waitUntil: 'domcontentloaded', timeout: 60000 });
const chegou = await Promise.race([page.waitForSelector('.site-header', { timeout: 25000 }).then(() => 'shell').catch(() => null), page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 25000 }).then(() => 'login').catch(() => null)]);
if (chegou === 'login' || ((await isLoginPage(page)) && await page.isVisible('input[type="password"]').catch(() => false))) await loginViaPage(page);
await page.waitForSelector('[data-region="main"]', { timeout: 30000 }); await page.waitForSelector('.preloader-container', { state: 'hidden', timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2000); perr.length = 0; cerr.length = 0;
const status = () => page.evaluate(async (MOD) => { const m = await import(MOD); const s = m.getStatus ? m.getStatus() : {}; return { mounted: !!s.mounted, dom: document.querySelectorAll('.dsd-container__content [data-panel="panel-gestao-paineis"]').length /* só o painel montado: o <link> do CSS e o link da sidebar também levam data-panel */, text: (document.querySelector('.dsd-container__content')?.innerText || '').slice(0, 40).replace(/\n/g, ' ') }; }, MOD);
const ir = async (h, sel, t = 30000) => { await page.evaluate((h) => { location.hash = h; }, h); await page.waitForSelector(sel, { timeout: t }).catch(() => {}); await page.waitForTimeout(2500); };
await ir('#/panel-gestao-paineis', '[data-panel="panel-gestao-paineis"]'); const s1 = await status();
await ir('#/panel-lotties-management', '.lotties-panel[data-state="pronto"]'); const s2 = await status();
await ir('#/panel-gestao-paineis', '[data-panel="panel-gestao-paineis"]'); const s3 = await status();
await ir('#/panel-cotacao', '[data-panel-id="panel-cotacao"], .cotacao-panel, .panel-cotacao', 20000); const s4 = await status();
await ir('#/panel-gestao-paineis', '[data-panel="panel-gestao-paineis"]'); const s5 = await status();
await page.screenshot({ path: resolve(OUT, 'gestao-remount.png') }).catch(() => {});
await browser.close();
G('MOUNT_1', s1.mounted && s1.dom === 1 && /Gest/.test(s1.text), JSON.stringify(s1));
G('AUTO_UNMOUNT_WHEN_SHELL_SWAPS', !s2.mounted && s2.dom === 0, JSON.stringify(s2));
G('REMOUNT_RENDERS_CONTENT', s3.mounted && s3.dom === 1 && /Gest/.test(s3.text), JSON.stringify(s3));
G('AUTO_UNMOUNT_2', !s4.mounted && s4.dom === 0, JSON.stringify(s4));
G('REMOUNT_2', s5.mounted && s5.dom === 1 && /Gest/.test(s5.text), JSON.stringify(s5));
G('NO_PAGE_ERRORS', perr.length === 0, JSON.stringify(perr.slice(0, 3)));
G('NO_ALREADY_MOUNTED_OR_CONSOLE_ERRORS', cerr.length === 0, JSON.stringify(cerr.slice(0, 3)));
const fails = gates.filter((g) => g.startsWith('FAIL')).length;
const txt = `# SMOKE panel-gestao-paineis — ${new Date().toISOString()} — base=${BASE}\n` + gates.join('\n') + `\n# ${fails ? fails + ' FAIL' : 'TODOS PASS'} (${gates.length} gates)\n`;
writeFileSync(resolve(OUT, 'SMOKE-GESTAO.txt'), txt); console.log(txt); process.exit(fails ? 1 : 0);
