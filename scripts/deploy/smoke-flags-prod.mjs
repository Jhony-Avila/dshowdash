// scripts/deploy/smoke-flags-prod.mjs — SMOKE pós-flip de flag na PRODUÇÃO servida (rollout global u75 → todos).
// Diferente dos audits (que forçam a flag por localStorage), este smoke NÃO escreve override local: apaga a
// chave `dshow.avst.flags.v1` e deixa os módulos decidirem pela API (/api/feature-flags?action=resolve),
// autenticado como o usuário de serviço (screenshot-bot, u546 — sem override; NÃO é o canário u75).
// Mede por viewport: html[data-mobile-header-v2], html[data-shell-layout-v2], decisão do resolve (enabled/source),
// overflow-x, erros de página (pageerror) e erros de console; health da API. Exit 1 se algo divergir do esperado.
// Uso:  node scripts/deploy/smoke-flags-prod.mjs --out /backup/x/smoke --expect header=on,shell=off [--baseline <smoke.json>]
//       --expect usa on|off|any por flag; --baseline compara cerr por cenário (novo erro de console = FAIL).
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TOOLS = process.env.MH2_TOOLS || '/var/www/dshowdash/tools/screenshot';
const pkg = (await import(TOOLS + '/node_modules/playwright/index.js')).default;
const { isLoginPage, loginViaPage } = await import(TOOLS + '/auth.mjs');
const { chromium } = pkg;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] ?? true) : d; };
const OUT = resolve(String(opt('out', '/tmp/smoke-flags')));
const BASE = process.env.MH2_BASE || 'https://dshowdash.com.br';
const VIEWPORTS = String(opt('viewports', '390x844,1440x900')).split(',').map((s) => s.split('x').map(Number));
const EXPECT = Object.fromEntries(String(opt('expect', 'header=any,shell=any')).split(',').map((p) => p.split('=')));
const BASELINE = opt('baseline', null) ? JSON.parse(readFileSync(String(opt('baseline')), 'utf8')) : null;
const FLAGS = { header: 'as6.mobile_header_v2', shell: 'as6.shell_layout_v2' };
mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log('[smoke]', ...a);

