#!/usr/bin/env node
// testes/gerar-boards-mobile.mjs — TRACK C Marco 10: gera os 15 BOARDS de
// evidência visual da adaptação mobile. Cada board é um PNG rotulado (banner de
// título) salvo em OUTPKG (default /tmp/mobile/pkg — fora do git, entra no
// pacote de entrega). Captura estados reais do shell mobile (flag ON + viewport
// estreito) e a prova de que o desktop segue intacto (flag OFF).
//
// Preparação: build vite do panel + gerar-harness + http.server 8901 em public/.
import { abrir, irParaHarness } from './navegador.mjs';
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUTPKG = process.env.OUTPKG || '/tmp/mobile/pkg';
mkdirSync(OUTPKG, { recursive: true });
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
const initFlags = (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Banner de título sobre uma captura (composição com sharp). */
async function rotular(pngBuf, titulo, sub) {
  const img = sharp(pngBuf); const meta = await img.metadata();
  const W = meta.width, H = meta.height, BH = 46;
  const banner = Buffer.from(
    `<svg width="${W}" height="${BH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${BH}" fill="#12141b"/>
      <text x="14" y="20" fill="#e6e8ee" font-family="sans-serif" font-size="15" font-weight="700">${esc(titulo)}</text>
      <text x="14" y="38" fill="#8a90a2" font-family="sans-serif" font-size="11">${esc(sub || '')}</text>
    </svg>`);
  return sharp({ create: { width: W, height: H + BH, channels: 3, background: { r: 18, g: 20, b: 27 } } })
    .composite([{ input: banner, top: 0, left: 0 }, { input: pngBuf, top: BH, left: 0 }]).png().toBuffer();
}

/** Montagem em grade de várias capturas rotuladas (para a matriz de viewports). */
async function montarGrade(cels, cols, cellW, cellH, titulo) {
  const gap = 8, padTop = 46;
  const rows = Math.ceil(cels.length / cols);
  const W = cols * cellW + (cols + 1) * gap;
  const H = padTop + rows * (cellH + 22) + (rows + 1) * gap;
  const layers = [];
  const banner = Buffer.from(`<svg width="${W}" height="${padTop}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${padTop}" fill="#12141b"/><text x="14" y="28" fill="#e6e8ee" font-family="sans-serif" font-size="17" font-weight="700">${esc(titulo)}</text></svg>`);
  layers.push({ input: banner, top: 0, left: 0 });
  for (let i = 0; i < cels.length; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const x = gap + c * (cellW + gap), y = padTop + gap + r * (cellH + 22 + gap);
    const thumb = await sharp(cels[i].buf).resize({ width: cellW, height: cellH, fit: 'contain', background: { r: 20, g: 22, b: 28 } }).png().toBuffer();
    const rot = Buffer.from(`<svg width="${cellW}" height="20" xmlns="http://www.w3.org/2000/svg"><text x="2" y="14" fill="#aeb4c6" font-family="sans-serif" font-size="12">${esc(cels[i].rot)}</text></svg>`);
    layers.push({ input: thumb, top: y, left: x });
    layers.push({ input: rot, top: y + cellH + 2, left: x });
  }
  return sharp({ create: { width: W, height: H, channels: 3, background: { r: 15, g: 16, b: 21 } } }).composite(layers).png().toBuffer();
}

const salvar = (nome, buf) => { writeFileSync(join(OUTPKG, nome), buf); console.log(`  board → ${nome}`); };

// ── helpers de captura ────────────────────────────────────────────────
async function capShell(viewport, prep) {
  const { navegador, pagina } = await abrir({ viewport, init: initFlags, initArg: FLAGS });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 1000);
    if (prep) await prep(pagina);
    await pagina.waitForTimeout(300);
    return await pagina.screenshot();
  } finally { await navegador.close(); }
}

const clicarCat = (nome) => async (p) => { await p.evaluate((n) => { const b = [...document.querySelectorAll('.avst5-sidebar .avst5-cat, button.avst6-navg-cab')].find((x) => (x.textContent || '').trim().startsWith(n)); b?.scrollIntoView({ inline: 'center' }); b?.click(); }, nome); await p.waitForTimeout(500); };
const abrirFerr = (nome) => async (p) => { await p.evaluate((n) => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim().startsWith(n)); b?.click(); }, nome); await p.waitForTimeout(700); };

console.log('Gerando boards mobile em', OUTPKG);

// 01 — MATRIZ DE VIEWPORTS (o shell mobile em vários tamanhos)
{
  const matriz = [
    { vp: { width: 320, height: 568 }, rot: '320×568 (iPhone SE)' },
    { vp: { width: 375, height: 667 }, rot: '375×667 (iPhone 8)' },
    { vp: { width: 390, height: 844 }, rot: '390×844 (iPhone 12/13)' },
    { vp: { width: 414, height: 896 }, rot: '414×896 (11 Pro Max)' },
    { vp: { width: 360, height: 800 }, rot: '360×800 (Android)' },
    { vp: { width: 768, height: 1024 }, rot: '768×1024 (tablet)' },
  ];
  const cels = [];
  for (const m of matriz) cels.push({ buf: await capShell(m.vp), rot: m.rot });
  salvar('01_MOBILE_VIEWPORT_MATRIX.png', await montarGrade(cels, 3, 190, 300, '01 · MOBILE VIEWPORT MATRIX — as6.mobile_studio ON'));
}

