// scripts/header/audit-mobile-header.mjs — auditoria do HEADER MOBILE no shell REAL.
// @version 1.2.0  @created 2026-09-11  (lote as6.mobile_header_v2 — doc 23)
//
// Mede, em sessão AUTENTICADA (screenshot-bot, caminho sancionado de tools/screenshot/auth.mjs),
// o empilhamento header → ticker → main, áreas EFETIVAS de toque (elementFromPoint no centro
// e nos 4 cantos do alvo), nomes acessíveis, badge cortado, overflow horizontal do documento,
// títulos visíveis duplicados, layout shift no scroll, erros de console/página/rede, o menu
// "Mais", teclado real (Tab) com foco visível, o painel Avatar Studio (barra interna + título
// externo) e o contador de listeners/observers do módulo v2 (leak em 3 trocas de painel +
// restauração total no deactivate()).
//
// Por padrão bate no PREVIEW do worktree (scripts/header/preview-shell.mjs, porta 8902), que
// serve o candidato e faz proxy da API/PHP para o origin. MH2_BASE=https://dshowdash.com.br
// mede a produção (baseline).
//
// Uso (da raiz do repo):
//   node scripts/header/audit-mobile-header.mjs --phase before --flag off --out /tmp/mh2/before
//   node scripts/header/audit-mobile-header.mjs --phase after  --flag on  --out /tmp/mh2/after
// Opções: --viewports 375x812,844x390  --routes dash,avatar  --themes dark,light
//         --safe-top 47 (simula safe-area superior via token --shell-safe-top)
//         --ticker on|off  --rm (prefers-reduced-motion)  --zoom 2 (texto 200%)
//         --long-name (nome longo no header)  --badge 1|3 (dígitos)  --leak (teste de leak/restauração)
// Saída: <out>/audit.json + PNGs por cenário. Exit 0 sempre (quem decide é gates-mobile-header.mjs).
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const TOOLS = process.env.MH2_TOOLS || '/var/www/dshowdash/tools/screenshot';
const pkg = (await import(TOOLS + '/node_modules/playwright/index.js')).default;
const { getSessionCookies, isLoginPage, loginViaPage } = await import(TOOLS + '/auth.mjs');
const { chromium } = pkg;

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] ?? true) : d; };
const has = (k) => args.includes('--' + k);
const PHASE = opt('phase', 'after');
const FLAG = opt('flag', 'off') === 'on';
const OUT = resolve(String(opt('out', `/tmp/mh2/${PHASE}`)));
const VIEWPORTS = String(opt('viewports', '320x568,375x812,390x844,393x852,430x932,768x1024,844x390,932x430,1440x900')).split(',').map((s) => s.split('x').map(Number));
const ROUTES = String(opt('routes', 'dash,avatar')).split(',');
const THEMES = String(opt('themes', 'dark')).split(',');
const SAFE_TOP = Number(opt('safe-top', 0));
const TICKER = String(opt('ticker', 'on'));
const RM = has('rm');
const ZOOM = Number(opt('zoom', 1));
const LONG_NAME = has('long-name');
const BADGE = Number(opt('badge', 0));
const LEAK = has('leak');
const BASE = process.env.MH2_BASE || 'http://127.0.0.1:8902'; // preview-shell.mjs (worktree + proxy do origin)
const ROUTE_HASH = { dash: '#/', avatar: process.env.MH2_AVATAR_ROUTE || '#/panel-avatar-studio' };
const BADGE_SEL = '.notifications-badge, .gcal-badge, .header-badge, .ti-badge';
mkdirSync(OUT, { recursive: true });

const log = (...a) => console.log('[mh2]', ...a);
const results = { version: '1.2.0', phase: PHASE, flag: FLAG, base: BASE, at: new Date().toISOString(), safeTop: SAFE_TOP, ticker: TICKER, rm: RM, zoom: ZOOM, longName: LONG_NAME, badge: BADGE, scenarios: [] };

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1, MAP www.dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
});

