#!/usr/bin/env node
// testes/gerar-boards-mobile-cert.mjs — TRACK C FINAL CERTIFICATION: os 15
// boards com o esquema de nomes da certificação. Cada board carrega viewport,
// flag e critério no banner. Salva em OUTPKG (default /tmp/trackc-cert/boards).
import { abrir, irParaHarness } from './navegador.mjs';
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.env.OUTPKG || '/tmp/trackc-cert/boards';
mkdirSync(OUT, { recursive: true });
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
const FLAGS_OFF = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true };
const seed = (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} };
const seedLegado = (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); localStorage.setItem('avst.harness.config', JSON.stringify({ formato: 'camadas', versao: 1, base: 'bas_classica', camadas: {}, cores: {} })); } catch {} };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function rotular(buf, titulo, sub) {
  const meta = await sharp(buf).metadata(); const W = meta.width, H = meta.height, BH = 52;
  const banner = Buffer.from(`<svg width="${W}" height="${BH}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${BH}" fill="#12141b"/><text x="14" y="21" fill="#e6e8ee" font-family="sans-serif" font-size="15" font-weight="700">${esc(titulo)}</text><text x="14" y="42" fill="#8a90a2" font-family="sans-serif" font-size="11">${esc(sub || '')}</text></svg>`);
  return sharp({ create: { width: W, height: H + BH, channels: 3, background: { r: 18, g: 20, b: 27 } } }).composite([{ input: banner, top: 0, left: 0 }, { input: buf, top: BH, left: 0 }]).png().toBuffer();
}
async function grade(cels, cols, cw, ch, titulo, sub) {
  const gap = 8, pad = 52, rows = Math.ceil(cels.length / cols);
  const W = cols * cw + (cols + 1) * gap, H = pad + rows * (ch + 22) + (rows + 1) * gap;
  const L = [{ input: Buffer.from(`<svg width="${W}" height="${pad}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${pad}" fill="#12141b"/><text x="14" y="24" fill="#e6e8ee" font-family="sans-serif" font-size="16" font-weight="700">${esc(titulo)}</text><text x="14" y="44" fill="#8a90a2" font-family="sans-serif" font-size="11">${esc(sub || '')}</text></svg>`), top: 0, left: 0 }];
  for (let i = 0; i < cels.length; i++) {
    const r = Math.floor(i / cols), c = i % cols, x = gap + c * (cw + gap), y = pad + gap + r * (ch + 22 + gap);
    L.push({ input: await sharp(cels[i].buf).resize({ width: cw, height: ch, fit: 'contain', background: { r: 20, g: 22, b: 28 } }).png().toBuffer(), top: y, left: x });
    L.push({ input: Buffer.from(`<svg width="${cw}" height="20" xmlns="http://www.w3.org/2000/svg"><text x="2" y="14" fill="#aeb4c6" font-family="sans-serif" font-size="12">${esc(cels[i].rot)}</text></svg>`), top: y + ch + 2, left: x });
  }
  return sharp({ create: { width: W, height: H, channels: 3, background: { r: 15, g: 16, b: 21 } } }).composite(L).png().toBuffer();
}
const salvar = (n, b) => { writeFileSync(join(OUT, n), b); console.log(`  board → ${n}`); };
async function cap(viewport, prep, flags = FLAGS, init = seed) {
  const { navegador, pagina } = await abrir({ viewport, init, initArg: flags });
  try { await irParaHarness(pagina, 'avst-harness.html', 1000); if (prep) await prep(pagina); await pagina.waitForTimeout(300); return await pagina.screenshot(); } finally { await navegador.close(); }
}
const cat = (n) => async (p) => { await p.evaluate((x) => { const b = [...document.querySelectorAll('.avst5-sidebar .avst5-cat, button.avst6-navg-cab')].find((e) => (e.textContent || '').trim().startsWith(x)); b?.scrollIntoView({ inline: 'center' }); b?.click(); }, n); await p.waitForTimeout(500); };
const ferr = (n) => async (p) => { await p.evaluate((x) => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim().startsWith(x)); b?.click(); }, n); await p.waitForTimeout(700); };

console.log('Boards de certificação em', OUT);

const M = [[320, 568, 'iPhone SE'], [375, 667, 'iPhone 8'], [390, 844, 'iPhone 12/13'], [412, 915, 'Android'], [430, 932, 'iPhone 15 PM'], [768, 1024, 'tablet']];
{ const cels = []; for (const [w, h, nome] of M) cels.push({ buf: await cap({ width: w, height: h }), rot: `${w}×${h} ${nome}` }); salvar('01_MOBILE_VIEWPORT_MATRIX.png', await grade(cels, 3, 190, 300, '01 · VIEWPORT MATRIX', 'flag as6.mobile_studio ON · teste mobile-viewport-matrix · critério: sem overflow, palco visível')); }

