// scripts/header/audit-r2-mobile-header.mjs — RODADA 2 do header mobile v2: prova por MEDIÇÃO DE DOM
// dos critérios de polimento (gaveta "Mais", badges zero, fluxo vertical, trava de scroll, FAB, ticker,
// chevron/avatar) no SHELL REAL autenticado (preview do worktree, scripts/header/preview-shell.mjs).
// @version 1.0.0  @created 2026-09-11  (lote as6.mobile_header_v2 — doc 23, decisões #80–#87)
//
// Uso (da raiz do repo):  node scripts/header/audit-r2-mobile-header.mjs --out /tmp/mh2r2
// Opções: --viewports 375x812,390x844,320x568  --themes dark,light  --routes dash,avatar
// Saída: <out>/r2.json, <out>/GATES-R2.txt (exit 1 se algum FAIL) e PNGs (fechado/aberto por cenário).
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const TOOLS = process.env.MH2_TOOLS || '/var/www/dshowdash/tools/screenshot';
const pkg = (await import(TOOLS + '/node_modules/playwright/index.js')).default;
const { isLoginPage, loginViaPage } = await import(TOOLS + '/auth.mjs');
const { chromium } = pkg;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] ?? true) : d; };
const OUT = resolve(String(opt('out', '/tmp/mh2r2')));
const VIEWPORTS = String(opt('viewports', '375x812,390x844,320x568,430x932')).split(',').map((s) => s.split('x').map(Number));
const THEMES = String(opt('themes', 'dark,light')).split(',');
const ROUTES = String(opt('routes', 'dash')).split(',');
const BASE = process.env.MH2_BASE || 'http://127.0.0.1:8902';
const ROUTE_HASH = { dash: '#/', avatar: process.env.MH2_AVATAR_ROUTE || '#/panel-avatar-studio' };
mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log('[mh2r2]', ...a);
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1, MAP www.dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });

// ── medições (rodam dentro da página) ─────────────────────────────────────
const MEDIR_FECHADO = () => {
  const q = (s) => document.querySelector(s);
  const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom), r: Math.round(r.right) }; };
  const vis = (el) => { if (!el) return false; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false; if (n.hidden) return false; } const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const lum = (rgb) => { const m = rgb.match(/[\d.]+/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map((v) => { v = Number(v) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contraste = (a, b) => { const la = lum(a), lb = lum(b); if (la === null || lb === null) return null; return Math.round(((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)) * 100) / 100; };
  const html = document.documentElement, main = q('[data-region="main"]'), footer = q('[data-region="footer"]'), header = q('[data-region="header"]'), ticker = q('[data-region="ticker"]');
  const bars = [...document.querySelectorAll('.site-header')].filter(vis);
  const tokens = {}; for (const t of ['--shell-safe-top', '--shell-header-content-height', '--shell-header-total-height', '--shell-ticker-height', '--shell-top-stack-height']) tokens[t] = getComputedStyle(html).getPropertyValue(t).trim();
  tokens.headerTotal = (parseFloat(tokens['--shell-safe-top']) || 0) + (parseFloat(tokens['--shell-header-content-height']) || 0);
  // badges: qualquer badge VISÍVEL com valor ≤ 0 é falha
  const badges = [...document.querySelectorAll('.site-header [class*="badge"]:not([class*="mh2"])')].map((b) => ({ cls: b.className, text: (b.textContent || '').trim(), visible: vis(b), attr: b.getAttribute('data-mh2-badge'), rect: R(b) }));
  const zeroVisiveis = badges.filter((b) => b.visible && !(parseInt(b.text, 10) > 0));
  // calendar: número e ponto juntos?
  const cal = [...document.querySelectorAll('.site-header [data-panel-trigger="panel-calendar"]')].map((t) => { const bd = t.querySelector('.gcal-badge'); const dot = getComputedStyle(t, '::after'); return { badgeVisible: !!bd && vis(bd) && parseInt(bd.textContent, 10) > 0, badgeText: bd ? bd.textContent.trim() : null, dotVisible: dot.content !== 'none' && dot.display !== 'none' && parseFloat(dot.width) > 0, estado: t.getAttribute('data-gcal-estado'), dotAttr: t.getAttribute('data-mh2-dot') }; });
  // identidade: chevron, avatar, nome
  const trig = q('.site-header .user-menu-trigger'); const chev = q('.site-header .user-chevron svg'); const av = q('.site-header .user-avatar'); const nome = q('.site-header .user-name');
  const hdrBg = header ? getComputedStyle(header).backgroundColor : null; const siteBg = q('.site-header') ? getComputedStyle(q('.site-header')).backgroundColor : null;
  const bgRef = (siteBg && !/rgba\(.*, 0\)$/.test(siteBg)) ? siteBg : hdrBg;
  const chevron = chev ? { rect: R(chev), visible: vis(chev), stroke: getComputedStyle(chev).stroke, contraste: contraste(getComputedStyle(chev).stroke, bgRef), bg: bgRef } : null;
  const avatar = av ? { rect: R(av), shadow: getComputedStyle(av).boxShadow } : null;
  const nomeInfo = nome ? { rect: R(nome), visible: vis(nome), lines: Math.round(nome.getBoundingClientRect().height / parseFloat(getComputedStyle(nome).lineHeight || '16')), truncated: nome.scrollWidth > nome.clientWidth + 1, text: nome.textContent.trim() } : null;
  // alvos de toque do header (fora da gaveta)
  const ctrls = [...(header || document).querySelectorAll('button, a[href], [role="button"], [tabindex]:not([tabindex="-1"])')].filter((el) => vis(el) && !el.closest('.mh2-more-menu')).map((el) => { const r = el.getBoundingClientRect(); return { sel: el.tagName.toLowerCase() + '.' + String(el.className || '').split(/\s+/)[0], name: el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent.trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y), cy: Math.round(r.y + r.height / 2) }; });
  // trânsito: nome acessível + tooltip
  const tr = q('.site-header .traffic-indicator'); const traffic = tr ? { aria: tr.getAttribute('aria-label'), title: tr.getAttribute('title') } : null;
  // ticker
  const cont = ticker ? ticker.querySelector('.ticker-content-container') : null; const track = ticker ? ticker.querySelector('.ticker-track') : null; const first = track ? track.querySelector('.ticker-item') : null;
  const ov = (a, b) => (a && b) ? Math.max(0, Math.min(a.b, b.b) - Math.max(a.y, b.y)) : 0;
  const tk = ticker ? { rect: R(ticker), visible: vis(ticker), mask: cont ? (getComputedStyle(cont).webkitMaskImage || getComputedStyle(cont).maskImage) : null, anim: track ? getComputedStyle(track).animationName : null, play: track ? getComputedStyle(track).animationPlayState : null, firstX: first ? Math.round(first.getBoundingClientRect().x) : null, overlapHeader: ov(R(ticker), R(header)), overlapMain: main ? Math.max(0, R(ticker).b - R(main).y) : null, status: ticker.getAttribute('data-status') } : null;
  // fluxo / vão / rodapé
  const de = document.documentElement;
  const footerInner = footer ? footer.querySelector('.dsd-footer, .app-footer') : null;
  const flow = { attr: html.getAttribute('data-mh2-flow'), navrail: html.getAttribute('data-shell-navrail'), bodyPos: getComputedStyle(document.body).position, bodyOverflow: getComputedStyle(document.body).overflowY, docScrollH: de.scrollHeight, docClientH: de.clientHeight, winScrollY: Math.round(scrollY), mainPos: main ? getComputedStyle(main).position : null, mainRect: R(main), mainScrollH: main ? main.scrollHeight : null, mainClientH: main ? main.clientHeight : null, footerPos: footer ? getComputedStyle(footer).position : null, footerInnerPos: footerInner ? getComputedStyle(footerInner).position : null, footerRect: R(footer), footerInnerRect: R(footerInner), shell: (() => { const s = document.getElementById('app-shell') || q('.dsd-app-shell'); return s ? { display: getComputedStyle(s).display, dir: getComputedStyle(s).flexDirection, minH: getComputedStyle(s).minHeight, padTop: getComputedStyle(s).paddingTop, rect: R(s) } : null; })() };
  // FAB de devtools
  const fabEl = q('#cm-devtools'); const tog = fabEl ? fabEl.querySelector('.cm-devtools-toggle') : null;
  const fab = fabEl ? { visible: vis(fabEl), rect: R(tog || fabEl), role: tog ? tog.getAttribute('role') : null, aria: tog ? tog.getAttribute('aria-label') : null, tabindex: tog ? tog.getAttribute('tabindex') : null, z: getComputedStyle(fabEl).zIndex, bottom: getComputedStyle(fabEl).bottom } : null;
  const role = html.getAttribute('data-mh2-role');
  const docOverflowX = Math.max(0, de.scrollWidth - de.clientWidth);
  return { vw: innerWidth, vh: innerHeight, theme: html.getAttribute('data-theme'), device: document.body.getAttribute('data-device'), mode: html.getAttribute('data-mh2-mode'), tokens, bars: bars.map((b) => R(b)), headerRect: R(header), badges, zeroVisiveis: zeroVisiveis.length, cal, chevron, avatar, nome: nomeInfo, trigRect: R(trig), ctrls, traffic, tk, flow, fab, role, docOverflowX, v2: window.__mobileHeaderV2 ? window.__mobileHeaderV2.info() : null };
};
const MEDIR_ABERTO = () => {
  const q = (s) => document.querySelector(s);
  const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom), r: Math.round(r.right) }; };
  const vis = (el) => { if (!el) return false; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false; if (n.hidden) return false; } const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const html = document.documentElement, menu = q('#mh2-more-menu'), scrim = q('.mh2-scrim'), main = q('[data-region="main"]');
  if (!menu || menu.hidden) return { open: false };
  const mr = R(menu); const cs = getComputedStyle(menu);
  const grids = [...menu.querySelectorAll('.mh2-more-grid')];
  // colunas = nº de posições x distintas dos itens NÃO-card visíveis na grade mais populosa
  let colunas = 0; for (const g of grids) { const xs = new Set([...g.querySelectorAll('.mh2-more-item:not(.mh2-more-item--card)')].filter(vis).map((it) => Math.round(it.getBoundingClientRect().x))); colunas = Math.max(colunas, xs.size); }
  const itens = [...menu.querySelectorAll('.mh2-more-item')].filter(vis).map((it) => { const lab = it.querySelector('.mh2-more-label'); const lr = lab ? lab.getBoundingClientRect() : null; const lh = lab ? parseFloat(getComputedStyle(lab).lineHeight) : 0; const linhas = lab ? Math.round(lr.height / lh) : 0; it.scrollIntoView({ block: 'nearest' }); const ctrl = it.querySelector('button, a[href], [role="button"]'); const c = ctrl || it.firstElementChild; const cr = c.getBoundingClientRect(); const center = document.elementFromPoint(cr.x + cr.width / 2, cr.y + cr.height / 2); return { key: it.getAttribute('data-mh2-key'), card: it.classList.contains('mh2-more-item--card'), label: lab ? lab.textContent : null, labelHidden: lab ? lab.hidden : null, linhas, truncated: lab ? (lab.scrollWidth > lab.clientWidth + 1 || lab.scrollHeight > lab.clientHeight + 1) : false, w: Math.round(cr.width), h: Math.round(cr.height), interactive: !!ctrl, hit: !!(center && (center === c || c.contains(center))), inViewportX: it.getBoundingClientRect().left >= -1 && it.getBoundingClientRect().right <= innerWidth + 1, group: it.closest('.mh2-more-group')?.getAttribute('data-mh2-group') }; });
  const grupos = [...menu.querySelectorAll('.mh2-more-group')].filter(vis).map((g) => ({ id: g.getAttribute('data-mh2-group'), titulo: g.querySelector('.mh2-more-group-title')?.textContent, itens: [...g.querySelectorAll('.mh2-more-item')].filter(vis).length }));
  // segunda barra de rolagem? contêineres roláveis visíveis FORA da gaveta
  const scrollers = [...document.querySelectorAll('*')].filter((el) => { if (menu.contains(el) || el === menu) return false; if (el === document.documentElement || el === document.body) return false; if (!vis(el)) return false; const s = getComputedStyle(el); return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 40; }).map((el) => el.tagName.toLowerCase() + '.' + String(el.className || '').split(/\s+/)[0]);
  const docScrollable = document.documentElement.scrollHeight > document.documentElement.clientHeight + 2 && !/hidden/.test(getComputedStyle(document.body).overflowY) && getComputedStyle(document.body).position !== 'fixed';
  // nada atravessa: pontos no fundo (fora da gaveta, abaixo do header) devem cair no scrim ou na gaveta
  const pontos = [[innerWidth / 2, innerHeight - 20], [20, innerHeight - 60], [innerWidth - 20, innerHeight - 60], [innerWidth / 2, mr.b + 10]];
  const atravessa = pontos.filter(([x, y]) => y < innerHeight && y > mr.y).map(([x, y]) => { const e = document.elementFromPoint(x, y); return e && (menu.contains(e) || e === menu || e === scrim) ? null : (e ? e.tagName.toLowerCase() + '.' + String(e.className || '').split(/\s+/)[0] : 'null'); }).filter(Boolean);
  const fabEl = q('#cm-devtools');
  const fab = fabEl ? { visible: vis(fabEl), z: getComputedStyle(fabEl).zIndex, rect: R(fabEl) } : null;
  const close = menu.querySelector('.mh2-more-close');
  const focusInside = menu.contains(document.activeElement);
  const mainClip = main ? getComputedStyle(main).overflowY : null;
  return { open: true, rect: mr, widthOk: mr.w <= innerWidth && mr.x >= 0 && mr.r <= innerWidth, topOk: Math.abs(mr.y - (document.querySelector('[data-region="header"]')?.getBoundingClientRect().bottom || 0)) <= 1, bottomOk: mr.b <= innerHeight + 0.5, maxHeight: cs.maxHeight, padBottom: cs.paddingBottom, bg: cs.backgroundColor, bgOpaque: !/rgba\(.*,\s*0?\.\d+\)$/.test(cs.backgroundColor) && cs.backgroundColor !== 'rgba(0, 0, 0, 0)', role: menu.getAttribute('role'), modal: menu.getAttribute('aria-modal'), closeBtn: close ? { rect: R(close), aria: close.getAttribute('aria-label'), visible: vis(close) } : null, colunas, itens, truncados: itens.filter((i) => i.truncated || i.linhas > 2).length, small: itens.filter((i) => i.interactive && (i.w < 44 || i.h < 44)).length, wrong: itens.filter((i) => i.interactive && !i.hit).length, foraX: itens.filter((i) => !i.inViewportX).length, grupos, scrollers, docScrollable, bodyPos: getComputedStyle(document.body).position, bodyOverflow: getComputedStyle(document.body).overflowY, mainClip, atravessa, fab, focusInside, scrimVisible: !!scrim && vis(scrim), menuScrollable: menu.scrollHeight > menu.clientHeight + 2 };
};