let cookies = null;
// cookie de API só vale no domínio real; no preview (127.0.0.1) o login é pelo formulário (caminho do usuário)
if (/dshowdash\.com\.br/.test(BASE)) { try { cookies = await getSessionCookies(); } catch (e) { log('warn cookie:', e.message); } }

// ── medição no DOM (roda dentro da página) ────────────────────────────────
const MEDIR = ({ badgeSel }) => {
  const q = (s) => document.querySelector(s);
  const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom), r: Math.round(r.right) }; };
  const vis = (el) => { for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false; if (n.hidden) return false; } const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const headerRegion = q('[data-region="header"]'), ticker = q('[data-region="ticker"]'), main = q('[data-region="main"]');
  const siteHeader = q('.site-header'), inner = q('.site-header .header-inner');
  const hr = R(headerRegion), tr = R(ticker), mr = R(main);
  const tickerVisible = !!(ticker && vis(ticker) && !ticker.classList.contains('dsd-shell__region--hidden') && tr.h > 0);
  const cs = getComputedStyle(document.documentElement);
  const tokens = {};
  for (const t of ['--shell-safe-top', '--shell-header-content-height', '--shell-header-total-height', '--shell-ticker-height', '--shell-top-stack-height', '--shell-header-height', '--shell-top-offset', '--hdr-height-mobile', '--hdr-hit-area-mobile', '--header-height']) tokens[t] = cs.getPropertyValue(t).trim();
  const overlap = (a, b) => (a && b) ? Math.max(0, Math.min(a.b, b.b) - Math.max(a.y, b.y)) : 0;
  const headerOverlap = overlap(hr, tickerVisible ? tr : null) + (mr && hr ? Math.max(0, hr.b - mr.y) : 0);
  const tickerOverlap = tickerVisible && mr ? Math.max(0, tr.b - mr.y) : 0;
  const stackGap = (mr && hr) ? (tickerVisible ? (mr.y - tr.b) : (mr.y - hr.b)) : null;
  // conteúdo do header atrás da área de sistema (safe area): nenhum controle pode começar acima de safe-top
  const safeTop = parseFloat(tokens['--shell-safe-top']) || 0;
  let mainHidden = 0;
  if (main) { const first = [...main.querySelectorAll('*')].find((el) => vis(el) && el.getBoundingClientRect().height > 8); if (first) { const fr = first.getBoundingClientRect(); const topo = tickerVisible ? tr.b : hr.b; mainHidden = Math.max(0, Math.round(topo - fr.top)); } }
  const de = document.documentElement;
  const docOverflow = Math.max(0, de.scrollWidth - de.clientWidth, document.body.scrollWidth - de.clientWidth);
  const nome = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) || (el.querySelector('img[alt]')?.getAttribute('alt')) || '');
  const controls = [];
  const sels = 'button, a[href], [role="button"], input, select, [tabindex]:not([tabindex="-1"])';
  const scope = headerRegion || document;
  let underSafe = 0;
  scope.querySelectorAll(sels).forEach((el) => {
    if (!vis(el)) return;
    if (el.closest('.mh2-more-menu')) return; // itens do menu "Mais" são medidos à parte
    const r = el.getBoundingClientRect();
    const pts = [[r.x + r.width / 2, r.y + r.height / 2], [r.x + 6, r.y + 6], [r.right - 6, r.y + 6], [r.x + 6, r.bottom - 6], [r.right - 6, r.bottom - 6]];
    let hits = 0, wrong = null;
    for (const [x, y] of pts) { const t = document.elementFromPoint(x, y); if (t && (t === el || el.contains(t))) hits++; else if (t && !wrong) wrong = t.tagName.toLowerCase() + (t.className && typeof t.className === 'string' ? '.' + t.className.trim().split(/\s+/)[0] : ''); }
    if (r.top < safeTop - 0.5) underSafe++;
    controls.push({ sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''), name: nome(el), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), hits, wrong, minSide: Math.round(Math.min(r.width, r.height)) });
  });
  let collisions = 0;
  for (let i = 0; i < controls.length; i++) for (let j = i + 1; j < controls.length; j++) { const a = controls[i], b = controls[j]; const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); if (ix > 4 && iy > 4) collisions++; }
  let badgeClipped = 0, badgeInfo = null;
  document.querySelectorAll(badgeSel).forEach((bd) => { if (!vis(bd)) return; const br = bd.getBoundingClientRect(); badgeInfo = { w: Math.round(br.width), h: Math.round(br.height), text: bd.textContent.trim(), pe: getComputedStyle(bd).pointerEvents }; for (let a = bd.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a); if (/(hidden|clip|auto|scroll)/.test(o.overflow + o.overflowX + o.overflowY)) { const ar = a.getBoundingClientRect(); if (br.left < ar.left - 0.5 || br.right > ar.right + 0.5 || br.top < ar.top - 0.5 || br.bottom > ar.bottom + 0.5) { badgeClipped++; break; } } } });
  // títulos VISÍVEIS de painel/barra (o h1 visually-hidden do header e os headings de conteúdo não contam como "identidade do topo")
  const titles = [];
  document.querySelectorAll('.dsd-container__title, .header-page-title, .vc-titulo, .vc-barra h1, .vc-barra h2, .vc-imersivo-barra .vc-titulo').forEach((el) => { if (!vis(el)) return; const er = el.getBoundingClientRect(); const t = (el.textContent || '').trim().replace(/\s+/g, ' '); const srOnly = er.width <= 2 && er.height <= 2; /* visually-hidden (sr-only) fica na a11y mas NÃO é título visível */ if (t && !srOnly) titles.push({ t, sel: el.tagName.toLowerCase() + '.' + String(el.className || '').trim().split(/\s+/)[0], w: Math.round(er.width), h: Math.round(er.height) }); });
  const seen = {}; let dup = 0; for (const { t } of titles) { const k = t.toLowerCase(); seen[k] = (seen[k] || 0) + 1; } for (const k in seen) if (seen[k] > 1) dup += seen[k] - 1;
  const unnamed = controls.filter((c) => !c.name).length;
  let v2 = null; try { v2 = window.__mobileHeaderV2 ? window.__mobileHeaderV2.info() : null; } catch (e) { v2 = { error: String(e) }; }
  const meta = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
  // Avatar Studio: barra interna + título externo (a11y)
  const vc = q('.vc-root[data-vc]');
  const cont = vc ? vc.closest('.dsd-container') : null;
  const contHeader = cont ? cont.querySelector(':scope > .dsd-container__header') : null;
  const contTitle = contHeader ? contHeader.querySelector('.dsd-container__title') : null;
  const barra = vc ? vc.querySelector('.vc-barra') : null;
  const avatar = vc ? { root: R(vc), barra: R(barra), barraPadTop: barra ? getComputedStyle(barra).paddingTop : null, titlebarAttr: vc.getAttribute('data-shell-titlebar'), contAttr: cont ? cont.getAttribute('data-shell-titlebar') : null, contHeaderVisible: contHeader ? (vis(contHeader) && contHeader.getBoundingClientRect().width > 2 && contHeader.getBoundingClientRect().height > 2) : null, contHeaderRect: R(contHeader), contTitleText: contTitle ? contTitle.textContent.trim() : null, contTitleRole: contTitle ? contTitle.getAttribute('role') : null, contTitleInA11y: contTitle ? (getComputedStyle(contTitle).display !== 'none' && getComputedStyle(contTitle).visibility !== 'hidden' && !contTitle.closest('[aria-hidden="true"]')) : null, barraTop: barra ? Math.round(barra.getBoundingClientRect().top) : null } : null;
  const contAny = q('[data-region="main"] .dsd-container');
  const contAnyHeader = contAny ? contAny.querySelector(':scope > .dsd-container__header') : null;
  const container = contAny ? { attr: contAny.getAttribute('data-shell-titlebar'), headerVisible: contAnyHeader ? (vis(contAnyHeader) && contAnyHeader.getBoundingClientRect().height > 2) : null, title: contAnyHeader?.querySelector('.dsd-container__title')?.textContent.trim() || null } : null;
  const headerRightChildren = [...(q('.site-header .header-right')?.children || [])].map((el) => (el.getAttribute('data-component-key') || el.className.split(/\s+/)[0] || el.tagName.toLowerCase()));
  return { vw: innerWidth, vh: innerHeight, html: { v2attr: document.documentElement.getAttribute('data-mobile-header-v2'), device: document.body.getAttribute('data-device'), bp: document.body.getAttribute('data-breakpoint'), theme: document.documentElement.getAttribute('data-theme'), mode: document.documentElement.getAttribute('data-mh2-mode'), tickerAttr: document.documentElement.getAttribute('data-shell-ticker') }, meta, tokens, rects: { headerRegion: hr, siteHeader: R(siteHeader), inner: R(inner), ticker: tr, main: mr }, tickerVisible, headerOverlap, tickerOverlap, stackGap, mainHidden, docOverflow, controls, collisions, underSafe, badgeClipped, badgeInfo, titles, dupTitles: dup, unnamed, v2, avatar, container, headerRightChildren, headerBg: headerRegion ? getComputedStyle(headerRegion).backgroundColor : null, siteHeaderBg: siteHeader ? getComputedStyle(siteHeader).backgroundColor : null };
};

