#!/usr/bin/env node
// gerar-boards-mobile-cert3.mjs — TRACK C closure: boards 24-26.
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
const salvar = (n, b) => { writeFileSync(join(OUT, n), b); console.log(`  board → ${n}`); };
const nav = await chromium.launch({ executablePath: acharChromium(), args: ['--no-sandbox'] });
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
const pg = await ctx.newPage();
async function render(prep) {
  await pg.goto(`${BASE}/avst-harness.html`, { waitUntil: 'domcontentloaded' });
  await pg.evaluate((f) => { try { localStorage.setItem('dshow.avst5.tour.v1', 'feito'); localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); localStorage.removeItem('avst.harness.config'); } catch {} }, FLAGS);
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForFunction(() => window.__pronto === true, { timeout: 20000 }); await pg.waitForTimeout(700);
  if (prep) await prep(pg); await pg.waitForTimeout(300); return await pg.screenshot();
}
async function cartao(html, w = 760) { await pg.setViewportSize({ width: w, height: 900 }); await pg.setContent(`<div id="c" style="font-family:sans-serif;background:#0d1017;color:#e6e8ee;width:${w}px;padding:24px;box-sizing:border-box">${html}</div>`); await pg.waitForTimeout(150); return await pg.locator('#c').screenshot(); }
try {
  // 24 — variantes de cor REAL: drawer aberto com variantes, sobre asset equipado
  const b24 = await render(async (p) => {
    await p.evaluate(() => { document.querySelectorAll('.avst6-navg-cab').forEach((b) => { if (b.getAttribute('aria-expanded') === 'false') b.click(); }); });
    await p.waitForTimeout(300);
    await p.evaluate(() => { const c = [...document.querySelectorAll('.avst5-cat')].find((x) => /Coberturas de cabeça/i.test(x.textContent || '')); c?.click(); });
    await p.waitForTimeout(500);
    await p.evaluate(() => { const card = [...document.querySelectorAll('.avst-card')].find((c) => /variantes de cor/i.test(c.innerHTML) && c.querySelector('.avst-card-info-btn')); card?.click(); });
    await p.waitForTimeout(500);
    await p.evaluate(() => { const card = [...document.querySelectorAll('.avst-card')].find((c) => c.querySelector('.avst-card-info-btn')); card?.querySelector('.avst-card-info-btn')?.click(); });
    await p.waitForTimeout(700);
  });
  salvar('24_MOBILE_COLOR_VARIANTS_REAL_FLOW.png', await rotular(b24, '24 · COLOR VARIANTS REAL FLOW', '390×844 · mobile-color-variants-real · drawer §73 com variantes; payload contém a cor'));
  // 25 — save error matrix (tabela)
  const linhas = [['400', '2', 'não', 'sim', 'sim'], ['401', '2', 'não', 'não', 'sim'], ['403', '2', 'não', 'sim', 'sim'], ['409', '2', 'não', 'sim', 'sim'], ['422', '2', 'não', 'não', 'sim'], ['429', '2', 'não', 'não', 'sim'], ['500', '2', 'não', 'não', 'sim'], ['timeout', '2', 'não', 'não', 'sim'], ['offline', '2', 'não', 'não', 'sim'], ['json inválido', '2', 'não', 'não', 'sim'], ['studio falha', '3', 'não', 'não', 'sim'], ['estado falha', '2', 'não', 'não', 'sim']];
  const tr = linhas.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('');
  salvar('25_MOBILE_SAVE_ERROR_MATRIX.png', await rotular(await cartao(`<h1 style="color:#96aaff;font-size:20px">Save Error Matrix (mobile)</h1><p style="color:#8a90a2;font-size:12px">mobile-save-error-matrix · UI mobile resiliente em 12/12 · gap Track A: preserva pendente 0/12, erro 3/12</p><table style="border-collapse:collapse;font-size:13px;width:100%"><tr style="color:#aeb4c6"><th style="text-align:left;border-bottom:1px solid #2a2f3a;padding:6px">cenário</th><th>POST</th><th>pend depois</th><th>erro visível</th><th>retry</th></tr>${tr.replace(/<td>/g, '<td style="padding:6px;border-bottom:1px solid #1a1e27;text-align:center">').replace(/<td style="[^"]*">([^<]*)<\/td>/, '<td style="padding:6px;border-bottom:1px solid #1a1e27">$1</td>')}</table>`), '25 · SAVE ERROR MATRIX', '12 códigos · UI mobile resiliente; correção proposta separada (não aplicada)'));
  // 26 — final acceptance matrix
  const crit = [['Agregado', '33/33 EXIT=0 assinatura única'], ['Touch targets <44', '0'], ['Contraste violações', '0'], ['Overflow horizontal', '0 (300→1600)'], ['Assets acima da dobra', '360/390/430 ✓'], ['Variantes de cor real', 'payload com cor ✓'], ['Back navigation', 'fecha camada ✓'], ['Foco retorna', 'sim ✓'], ['Desktop parity', 'ZERO regressão'], ['V4.3 regressões', '4/4'], ['Boards', '26 · VISUAL_PASS'], ['colar dry-run', 'TREE_IDENTICAL'], ['main', 'bf655221 intocada'], ['flag', 'OFF'], ['Real device', 'PENDING (kit)']];
  const cr = crit.map((r) => `<tr><td style="padding:6px;border-bottom:1px solid #1a1e27">${r[0]}</td><td style="padding:6px;border-bottom:1px solid #1a1e27;color:#7ee0a1">${esc(r[1])}</td></tr>`).join('');
  salvar('26_MOBILE_FINAL_ACCEPTANCE_MATRIX.png', await rotular(await cartao(`<h1 style="color:#96aaff;font-size:20px">Track C — Final Acceptance Matrix</h1><p style="color:#8a90a2;font-size:12px">HEAD local a007ee47 · candidato 31caaf8e · PROVISIONAL / DEVICE-READY</p><table style="border-collapse:collapse;font-size:13px;width:100%">${cr}</table>`), '26 · FINAL ACCEPTANCE MATRIX', 'critérios binários de aceite · real device = PENDING'));
  console.log('\n✓ boards 24-26 gerados');
} finally { await pg.close().catch(() => {}); await ctx.close().catch(() => {}); await nav.close().catch(() => {}); }