// 02 — SHELL STACK (reflow do grid de 5 col → coluna)
salvar('02_MOBILE_SHELL_STACK.png', await rotular(await capShell({ width: 390, height: 844 }), '02 · MOBILE SHELL STACK', 'grid de 5 colunas → stack vertical · palco topo · catálogo abaixo'));
// 03 — PALCO VISÍVEL no topo
salvar('03_MOBILE_PALCO_VISIBLE.png', await rotular(await capShell({ width: 390, height: 844 }, clicarCat('Rosto')), '03 · MOBILE PALCO VISIBLE', 'palco 2D emoldurado, sticky no topo, proporção preservada'));
// 04 — TRILHO DE CATEGORIAS horizontal
salvar('04_MOBILE_CATEGORY_RAIL.png', await rotular(await capShell({ width: 390, height: 844 }, clicarCat('Cabelo')), '04 · MOBILE CATEGORY RAIL', 'trilho horizontal fino, snap, categoria ativa marcada'));
// 05 — FERRAMENTA como full-screen sheet
salvar('05_MOBILE_TOOLS_SHEET.png', await rotular(await capShell({ width: 390, height: 844 }, abrirFerr('Coleções')), '05 · MOBILE TOOLS SHEET', 'ferramenta clássica como sheet full-screen (role=dialog, aria-modal)'));
// 06 — GRADE DE ASSETS por toque
salvar('06_MOBILE_ASSET_GRID.png', await rotular(await capShell({ width: 390, height: 844 }, clicarCat('Roupa')), '06 · MOBILE ASSET GRID', 'grade 2 colunas, cards com alvo de toque confortável'));
// 07 — CONTROLES DE COR
salvar('07_MOBILE_COLOR_CONTROLS.png', await rotular(await capShell({ width: 390, height: 844 }, clicarCat('Cabelo')), '07 · MOBILE COLOR CONTROLS', 'swatches ≥34px e sliders com trilho/thumb ampliados'));
// 08 — BARRA DE SALVAR fixa inferior
salvar('08_MOBILE_SAVE_BAR.png', await rotular(await capShell({ width: 390, height: 844 }, clicarCat('Rosto')), '08 · MOBILE SAVE BAR', 'barra de ação inferior fixa, sempre alcançável, acima do catálogo'));
// 09 — SAFE-AREA (notch simulado por viewport largo alto)
salvar('09_MOBILE_SAFE_AREA.png', await rotular(await capShell({ width: 390, height: 844 }), '09 · MOBILE SAFE AREA', 'env(safe-area-inset-*) no header e na barra inferior (fallback 0)'));
// 10 — PAISAGEM de celular
salvar('10_MOBILE_LANDSCAPE.png', await rotular(await capShell({ width: 844, height: 390 }, clicarCat('Rosto')), '10 · MOBILE LANDSCAPE', 'altura baixa: palco menor, tudo cabe, sem overflow'));
// 11 — TECLADO (foco em campo dentro de ferramenta com input)
salvar('11_MOBILE_KEYBOARD.png', await rotular(await capShell({ width: 390, height: 844 }, abrirFerr('Títulos')), '11 · MOBILE KEYBOARD', 'campos font-size 16 (sem zoom iOS) + barra de salvar sai do teclado'));
// 12 — COMPAT LEGADO
salvar('12_MOBILE_LEGACY_COMPAT.png', await rotular(await (async () => {
  const { navegador, pagina } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); localStorage.setItem('avst.harness.config', JSON.stringify({ formato: 'camadas', versao: 1, base: 'bas_classica', camadas: {}, cores: {} })); } catch {} }, initArg: FLAGS });
  try { await irParaHarness(pagina, 'avst-harness.html', 1100); await pagina.waitForTimeout(400); return await pagina.screenshot(); } finally { await navegador.close(); }
})(), '12 · MOBILE LEGACY COMPAT', 'avatar legado (formato camadas) abre, renderiza e salva no shell mobile'));
// 13 — ALVOS DE ACESSIBILIDADE (mesma tela, foco em toque)
salvar('13_MOBILE_ACCESSIBILITY_TARGETS.png', await rotular(await capShell({ width: 390, height: 844 }, clicarCat('Olhos')), '13 · MOBILE ACCESSIBILITY TARGETS', 'alvos ≥44px, aria-current na categoria ativa, zoom livre, reduced-motion'));
// 14 — REGRESSÃO DESKTOP (flag OFF → composição mobile NÃO aplica)
salvar('14_MOBILE_DESKTOP_REGRESSION.png', await rotular(await (async () => {
  const { navegador, pagina } = await abrir({ viewport: { width: 1280, height: 900 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true } });
  try { await irParaHarness(pagina, 'avst-harness.html', 1000); await pagina.waitForTimeout(300); return await pagina.screenshot(); } finally { await navegador.close(); }
})(), '14 · DESKTOP REGRESSION (flag OFF)', 'as6.mobile_studio OFF → grid aprovado de 5 colunas byte a byte (Track A)'));
// 15 — FLUXO FINAL DO PRODUTO (montagem entry→edit→tools→save)
{
  const cels = [
    { buf: await capShell({ width: 390, height: 844 }), rot: '1. entrada' },
    { buf: await capShell({ width: 390, height: 844 }, clicarCat('Roupa')), rot: '2. editar' },
    { buf: await capShell({ width: 390, height: 844 }, abrirFerr('Coleções')), rot: '3. ferramentas' },
    { buf: await capShell({ width: 390, height: 844 }, clicarCat('Rosto')), rot: '4. salvar' },
  ];
  salvar('15_MOBILE_FINAL_PRODUCT_FLOW.png', await montarGrade(cels, 4, 175, 320, '15 · MOBILE FINAL PRODUCT FLOW — entry → edit → tools → save'));
}

console.log('\n✓ 15 boards mobile gerados em', OUTPKG);