const health = await fetch(BASE + '/api/health').then((r) => r.status).catch(() => 0);
log('health', health);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1, MAP www.dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const result = { version: '1.0.0', base: BASE, at: new Date().toISOString(), health, expect: EXPECT, scenarios: [] };
let cookies = null;
for (const [vw, vh] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, ignoreHTTPSErrors: true, isMobile: vw < 700, hasTouch: vw < 700 });
  if (cookies) await ctx.addCookies(cookies);
  // SEM override local: garante que a decisão vem do servidor
  await ctx.addInitScript(() => { try { localStorage.removeItem('dshow.avst.flags.v1'); localStorage.setItem('avst.vc.onboarded', '1'); } catch {} });
  const page = await ctx.newPage();
  const perr = [], cerr = [];
  page.on('pageerror', (e) => perr.push(String(e && e.message || e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') cerr.push(m.text().slice(0, 200)); });
  const tag = `${vw}x${vh}`;
  const s = { tag, vw, vh, ok: false };
  try {
    await page.goto(BASE + '/#/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const chegou = await Promise.race([page.waitForSelector('.site-header', { timeout: 25000 }).then(() => 'shell').catch(() => null), page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 25000 }).then(() => 'login').catch(() => null)]);
    if (chegou === 'login' || ((await isLoginPage(page)) && await page.isVisible('input[type="password"]').catch(() => false))) { await loginViaPage(page); try { cookies = await ctx.cookies(); } catch {} }
    await page.waitForSelector('.site-header', { timeout: 30000 }); await page.waitForSelector('[data-region="main"]', { timeout: 30000 });
    await page.waitForSelector('.preloader-container', { state: 'hidden', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(4000);
    const m = await page.evaluate(async (FLAGS) => {
      const h = document.documentElement;
      const rs = {};
      for (const [k, f] of Object.entries(FLAGS)) {
        try {
          const r = await fetch('/api/feature-flags?action=resolve&flag=' + encodeURIComponent(f), { credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' } });
          const j = await r.json(); const fl = (j && j.data && j.data.flag) || (j && j.flag) || {};
          rs[k] = { http: r.status, enabled: fl.enabled === true, source: fl.source || null, rollout: fl.rollout_percentage ?? null };
        } catch (e) { rs[k] = { http: 0, enabled: false, source: 'fetch_error' }; }
      }
      return {
        headerAttr: h.getAttribute('data-mobile-header-v2'), shellAttr: h.getAttribute('data-shell-layout-v2'), device: document.body.getAttribute('data-device'),
        localOverride: (() => { try { return localStorage.getItem('dshow.avst.flags.v1'); } catch { return null; } })(),
        overflowX: Math.max(0, h.scrollWidth - h.clientWidth), regions: ['sidebar', 'main', 'footer'].map((r) => !!document.querySelector('[data-region="' + r + '"]')),
        resolve: rs,
      };
    }, FLAGS);
    Object.assign(s, m);
    await page.screenshot({ path: resolve(OUT, `${tag}.png`), fullPage: false }).catch(() => {});
    s.ok = true;
  } catch (e) { s.erro = String(e && e.message || e).slice(0, 300); }
  s.perr = perr.length; s.cerr = cerr.length; s.perrList = perr.slice(0, 5); s.cerrList = cerr.slice(0, 8);
  result.scenarios.push(s);
  log(tag, JSON.stringify({ ok: s.ok, header: s.headerAttr, shell: s.shellAttr, resolve: s.resolve, overflowX: s.overflowX, perr: s.perr, cerr: s.cerr, erro: s.erro }));
  await ctx.close();
}
await browser.close();

// ── gates do smoke ──
const gates = [];
const G = (nome, ok, det) => { gates.push(`${ok ? 'PASS' : 'FAIL'} ${nome} — ${det}`); return ok; };
G('HEALTH_200', health === 200, `http=${health}`);
G('ALL_SCENARIOS_LOADED', result.scenarios.every((s) => s.ok), result.scenarios.map((s) => `${s.tag}:${s.ok ? 'ok' : s.erro}`).join(' · '));
G('NO_LOCAL_OVERRIDE', result.scenarios.every((s) => !s.localOverride), 'decisão vem do servidor');
G('NO_PAGE_ERRORS', result.scenarios.every((s) => s.perr === 0), result.scenarios.map((s) => `${s.tag}: perr=${s.perr}${s.perr ? ' ' + JSON.stringify(s.perrList) : ''}`).join(' · '));
G('NO_HORIZONTAL_OVERFLOW', result.scenarios.every((s) => (s.overflowX || 0) === 0), result.scenarios.map((s) => `${s.tag}: ${s.overflowX}`).join(' · '));
for (const [k, f] of Object.entries(FLAGS)) {
  const exp = EXPECT[k] || 'any';
  if (exp === 'any') { gates.push(`INFO ${f} — ` + result.scenarios.map((s) => `${s.tag}: attr=${k === 'header' ? s.headerAttr : s.shellAttr} resolve=${JSON.stringify(s.resolve && s.resolve[k])}`).join(' · ')); continue; }
  const want = exp === 'on';
  G(`${f}_RESOLVE_${exp.toUpperCase()}`, result.scenarios.every((s) => s.resolve && s.resolve[k] && s.resolve[k].http === 200 && s.resolve[k].enabled === want && (!want || s.resolve[k].source === 'global')),
    result.scenarios.map((s) => `${s.tag}: ${JSON.stringify(s.resolve && s.resolve[k])}`).join(' · '));
  // atributo no DOM: header v2 só se aplica em modo compacto (data-device), layout v2 em todo viewport
  G(`${f}_DOM_${exp.toUpperCase()}`, result.scenarios.every((s) => {
    const attr = k === 'header' ? s.headerAttr : s.shellAttr;
    if (!want) return attr !== 'on';
    if (k === 'header' && s.vw >= 1024) return attr === 'on' || attr === null; // no desktop o header v2 pode ficar inerte (contrato do módulo)
    return attr === 'on';
  }), result.scenarios.map((s) => `${s.tag}: ${k === 'header' ? s.headerAttr : s.shellAttr} (device=${s.device})`).join(' · '));
}
if (BASELINE) {
  const bl = Object.fromEntries((BASELINE.scenarios || []).map((s) => [s.tag, s.cerr]));
  G('NO_NEW_CONSOLE_ERRORS_VS_BASELINE', result.scenarios.every((s) => s.cerr <= (bl[s.tag] ?? 0)), result.scenarios.map((s) => `${s.tag}: cerr=${s.cerr} (baseline ${bl[s.tag] ?? '-'})${s.cerr > (bl[s.tag] ?? 0) ? ' ' + JSON.stringify(s.cerrList) : ''}`).join(' · '));
} else {
  gates.push('INFO CONSOLE_ERRORS (baseline) — ' + result.scenarios.map((s) => `${s.tag}: cerr=${s.cerr}`).join(' · '));
}
const falhas = gates.filter((g) => g.startsWith('FAIL')).length;
const txt = `# SMOKE flags prod — ${result.at} — base=${BASE} — expect=${JSON.stringify(EXPECT)}\n` + gates.join('\n') + `\n# ${falhas ? falhas + ' FAIL' : 'TODOS PASS'} (${gates.filter((g) => !g.startsWith('INFO')).length} gates)\n`;
writeFileSync(resolve(OUT, 'smoke.json'), JSON.stringify(result, null, 2));
writeFileSync(resolve(OUT, 'SMOKE.txt'), txt);
console.log(txt);
process.exit(falhas ? 1 : 0);
