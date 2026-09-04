// auditoria-auth.mjs — auditoria autenticada ZERO-EDIT do candidato, dirigida por ARQUIVO DE CONFIG versionado.
// NAO edite este arquivo. Configuracao NAO-secreta vem de AUDIT_CONFIG (json versionado).
// Segredos/ambiente vem SO por env: BASE_URL, STORAGE_STATE, CHROME_PATH, OUT.
//
// Uso:
//   AUDIT_CONFIG=/caminho/audit.config.json BASE_URL=https://staging STORAGE_STATE=/caminho/state.json \
//   CHROME_PATH=/.../chrome OUT=/caminho/out node auditoria-auth.mjs
//   node auditoria-auth.mjs --help
//
// Config (json, sem segredos):
//   candidate.expectedSha / candidate.expectedTree
//   allowlist: ["dshowdash.com.br","127.0.0.1","localhost"]  (hosts permitidos p/ BASE_URL, API e redirects)
//   scope: "full" | "panel"   (full exige shell global; panel = AUTHENTICATED_PANEL_PREVIEW)
//   avatarRoute: "/"
//   avatarTriggers: [seletor|texto, ...]     (tentados em ordem)
//   navigation.preferRouter / navigation.routerGlobals: ["__router","app.router",...]
//   shell.expectedSha (ou shell.composition documentada) / shell.header[] shell.sidebar[] shell.navrail[] shell.footer[] shell.main[]
//   viewports: ["320x568",...]
//
// Sempre fail-closed: qualquer condicao invalida -> exit != 0, nada e "passado".

import fs from 'fs';
import path from 'path';

const HELP = `auditoria-auth.mjs — auditoria autenticada zero-edit (config-file driven)

OBRIGATORIO (env):
  AUDIT_CONFIG   caminho do audit.config.json versionado (sem segredos)
  BASE_URL       origem que serve o CANDIDATO (staging/preview) — nunca a main
  CHROME_PATH    caminho do chromium (playwright-core)
  STORAGE_STATE  storageState.json de sessao autenticada (perm 600; nunca vai ao git/pacote/log)

OPCIONAL (env):
  OUT            diretorio de saida (default ./auth-out)

TUDO que e seletor/rota/identidade vem do AUDIT_CONFIG. Nunca edite este script.
Saidas: <OUT>/AUTHENTICATED_ROUTE_REPORT.json + screenshots + logs de console por viewport.
Exit != 0 em qualquer viewport ruim, identidade divergente, storage inseguro, host fora da allowlist.
`;

if (process.argv.includes('--help') || process.argv.includes('-h')) { process.stdout.write(HELP); process.exit(0); }

function die(msg, code) { console.error('FAIL_CLOSED: ' + msg); process.exit(code || 2); }
function req(k) { const v = process.env[k]; if (!v) die('falta env ' + k, 3); return v; }

// ---- config ----
const CFG_PATH = req('AUDIT_CONFIG');
if (!fs.existsSync(CFG_PATH)) die('AUDIT_CONFIG nao existe: ' + CFG_PATH, 3);
let CFG;
try { CFG = JSON.parse(fs.readFileSync(CFG_PATH, 'utf8')); } catch (e) { die('AUDIT_CONFIG json invalido: ' + e, 3); }

const BASE = req('BASE_URL').replace(/\/$/, '');
const STATE = req('STORAGE_STATE');
const CHROME = req('CHROME_PATH');
const OUT = process.env.OUT || './auth-out';

