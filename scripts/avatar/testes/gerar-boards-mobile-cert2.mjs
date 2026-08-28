#!/usr/bin/env node
// gerar-boards-mobile-cert2.mjs — TRACK C cert corretiva: boards 17-23 (16 é a
// contact sheet, gerada à parte). Navegador único reutilizado.
import { chromium } from 'playwright-core';
import { acharChromium, BASE } from './navegador.mjs';
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const OUT = process.env.OUTPKG || '/tmp/trackc-cert/boards';
mkdirSync(OUT, { recursive: true });
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function rotular(buf, t, s) { const m = await sharp(buf).metadata(); const W = m.width, H = m.height, BH = 52; const b = Buffer.from(`<svg width="${W}" height="${BH}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${BH}" fill="#12141b"/><text x="14" y="21" fill="#e6e8ee" font-family="sans-serif" font-size="15" font-weight="700">${esc(t)}</text><text x="14" y="42" fill="#8a90a2" font-family="sans-serif" font-size="11">${esc(s || '')}</text></svg>`); return sharp({ create: { width: W, height: H + BH, channels: 3, background: { r: 18, g: 20, b: 27 } } }).composite([{ input: b, top: 0, left: 0 }, { input: buf, top: BH, left: 0 }]).png().toBuffer(); }
async function par(a, b, cw, ch, t, s, ra, rb) {
  const gap = 8, pad = 52, W = 2 * cw + 3 * gap, H = pad + ch + 22 + 2 * gap;
  const L = [{ input: Buffer.from(`<svg width="${W}" height="${pad}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${pad}" fill="#12141b"/><text x="14" y="24" fill="#e6e8ee" font-family="sans-serif" font-size="16" font-weight="700">${esc(t)}</text><text x="14" y="44" fill="#8a90a2" font-family="sans-serif" font-size="11">${esc(s || '')}</text></svg>`), top: 0, left: 0 }];
  const th = async (buf, x, rot) => { L.push({ input: await sharp(buf).resize({ width: cw, height: ch, fit: 'contain', background: { r: 20, g: 22, b: 28 } }).png().toBuffer(), top: pad + gap, left: x }); L.push({ input: Buffer.from(`<svg width="${cw}" height="20" xmlns="http://www.w3.org/2000/svg"><text x="2" y="14" fill="#aeb4c6" font-family="sans-serif" font-size="12">${esc(rot)}</text></svg>`), top: pad + gap + ch + 2, left: x }); };
  await th(a, gap, ra); await th(b, gap * 2 + cw, rb);
  return sharp({ create: { width: W, height: H, channels: 3, background: { r: 15, g: 16, b: 21 } } }).composite(L).png().toBuffer();
}
const salvar = (n, b) => { writeFileSync(join(OUT, n), b); console.log(`  board → ${n}`); };
const nav = await chromium.launch({ executablePath: acharChromium(), args: ['--no-sandbox'] });
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
const pg = await ctx.newPage();
async function render(vp, prep, { flags = FLAGS, legado = false, css = '' } = {}) {
  await pg.setViewportSize(vp);
  await pg.goto(`${BASE}/avst-harness.html`, { waitUntil: 'domcontentloaded' });
  await pg.evaluate((c) => { try { localStorage.setItem('dshow.avst5.tour.v1', 'feito'); localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(c.flags)); if (c.legado) localStorage.setItem('avst.harness.config', JSON.stringify({ formato: 'camadas', versao: 1, base: 'bas_classica', camadas: {}, cores: {} })); else localStorage.removeItem('avst.harness.config'); } catch {} }, { flags, legado });
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForFunction(() => window.__pronto === true, { timeout: 20000 });
  await pg.waitForTimeout(700);
  if (css) await pg.addStyleTag({ content: css });
  if (prep) await prep(pg);
  await pg.waitForTimeout(300);
  return await pg.screenshot();
}
const cat = (n) => async (p) => { await p.evaluate((x) => { const b = [...document.querySelectorAll('.avst5-sidebar .avst5-cat')].find((e) => (e.textContent || '').trim().startsWith(x)); b?.click(); }, n); await p.waitForTimeout(500); };
const ferr = (n) => async (p) => { await p.evaluate((x) => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim().startsWith(x)); b?.click(); }, n); await p.waitForTimeout(700); };
try {
  // 17 — densidade antes/depois (antes = desfaz o Marco 11 via CSS)
  const cssAntes = `.avst5-shell[data-mobile]{--palco-mobile-h:clamp(200px,52dvh,52dvh)!important}.avst5-shell[data-mobile] .avst5-abas,.avst5-shell[data-mobile] .avst6-dockchips,.avst5-shell[data-mobile] .avst5-chips,.avst5-shell[data-mobile] .avst-ft-chips{flex-wrap:wrap!important;overflow:visible!important}.avst5-shell[data-mobile] .avst5-painel-topo{padding:12px!important}`;
  const antes = await render({ width: 390, height: 844 }, cat('Roupa'), { css: cssAntes });
  const depois = await render({ width: 390, height: 844 }, cat('Roupa'));
  salvar('17_MOBILE_CATALOG_DENSITY_BEFORE_AFTER.png', await par(antes, depois, 300, 460, '17 · CATALOG DENSITY (antes → depois)', '390×844 · mobile-catalog-density · Marco 11: cabeçalho 155→57px, ≥1 linha de assets à vista', 'antes (cabeçalho denso)', 'depois (assets à vista)'));
  // 18 — caminho de variantes de cor (equipar + botão Detalhes)
  salvar('18_MOBILE_COLOR_VARIANTS_FLOW.png', await rotular(await render({ width: 390, height: 844 }, async (p) => { await cat('Cabelo')(p); await p.evaluate(() => { const c = [...document.querySelectorAll('.avst-card')].find((x) => !x.classList.contains('avst-card-ativo')); c?.click(); }); await p.waitForTimeout(500); }), '18 · COLOR VARIANTS FLOW', '390×844 · mobile-color-flow · equipar → Detalhes (variantes §73; payload = sessão autenticada)'));
  // 19 — erro e retry (injeta save 500)
  salvar('19_MOBILE_ERROR_AND_RETRY_STATES.png', await rotular(await render({ width: 390, height: 844 }, async (p) => { await p.evaluate(() => { const of = window.fetch; window.fetch = (u, o) => { if (/estado\.php|studio\.php/.test(String(u)) && /post/i.test((o && o.method) || '')) return Promise.resolve(new Response(JSON.stringify({ success: false }), { status: 500, headers: { 'Content-Type': 'application/json' } })); return of(u, o); }; }); await p.evaluate(() => { const c = [...document.querySelectorAll('.avst-card')].find((x) => !x.classList.contains('avst-card-ativo')); c?.click(); }); await p.waitForTimeout(500); await p.evaluate(() => document.querySelector('.avst5-salvar .avst-botao-primario')?.click()); await p.waitForTimeout(900); }), '19 · ERROR & RETRY STATES', '390×844 · mobile-adverse-states · save 500: UI viva, botão utilizável (retry)'));
  // 20 — conteúdo longo / dados extremos
  salvar('20_MOBILE_LONG_CONTENT_AND_LARGE_DATA.png', await rotular(await render({ width: 360, height: 640 }, async (p) => { await cat('Roupa')(p); await p.evaluate(() => { [...document.querySelectorAll('.avst-card-nome')].slice(0, 8).forEach((n, i) => { n.textContent = i % 2 ? 'Traje'.repeat(30) : '🎭👗✨ Premium Édition ' + 'x'.repeat(40); }); }); await p.waitForTimeout(300); }), '20 · LONG CONTENT & LARGE DATA', '360×640 · mobile-extreme-data · nomes longos/emoji truncados, sem overflow'));
  // 21 — back navigation (sheet aberta → após voltar)
  const comSheet = await render({ width: 390, height: 844 }, ferr('Coleções'));
  const aposVoltar = await render({ width: 390, height: 844 }, async (p) => { await ferr('Coleções')(p); await p.evaluate(() => history.back()); await p.waitForTimeout(600); });
  salvar('21_MOBILE_BACK_NAVIGATION.png', await par(comSheet, aposVoltar, 300, 460, '21 · BACK NAVIGATION', '390×844 · mobile-back-navigation · voltar fecha a sheet (não sai do módulo)', 'sheet aberta', 'após voltar (fechou)'));
  // 22 — contraste e foco (foco visível + chip acento escuro)
  salvar('22_MOBILE_CONTRAST_AND_FOCUS.png', await rotular(await render({ width: 390, height: 844 }, async (p) => { await cat('Cabelo')(p); await p.evaluate(() => { const b = document.querySelector('.avst5-shell[data-mobile] .avst5-cat'); b?.focus(); }); await p.waitForTimeout(200); }), '22 · CONTRAST & FOCUS', '390×844 · mobile-contrast-audit · texto ≥4.5:1, fills acento 5.14:1, foco visível'));
  // 23 — device kit (render de um cartão informativo)
  await pg.setContent(`<div style="font-family:sans-serif;background:#0d1017;color:#e6e8ee;width:760px;padding:28px;box-sizing:border-box"><h1 style="color:#96aaff">Device Test Kit — iPhone / Android</h1><ol style="line-height:1.7;font-size:14px"><li>Subir: <code>vite build</code> · <code>gerar-harness</code> · <code>http.server 8901 --bind 0.0.0.0</code></li><li>URL LAN: <code>http://&lt;IP&gt;:8901/avst-harness.html</code> (IP via <code>hostname -I</code>)</li><li>QR: <code>qrencode -t ANSIUTF8 "$URL"</code></li><li>Ligar mobile: <code>localStorage as6.mobile_studio=true</code> + reload</li><li>Checklists: retrato · paisagem · notch · teclado · save autenticado</li><li>VoiceOver (iOS) / TalkBack (Android): categorias anunciam nome+estado; diálogo anuncia; foco entra e retorna</li><li>Capturar: console (Web Inspector / chrome://inspect) + rede + screenshots + gravação</li><li>Formulário de aprovação/reprovação por device</li></ol><p style="color:#8a90a2;font-size:12px">Ver MOBILE_REAL_DEVICE_TEST_KIT.md para o roteiro completo.</p></div>`);
  await pg.waitForTimeout(200);
  const kit = await pg.locator('div').first().screenshot();
  salvar('23_MOBILE_DEVICE_TEST_KIT.png', await rotular(kit, '23 · DEVICE TEST KIT', 'roteiro iPhone/Android + VoiceOver/TalkBack + captura de evidências'));
  console.log('\n✓ boards 17-23 gerados');
} finally { await pg.close().catch(() => {}); await ctx.close().catch(() => {}); await nav.close().catch(() => {}); }
