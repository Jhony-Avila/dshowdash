// basal-caracterizacao.mjs — Elevação Basal / M2 · Characterization tests (§1605/§1606)
// ============================================================================
// Registra o COMPORTAMENTO ATUAL das jornadas críticas ANTES de qualquer
// refatoração (M3+). É READ-ONLY: navega, lê e mede — nunca cria/edita/apaga
// dados. Logout fica atrás de DO_LOGOUT=1 (default off) p/ não matar a sessão
// do bot de screenshots.
//
// Reusa a infra existente (auth.mjs, node_modules/playwright, .env) e bate na
// ORIGEM (host-resolver MAP → 127.0.0.1), o mesmo bypass de Cloudflare das provas.
//
// Uso (no servidor, cwd = tools/screenshot):  node basal-caracterizacao.mjs
// Saídas:
//   - JSON versionável: docs/ELEVACAO-BASAL/evidencias/baseline-funcional-<data>.json
//   - Screenshots p/ validação visual do Jhony: storage/.../screenshots/basal-*.png
//   - Resumo no stdout (VERDES/VERMELHOS por jornada)
// ============================================================================
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';

// Resolve o Chromium do servidor sem depender de um caminho fixo. Ordem: PW_CHROME,
// cache do Playwright (chromium-* e headless-shell), node_modules local, sistema.
function resolveChrome() {
  if (process.env.PW_CHROME && existsSync(process.env.PW_CHROME)) return process.env.PW_CHROME;
  const globs = [
    ['/root/.cache/ms-playwright', /^chromium-\d+$/, 'chrome-linux/chrome'],
    ['/root/.cache/ms-playwright', /^chromium_headless_shell-\d+$/, 'chrome-headless-shell-linux64/chrome-headless-shell'],
    ['./node_modules/playwright-core/.local-browsers', /^chromium-\d+$/, 'chrome-linux/chrome'],
    ['./node_modules/playwright/.local-browsers', /^chromium-\d+$/, 'chrome-linux/chrome'],
    ['/opt/pw-browsers', /^chromium-\d+$/, 'chrome-linux/chrome'],
  ];
  for (const [base, re, tail] of globs) {
    try { for (const d of readdirSync(base).filter(x => re.test(x)).sort().reverse()) {
      const p = `${base}/${d}/${tail}`; if (existsSync(p)) return p;
    } } catch {}
  }
  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable']) if (existsSync(p)) return p;
  return undefined; // deixa o Playwright tentar o default (e falhar com mensagem clara)
}
const CHROME = resolveChrome();
console.log('[basal] Chromium:', CHROME || '(default do Playwright)');

const BASE = 'https://dshowdash.com.br';
const REPO = '/var/www/dshowdash';
const SHOTS = `${REPO}/storage/media/images/screenshots`;
const DATA = new Date().toISOString().slice(0, 10);
const OUTJSON = `${REPO}/docs/ELEVACAO-BASAL/evidencias/baseline-funcional-${DATA}.json`;
// Painéis read-only usados na jornada de navegação (seguros, montam rápido).
const PAINEIS = (process.env.BASAL_PANELS || 'panel-dashboard,panel-observability,panel-datatables').split(',');

const log = (...a) => console.log(...a);
const rel = {                       // resultado por jornada
  meta: { base: BASE, data: DATA, geradoEm: new Date().toISOString() },
  jornadas: {},
};
const errosConsole = [];

function reg(nome, ok, dados) { rel.jornadas[nome] = { ok, ...dados }; log(`${ok ? '✓' : '✗'} ${nome}`); }

const browser = await chromium.launch({
  headless: true,
  ...(CHROME ? { executablePath: CHROME } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
         '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
});
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, ignoreHTTPSErrors: true });
const netFail = [];
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { rel.meta.authCookieErro = e.message; }
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') errosConsole.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errosConsole.push('PAGEERROR: ' + e.message.slice(0, 300)));
page.on('response', r => { const s = r.status(); if (s >= 400) netFail.push(`${s} ${r.url().replace(BASE, '')}`); });