const EXPECTED = (CFG.candidate && CFG.candidate.expectedSha) || die('config.candidate.expectedSha ausente', 3);
const EXPECTED_TREE = (CFG.candidate && CFG.candidate.expectedTree) || '';
const SHELL_EXPECTED = (CFG.shell && CFG.shell.expectedSha) || EXPECTED; // por padrao o shell tambem deve ser o candidato
const SCOPE = (CFG.scope === 'panel') ? 'panel' : 'full';
const EXPECT_FULL_SHELL = SCOPE === 'full';
const ALLOW = Array.isArray(CFG.allowlist) ? CFG.allowlist : [];
const ROUTE = process.env.BASE_ROUTE || CFG.avatarRoute || '/';
const TRIGGERS = Array.isArray(CFG.avatarTriggers) ? CFG.avatarTriggers : [];
const NAV = CFG.navigation || {};
const ROUTER_GLOBALS = Array.isArray(NAV.routerGlobals) ? NAV.routerGlobals : [];
const SH = CFG.shell || {};
const REGIONS = ['header', 'sidebar', 'navrail', 'footer', 'main'];
const VIEWS = (Array.isArray(CFG.viewports) && CFG.viewports.length ? CFG.viewports : ['320x568', '390x844', '412x915', '844x390', '1280x720'])
  .map(s => s.split('x').map(Number));

try { fs.mkdirSync(OUT, { recursive: true }); } catch (e) {}

// ---- allowlist do BASE_URL ----
function hostOf(u) { try { return new URL(u).hostname; } catch (e) { return ''; } }
function allowed(host) { return ALLOW.some(a => host === a || host.endsWith('.' + a)); }
const BASE_HOST = hostOf(BASE);
if (!BASE_HOST) die('BASE_URL invalida: ' + BASE, 4);
if (ALLOW.length && !allowed(BASE_HOST)) die('BASE_URL fora da allowlist: ' + BASE_HOST, 4);

// ---- preflight de storage-state (NUNCA imprime conteudo) ----
const storage = { STORAGE_FILE_EXISTS: 'NO', STORAGE_MODE: '', STORAGE_NONEMPTY: 'NO', STORAGE_CAPTURE_DATE: '', STORAGE_COOKIE_EXPIRY_CLASS: '' };
if (!fs.existsSync(STATE)) die('STORAGE_STATE nao existe (nao imprimimos caminho de segredo em log publico)', 5);
storage.STORAGE_FILE_EXISTS = 'YES';
const st = fs.statSync(STATE);
const mode = (st.mode & 0o777).toString(8).padStart(3, '0');
storage.STORAGE_MODE = mode;
if (mode !== '600' && mode !== '400') die('STORAGE_STATE com permissao insegura (' + mode + '); exija 600', 5);
storage.STORAGE_NONEMPTY = st.size > 2 ? 'YES' : 'NO';
if (storage.STORAGE_NONEMPTY !== 'YES') die('STORAGE_STATE vazio', 5);
storage.STORAGE_CAPTURE_DATE = new Date(st.mtimeMs).toISOString().slice(0, 10);
try {
  const sj = JSON.parse(fs.readFileSync(STATE, 'utf8'));
  const cks = (sj.cookies || []);
  const now = Date.now() / 1000;
  let cls = 'sem-expiry';
  const exps = cks.map(c => c.expires).filter(e => typeof e === 'number' && e > 0);
  if (exps.length) { const min = Math.min(...exps); cls = min < now ? 'EXPIRADO' : (min - now < 86400 ? 'EXPIRA<24h' : 'OK'); }
  storage.STORAGE_COOKIE_EXPIRY_CLASS = cls;
  if (cls === 'EXPIRADO') die('cookies do storage-state expirados; recapture', 5);
} catch (e) { die('STORAGE_STATE json invalido', 5); }

// ---- chromium ----
if (!fs.existsSync(CHROME)) die('CHROME_PATH nao existe: ' + CHROME, 3);
let chromium;
try { ({ chromium } = await import('playwright-core')); } catch (e) { die('playwright-core ausente: ' + e, 3); }