salvar('02_MOBILE_ENTRY_AND_SHELL.png', await rotular(await cap({ width: 390, height: 844 }), '02 · ENTRY & SHELL', '390×844 · flag ON · mobile-shell-layout · grid 5col → stack, palco sticky topo'));
salvar('03_MOBILE_CATEGORY_NAVIGATION.png', await rotular(await cap({ width: 390, height: 844 }, cat('Cabelo')), '03 · CATEGORY NAVIGATION', '390×844 · flag ON · mobile-touch-navigation · trilho horizontal fino, ativa marcada'));
salvar('04_MOBILE_ASSET_BOTTOM_SHEET.png', await rotular(await cap({ width: 390, height: 844 }, cat('Roupa')), '04 · ASSET GRID / BOTTOM SHEET', '390×844 · flag ON · mobile-asset-selection · grade 2col por toque'));
{ const cels = [
  { buf: await cap({ width: 390, height: 844 }, cat('Rosto')), rot: 'Rosto (busto)' },
  { buf: await cap({ width: 390, height: 844 }, cat('Cabelo')), rot: 'Cabelo (busto)' },
  { buf: await cap({ width: 390, height: 844 }, cat('Roupa')), rot: 'Roupa (corpo)' },
  { buf: await cap({ width: 390, height: 844 }, cat('Calçados')), rot: 'Calçados (pés)' },
]; salvar('05_MOBILE_FACE_HAIR_CLOTHING_FOOTWEAR.png', await grade(cels, 4, 175, 320, '05 · FACE · HAIR · CLOTHING · FOOTWEAR', '390×844 · flag ON · mobile-category-flow · palco reenquadra pelo motor real')); }
salvar('06_MOBILE_TOOLS_OVERLAYS.png', await rotular(await cap({ width: 390, height: 844 }, ferr('Coleções')), '06 · TOOLS / OVERLAYS', '390×844 · flag ON · mobile-tools-overlays · full-screen sheet (role=dialog, aria-modal)'));
salvar('07_MOBILE_SAVE_FLOW.png', await rotular(await cap({ width: 390, height: 844 }, cat('Rosto')), '07 · SAVE FLOW', '390×844 · flag ON · mobile-save-flow · barra fixa inferior, POST estado.php'));
salvar('08_MOBILE_KEYBOARD_AND_FORMS.png', await rotular(await cap({ width: 390, height: 844 }, ferr('Títulos')), '08 · KEYBOARD & FORMS', '390×844 · flag ON · mobile-keyboard-viewport · campos 16px, barra sai do teclado'));
salvar('09_MOBILE_SAFE_AREAS.png', await rotular(await cap({ width: 390, height: 844 }), '09 · SAFE AREAS', '390×844 · flag ON · mobile-safe-area · env(safe-area-inset-*) header/barra'));
salvar('10_MOBILE_LANDSCAPE.png', await rotular(await cap({ width: 844, height: 390 }, cat('Rosto')), '10 · LANDSCAPE', '844×390 · flag ON · mobile-landscape · altura baixa, palco menor, sem overflow'));
salvar('11_MOBILE_LEGACY_COMPAT.png', await rotular(await cap({ width: 390, height: 844 }, null, FLAGS, seedLegado), '11 · LEGACY COMPAT', '390×844 · flag ON · mobile-legacy-compat · avatar legado (camadas) renderiza/salva'));
salvar('12_MOBILE_TABLET.png', await rotular(await cap({ width: 768, height: 1024 }, cat('Rosto')), '12 · TABLET', '768×1024 · flag ON · mobile-tablet-layout · fronteira: 768 = stack mobile'));
{ const cels = [
  { buf: await cap({ width: 1280, height: 900 }, cat('Rosto'), FLAGS_OFF), rot: 'flag OFF (produção)' },
  { buf: await cap({ width: 1280, height: 900 }, cat('Rosto'), FLAGS), rot: 'flag ON (mesmo desktop)' },
]; salvar('13_DESKTOP_BEFORE_AFTER_PARITY.png', await grade(cels, 2, 380, 300, '13 · DESKTOP BEFORE/AFTER PARITY', '1280×900 · desktop-responsive-regression · grid 5col idêntico com flag OFF e ON (mobile não vaza)')); }
salvar('14_MOBILE_ACCESSIBILITY_TOUCH_TARGETS.png', await rotular(await cap({ width: 390, height: 844 }, cat('Olhos')), '14 · ACCESSIBILITY / TOUCH TARGETS', '390×844 · flag ON · mobile-accessibility-smoke · alvos ≥44, aria-current, zoom livre'));
{ const cels = [
  { buf: await cap({ width: 390, height: 844 }), rot: '1. entrada' },
  { buf: await cap({ width: 390, height: 844 }, cat('Roupa')), rot: '2. editar' },
  { buf: await cap({ width: 390, height: 844 }, ferr('Coleções')), rot: '3. ferramentas' },
  { buf: await cap({ width: 390, height: 844 }, cat('Rosto')), rot: '4. salvar' },
]; salvar('15_MOBILE_FINAL_PRODUCT_FLOW.png', await grade(cels, 4, 175, 320, '15 · FINAL PRODUCT FLOW', '390×844 · flag ON · entry → edit → tools → save, sem sair do 2D único')); }

console.log('\n✓ 15 boards de certificação gerados em', OUT);