try {
  // ── Jornada 1 · BOOT a frio ──────────────────────────────────────────────
  const t0 = Date.now();
  const resp = await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  const bootMs = Date.now() - t0;
  const naLogin = await isLoginPage(page).catch(() => false);
  if (naLogin) { try { await loginViaPage(page); await page.waitForTimeout(2500); } catch (e) { rel.meta.loginViaPageErro = e.message; } }
  const shell = await page.evaluate(() => ({
    title: document.title,
    appShell: !!document.querySelector('[data-component="app-shell"], .app-shell, #app-shell'),
    header: !!document.querySelector('header, .header, [data-component="header"]'),
    sidebar: !!document.querySelector('.sidebar, [data-component="sidebar"], .dsd-sidebar'),
    navRail: !!document.querySelector('.nav-rail, [data-component="nav-rail"]'),
    footer: !!document.querySelector('footer, .footer, [data-component="footer"]'),
    main: !!document.querySelector('main, .main, [data-component="main"], .dsd-container'),
  }));
  await page.screenshot({ path: `${SHOTS}/basal-01-boot.png` }).catch(() => {});
  reg('01_boot', resp?.status() === 200 && (shell.appShell || shell.main), {
    httpStatus: resp?.status(), bootMs, naLoginAntesDeAuth: naLogin, shell,
    errosConsoleBoot: errosConsole.length, netFail4xx5xxBoot: [...netFail],
  });

  // ── Jornada 2 · AUTENTICAÇÃO ─────────────────────────────────────────────
  const check = await page.evaluate(async (b) => {
    try { const r = await fetch(`${b}/api/auth/check.php`, { credentials: 'include' });
      const j = await r.json().catch(() => ({}));
      return { status: r.status, ok: j.ok ?? j.success ?? null,
        temCsrf: !!(j.data?.session?.csrf_token), temUser: !!(j.data?.user || j.data?.session?.user) };
    } catch (e) { return { erro: String(e).slice(0, 200) }; }
  }, BASE);
  reg('02_autenticacao', check.status === 200 && !!check.ok, { checkPhp: check, autenticado: !naLogin || !!check.ok });

  // ── Jornada 3 · SHELL / inventário de navegação ──────────────────────────
  const inv = await page.evaluate(() => ({
    navItens: document.querySelectorAll('.sidebar a, .dsd-sidebar a, [data-panel-trigger], .nav-rail [data-panel]').length,
    triggers: document.querySelectorAll('[data-panel-trigger]').length,
  }));
  reg('03_shell', inv.navItens > 0, inv);

  // ── Jornada 4 · NAVEGAÇÃO entre painéis (read-only) ──────────────────────
  const navRes = [];
  for (const pid of PAINEIS) {
    const antes = errosConsole.length;
    let ok = false, marcador = null;
    try {
      await page.evaluate((p) => { location.hash = `#/${p}`; }, pid);
      await page.waitForTimeout(3500);
      marcador = await page.evaluate((p) => {
        const cont = document.querySelector('.dsd-container__content, [data-active-panel], main');
        return { hash: location.hash, temConteudo: !!cont && cont.childElementCount > 0,
          idAtivo: document.querySelector('[data-active-panel]')?.getAttribute('data-active-panel') || null };
      }, pid);
      ok = marcador.temConteudo;
      await page.screenshot({ path: `${SHOTS}/basal-04-${pid}.png` }).catch(() => {});
    } catch (e) { marcador = { erro: String(e).slice(0, 150) }; }
    navRes.push({ pid, ok, marcador, novosErrosConsole: errosConsole.length - antes });
  }
  reg('04_navegacao', navRes.some(r => r.ok), { paineis: navRes });

  // ── Jornada 5 · API autenticada (read-only) ──────────────────────────────
  const endpoints = ['/api/health', '/api/auth/check.php', '/api/user/preferences'];
  const apis = await page.evaluate(async (arg) => {
    const out = [];
    for (const ep of arg.endpoints) {
      try { const r = await fetch(arg.base + ep, { credentials: 'include' });
        let keys = []; try { const j = await r.json(); keys = j && typeof j === 'object' ? Object.keys(j).slice(0, 8) : []; } catch {}
        out.push({ ep, status: r.status, chavesTopo: keys });
      } catch (e) { out.push({ ep, erro: String(e).slice(0, 120) }); }
    }
    return out;
  }, { base: BASE, endpoints });
  reg('05_api_autenticada', apis.every(a => a.status && a.status < 500), { endpoints: apis });

  // ── Jornada 6 · PERSISTÊNCIA (só leitura) ────────────────────────────────
  const persist = await page.evaluate(async (b) => {
    const out = {};
    for (const ep of ['/api/user/preferences', '/api/user/layouts']) {
      try { const r = await fetch(b + ep, { credentials: 'include' }); out[ep] = r.status; } catch (e) { out[ep] = String(e).slice(0, 80); }
    }
    return out;
  }, BASE);
  reg('06_persistencia_leitura', Object.values(persist).some(v => v === 200), { endpoints: persist });

  // ── Jornada 7 · RECUPERAÇÃO DE ERRO (rota inexistente não derruba o shell) ─
  let recuperou = false, shellVivo = null;
  try {
    await page.evaluate(() => { location.hash = '#/panel-inexistente-zzz-basal'; });
    await page.waitForTimeout(2500);
    shellVivo = await page.evaluate(() => ({
      appShell: !!document.querySelector('[data-component="app-shell"], .app-shell, main, .dsd-container'),
      errorBoundary: !!document.querySelector('[data-error-boundary], .error-boundary'),
      telaBranca: document.body.innerText.trim().length < 20,
    }));
    recuperou = shellVivo.appShell && !shellVivo.telaBranca;
    await page.screenshot({ path: `${SHOTS}/basal-07-erro.png` }).catch(() => {});
  } catch (e) { shellVivo = { erro: String(e).slice(0, 150) }; }
  reg('07_recuperacao_erro', recuperou, { shellVivo });

  // ── Jornada 8 · LOGOUT (só presença; ação atrás de DO_LOGOUT=1) ──────────
  const logout = await page.evaluate(() => ({
    controlePresente: !!document.querySelector('[data-action="logout"], [href*="logout"], .logout, [data-logout]'),
  }));
  let logoutExec = null;
  if (process.env.DO_LOGOUT === '1') {
    try { const r = await page.evaluate(async (b) => (await fetch(`${b}/api/auth/logout.php`, { method: 'POST', credentials: 'include' })).status, BASE);
      logoutExec = r; } catch (e) { logoutExec = String(e).slice(0, 120); }
  }
  reg('08_logout', logout.controlePresente, { ...logout, logoutExecutado: logoutExec });

} catch (e) {
  rel.meta.erroFatal = String(e).slice(0, 400);
} finally {
  rel.resumo = {
    verdes: Object.entries(rel.jornadas).filter(([, v]) => v.ok).map(([k]) => k),
    vermelhos: Object.entries(rel.jornadas).filter(([, v]) => !v.ok).map(([k]) => k),
    totalErrosConsole: errosConsole.length,
    amostraErrosConsole: errosConsole.slice(0, 15),
    totalNetFail: netFail.length,
    amostraNetFail: netFail.slice(0, 20),
  };
  try { mkdirSync(`${REPO}/docs/ELEVACAO-BASAL/evidencias`, { recursive: true }); writeFileSync(OUTJSON, JSON.stringify(rel, null, 2)); } catch (e) { log('erro ao gravar JSON:', e.message); }
  await browser.close().catch(() => {});
  log('\n==== BASELINE FUNCIONAL ====');
  log('VERDES  :', rel.resumo.verdes.join(', ') || '(nenhum)');
  log('VERMELHOS:', rel.resumo.vermelhos.join(', ') || '(nenhum)');
  log('erros console:', rel.resumo.totalErrosConsole, '| net 4xx/5xx:', rel.resumo.totalNetFail);
  log('JSON:', OUTJSON);
}