// selector-resolver injetado na pagina; devolve o vencedor e diagnostico. NUNCA aceita body/html como main.
const RESOLVER = `(function(cands, opts){
  opts = opts || {};
  const vis = (el) => { if(!el||!el.isConnected) return false; const b=el.getBoundingClientRect(); const s=getComputedStyle(el); return b.width>0&&b.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&s.opacity!=='0'; };
  for (const sel of cands) {
    let list = [];
    try { list = Array.from(document.querySelectorAll(sel)); } catch(e) { continue; }
    if (opts.byText && !list.length) {
      const rx = new RegExp(sel, 'i');
      list = Array.from(document.querySelectorAll('a,button,[role=link],[role=button],[role=menuitem]')).filter(e => rx.test((e.textContent||'').trim()));
    }
    const visible = list.filter(vis);
    if (!visible.length) continue;
    if (opts.requireUnique && visible.length > 1) { return { sel, matched: false, reason: 'AMBIGUO('+visible.length+')' }; }
    const el = visible[0];
    if (opts.rejectBody && (el === document.body || el === document.documentElement)) { return { sel, matched:false, reason:'BODY_REJEITADO' }; }
    return { sel, matched: true, count: visible.length };
  }
  return { sel: null, matched: false, reason: 'NENHUM_CANDIDATO' };
})`;

const rows = [];
const b = await chromium.launch({ headless: true, executablePath: CHROME });