async function garantirTema(page, theme) {
  const atual = () => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  let t = await atual();
  for (let i = 0; i < 3 && t !== theme; i++) {
    await page.evaluate(() => { const b = document.querySelector('[data-dsd-theme-toggle]'); if (b) b.click(); });
    await page.waitForTimeout(700);
    t = await atual();
  }
  return t;
}

async function cenario({ vw, vh, route, theme }) {
  const isMobile = vw < 768 || (vh < 768 && vw < 1000);
  const ctx = await browser.newContext({
    viewport: { width: vw, height: vh }, deviceScaleFactor: 2, isMobile, hasTouch: isMobile, ignoreHTTPSErrors: true,
    colorScheme: theme === 'light' ? 'light' : 'dark', reducedMotion: RM ? 'reduce' : 'no-preference',
  });
  if (cookies) { try { await ctx.addCookies(cookies); } catch {} }
  await ctx.addInitScript(({ theme, flag }) => {
    try { localStorage.setItem('cm_theme', theme); localStorage.setItem('dshowdash_theme_prefs', JSON.stringify({ theme, density: 'comfortable' })); } catch {}
    // override local = MESMA chave do Avatar Studio; espelha as flags que o u75 tem por override no banco
    // (visual_composer/vc_3d/shell_vc3d/vestuario_separado/catalogo_v2) p/ o bot exercitar o MESMO caminho do canário
    try { const k = 'dshow.avst.flags.v1'; const cur = JSON.parse(localStorage.getItem(k) || '{}'); for (const f of ['as6.visual_composer', 'as6.vc_3d', 'as6.shell_vc3d', 'as6.vestuario_separado', 'as6.catalogo_v2']) cur[f] = true; cur['as6.mobile_header_v2'] = !!flag; localStorage.setItem(k, JSON.stringify(cur)); localStorage.setItem('avst.vc.onboarded', '1'); } catch {}
  }, { theme, flag: FLAG });
  const page = await ctx.newPage();
  const cerr = [], perr = [], freq = [];
  page.on('console', (m) => { if (m.type() === 'error') { const t = m.text(); if (!/favicon|net::ERR_ABORTED/i.test(t)) cerr.push(t.slice(0, 200)); } });
  page.on('pageerror', (e) => perr.push(String(e).slice(0, 200)));
  page.on('response', (r) => { const st = r.status(); if (st >= 400 && !/favicon/.test(r.url())) freq.push(r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 120) + ' HTTP' + st); });
  page.on('requestfailed', (r) => { const u = r.url(); const f = r.failure()?.errorText || ''; if (/favicon|analytics|gtag|beacon|telemetry|\.map$/i.test(u)) return; if (/ERR_ABORTED/.test(f)) return; freq.push(u.slice(0, 160) + ' ' + f); });
  const tag = `${vw}x${vh}-${route}-${theme}${SAFE_TOP ? '-safe' + SAFE_TOP : ''}${TICKER !== 'on' ? '-ticker' + TICKER : ''}${RM ? '-rm' : ''}${ZOOM !== 1 ? '-zoom' + ZOOM : ''}${LONG_NAME ? '-long' : ''}${BADGE ? '-badge' + BADGE : ''}`;
  const out = { tag, vw, vh, route, theme, isMobile, ok: false };
  try {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    // espera o que vier PRIMEIRO: shell montado ou formulário de login visível (a decisão por tempo fixo perdia a corrida)
    const chegou = await Promise.race([
      page.waitForSelector('.site-header', { timeout: 25000 }).then(() => 'shell').catch(() => null),
      page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 25000 }).then(() => 'login').catch(() => null),
    ]);
    const precisaLogar = async () => chegou === 'login' || ((await isLoginPage(page)) && await page.isVisible('input[type="password"]').catch(() => false));
    if (await precisaLogar()) { await loginViaPage(page); try { cookies = await ctx.cookies(); } catch {} } // sessão reutilizada nos próximos cenários (mesmo caminho do usuário; só evita relogar)
    await page.waitForSelector('.site-header', { timeout: 30000 });
    await page.waitForSelector('[data-region="main"]', { timeout: 30000 });
    // o preloader do shell (z 9999) cobre o header por alguns segundos após o boot — medir com ele visível
    // registraria toque interceptado em TODOS os controles (artefato de medição, não do candidato)
    await page.waitForSelector('.preloader-container', { state: 'hidden', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000);
    out.themeGot = await garantirTema(page, theme);
    if (route !== 'dash') {
      await page.evaluate((h) => { if (window.RouterGlobal && window.RouterGlobal.navigate) window.RouterGlobal.navigate(h.replace(/^#/, '')); else location.hash = h; }, ROUTE_HASH[route]);
      await page.waitForTimeout(4500);
      await page.waitForSelector('[data-vc], [data-avst-react-root], .avst-root', { timeout: 45000 }).catch(() => { out.avatarMountTimeout = true; });
      await page.waitForTimeout(1500);
    }
    // instrumentação de cenário (só teste — nunca entra no produto)
    await page.evaluate(({ safeTop, ticker, zoom, longName, badge }) => {
      if (safeTop) { const st = document.createElement('style'); st.id = 'mh2-safe-sim'; st.textContent = `html[data-mobile-header-v2]{--shell-safe-top:${safeTop}px !important}`; document.head.appendChild(st); }
      if (ticker === 'off') { const t = document.querySelector('[data-region="ticker"]'); if (t) { t.classList.add('dsd-shell__region--hidden'); t.setAttribute('aria-hidden', 'true'); } }
      if (zoom && zoom !== 1) { document.documentElement.style.fontSize = (zoom * 100) + '%'; document.querySelectorAll('.site-header .user-name, .site-header .ti-value, .mh2-more-label').forEach((el) => { el.style.fontSize = (zoom * 100) + '%'; }); }
      if (longName) { document.querySelectorAll('.user-menu-component .user-name').forEach((el) => { el.textContent = 'Maximiliano Alexandrino de Albuquerque Wanderley'; }); }
      if (badge) { const b = document.querySelector('.notifications-badge'); if (b) { b.textContent = badge === 3 ? '128' : '7'; b.style.display = ''; b.removeAttribute('hidden'); b.classList.remove('hidden'); b.setAttribute('data-mh2-forced', '1'); } }
    }, { safeTop: SAFE_TOP, ticker: TICKER, zoom: ZOOM, longName: LONG_NAME, badge: BADGE });
    await page.waitForTimeout(900);
    const m1 = await page.evaluate(MEDIR, { badgeSel: BADGE_SEL });
    await page.screenshot({ path: `${OUT}/${tag}.png`, fullPage: false });
    // scroll no main (ou no corpo rolável do painel): layout shift do topo?
    await page.evaluate(() => { const m = document.querySelector('[data-region="main"]'); if (m) { m.scrollTop = 240; } const b = document.querySelector('.dsd-container__body'); if (b && b.scrollHeight > b.clientHeight) b.scrollTop = 240; });
    await page.waitForTimeout(700);
    const m2 = await page.evaluate(MEDIR, { badgeSel: BADGE_SEL });
    await page.screenshot({ path: `${OUT}/${tag}-scrolled.png`, fullPage: false });
    const shift = (a, b) => (!a || !b) ? 0 : Math.abs(a.y - b.y) + Math.abs(a.x - b.x) + Math.abs(a.w - b.w) + Math.abs(a.h - b.h);
    const layoutShift = shift(m1.rects.headerRegion, m2.rects.headerRegion) + shift(m1.rects.main, m2.rects.main) + (m1.tickerVisible ? shift(m1.rects.ticker, m2.rects.ticker) : 0);
    await page.evaluate(() => { const m = document.querySelector('[data-region="main"]'); if (m) m.scrollTop = 0; const b = document.querySelector('.dsd-container__body'); if (b) b.scrollTop = 0; });
    await page.waitForTimeout(300);
    // menu de perfil aberto
    let menu = null;
    try { const trig = await page.$('.user-menu-trigger'); if (trig) { await trig.click(); await page.waitForTimeout(700); menu = await page.evaluate(() => { const d = document.querySelector('.user-menu-dropdown-portal, .user-menu-dropdown'); if (!d) return { open: false }; const r = d.getBoundingClientRect(); const cs = getComputedStyle(d); return { open: cs.display !== 'none' && r.width > 0 && cs.visibility !== 'hidden', x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom), inViewport: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1, z: cs.zIndex }; }); await page.screenshot({ path: `${OUT}/${tag}-menu.png` }); await page.keyboard.press('Escape'); await page.waitForTimeout(300); await page.evaluate(() => { document.body.click(); }); await page.waitForTimeout(300); } } catch (e) { menu = { error: String(e).slice(0, 120) }; }
    // notificações abertas (se o componente abrir um painel)
    let notif = null;
    try { const n = await page.$('.notifications-component'); if (n && await n.isVisible()) { await n.click(); await page.waitForTimeout(700); notif = await page.evaluate(() => { const d = document.querySelector('.notifications-dropdown, .notifications-panel, [class*="notifications-"][class*="dropdown"], [class*="notifications-"][class*="panel"]'); if (!d) return { open: false }; const r = d.getBoundingClientRect(); const cs = getComputedStyle(d); return { open: cs.display !== 'none' && r.width > 0 && cs.visibility !== 'hidden', x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), inViewport: r.left >= -1 && r.right <= innerWidth + 1, z: cs.zIndex }; }); await page.screenshot({ path: `${OUT}/${tag}-notif.png` }); await page.keyboard.press('Escape'); await page.evaluate(() => { document.body.click(); }); await page.waitForTimeout(300); } } catch (e) { notif = { error: String(e).slice(0, 120) }; }
    // menu "Mais" (só com a flag ON em modo compacto)
    let mais = null;
    try {
      const b = await page.$('.mh2-more');
      if (b && await b.isVisible()) {
        await b.click(); await page.waitForTimeout(500);
        mais = await page.evaluate(() => {
          const m = document.querySelector('#mh2-more-menu'); if (!m || m.hidden) return { open: false };
          const r = m.getBoundingClientRect(); const cs = getComputedStyle(m);
          const items = [...m.querySelectorAll('.mh2-more-item')].filter((it) => !it.hidden && getComputedStyle(it).display !== 'none').map((it) => { it.scrollIntoView({ block: 'nearest' }); const ctrl = it.querySelector('button, a[href], [role="button"], [tabindex]'); const c = ctrl || it.firstElementChild; const cr = c.getBoundingClientRect(); const ir = it.getBoundingClientRect(); const center = document.elementFromPoint(cr.x + cr.width / 2, cr.y + cr.height / 2); const cs = getComputedStyle(c); /* item informativo (ex.: relógio, pointer-events:none) não é alvo de toque */ const interactive = !!ctrl || cs.cursor === 'pointer' || (cs.pointerEvents !== 'none' && !!c.onclick); return { label: it.querySelector('.mh2-more-label')?.textContent, w: Math.round(cr.width), h: Math.round(cr.height), hit: !!(center && (center === c || c.contains(center))), interactive, inViewport: ir.right <= innerWidth + 1 && ir.left >= -1 }; });
          return { open: true, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom), inViewport: r.left >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, z: cs.zIndex, items, small: items.filter((i) => i.interactive && (i.w < 44 || i.h < 44)).length, wrong: items.filter((i) => i.interactive && !i.hit).length, informativos: items.filter((i) => !i.interactive).length, focusInside: m.contains(document.activeElement) };
        });
        await page.screenshot({ path: `${OUT}/${tag}-mais.png` });
        await page.keyboard.press('Escape'); await page.waitForTimeout(300);
        mais.closedByEscape = await page.evaluate(() => { const m = document.querySelector('#mh2-more-menu'); return !!(m && m.hidden); });
        mais.focusReturned = await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('mh2-more'));
      }
    } catch (e) { mais = { error: String(e).slice(0, 120) }; }
    // teclado REAL: Tab a partir do início do documento até percorrer os controles do header
    let focus = null;
    try {
      // ponto de partida DETERMINÍSTICO: sentinela focável no início do body (Tab segue a ordem do DOM a partir dele)
      await page.evaluate(() => { let s = document.getElementById('mh2-tab-sentinel'); if (!s) { s = document.createElement('span'); s.id = 'mh2-tab-sentinel'; s.tabIndex = -1; s.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0'; document.body.insertBefore(s, document.body.firstChild); } s.focus(); });
      const seen = []; let fail = 0; let inHeader = 0;
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press('Tab');
        const f = await page.evaluate(() => { const el = document.activeElement; if (!el || el === document.body) return null; const inH = !!el.closest('[data-region="header"]'); const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none'); return { inH, sel: el.tagName.toLowerCase() + '.' + (el.className && typeof el.className === 'string' ? el.className.split(/\s+/)[0] : ''), name: el.getAttribute('aria-label') || el.textContent.trim().slice(0, 20), ring, visible: r.width > 0 && r.height > 0, inViewport: r.top >= 0 && r.bottom <= innerHeight }; });
        if (!f) continue;
        if (f.inH) { inHeader++; seen.push(f); if (!f.ring || !f.visible || !f.inViewport) fail++; if (inHeader >= 12) break; }
        else if (inHeader > 0) break; // saiu do header
      }
      focus = { checked: inHeader, fail, seen: seen.slice(0, 12) };
    } catch (e) { focus = { error: String(e).slice(0, 120) }; }
    // leak / restauração (3 trocas de painel; depois deactivate())
    let leak = null;
    if (LEAK) {
      try {
        const before = await page.evaluate(() => window.__mobileHeaderV2 ? window.__mobileHeaderV2.info() : null);
        const domBefore = await page.evaluate(() => ({ right: document.querySelector('.site-header .header-right')?.children.length, html: [...document.documentElement.attributes].map((a) => a.name).sort().join(','), meta: document.querySelector('meta[name="viewport"]')?.getAttribute('content'), css: !!document.getElementById('mh2-css') }));
        for (let i = 0; i < 3; i++) {
          await page.evaluate((h) => { if (window.RouterGlobal && window.RouterGlobal.navigate) window.RouterGlobal.navigate(h.replace(/^#/, '')); else location.hash = h; }, ROUTE_HASH.avatar); await page.waitForTimeout(3500);
          await page.evaluate((h) => { if (window.RouterGlobal && window.RouterGlobal.navigate) window.RouterGlobal.navigate(h.replace(/^#/, '')); else location.hash = h; }, ROUTE_HASH.dash); await page.waitForTimeout(2500);
        }
        const after = await page.evaluate(() => window.__mobileHeaderV2 ? window.__mobileHeaderV2.info() : null);
        const restored = await page.evaluate(() => { if (!window.__mobileHeaderV2) return null; const w = window.__mobileHeaderV2; w.deactivate(); const i = w.info(); return { info: i, right: document.querySelector('.site-header .header-right')?.children.length, html: [...document.documentElement.attributes].map((a) => a.name).sort().join(','), meta: document.querySelector('meta[name="viewport"]')?.getAttribute('content'), css: !!document.getElementById('mh2-css'), more: !!document.querySelector('.mh2-more, #mh2-more-menu'), wrappersInRight: document.querySelectorAll('.site-header .header-right > .header-component-wrapper').length, notifRole: document.querySelector('.notifications-component')?.getAttribute('role') }; });
        const reactivated = await page.evaluate(() => { if (!window.__mobileHeaderV2) return null; window.__mobileHeaderV2.activate(); window.__mobileHeaderV2.activate(); return window.__mobileHeaderV2.info(); });
        leak = { before, after, restored, reactivated, domBefore };
      } catch (e) { leak = { error: String(e).slice(0, 160) }; }
    }
    Object.assign(out, { ok: true, m1, m2, layoutShift, menu, notif, mais, focus, leak, cerr, perr, freq });
  } catch (e) {
    out.error = String(e).slice(0, 300);
    try { await page.screenshot({ path: `${OUT}/${tag}-ERRO.png` }); } catch {}
    Object.assign(out, { cerr, perr, freq });
  }
  await ctx.close();
  return out;
}

for (const [vw, vh] of VIEWPORTS) for (const route of ROUTES) for (const theme of THEMES) {
  const r = await cenario({ vw, vh, route, theme });
  results.scenarios.push(r);
  const m = r.m1 || {};
  log(r.tag, r.ok ? 'OK' : 'ERRO ' + r.error, r.ok ? `theme=${r.themeGot} hdr=${m.rects?.headerRegion?.h} tick=${m.tickerVisible ? m.rects?.ticker?.h : 'off'} main.y=${m.rects?.main?.y} gap=${m.stackGap} ovl=${m.headerOverlap}/${m.tickerOverlap} hidden=${m.mainHidden} ox=${m.docOverflow} ctrls=${m.controls?.length} small=${m.controls?.filter((c) => c.minSide < 44).length} wrong=${m.controls?.filter((c) => c.hits < 5).length} coll=${m.collisions} unnamed=${m.unnamed} safe=${m.underSafe} badgeClip=${m.badgeClipped} dup=${m.dupTitles} shift=${r.layoutShift} mais=${r.mais ? (r.mais.open ? `${r.mais.items?.length}i/${r.mais.small}s/${r.mais.wrong}w` : 'closed') : '-'} focus=${r.focus?.checked}/${r.focus?.fail} avatar=${m.avatar ? `barra.y=${m.avatar.barraTop} ext=${m.avatar.contHeaderVisible} role=${m.avatar.contTitleRole}` : '-'} cerr=${r.cerr.length} perr=${r.perr.length} freq=${r.freq.length}` : '');
}
await browser.close();
writeFileSync(`${OUT}/audit.json`, JSON.stringify(results, null, 1));
log('gravado', `${OUT}/audit.json`);
