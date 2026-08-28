// global-mobile-css.mjs — Track D: valida a política global-mobile.css num harness
// ISOLADO (classes reais do shell + CSS-fonte real das regiões). NÃO valida a
// sessão autenticada ao vivo (essa é do Jhony). Prova: (A) com o marcador AUSENTE
// o CSS novo casa ZERO → desktop byte a byte; (B) com o marcador presente, as
// causas-raiz confirmadas são corrigidas em 320/360/390/430 + reduced-motion.
import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
import { fileURLToPath } from 'node:url';
// PORTÁTIL: public/ = 3 níveis acima de scripts/avatar/testes/, com fallback p/ cwd.
const _viaScript = fileURLToPath(new URL('../../../public', import.meta.url));
const ROOT = existsSync(_viaScript) ? _viaScript : `${process.cwd()}/public`;
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json' };
// servidor estático embutido (mesmo processo → o governador gerencia 1 coisa só)
const server = http.createServer((req, res) => {
  try {
    const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); return res.end('nf'); }
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(readFileSync(p));
  } catch { res.writeHead(500); res.end('err'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const nav = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
  const ctx = await nav.newContext();
  const pg = await ctx.newPage();
  await pg.goto(`${BASE}/global-mobile-harness.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => window.__pronto === true, { timeout: 15000 });

  // ── (A) DESKTOP SAFETY: marcador AUSENTE → nenhuma regra [data-mobile] aplica ──
  // conta, via CSSOM, quantas regras do global-mobile.css casariam sem o atributo.
  const semMarcador = await pg.evaluate(() => {
    const sh = [...document.styleSheets].find(s => (s.href || '').includes('global-mobile.css'));
    let seletores = 0, casam = 0;
    const root = document.getElementById('app-shell');
    root.removeAttribute('data-mobile'); root.removeAttribute('data-viewport');
    const walk = (rules) => { for (const r of rules) {
      if (r.selectorText) { seletores++; try { if (document.querySelector(r.selectorText)) casam++; } catch {} }
      if (r.cssRules) walk(r.cssRules);
    } };
    try { walk(sh.cssRules); } catch (e) { return { erro: String(e) }; }
    return { seletores, casam };
  });
  ok(!semMarcador.erro && semMarcador.seletores > 0, `global-mobile.css carregou (${semMarcador.seletores} seletores)`);
  ok(semMarcador.casam === 0, `marcador AUSENTE → 0 seletores casam (desktop byte a byte) [casam=${semMarcador.casam}]`);

  // ── (B) MOBILE: liga o marcador e valida em cada viewport ──
  const VPS = [[320,568],[360,640],[390,844],[430,932]];
  for (const [w, h] of VPS) {
    await pg.setViewportSize({ width: w, height: h });
    await pg.evaluate(() => window.__setMobile(true));
    await pg.waitForTimeout(120);
    const r = await pg.evaluate(() => {
      const de = document.documentElement;
      const overflowH = de.scrollWidth > de.clientWidth + 1;
      const cs = (el) => el ? getComputedStyle(el) : null;
      const side = document.querySelector('.dsd-sidebar');
      const sideCS = cs(side);
      const hr = document.getElementById('hr');
      const hrCS = cs(hr);
      const footer = document.querySelector('.dsd-footer');
      const footCS = cs(footer);
      // alvos de toque no chrome mobile (bottom-nav + footer controls)
      const alvos = [...document.querySelectorAll('.nav-rail--mobile .nav-rail__item, .dsd-footer__control-btn, .dsd-footer__link')];
      const menores = alvos.filter(a => { const b = a.getBoundingClientRect(); return b.width < 44 || b.height < 44; }).length;
      return {
        overflowH,
        sidebarDisplay: sideCS.display,
        sidebarW: Math.round(side.getBoundingClientRect().width),
        headerRightOverflowX: hrCS.overflowX,
        docScrollW: de.scrollWidth, docClientW: de.clientWidth,
        footerPosition: footCS.position,
        alvosMenores44: menores, alvosTotal: alvos.length,
      };
    });
    ok(!r.overflowH, `${w}×${h}: SEM overflow horizontal do documento (scroll=${r.docScrollW} client=${r.docClientW})`);
    ok(r.sidebarDisplay !== 'none' && r.sidebarW >= 200, `${w}×${h}: drawer REABILITADO (display=${r.sidebarDisplay}, w=${r.sidebarW}px — refuta display:none<500 e 0×0)`);
    ok(r.headerRightOverflowX === 'auto' || r.headerRightOverflowX === 'scroll', `${w}×${h}: header-right contém as ações (overflow-x=${r.headerRightOverflowX}) sem estourar o documento`);
    ok(r.footerPosition === 'static', `${w}×${h}: footer no FLUXO (position=${r.footerPosition}) — não compete com a bottom-nav`);
    ok(r.alvosMenores44 === 0, `${w}×${h}: alvos de toque ≥44px no chrome mobile (${r.alvosTotal} alvos, ${r.alvosMenores44}<44)`);
  }

  // ── drawer abre com geometria real ──
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.evaluate(() => { window.__setMobile(true); window.__openDrawer(true); });
  await pg.waitForTimeout(150);
  const drawer = await pg.evaluate(() => {
    const s = document.querySelector('.dsd-sidebar'); const b = s.getBoundingClientRect();
    return { x: Math.round(b.x), w: Math.round(b.width), h: Math.round(b.height) };
  });
  ok(drawer.x >= -1 && drawer.x <= 2 && drawer.w >= 200 && drawer.h > 200, `drawer ABERTO visível e ancorado (x=${drawer.x}, ${drawer.w}×${drawer.h})`);

  // ── reduced-motion: o marquee do ticker para ──
  const ctx2 = await nav.newContext({ reducedMotion: 'reduce' });
  const pg2 = await ctx2.newPage();
  await pg2.goto(`${BASE}/global-mobile-harness.html`, { waitUntil: 'domcontentloaded' });
  await pg2.waitForFunction(() => window.__pronto === true, { timeout: 15000 });
  await pg2.setViewportSize({ width: 390, height: 844 });
  await pg2.evaluate(() => window.__setMobile(true));
  await pg2.waitForTimeout(120);
  const anim = await pg2.evaluate(() => getComputedStyle(document.querySelector('.ticker-track')).animationName);
  ok(anim === 'none', `reduced-motion → ticker-track SEM animação (animation-name=${anim})`);

  console.log(falhas ? `\n✗ global-mobile-css: ${falhas} falha(s)` : '\n✓ global-mobile-css verde');
} finally { await nav.close(); server.close(); }
process.exit(falhas ? 1 : 0);
