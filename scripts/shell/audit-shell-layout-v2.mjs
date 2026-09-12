// scripts/shell/audit-shell-layout-v2.mjs — prova por MEDIÇÃO DE DOM do shell responsivo (lote
// as6.shell_layout_v2, decisão #88) no SHELL REAL autenticado (preview do worktree: scripts/header/preview-shell.mjs).
// @version 1.0.0  @created 2026-09-11
//
// Mede, por viewport/tema/rota: geometria das regiões (sidebar/main/footer), sidebar expandir↔recolher
// no desktop (reflow real do main, persistência, tooltip no recolhido, item ativo), tablet recolhida,
// gaveta no mobile (abrir/fechar por botão, scrim, Esc; foco preso e devolvido; scroll do fundo travado;
// itens de navegação acessíveis), overflow-x, rolagem aninhada, rodapé (página curta e longa), FAB,
// popovers/gavetas não recortados, temas, e FLAG_OFF_IDENTITY do shell (flag OFF = rects/atributos/
// conjunto de controles iguais à produção OFF em vários painéis).
//
// Uso:  node scripts/shell/audit-shell-layout-v2.mjs --out /tmp/lv2 [--flag on|off] [--viewports ...]
//       [--themes dark,light] [--routes dash,avatar,...]  MH2_BASE=https://dshowdash.com.br p/ baseline.
// Saída: <out>/lv2.json + PNGs. Gates: node scripts/shell/gates-shell-layout-v2.mjs <dir-on> <dir-off> <dir-prod-off>
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const TOOLS = process.env.MH2_TOOLS || '/var/www/dshowdash/tools/screenshot';
const pkg = (await import(TOOLS + '/node_modules/playwright/index.js')).default;
const { isLoginPage, loginViaPage } = await import(TOOLS + '/auth.mjs');
const { chromium } = pkg;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] ?? true) : d; };
const OUT = resolve(String(opt('out', '/tmp/lv2')));
const FLAG = String(opt('flag', 'on')) === 'on';
const VIEWPORTS = String(opt('viewports', '360x780,390x844,430x932,768x1024,1024x768,1280x800,1440x900')).split(',').map((s) => s.split('x').map(Number));
const THEMES = String(opt('themes', 'dark')).split(',');
const ROUTES = String(opt('routes', 'dash')).split(',');
const BASE = process.env.MH2_BASE || 'http://127.0.0.1:8902';
const ROUTE_HASH = { dash: '#/', avatar: process.env.MH2_AVATAR_ROUTE || '#/panel-avatar-studio', geral: '#/geral', clientes: '#/clientes', financeiro: '#/financeiro' };
mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log('[lv2]', ...a);
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1, MAP www.dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });

const MEDIR = () => {
  const q = (s) => document.querySelector(s);
  const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) }; };
  const vis = (el) => { if (!el) return false; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false; if (n.hidden) return false; } const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const html = document.documentElement, de = html;
  const reg = {}; for (const n of ['header', 'ticker', 'nav-rail', 'sidebar', 'main', 'footer']) { const el = q(`[data-region="${n}"]`); reg[n] = el ? { rect: R(el), pos: getComputedStyle(el).position, visible: vis(el), cls: el.className.split(/\s+/).filter((c) => /hidden|visible/.test(c)).join(' ') } : null; }
  const shell = document.getElementById('app-shell');
  const sb = q('[data-region="sidebar"] .dsd-sidebar');
  const sbLinks = sb ? [...sb.querySelectorAll('.dsd-sidebar__link')] : [];
  const sbVis = sbLinks.filter(vis);
  const ativo = sb ? sb.querySelector('.dsd-sidebar__item--active .dsd-sidebar__link, .dsd-sidebar__link[aria-current="page"]') : null;
  const nav = q('[data-region="nav-rail"]'); const navBtns = nav ? [...nav.querySelectorAll('.navrail-btn')] : []; const navVis = navBtns.filter(vis);
  const footer = q('[data-region="footer"]'); const fi = footer ? footer.querySelector('.dsd-footer, .app-footer') : null;
  const main = q('[data-region="main"]'); const cont = main ? main.querySelector('.dsd-container') : null; const body = cont ? cont.querySelector('.dsd-container__body') : null;
  const scrollers = main ? [...main.querySelectorAll('*')].filter((el) => { if (!vis(el)) return false; const s = getComputedStyle(el); return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 80 && el.getBoundingClientRect().width > innerWidth * 0.6; }).map((el) => el.tagName.toLowerCase() + '.' + String(el.className || '').split(/\s+/)[0]) : [];
  const acoes = [...document.querySelectorAll('[data-region="main"] .ger-controles-acoes button, [data-region="main"] .ger-btn')].filter(vis).map((b) => ({ t: b.textContent.trim().slice(0, 24), rect: R(b) }));
  const tit = q('[data-region="main"] .ger-controles-tit'); const titR = tit ? R(tit) : null;
  const overlapTit = titR ? acoes.filter((a) => Math.min(a.rect.r, titR.r) - Math.max(a.rect.x, titR.x) > 2 && Math.min(a.rect.b, titR.b) - Math.max(a.rect.y, titR.y) > 2).length : 0;
  const wide = [...document.querySelectorAll('[data-region="main"] *')].filter((el) => { if (!vis(el)) return false; const r = el.getBoundingClientRect(); if (r.right <= de.clientWidth + 1) return false; for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) { const s = getComputedStyle(n); if (/(auto|scroll|hidden|clip)/.test(s.overflowX) && n.getBoundingClientRect().right <= de.clientWidth + 1) return false; } return true; }).slice(0, 5).map((el) => el.tagName.toLowerCase() + '.' + String(el.className || '').split(/\s+/)[0]);
  const fab = q('#cm-devtools'); const ov = (a, b) => (a && b) ? Math.max(0, Math.min(a.r, b.r) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.y, b.y)) : 0;
  const toggleSb = q('.dsd-sidebar__toggle'); const navToggle = q('.lv2-nav-toggle');
  return {
    vw: innerWidth, vh: innerHeight, cw: de.clientWidth, docSW: de.scrollWidth, docSH: de.scrollHeight, scrollY: Math.round(scrollY), device: document.body.getAttribute('data-device'), theme: html.getAttribute('data-theme'),
    attrs: [...html.attributes].map((a) => a.name).sort().join(','), lv2: html.getAttribute('data-shell-layout-v2'), lv2mode: html.getAttribute('data-lv2-mode'), mh2: html.getAttribute('data-mobile-header-v2'), bodyCls: document.body.className.split(/\s+/).filter((c) => /sidebar|layout|bp-|dsd-|has-/.test(c)).sort().join(' '), collapsed: document.body.classList.contains('sidebar-collapsed'),
    shell: shell ? { display: getComputedStyle(shell).display, cols: getComputedStyle(shell).gridTemplateColumns, minH: getComputedStyle(shell).minHeight, padTop: getComputedStyle(shell).paddingTop, rect: R(shell) } : null,
    reg, sidebar: { links: sbLinks.length, visLinks: sbVis.length, ativo: ativo ? { text: (ativo.getAttribute('aria-label') || ativo.textContent).trim().slice(0, 30), bg: getComputedStyle(ativo).backgroundColor, rect: R(ativo) } : null, toggle: toggleSb ? { rect: R(toggleSb), vis: vis(toggleSb), aria: toggleSb.getAttribute('aria-expanded'), label: toggleSb.getAttribute('aria-label') } : null, linksSemNome: sbLinks.filter((a) => !(a.getAttribute('aria-label') || a.textContent.trim())).length, asideCls: sb ? sb.className : null },
    nav: { btns: navBtns.length, vis: navVis.length, semNome: navBtns.filter((b) => !b.getAttribute('aria-label')).length },
    navToggle: navToggle ? { rect: R(navToggle), vis: vis(navToggle), aria: navToggle.getAttribute('aria-expanded'), controls: navToggle.getAttribute('aria-controls'), label: navToggle.getAttribute('aria-label') } : null,
    main: main ? { rect: R(main), pos: getComputedStyle(main).position, minW: getComputedStyle(main).minWidth, cont: R(cont), contOv: cont ? getComputedStyle(cont).overflowY : null, body: R(body), bodyOv: body ? getComputedStyle(body).overflowY : null, bodyScrolls: body ? body.scrollHeight > body.clientHeight + 2 : null } : null,
    footer: footer ? { region: R(footer), inner: R(fi), pos: getComputedStyle(footer).position, innerPos: fi ? getComputedStyle(fi).position : null, gapMain: (fi && main) ? R(fi).y - R(main).b : null, atBottom: fi ? (Math.abs(R(fi).b - innerHeight) <= 1 || Math.abs(R(fi).b - de.clientHeight) <= 1) : null, width: fi ? R(fi).w : null, count: document.querySelectorAll('[data-region="footer"], .dsd-footer').length } : null,
    scrollers, acoes, titR, overlapTit, wide,
    fab: fab ? { rect: R(fab), vis: vis(fab), overFooter: fi ? ov(R(fab), R(fi)) : 0, overHeader: ov(R(fab), R(q('[data-region="header"]'))), z: getComputedStyle(fab).zIndex, role: fab.querySelector('.cm-devtools-toggle')?.getAttribute('role') } : null, role: html.getAttribute('data-lv2-role') || q('.user-menu-component')?.getAttribute('data-role'),
    ctrlsHeader: [...(q('[data-region="header"]') || document).querySelectorAll('button, a[href], [role="button"]')].filter((el) => vis(el) && !el.closest('.mh2-more-menu')).map((el) => (el.getAttribute('aria-label') || el.textContent.trim().slice(0, 20)) + '|' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height)).sort(),
    v2: { lv2: window.__shellLayoutV2 ? window.__shellLayoutV2.info() : null, mh2: window.__mobileHeaderV2 ? window.__mobileHeaderV2.info() : null },
  };
};
const MEDIR_GAVETA = () => {
  const q = (s) => document.querySelector(s); const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) }; };
  const vis = (el) => { if (!el) return false; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false; if (n.hidden) return false; } const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const html = document.documentElement; const sb = q('[data-region="sidebar"]'); const nav = q('[data-region="nav-rail"]'); const scrim = q('.lv2-scrim');
  const open = html.getAttribute('data-lv2-drawer') === 'open';
  const links = sb ? [...sb.querySelectorAll('.dsd-sidebar__link, .dsd-sidebar__group-button')] : []; const navBtns = nav ? [...nav.querySelectorAll('.navrail-btn')] : [];
  const inVp = (el) => { const r = el.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; };
  const hit = (el) => { const r = el.getBoundingClientRect(); const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!(e && (e === el || el.contains(e))); };
  const pontos = [[innerWidth - 20, innerHeight / 2], [innerWidth - 20, innerHeight - 30]].map(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? (e === scrim ? 'scrim' : (sb && sb.contains(e)) ? 'sidebar' : (nav && nav.contains(e)) ? 'nav' : e.tagName.toLowerCase() + '.' + String(e.className || '').split(/\s+/)[0]) : 'null'; });
  const focusIn = !!(document.activeElement && ((sb && sb.contains(document.activeElement)) || (nav && nav.contains(document.activeElement))));
  const sbR = R(sb), navR = R(nav);
  // recorte: cada item visível da sidebar/nav deve estar dentro do viewport e responder ao toque no centro (após scrollIntoView)
  const itens = [...navBtns, ...links].filter(vis).map((el) => { el.scrollIntoView({ block: 'nearest' }); return { t: (el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 20), inVp: inVp(el), hit: hit(el), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }; });
  return { open, sb: sbR, nav: navR, sbVisible: vis(sb), navVisible: vis(nav), scrim: !!scrim && vis(scrim), widthOk: sbR ? sbR.r <= innerWidth + 1 && sbR.x >= 0 : null, topOk: sbR ? Math.abs(sbR.y - (q('[data-region="header"]').getBoundingClientRect().bottom + (q('[data-region="ticker"]') && vis(q('[data-region="ticker"]')) ? q('[data-region="ticker"]').getBoundingClientRect().height : 0))) <= 1 : null, bottomOk: sbR ? sbR.b <= innerHeight + 1 : null, sbScrolls: sb ? sb.scrollHeight > sb.clientHeight + 2 : null, navItens: navBtns.filter(vis).length, sbItens: links.filter(vis).length, itens, foraVp: itens.filter((i) => !i.inVp).length, semHit: itens.filter((i) => !i.hit).length, pequenos: itens.filter((i) => i.h < 40).length, pontos, focusIn, bodyPos: getComputedStyle(document.body).position, bodyTop: getComputedStyle(document.body).top, docScrollable: document.documentElement.scrollHeight > document.documentElement.clientHeight + 2 && getComputedStyle(document.body).position !== 'fixed', z: { sb: sb ? getComputedStyle(sb).zIndex : null, nav: nav ? getComputedStyle(nav).zIndex : null, scrim: scrim ? getComputedStyle(scrim).zIndex : null, header: getComputedStyle(q('[data-region="header"]')).zIndex }, fab: (() => { const f = q('#cm-devtools'); return f ? vis(f) : null; })(), toggleAria: q('.lv2-nav-toggle')?.getAttribute('aria-expanded') };
};