for (const [w, h] of VIEWS) {
  const nome = w + 'x' + h; const r = { viewport: nome };
  const ctx = await b.newContext({ viewport: { width: w, height: h }, storageState: STATE, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = [], perr = [], failed = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => perr.push(String(e)));
  p.on('requestfailed', rq => { const u = rq.url(); if (!/^data:|^blob:/.test(u)) failed.push(u + ' :: ' + (rq.failure() ? rq.failure().errorText : '?')); });
  try {
    await p.goto(BASE + ROUTE, { waitUntil: 'networkidle', timeout: 30000 });
    // redirect fora da allowlist?
    const finalHost = hostOf(p.url());
    r.ROUTE_BEFORE = p.url();
    if (ALLOW.length && finalHost && !allowed(finalHost)) { r.REDIRECT_UNAUTHORIZED = finalHost; rows.push(r); await ctx.close(); continue; }
    r.AUTH_SESSION_REAL = await p.evaluate(() => !!(document.cookie || (window.localStorage && localStorage.length))) ? 'YES' : 'DESCONHECIDO';
    // identidade
    r.VC_SERVED_SHA = await p.evaluate(() => window.__servedSha || (window.__avstIdent && window.__avstIdent.vc) || '');
    r.SHELL_SERVED_SHA = await p.evaluate(() => window.__shellSha || (window.__avstIdent && window.__avstIdent.shell) || window.__servedSha || '');
    r.INDEX_SERVED_HASH = await p.evaluate(() => window.__indexHash || '');
    r.VC_BUNDLE_HASH = await p.evaluate(() => window.__vcBundleHash || '');
    r.EXPECTED_SHA = EXPECTED; r.SHELL_EXPECTED_SHA = SHELL_EXPECTED;
    let idm = 'YES';
    if (r.VC_SERVED_SHA && r.VC_SERVED_SHA !== EXPECTED) idm = 'NO-MIX(VC=' + r.VC_SERVED_SHA + ')';
    else if (!r.VC_SERVED_SHA) idm = 'NO(VC_DESCONHECIDO)';
    else if (EXPECT_FULL_SHELL && r.SHELL_SERVED_SHA && r.SHELL_SERVED_SHA !== SHELL_EXPECTED) idm = 'NO-MIX(SHELL=' + r.SHELL_SERVED_SHA + ')';
    else if (EXPECT_FULL_SHELL && !r.SHELL_SERVED_SHA) idm = 'NO(SHELL_DESCONHECIDO)';
    r.IDENTITY_MATCH = idm;
    // descoberta/abertura da rota do Avatar Studio
    let trig = null, discovery = 'nenhum';
    if (await p.locator('.vc-root').count()) { trig = '(ja-montado)'; discovery = 'ja-montado'; }
    if (!trig && NAV.preferRouter && ROUTER_GLOBALS.length) {
      for (const g of ROUTER_GLOBALS) {
        try {
          const ok = await p.evaluate((gg, rr) => { try { const obj = gg.split('.').reduce((o, k) => (o ? o[k] : undefined), window); if (obj && typeof obj.navigate === 'function') { obj.navigate(rr); return true; } if (obj && typeof obj.push === 'function') { obj.push(rr); return true; } } catch (e) {} return false; }, g, ROUTE);
          if (ok) { await p.waitForSelector('.vc-root', { timeout: 8000 }); trig = 'router:' + g; discovery = 'router'; break; }
        } catch (e) {}
      }
    }
    if (!trig) {
      for (const t of TRIGGERS) {
        try {
          const res = await p.evaluate(([sel, resolver]) => { const R = eval(resolver); const hit = R([sel], { byText: true }); if (hit.matched) { const el = document.querySelector(hit.sel) || Array.from(document.querySelectorAll('a,button,[role=link],[role=button],[role=menuitem]')).find(e => new RegExp(sel, 'i').test((e.textContent || '').trim())); if (el) { el.click(); return hit.sel; } } return null; }, [t, RESOLVER]);
          if (res) { await p.waitForSelector('.vc-root', { timeout: 8000 }); trig = res; discovery = 'trigger'; break; }
        } catch (e) {}
      }
    }
    r.AVATAR_ROUTE_DISCOVERY = ROUTE; r.AVATAR_TRIGGER_DISCOVERY = TRIGGERS.join(' | ') || '(nenhum)';
    r.TRIGGER_USED = trig || '(nenhum)'; r.AVATAR_OPEN_RESULT = trig ? 'OK(' + discovery + ')' : 'FAILED';
    r.ROUTE_AFTER = p.url();
    r.VC_ROOT = (await p.locator('.vc-root').count()) ? 'YES' : 'NO';

    if (r.VC_ROOT === 'YES') {
      // resolucao de seletores do shell (por regiao, lista em ordem)
      const sel = {};
      for (const reg of REGIONS) {
        const cands = Array.isArray(SH[reg]) ? SH[reg] : [];
        if (!cands.length) { r[reg.toUpperCase() + '_SELECTOR'] = EXPECT_FULL_SHELL ? 'SEM_CANDIDATO' : 'n/a'; sel[reg] = null; continue; }
        const opts = reg === 'main' ? { requireUnique: false, rejectBody: true } : {};
        const hit = await p.evaluate(([c, o, resolver]) => eval(resolver)(c, o), [cands, opts, RESOLVER]);
        r[reg.toUpperCase() + '_SELECTOR'] = hit.matched ? hit.sel : (hit.reason || 'NAO_ENCONTRADO');
        sel[reg] = hit.matched ? hit.sel : null;
      }
      r.PANEL_HOST_SELECTOR = await p.evaluate(() => { const rt = document.querySelector('.vc-root'); const h = rt && rt.parentElement; if (!h) return ''; if (h.id) return '#' + h.id; const dr = h.getAttribute('data-region'); if (dr) return "[data-region='" + dr + "']"; return h.tagName.toLowerCase() + (h.className ? '.' + String(h.className).trim().split(/\\s+/)[0] : ''); });
      // main obrigatorio no escopo full
      if (EXPECT_FULL_SHELL && !sel.main) { r.MAIN_RESOLUTION = 'FALHOU'; }
      // metricas geometricas + do shell
      const geo = await p.evaluate((s) => {
        const root = document.querySelector('.vc-root'); const host = root ? root.parentElement : null;
        const q = (x) => x ? document.querySelector(x) : null;
        const main = q(s.main) || host;
        const cs = host ? getComputedStyle(host) : null;
        const rr = root.getBoundingClientRect(); const mr = main ? main.getBoundingClientRect() : rr;
        const vis = (el) => { if (!el) return false; const b = el.getBoundingClientRect(); const st = getComputedStyle(el); return b.width > 0 && b.height > 0 && st.visibility !== 'hidden' && st.display !== 'none'; };
        const bodyLock = getComputedStyle(document.body).overflow === 'hidden' || getComputedStyle(document.documentElement).overflow === 'hidden';
        return {
          HOST_POSITION: cs ? cs.position : 'n/a', HOST_MIN_HEIGHT: cs ? cs.minHeight : 'n/a',
          VC_CONTAINED_IN_MAIN: (rr.left >= mr.left - 2 && rr.top >= mr.top - 2 && rr.right <= mr.right + 2 && rr.bottom <= mr.bottom + 2) ? 'YES' : 'NO',
          BODY_OVERFLOW_X: (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) ? 'YES' : 'NO',
          MAIN_OVERFLOW_X: main ? (main.scrollWidth > main.clientWidth + 1 ? 'YES' : 'NO') : 'n/a',
          HEADER_VISIBLE: s.header ? (vis(q(s.header)) ? 'YES' : 'NO') : 'n/a',
          SIDEBAR_VISIBLE: s.sidebar ? (vis(q(s.sidebar)) ? 'YES' : 'NO') : 'n/a',
          NAVRAIL_VISIBLE: s.navrail ? (vis(q(s.navrail)) ? 'YES' : 'NO') : 'n/a',
          FOOTER_VISIBLE: s.footer ? (vis(q(s.footer)) ? 'YES' : 'NO') : 'n/a',
          BODY_SCROLL_LOCK: bodyLock ? 'YES' : 'NO',
          CLASSIC_PRESENT: (!!document.querySelector('.avst-topo') || !!document.querySelector('.avst-categorias')) ? 'YES' : 'NO',
        };
      }, sel);
      Object.assign(r, geo);
      // colisoes de z-index (elementos do shell fora do .vc-root com z maior sobrepondo o palco)
      r.Z_INDEX_COLLISIONS = await p.evaluate(() => {
        const root = document.querySelector('.vc-root'); if (!root) return 'n/a'; const rb = root.getBoundingClientRect();
        const zRoot = parseInt(getComputedStyle(root).zIndex) || 0; let col = 0;
        for (const el of document.querySelectorAll('body *')) { if (root.contains(el) || el.contains(root)) continue; const s = getComputedStyle(el); if (s.position === 'static') continue; const z = parseInt(s.zIndex); if (!(z > zRoot)) continue; const bx = el.getBoundingClientRect(); if (bx.width < 4 || bx.height < 4) continue; if (!(bx.right < rb.left || bx.left > rb.right || bx.bottom < rb.top || bx.top > rb.bottom)) col++; }
        return String(col);
      });
      // interacoes principais
      await p.evaluate(() => { const c = [...document.querySelectorAll('.vc-trilho .vc-cat')].find(x => /Rosto/.test(x.textContent || '')); if (c) c.click(); }); await p.waitForTimeout(300);
      r.CATEGORY_SWITCH = /rosto/i.test(await p.evaluate(() => document.querySelector('.vc-cat-ativa')?.textContent || '')) ? 'YES' : 'NO';
      const antes = await p.locator('.vc-palco-wrap').first().innerHTML().catch(() => '');
      await p.evaluate(() => { const cs = document.querySelectorAll('.vc-grade .vc-card-btn'); if (cs[1]) cs[1].click(); }); await p.waitForTimeout(500);
      r.ASSET_APPLY = (antes !== (await p.locator('.vc-palco-wrap').first().innerHTML().catch(() => ''))) ? 'YES' : 'NO';
      await p.evaluate(() => { const el = document.querySelector('[aria-label="Cores"]'); if (el) el.click(); }); await p.waitForTimeout(300);
      r.CORES_OPEN = (await p.locator('.vc-cores-sheet').count()) ? 'YES' : 'NO'; await p.keyboard.press('Escape');
      // Conquistas + Ajuda via Mais
      const mais = async (grp, item) => { await p.evaluate(() => { const b = [...document.querySelectorAll('.vc-acao')].find(x => x.getAttribute('aria-label') === 'Mais'); if (b) b.click(); }); await p.waitForTimeout(200); await p.evaluate((g) => { const x = [...document.querySelectorAll('.vc-mp-grupo-cab')].find(e => new RegExp(g).test(e.textContent || '')); if (x && x.getAttribute('aria-expanded') !== 'true') x.click(); }, grp); await p.waitForTimeout(150); await p.evaluate((it) => { const x = [...document.querySelectorAll('.vc-mp-item')].find(e => new RegExp(it).test(e.textContent || '')); if (x) x.click(); }, item); await p.waitForTimeout(500); const ok = await p.evaluate(() => !!document.querySelector('.vc-mp-tool')); await p.keyboard.press('Escape'); return ok ? 'YES' : 'NO'; };
      r.CONQUISTAS = await mais('Revisar', 'Conquistas');
      r.AJUDA = await mais('Prefer', 'Ajuda');
      // salvar (backend REAL)
      await p.evaluate(() => { const s = document.querySelector('.vc-salvar'); if (s) s.click(); }); const t0 = Date.now(); let est = '';
      while (Date.now() - t0 < 8000) { est = await p.locator('.vc-salvar').getAttribute('data-estado').catch(() => '') || ''; if (est === 'salvo' || est === 'erro') break; await p.waitForTimeout(150); }
      r.SAVE_RESULT = est || 'timeout';
      // fechar / voltar
      await p.evaluate(() => { const v = [...document.querySelectorAll('.vc-acao')].find(x => x.getAttribute('aria-label') === 'Voltar'); if (v) v.click(); }); await p.waitForTimeout(400);
      r.CLOSE_AND_RETURN = 'executado';
    }
    r.CONSOLE_ERRORS = String(errs.length); r.PAGE_ERRORS = String(perr.length); r.FAILED_REQUESTS = String(failed.length);
    try { await p.screenshot({ path: OUT + '/auth-' + nome + '.png', fullPage: false }); } catch (e) {}
    if (errs.length || perr.length || failed.length) fs.appendFileSync(OUT + '/AUTH_CONSOLE_' + nome + '.txt', ['ERR', ...errs, 'PAGEERR', ...perr, 'REQFAIL', ...failed].join('\n'));
  } catch (e) { r.ERRO = String(e); }
  Object.assign(r, storage);
  rows.push(r); console.log('=== ' + nome + ' ===\n' + JSON.stringify(r, null, 1));
  await ctx.close();
}
await b.close();

fs.writeFileSync(OUT + '/AUTHENTICATED_ROUTE_REPORT.json', JSON.stringify({ base: BASE, scope: SCOPE, expected: EXPECTED, expected_tree: EXPECTED_TREE, shell_expected: SHELL_EXPECTED, classification: SCOPE === 'panel' ? 'AUTHENTICATED_PANEL_PREVIEW' : 'AUTHENTICATED_REAL_ROUTE', rows }, null, 2));

const bad = rows.filter(r =>
  r.IDENTITY_MATCH !== 'YES' || r.VC_ROOT !== 'YES' || (r.AVATAR_OPEN_RESULT || '').startsWith('FAILED') ||
  r.REDIRECT_UNAUTHORIZED || Number(r.CONSOLE_ERRORS || 0) > 0 || Number(r.PAGE_ERRORS || 0) > 0 || Number(r.FAILED_REQUESTS || 0) > 0 ||
  (EXPECT_FULL_SHELL && (r.MAIN_RESOLUTION === 'FALHOU' || r.VC_CONTAINED_IN_MAIN === 'NO'))
);
console.log('CLASSIFICACAO=' + (SCOPE === 'panel' ? 'AUTHENTICATED_PANEL_PREVIEW' : 'AUTHENTICATED_REAL_ROUTE'));
console.log('RESULTADO=' + (bad.length ? 'FAIL (' + bad.map(r => r.viewport).join(',') + ')' : 'PASS'));
process.exit(bad.length ? 1 : 0);