async function garantirTema(page, theme) {
  let t = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 3 && t !== theme; i++) { await page.evaluate(() => { document.querySelector('[data-dsd-theme-toggle]')?.click(); }); await page.waitForTimeout(700); t = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
  return t;
}
let cookies = null;
async function cenario({ vw, vh, theme, route }) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true, colorScheme: theme });
  if (cookies) { try { await ctx.addCookies(cookies); } catch {} }
  await ctx.addInitScript(({ theme }) => { try { localStorage.setItem('cm_theme', theme); localStorage.setItem('dshowdash_theme_prefs', JSON.stringify({ theme, density: 'comfortable' })); const k = 'dshow.avst.flags.v1'; const cur = JSON.parse(localStorage.getItem(k) || '{}'); for (const f of ['as6.visual_composer', 'as6.vc_3d', 'as6.shell_vc3d', 'as6.vestuario_separado', 'as6.catalogo_v2']) cur[f] = true; cur['as6.mobile_header_v2'] = true; localStorage.setItem(k, JSON.stringify(cur)); localStorage.setItem('avst.vc.onboarded', '1'); } catch {} }, { theme });
  const page = await ctx.newPage();
  const cerr = [], perr = [];
  page.on('console', (m) => { if (m.type() === 'error') { const t = m.text(); if (!/favicon|net::ERR_ABORTED/i.test(t)) cerr.push(t.slice(0, 160)); } });
  page.on('pageerror', (e) => perr.push(String(e).slice(0, 160)));
  const tag = `${vw}x${vh}-${route}-${theme}`;
  const out = { tag, vw, vh, theme, route, ok: false };
  try {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    const chegou = await Promise.race([page.waitForSelector('.site-header', { timeout: 25000 }).then(() => 'shell').catch(() => null), page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 25000 }).then(() => 'login').catch(() => null)]);
    if (chegou === 'login' || ((await isLoginPage(page)) && await page.isVisible('input[type="password"]').catch(() => false))) { await loginViaPage(page); try { cookies = await ctx.cookies(); } catch {} }
    await page.waitForSelector('.site-header', { timeout: 30000 }); await page.waitForSelector('[data-region="main"]', { timeout: 30000 });
    await page.waitForSelector('.preloader-container', { state: 'hidden', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000);
    out.themeGot = await garantirTema(page, theme);
    if (route !== 'dash') { await page.evaluate((h) => { if (window.RouterGlobal && window.RouterGlobal.navigate) window.RouterGlobal.navigate(h.replace(/^#/, '')); else location.hash = h; }, ROUTE_HASH[route]); await page.waitForTimeout(4500); await page.waitForSelector('[data-vc], [data-avst-react-root], .avst-root', { timeout: 45000 }).catch(() => { out.avatarMountTimeout = true; }); await page.waitForTimeout(1500); }
    await page.waitForSelector('#mh2-more-menu', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(800);
    const fechado = await page.evaluate(MEDIR_FECHADO);
    await page.screenshot({ path: `${OUT}/${tag}-fechado.png` });
    // rola até o fim: rodapé deve terminar no fundo do viewport (fluxo), sem vão
    const fim = await page.evaluate(() => { const de = document.documentElement; const main = document.querySelector('[data-region="main"]'); window.scrollTo(0, de.scrollHeight); if (main && getComputedStyle(main).position === 'fixed') main.scrollTop = main.scrollHeight; return null; });
    await page.waitForTimeout(500);
    const noFim = await page.evaluate(() => { const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { y: Math.round(r.y), b: Math.round(r.bottom), h: Math.round(r.height) }; }; const f = document.querySelector('[data-region="footer"]'); const fi = f ? f.querySelector('.dsd-footer, .app-footer') : null; const m = document.querySelector('[data-region="main"]'); const cont = m ? m.querySelector('.dsd-container') : null; const fab = document.querySelector('#cm-devtools'); const fr = R(fi || f); const fab_r = fab ? fab.getBoundingClientRect() : null; const ov = (a, b) => (a && b) ? Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) * Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) : 0; return { scrollY: Math.round(scrollY), vh: innerHeight, footer: fr, footerRegion: R(f), main: R(m), cont: R(cont), gapMainFooter: (fr && m) ? fr.y - R(m).b : null, footerAtBottom: fr ? (Math.abs(fr.b - innerHeight) <= 1 || Math.abs(fr.b - document.documentElement.clientHeight) <= 1) : null, clientH: document.documentElement.clientHeight, docSH: document.documentElement.scrollHeight, fabOverFooter: (fab && fi) ? ov(fab_r, fi.getBoundingClientRect()) : 0, fabOverHeader: fab ? ov(fab_r, document.querySelector('[data-region="header"]').getBoundingClientRect()) : 0, fabRect: fab_r ? { y: Math.round(fab_r.y), b: Math.round(fab_r.bottom), r: Math.round(fab_r.right) } : null }; });
    await page.screenshot({ path: `${OUT}/${tag}-fim.png` });
    // volta a um ponto intermediário e abre a gaveta: fundo travado + posição preservada
    await page.evaluate(() => { window.scrollTo(0, 180); const m = document.querySelector('[data-region="main"]'); if (m && getComputedStyle(m).position === 'fixed') m.scrollTop = 180; });
    await page.waitForTimeout(400);
    const antes = await page.evaluate(() => ({ y: Math.round(scrollY), m: Math.round(document.querySelector('[data-region="main"]')?.scrollTop || 0), anchor: Math.round(document.querySelector('[data-region="main"] .dsd-container')?.getBoundingClientRect().top ?? -9999) }));
    const botao = await page.$('.mh2-more');
    let aberto = null, lock = null, depois = null;
    if (botao && await botao.isVisible()) {
      await botao.click(); await page.waitForTimeout(600);
      await page.screenshot({ path: `${OUT}/${tag}-aberto.png` }); // estado inicial da gaveta (topo), antes do hit-test rolar itens p/ dentro da vista
      aberto = await page.evaluate(MEDIR_ABERTO);
      // tenta rolar o fundo por todos os caminhos: API, roda do mouse e gesto de toque fora da gaveta
      await page.evaluate(() => { window.scrollBy(0, 300); const m = document.querySelector('[data-region="main"]'); if (m) m.scrollTop += 300; });
      await page.mouse.move(Math.round(vw / 2), vh - 30); await page.mouse.wheel(0, 400);
      try { await page.touchscreen.tap(Math.round(vw / 2), vh - 30); } catch {}
      await page.waitForTimeout(400);
      lock = await page.evaluate(() => ({ y: Math.round(scrollY), m: Math.round(document.querySelector('[data-region="main"]')?.scrollTop || 0), anchor: Math.round(document.querySelector('[data-region="main"] .dsd-container')?.getBoundingClientRect().top ?? -9999), bodyTop: getComputedStyle(document.body).top, bodyPos: getComputedStyle(document.body).position, aindaAberto: !document.querySelector('#mh2-more-menu')?.hidden }));
      await page.screenshot({ path: `${OUT}/${tag}-aberto-fim.png` }); // gaveta rolada até o fim (rolagem só dentro dela)
      // fecha pelo botão explícito
      await page.click('.mh2-more-close').catch(() => {});
      await page.waitForTimeout(400);
      depois = await page.evaluate(() => ({ y: Math.round(scrollY), m: Math.round(document.querySelector('[data-region="main"]')?.scrollTop || 0), anchor: Math.round(document.querySelector('[data-region="main"] .dsd-container')?.getBoundingClientRect().top ?? -9999), fechado: !!document.querySelector('#mh2-more-menu')?.hidden, bodyPos: getComputedStyle(document.body).position, focoNoBotao: document.activeElement?.classList.contains('mh2-more') }));
      // reabre e fecha com Esc (paridade com a rodada 1)
      await botao.click(); await page.waitForTimeout(400); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      depois.escFecha = await page.evaluate(() => !!document.querySelector('#mh2-more-menu')?.hidden);
    }
    Object.assign(out, { ok: true, fechado, noFim, antes, aberto, lock, depois, cerr, perr });
  } catch (e) { out.error = String(e).slice(0, 300); try { await page.screenshot({ path: `${OUT}/${tag}-ERRO.png` }); } catch {} }
  await ctx.close();
  return out;
}

const results = { version: '1.0.0', base: BASE, at: new Date().toISOString(), scenarios: [] };
for (const [vw, vh] of VIEWPORTS) for (const route of ROUTES) for (const theme of THEMES) {
  const r = await cenario({ vw, vh, theme, route });
  results.scenarios.push(r);
  const f = r.fechado || {}, a = r.aberto || {};
  log(r.tag, r.ok ? 'OK' : 'ERRO ' + r.error, r.ok ? `theme=${r.themeGot} bars=${f.bars?.length} zeroBadges=${f.zeroVisiveis} cal=${JSON.stringify(f.cal?.map((c) => [c.badgeVisible, c.dotVisible]))} chev=${f.chevron?.contraste} av=${f.avatar?.rect?.w} nomeLinhas=${f.nome?.lines} small=${f.ctrls?.filter((c) => c.w < 44 || c.h < 44).length} flow=${f.flow?.attr} gap=${r.noFim?.gapMainFooter} footerBottom=${r.noFim?.footerAtBottom} footerPos=${f.flow?.footerInnerPos} fabOverFooter=${r.noFim?.fabOverFooter} tickerOv=${f.tk?.overlapHeader}/${f.tk?.overlapMain} mask=${!!(f.tk?.mask && f.tk.mask !== 'none')} | menu: cols=${a.colunas} trunc=${a.truncados} small=${a.small} wrong=${a.wrong} width=${a.widthOk} top=${a.topOk} bottom=${a.bottomOk} scrollers=${a.scrollers?.length} doc=${a.docScrollable} atravessa=${a.atravessa?.length} fab=${a.fab?.visible} lock=${r.antes?.y}/${r.antes?.m}→${r.lock?.y}/${r.lock?.m}→${r.depois?.y}/${r.depois?.m} esc=${r.depois?.escFecha} cerr=${r.cerr.length}` : '');
}
await browser.close();
writeFileSync(`${OUT}/r2.json`, JSON.stringify(results, null, 1));

// ── gates (rodada 2) ──────────────────────────────────────────────────────
const S = results.scenarios.filter((s) => s.ok && s.fechado);
const dash = S.filter((s) => s.route === 'dash');
const abertos = S.filter((s) => s.aberto && s.aberto.open);
const linhas = []; let falhas = 0;
const gate = (n, ok, det) => { linhas.push(`${ok ? 'PASS' : 'FAIL'} ${n} — ${det}`); if (!ok) falhas++; };
const todos = (arr, f) => arr.length > 0 && arr.every(f);
gate('SINGLE_COMPACT_HEADER', todos(S, (s) => s.fechado.bars.length === 1 && s.fechado.headerRect && Math.abs(s.fechado.headerRect.h - s.fechado.tokens.headerTotal) <= 1), `${S.length} cenários: barras=${[...new Set(S.map((s) => s.fechado.bars.length))]} altura=${[...new Set(S.map((s) => s.fechado.headerRect?.h))]}`);
gate('ZERO_BADGES_VISIBLE=NO', todos(S, (s) => s.fechado.zeroVisiveis === 0) && todos(abertos, (s) => s.aberto.itens.length > 0), `badges visíveis com valor ≤0: ${S.map((s) => s.fechado.zeroVisiveis).join(',')} (badges medidos: ${S.map((s) => s.fechado.badges.length).join(',')})`);
gate('DUPLICATE_NOTIFICATION_INDICATORS=NO', todos(S, (s) => s.fechado.cal.every((c) => !(c.badgeVisible && c.dotVisible))), S.map((s) => s.fechado.cal.map((c) => `badge=${c.badgeVisible}(${c.badgeText}) dot=${c.dotVisible} estado=${c.estado}`).join(';')).join(' | '));
gate('MENU_MOBILE_COLUMNS_MAX=3', todos(abertos, (s) => s.aberto.colunas >= 2 && s.aberto.colunas <= 3 && (s.vw >= 360 ? s.aberto.colunas === 3 : s.aberto.colunas === 2)), abertos.map((s) => `${s.vw}px→${s.aberto.colunas} col`).join(' · '));
gate('MENU_LABELS_TRUNCATED=NO', todos(abertos, (s) => s.aberto.truncados === 0 && s.aberto.foraX === 0), abertos.map((s) => `${s.tag}: truncados=${s.aberto.truncados} foraX=${s.aberto.foraX} itens=${s.aberto.itens.length}`).join(' · '));
gate('GRID_ITEMS_ALIGNED=YES', todos(abertos, (s) => s.aberto.grupos.length >= 4 && s.aberto.itens.every((i) => i.card || i.label)), abertos.map((s) => `${s.tag}: grupos=${s.aberto.grupos.map((g) => `${g.id}:${g.itens}`).join(',')} cards=${s.aberto.itens.filter((i) => i.card).map((i) => i.key).join('/')}`).join(' · '));
gate('MENU_TOUCH_TARGETS_44', todos(abertos, (s) => s.aberto.small === 0 && s.aberto.wrong === 0), abertos.map((s) => `${s.tag}: small=${s.aberto.small} wrong=${s.aberto.wrong}`).join(' · '));
gate('MENU_GEOMETRY', todos(abertos, (s) => s.aberto.widthOk && s.aberto.topOk && s.aberto.bottomOk && s.aberto.bgOpaque && s.aberto.closeBtn && s.aberto.closeBtn.visible && s.aberto.closeBtn.rect.w >= 44 && s.aberto.closeBtn.rect.h >= 44 && s.aberto.role === 'dialog' && s.aberto.focusInside && s.aberto.scrimVisible), abertos.map((s) => `${s.tag}: ${JSON.stringify({ w: s.aberto.rect.w, y: s.aberto.rect.y, b: s.aberto.rect.b, vh: s.vh, bg: s.aberto.bg, close: s.aberto.closeBtn?.rect.w })}`).join(' · '));
gate('BACKGROUND_SCROLL_WHILE_MENU_OPEN=NO', todos(abertos, (s) => s.lock && s.lock.aindaAberto && s.lock.anchor === s.antes.anchor && s.lock.m === s.antes.m && s.aberto.atravessa.length === 0), abertos.map((s) => `${s.tag}: conteúdo.y antes=${s.antes?.anchor} durante=${s.lock?.anchor} (scrollY ${s.antes?.y}→${s.lock?.y}, main.scrollTop ${s.antes?.m}→${s.lock?.m}) body=${s.lock?.bodyPos}@${s.lock?.bodyTop} atravessa=${s.aberto.atravessa.join(',') || '-'}`).join(' · '));
gate('SCROLL_POSITION_RESTORED', todos(abertos, (s) => s.depois && s.depois.fechado && s.depois.y === s.antes.y && s.depois.m === s.antes.m && s.depois.anchor === s.antes.anchor && s.depois.bodyPos !== 'fixed' && s.depois.escFecha && s.depois.focoNoBotao), abertos.map((s) => `${s.tag}: depois=${s.depois?.y}/${s.depois?.m} (antes ${s.antes?.y}/${s.antes?.m}) body=${s.depois?.bodyPos} esc=${s.depois?.escFecha} foco=${s.depois?.focoNoBotao}`).join(' · '));
gate('DOUBLE_SCROLLBAR=NO', todos(abertos, (s) => s.aberto.scrollers.length === 0 && !s.aberto.docScrollable), abertos.map((s) => `${s.tag}: roláveis fora da gaveta=${s.aberto.scrollers.join(',') || 0} doc=${s.aberto.docScrollable} gavetaRola=${s.aberto.menuScrollable}`).join(' · '));
gate('MENU_SAFE_AREA=YES', todos(abertos, (s) => parseFloat(s.aberto.padBottom) >= 12 && s.aberto.bottomOk), abertos.map((s) => `${s.tag}: padding-bottom=${s.aberto.padBottom} max-height=${s.aberto.maxHeight} (css: 100dvh − header; env(safe-area-inset-bottom))`).join(' · '));
gate('PROFILE_CHEVRON_VISIBLE=YES', todos(S, (s) => s.fechado.chevron && s.fechado.chevron.visible && s.fechado.chevron.rect.w >= 16 && (s.fechado.chevron.contraste === null || s.fechado.chevron.contraste >= 3)), S.map((s) => `${s.tag}: ${s.fechado.chevron?.rect?.w}px contraste=${s.fechado.chevron?.contraste} (${s.fechado.chevron?.stroke} sobre ${s.fechado.chevron?.bg})`).join(' · '));
gate('AVATAR_40_44_NAME_1_LINE', todos(S, (s) => s.fechado.avatar && s.fechado.avatar.rect.w >= 40 && s.fechado.avatar.rect.w <= 44 && s.fechado.trigRect.h >= 44 && (!s.fechado.nome || !s.fechado.nome.visible || s.fechado.nome.lines === 1)), S.map((s) => `${s.tag}: avatar=${s.fechado.avatar?.rect?.w} trigger.h=${s.fechado.trigRect?.h} nome=${s.fechado.nome?.visible ? `${s.fechado.nome.lines} linha(s) trunc=${s.fechado.nome.truncated}` : 'oculto (P4)'}`).join(' · '));
gate('TOUCH_TARGETS_MIN_44PX=YES', todos(S, (s) => s.fechado.ctrls.every((c) => c.w >= 44 && c.h >= 44)) && todos(abertos, (s) => s.aberto.small === 0), S.map((s) => `${s.tag}: ${s.fechado.ctrls.filter((c) => c.w < 44 || c.h < 44).length}/${s.fechado.ctrls.length} <44`).join(' · '));
gate('VERTICAL_ALIGNMENT', todos(S, (s) => { const cys = s.fechado.ctrls.map((c) => c.cy); return Math.max(...cys) - Math.min(...cys) <= 2; }), S.map((s) => `${s.tag}: centros y=${[...new Set(s.fechado.ctrls.map((c) => c.cy))].join('/')}`).join(' · '));
gate('TRAFFIC_ARIA_TOOLTIP', todos(S, (s) => !s.fechado.traffic || (!!s.fechado.traffic.aria && !!s.fechado.traffic.title)), S.map((s) => `${s.tag}: aria=${!!s.fechado.traffic?.aria} title=${!!s.fechado.traffic?.title}`).join(' · '));
gate('TICKER_OVERLAP=NO', todos(S, (s) => !s.fechado.tk || !s.fechado.tk.visible || (s.fechado.tk.overlapHeader === 0 && s.fechado.tk.overlapMain === 0 && s.fechado.tk.mask && s.fechado.tk.mask !== 'none' && (s.fechado.tk.anim === 'none' || s.fechado.tk.play === 'running') && s.fechado.tk.rect.h === parseFloat(s.fechado.tokens['--shell-ticker-height']))), S.map((s) => `${s.tag}: h=${s.fechado.tk?.rect?.h} ov=${s.fechado.tk?.overlapHeader}/${s.fechado.tk?.overlapMain} anim=${s.fechado.tk?.anim}/${s.fechado.tk?.play} firstX=${s.fechado.tk?.firstX} mask=${!!(s.fechado.tk?.mask && s.fechado.tk.mask !== 'none')}`).join(' · '));
gate('UNEXPLAINED_BOTTOM_GAP=NO', todos(dash, (s) => s.noFim && s.noFim.gapMainFooter !== null && s.noFim.gapMainFooter >= -1 && s.noFim.gapMainFooter <= 1 && s.noFim.footerAtBottom), dash.map((s) => `${s.tag}: main.bottom→footer.top=${s.noFim?.gapMainFooter}px rodapé no fundo=${s.noFim?.footerAtBottom} (scrollY=${s.noFim?.scrollY})`).join(' · '));
gate('FOOTER_IN_NORMAL_FLOW=YES', todos(dash, (s) => s.fechado.flow.attr === 'on' && s.fechado.flow.footerPos === 'static' && s.fechado.flow.footerInnerPos === 'static' && s.fechado.flow.mainPos === 'static' && s.fechado.flow.shell && s.fechado.flow.shell.display === 'flex' && s.fechado.flow.shell.dir === 'column' && parseFloat(s.fechado.flow.shell.minH) >= s.vh - 1), dash.map((s) => `${s.tag}: flow=${s.fechado.flow.attr} main=${s.fechado.flow.mainPos} footer=${s.fechado.flow.footerPos}/${s.fechado.flow.footerInnerPos} shell=${s.fechado.flow.shell?.display}/${s.fechado.flow.shell?.dir} min-height=${s.fechado.flow.shell?.minH} padding-top=${s.fechado.flow.shell?.padTop}`).join(' · '));
gate('TOOLS_BUTTON_OVERLAP=NO', todos(S, (s) => !s.fechado.fab || !s.fechado.fab.visible || (s.noFim.fabOverFooter === 0 && s.noFim.fabOverHeader === 0 && s.fechado.fab.role === 'button' && !!s.fechado.fab.aria)) && todos(abertos, (s) => !s.aberto.fab || !s.aberto.fab.visible), S.map((s) => `${s.tag}: role=${s.fechado.role} fab=${s.fechado.fab ? `${s.fechado.fab.visible ? 'visível' : 'oculto'} over footer=${s.noFim?.fabOverFooter} header=${s.noFim?.fabOverHeader} role=${s.fechado.fab.role} aria=${!!s.fechado.fab.aria} bottom=${s.fechado.fab.bottom}` : 'ausente'} | aberto: ${s.aberto?.fab ? (s.aberto.fab.visible ? 'VISÍVEL' : 'oculto') : '-'}`).join(' · '));
gate('LIGHT_THEME=OK', todos(S.filter((s) => s.theme === 'light'), (s) => s.themeGot === 'light' && s.aberto && s.aberto.bgOpaque), S.filter((s) => s.theme === 'light').map((s) => `${s.tag}: theme=${s.themeGot} gaveta bg=${s.aberto?.bg}`).join(' · '));
gate('DARK_THEME=OK', todos(S.filter((s) => s.theme === 'dark'), (s) => s.themeGot === 'dark' && s.aberto && s.aberto.bgOpaque), S.filter((s) => s.theme === 'dark').map((s) => `${s.tag}: theme=${s.themeGot} gaveta bg=${s.aberto?.bg}`).join(' · '));
gate('NO_HORIZONTAL_OVERFLOW', todos(S, (s) => s.fechado.docOverflowX === 0), S.map((s) => `${s.tag}: ${s.fechado.docOverflowX}`).join(' · '));
gate('NO_NEW_PAGE_ERRORS', todos(S, (s) => s.perr.length === 0), S.map((s) => `${s.tag}: perr=${s.perr.length} cerr=${s.cerr.length}`).join(' · '));
const txt = `# GATES rodada 2 — ${results.at} — base=${BASE}\n${linhas.join('\n')}\n# ${falhas === 0 ? 'TODOS PASS' : falhas + ' FAIL'} (${linhas.length} gates)\n`;
writeFileSync(`${OUT}/GATES-R2.txt`, txt);
console.log(txt);
process.exit(falhas ? 1 : 0);