async function garantirTema(page, theme) {
  let t = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 3 && t !== theme; i++) { await page.evaluate(() => { document.querySelector('[data-dsd-theme-toggle]')?.click(); }); await page.waitForTimeout(700); t = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
  return t;
}
let cookies = null;
async function cenario({ vw, vh, theme, route }) {
  const isMobile = vw < 768 || (vh < 768 && vw < 1000);
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: vw < 800 ? 2 : 1, isMobile, hasTouch: isMobile, ignoreHTTPSErrors: true, colorScheme: theme });
  if (cookies) { try { await ctx.addCookies(cookies); } catch {} }
  await ctx.addInitScript(({ theme, flag }) => { try { localStorage.setItem('cm_theme', theme); localStorage.setItem('dshowdash_theme_prefs', JSON.stringify({ theme, density: 'comfortable' })); const k = 'dshow.avst.flags.v1'; const cur = JSON.parse(localStorage.getItem(k) || '{}'); for (const f of ['as6.visual_composer', 'as6.vc_3d', 'as6.shell_vc3d', 'as6.vestuario_separado', 'as6.catalogo_v2']) cur[f] = true; cur['as6.mobile_header_v2'] = !!flag; cur['as6.shell_layout_v2'] = !!flag; localStorage.setItem(k, JSON.stringify(cur)); localStorage.setItem('avst.vc.onboarded', '1'); if (!sessionStorage.getItem('lv2.audit.limpo')) { for (const k2 of ['dshowdash-layout-sidebarCollapsed', 'dsd-sidebar-collapsed']) localStorage.removeItem(k2); sessionStorage.removeItem('lv2.tablet.auto-collapsed'); sessionStorage.setItem('lv2.audit.limpo', '1'); } } catch {} }, { theme, flag: FLAG });
  const page = await ctx.newPage();
  const cerr = [], perr = [];
  page.on('console', (m) => { if (m.type() === 'error') { const t = m.text(); if (!/favicon|net::ERR_ABORTED/i.test(t)) cerr.push(t.slice(0, 160)); } });
  page.on('pageerror', (e) => perr.push(String(e).slice(0, 160)));
  const tag = `${vw}x${vh}-${route}-${theme}-${FLAG ? 'on' : 'off'}`;
  const out = { tag, vw, vh, theme, route, flag: FLAG, ok: false };
  try {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    const chegou = await Promise.race([page.waitForSelector('.site-header', { timeout: 25000 }).then(() => 'shell').catch(() => null), page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 25000 }).then(() => 'login').catch(() => null)]);
    if (chegou === 'login' || ((await isLoginPage(page)) && await page.isVisible('input[type="password"]').catch(() => false))) { await loginViaPage(page); try { cookies = await ctx.cookies(); } catch {} }
    await page.waitForSelector('.site-header', { timeout: 30000 }); await page.waitForSelector('[data-region="main"]', { timeout: 30000 });
    await page.waitForSelector('.preloader-container', { state: 'hidden', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000);
    out.themeGot = await garantirTema(page, theme);
    if (route !== 'dash') { await page.evaluate((h) => { if (window.RouterGlobal && window.RouterGlobal.navigate) window.RouterGlobal.navigate(h.replace(/^#/, '')); else location.hash = h; }, ROUTE_HASH[route] || ('#/' + route)); await page.waitForTimeout(4500); if (route === 'avatar') await page.waitForSelector('[data-vc], [data-avst-react-root], .avst-root', { timeout: 45000 }).catch(() => { out.avatarMountTimeout = true; }); await page.waitForTimeout(1500); }
    await page.waitForTimeout(800);
    const m1 = await page.evaluate(MEDIR);
    await page.screenshot({ path: `${OUT}/${tag}.png` });
    // fim da página (rodapé após o conteúdo)
    await page.evaluate(() => { const de = document.documentElement; window.scrollTo(0, de.scrollHeight); const m = document.querySelector('[data-region="main"]'); if (m && getComputedStyle(m).position === 'fixed') m.scrollTop = m.scrollHeight; }); await page.waitForTimeout(500);
    const fim = await page.evaluate(MEDIR);
    await page.screenshot({ path: `${OUT}/${tag}-fim.png` });
    await page.evaluate(() => { window.scrollTo(0, 0); const m = document.querySelector('[data-region="main"]'); if (m) m.scrollTop = 0; }); await page.waitForTimeout(300);
    // página CURTA: esvazia o conteúdo do main (só medição) → rodapé deve ficar no fim do viewport
    const curta = await page.evaluate(() => { const c = document.querySelector('[data-region="main"] .dsd-container'); if (!c) return null; const prev = c.style.cssText; c.style.cssText = 'height:120px !important;min-height:0 !important;max-height:120px !important;overflow:hidden !important'; const fi = document.querySelector('[data-region="footer"] .dsd-footer, [data-region="footer"] .app-footer'); const r = fi ? fi.getBoundingClientRect() : null; const de = document.documentElement; const res = r ? { footerBottom: Math.round(r.bottom), vh: innerHeight, clientH: de.clientHeight, docSH: de.scrollHeight, atBottom: Math.abs(r.bottom - de.clientHeight) <= 1 || Math.abs(r.bottom - innerHeight) <= 1, gapMain: Math.round(r.top - document.querySelector('[data-region="main"]').getBoundingClientRect().bottom) } : null; c.style.cssText = prev; return res; });
    await page.waitForTimeout(200);
    // sidebar: expandir/recolher no desktop e tablet
    let sidebar = null;
    if (m1.sidebar.toggle && m1.sidebar.toggle.vis && m1.sidebar.toggle.rect.x >= 0 && m1.sidebar.toggle.rect.r <= vw && (vw >= 768)) { // só quando o toggle está de fato na tela (flag OFF em tablet: sidebar fora do viewport)
      const antes = await page.evaluate(() => ({ collapsed: document.body.classList.contains('sidebar-collapsed'), sbW: Math.round(document.querySelector('[data-region="sidebar"]').getBoundingClientRect().width), mainX: Math.round(document.querySelector('[data-region="main"]').getBoundingClientRect().x), mainW: Math.round(document.querySelector('[data-region="main"]').getBoundingClientRect().width), footW: Math.round((document.querySelector('[data-region="footer"] .dsd-footer') || document.querySelector('[data-region="footer"]')).getBoundingClientRect().width), ls: localStorage.getItem('dshowdash-layout-sidebarCollapsed') }));
      await page.click('.dsd-sidebar__toggle'); await page.waitForTimeout(700);
      const depois = await page.evaluate(() => ({ collapsed: document.body.classList.contains('sidebar-collapsed'), sbW: Math.round(document.querySelector('[data-region="sidebar"]').getBoundingClientRect().width), mainX: Math.round(document.querySelector('[data-region="main"]').getBoundingClientRect().x), mainW: Math.round(document.querySelector('[data-region="main"]').getBoundingClientRect().width), footW: Math.round((document.querySelector('[data-region="footer"] .dsd-footer') || document.querySelector('[data-region="footer"]')).getBoundingClientRect().width), ls: localStorage.getItem('dshowdash-layout-sidebarCollapsed'), toggleAria: document.querySelector('.dsd-sidebar__toggle')?.getAttribute('aria-expanded'), ativo: (() => { const a = document.querySelector('.dsd-sidebar__item--active .dsd-sidebar__link, .dsd-sidebar__link[aria-current="page"]'); return a ? { vis: a.getBoundingClientRect().width > 0, bg: getComputedStyle(a).backgroundColor } : null; })(), overlapMain: (() => { const s = document.querySelector('[data-region="sidebar"]').getBoundingClientRect(), m = document.querySelector('[data-region="main"]').getBoundingClientRect(); return Math.max(0, Math.min(s.right, m.right) - Math.max(s.left, m.left)); })() }));
      await page.screenshot({ path: `${OUT}/${tag}-sidebar-toggled.png` });
      // tooltip acessível no estado recolhido: foca o primeiro link
      let tooltip = null;
      const colapsadoAgora = depois.collapsed;
      if (colapsadoAgora) { tooltip = await page.evaluate(() => { const a = document.querySelector('.dsd-sidebar__link'); if (!a) return null; a.focus(); const t = document.getElementById('lv2-tooltip'); return { name: a.getAttribute('aria-label') || a.textContent.trim(), tooltipVisible: !!t && !t.hidden && t.getBoundingClientRect().width > 0, tooltipText: t ? t.textContent : null, describedby: a.getAttribute('aria-describedby'), inViewport: t ? t.getBoundingClientRect().right <= innerWidth : null }; }); }
      // volta ao estado anterior (persistência: a chave deve refletir a preferência)
      await page.click('.dsd-sidebar__toggle'); await page.waitForTimeout(700);
      const volta = await page.evaluate(() => ({ collapsed: document.body.classList.contains('sidebar-collapsed'), ls: localStorage.getItem('dshowdash-layout-sidebarCollapsed'), mainX: Math.round(document.querySelector('[data-region="main"]').getBoundingClientRect().x) }));
      // recarrega para provar persistência da preferência (deixa recolhido, recarrega, mede)
      await page.click('.dsd-sidebar__toggle'); await page.waitForTimeout(500);
      const salvo = await page.evaluate(() => localStorage.getItem('dshowdash-layout-sidebarCollapsed'));
      await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector('[data-region="main"]', { timeout: 30000 }); await page.waitForSelector('.preloader-container', { state: 'hidden', timeout: 20000 }).catch(() => {}); await page.waitForTimeout(3500);
      const aposReload = await page.evaluate(() => ({ collapsed: document.body.classList.contains('sidebar-collapsed'), sbW: Math.round(document.querySelector('[data-region="sidebar"]').getBoundingClientRect().width), ls: localStorage.getItem('dshowdash-layout-sidebarCollapsed'), lv2: document.documentElement.getAttribute('data-shell-layout-v2') }));
      sidebar = { antes, depois, tooltip, volta, salvo, aposReload };
    }
    // gaveta no mobile
    let gaveta = null;
    if (m1.navToggle && m1.navToggle.vis) {
      await page.evaluate(() => window.scrollTo(0, 160)); await page.waitForTimeout(300);
      const anchorAntes = await page.evaluate(() => Math.round(document.querySelector('[data-region="main"] .dsd-container').getBoundingClientRect().top));
      await page.click('.lv2-nav-toggle'); await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}/${tag}-gaveta.png` });
      const aberta = await page.evaluate(MEDIR_GAVETA);
      await page.evaluate(() => { window.scrollBy(0, 300); }); await page.mouse.move(Math.round(vw / 2), vh - 30); await page.mouse.wheel(0, 300); await page.waitForTimeout(300);
      const lock = await page.evaluate(() => ({ anchor: Math.round(document.querySelector('[data-region="main"] .dsd-container').getBoundingClientRect().top), open: document.documentElement.getAttribute('data-lv2-drawer') === 'open' }));
      // Tab circula dentro da gaveta
      const focos = []; for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); focos.push(await page.evaluate(() => { const a = document.activeElement; const sb = document.querySelector('[data-region="sidebar"]'), nav = document.querySelector('[data-region="nav-rail"]'); return { in: !!(a && ((sb && sb.contains(a)) || (nav && nav.contains(a)))), name: a ? (a.getAttribute('aria-label') || a.textContent.trim().slice(0, 16)) : null, ring: a ? (getComputedStyle(a).outlineStyle !== 'none' && parseFloat(getComputedStyle(a).outlineWidth) > 0) || getComputedStyle(a).boxShadow !== 'none' : false }; })); }
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      const escFechou = await page.evaluate(() => ({ closed: document.documentElement.getAttribute('data-lv2-drawer') !== 'open', focoNoBotao: document.activeElement?.classList.contains('lv2-nav-toggle'), anchor: Math.round(document.querySelector('[data-region="main"] .dsd-container').getBoundingClientRect().top), scrollY: Math.round(scrollY), bodyPos: getComputedStyle(document.body).position, sbHidden: (() => { const s = document.querySelector('[data-region="sidebar"]'); const cs = getComputedStyle(s); return cs.visibility === 'hidden' || s.getBoundingClientRect().right <= 0; })() }));
      // reabre, fecha por toque fora (scrim) e pelo botão
      await page.click('.lv2-nav-toggle'); await page.waitForTimeout(400);
      await page.mouse.click(vw - 15, Math.round(vh / 2)); await page.waitForTimeout(400);
      const scrimFechou = await page.evaluate(() => document.documentElement.getAttribute('data-lv2-drawer') !== 'open');
      await page.click('.lv2-nav-toggle'); await page.waitForTimeout(400);
      const reaberta = await page.evaluate(() => document.documentElement.getAttribute('data-lv2-drawer') === 'open');
      await page.click('.lv2-nav-toggle'); await page.waitForTimeout(400);
      const botaoFechou = await page.evaluate(() => document.documentElement.getAttribute('data-lv2-drawer') !== 'open');
      await page.screenshot({ path: `${OUT}/${tag}-gaveta-fechada.png` });
      gaveta = { anchorAntes, aberta, lock, focos, escFechou, scrimFechou, reaberta, botaoFechou };
    }
    // header v2: menu "Mais" ainda abre e não coexiste com a gaveta
    let mais = null;
    const maisBtn = await page.$('.mh2-more');
    if (maisBtn && await maisBtn.isVisible()) { await maisBtn.click(); await page.waitForTimeout(400); mais = await page.evaluate(() => ({ open: !document.querySelector('#mh2-more-menu')?.hidden, drawer: document.documentElement.getAttribute('data-lv2-drawer'), rect: (() => { const r = document.querySelector('#mh2-more-menu')?.getBoundingClientRect(); return r ? { y: Math.round(r.y), b: Math.round(r.bottom), w: Math.round(r.width) } : null; })(), inVp: (() => { const r = document.querySelector('#mh2-more-menu')?.getBoundingClientRect(); return r ? r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 : null; })() })); await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
    // popover do perfil não recortado
    let perfil = null;
    try { const t = await page.$('.user-menu-trigger'); if (t) { await t.click(); await page.waitForTimeout(600); perfil = await page.evaluate(() => { const d = document.querySelector('.user-menu-dropdown-portal, .user-menu-dropdown'); if (!d) return { open: false }; const r = d.getBoundingClientRect(); const cs = getComputedStyle(d); return { open: cs.display !== 'none' && r.width > 0, inVp: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1, hit: (() => { const e = document.elementFromPoint(r.x + r.width / 2, r.y + Math.min(r.height / 2, 40)); return !!(e && d.contains(e)); })() }; }); await page.keyboard.press('Escape'); await page.evaluate(() => document.body.click()); await page.waitForTimeout(300); } } catch (e) { perfil = { error: String(e).slice(0, 100) }; }
    Object.assign(out, { ok: true, m1, fim, curta, sidebar, gaveta, mais, perfil, cerr, perr });
  } catch (e) { out.error = String(e).slice(0, 300); try { await page.screenshot({ path: `${OUT}/${tag}-ERRO.png` }); } catch {} Object.assign(out, { cerr, perr }); }
  await ctx.close();
  return out;
}
const results = { version: '1.0.0', base: BASE, flag: FLAG, at: new Date().toISOString(), scenarios: [] };
for (const [vw, vh] of VIEWPORTS) for (const route of ROUTES) for (const theme of THEMES) {
  const r = await cenario({ vw, vh, theme, route });
  results.scenarios.push(r);
  const m = r.m1 || {};
  log(r.tag, r.ok ? 'OK' : 'ERRO ' + r.error, r.ok ? `dev=${m.device} mode=${m.lv2mode} cols=${m.shell?.cols} sb=${m.reg?.sidebar?.rect?.w}/${m.reg?.sidebar?.pos} main=${m.main?.rect?.x}+${m.main?.rect?.w}/${m.main?.pos} foot=${m.footer?.innerPos} gapFim=${r.fim?.footer?.gapMain} fimBottom=${r.fim?.footer?.atBottom} curta=${r.curta?.atBottom}/${r.curta?.gapMain} ox=${m.docSW - m.cw} scrollers=${m.scrollers?.length} acoesOverlap=${m.overlapTit} wide=${m.wide?.length} navVis=${m.nav?.vis} sbVis=${m.sidebar?.visLinks} | sb: ${r.sidebar ? `${r.sidebar.antes.sbW}→${r.sidebar.depois.sbW} main.x ${r.sidebar.antes.mainX}→${r.sidebar.depois.mainX} ov=${r.sidebar.depois.overlapMain} ls=${r.sidebar.depois.ls} reload=${r.sidebar.aposReload.collapsed}/${r.sidebar.aposReload.sbW} tip=${r.sidebar.tooltip?.tooltipVisible}` : '-'} | gaveta: ${r.gaveta ? `open=${r.gaveta.aberta.open} w=${r.gaveta.aberta.widthOk} top=${r.gaveta.aberta.topOk} nav=${r.gaveta.aberta.navItens} sb=${r.gaveta.aberta.sbItens} foraVp=${r.gaveta.aberta.foraVp} semHit=${r.gaveta.aberta.semHit} pontos=${r.gaveta.aberta.pontos} lock=${r.gaveta.anchorAntes}=${r.gaveta.lock.anchor} esc=${r.gaveta.escFechou.closed}/${r.gaveta.escFechou.focoNoBotao} scrim=${r.gaveta.scrimFechou} btn=${r.gaveta.botaoFechou} tabs=${r.gaveta.focos.filter((f) => f.in).length}/${r.gaveta.focos.length}` : '-'} mais=${r.mais ? `${r.mais.open}/${r.mais.drawer}` : '-'} perfil=${r.perfil?.open}/${r.perfil?.inVp} cerr=${r.cerr.length} perr=${r.perr.length}` : '');
}
await browser.close();
writeFileSync(`${OUT}/lv2.json`, JSON.stringify(results, null, 1));
log('gravado', `${OUT}/lv2.json`);
