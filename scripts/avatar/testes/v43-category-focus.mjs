// testes/v43-category-focus.mjs — GOLDEN V4.3 FINAL §7-10: prova SEMÂNTICA do
// category focus no browser real. NÃO usa só string de viewBox (§7): lê a CÂMERA
// REAL aplicada — transform/transform-origin do .avst5-zoom + modo corpo/busto do
// palco — porque Calçados foca por transform derivado do FOCO_FINO.pes (§5).
// Critérios (§9): Rosto/Olhos/Cabelo enquadram a cabeça; Olhos amplia MAIS que
// Rosto; Roupa=torso (corpo); Calçados=região inferior/pés domina (centro perto
// do fundo). Board 14_V43_CATEGORY_FOCUS_FINAL.png.
import { abrir, irParaHarness, SAIDA } from './navegador.mjs';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
const OUTPKG = process.env.OUTPKG || '/tmp/v4/pkg';
mkdirSync(OUTPKG, { recursive: true });
if (!existsSync(SAIDA)) mkdirSync(SAIDA, { recursive: true });
const FLAGS = { 'as5.novo_shell': true, 'as6.classico_premium': true, 'as6.arte_v2': true, 'as6.fit_v2': true, 'as6.hero_2d': true, 'as6.face_v2': true, 'as6.single_2d': true };
const CATS = ['Rosto', 'Olhos', 'Cabelo', 'Roupa', 'Calçados'];

let falhas = 0; const shots = []; const cam = {};
const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const { navegador, pagina, erros } = await abrir({ viewport: { width: 1440, height: 1000 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  for (const c of CATS) {
    await pagina.evaluate((n) => { const b = [...document.querySelectorAll('button.avst5-cat, button.avst6-navg-cab')].find((x) => (x.textContent || '').trim().startsWith(n)); b?.click(); }, c);
    await pagina.waitForTimeout(650);
    // CÂMERA REAL aplicada: escala + origem vertical (fração da altura) + modo corpo
    const info = await pagina.evaluate(() => {
      const zoom = document.querySelector('.avst5-zoom');
      const palco = document.querySelector('.avst5-palco');
      if (!zoom || !palco) return null;
      const cs = getComputedStyle(zoom);
      // offsetHeight = altura de LAYOUT (não afetada pelo transform); a
      // transform-origin % resolve contra a caixa de layout, não a escalada.
      const h = zoom.offsetHeight || 1;
      const m = cs.transform && cs.transform.startsWith('matrix') ? cs.transform.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number) : [1, 0, 0, 1, 0, 0];
      const scale = m[0] || 1;
      const oy = parseFloat((cs.transformOrigin || '0px 0px').split(' ')[1]) || 0;
      const svg = palco.querySelector('svg');
      const vb = svg ? svg.getAttribute('viewBox') : null;
      // corpo = render 240×400 (fonte 'corpo'); busto = 240×240. Detecta pela altura do viewBox.
      const corpo = !!vb && parseFloat(vb.split(/\s+/)[3] || '0') > 300;
      return { scale: +scale.toFixed(3), originYfrac: +(oy / h).toFixed(3), corpo, vb };
    });
    cam[c] = info;
    const alvo = await pagina.$('.avst5-palco');
    const cami = join(SAIDA, `v43_cf_${c}.png`);
    if (alvo) { await alvo.screenshot({ path: cami }); shots.push({ c, cami }); }
    console.log(`  ${c}:`, JSON.stringify(info));
  }
  // ── critérios semânticos (§9) ──────────────────────────────────────
  ok(cam['Rosto'] && !cam['Rosto'].corpo, 'Rosto enquadra a cabeça (render de busto)');
  ok(cam['Cabelo'] && !cam['Cabelo'].corpo, 'Cabelo enquadra a cabeça (render de busto)');
  ok(cam['Olhos'] && cam['Rosto'] && cam['Olhos'].scale > cam['Rosto'].scale + 0.05, `Olhos amplia MAIS que Rosto (olhos ${cam['Olhos']?.scale} > rosto ${cam['Rosto']?.scale})`);
  ok(cam['Roupa'] && cam['Roupa'].corpo, 'Roupa enquadra o torso (render de corpo inteiro)');
  ok(cam['Calçados'] && cam['Calçados'].corpo, 'Calçados usa corpo inteiro (pés existem no quadro)');
  ok(cam['Calçados'] && cam['Calçados'].originYfrac >= 0.78, `Calçados: centro visual perto do FUNDO (originY ${cam['Calçados']?.originYfrac} ≥ 0.78) — pés dominam (§9)`);
  ok(cam['Calçados'] && cam['Roupa'] && cam['Calçados'].originYfrac > cam['Roupa'].originYfrac + 0.1, `Calçados foca MAIS embaixo que Roupa (${cam['Calçados']?.originYfrac} > ${cam['Roupa']?.originYfrac})`);
  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);

  // ── board 14 ───────────────────────────────────────────────────────
  if (shots.length) {
    const cell = 240, pad = 12, head = 58, lab = 40;
    const metas = await Promise.all(shots.map((s) => sharp(s.cami).resize({ width: cell, height: cell, fit: 'contain', background: { r: 20, g: 22, b: 28 } }).png().toBuffer()));
    const cw = cell + pad, BW = shots.length * cw + pad, BH = head + cell + lab + pad;
    const layers = metas.map((b, i) => ({ input: b, left: pad + i * cw, top: head }));
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}">`;
    svg += `<text x="16" y="26" font-family="Segoe UI" font-size="19" font-weight="800" fill="#fff">14 · CATEGORY FOCUS FINAL — o que edito domina o palco (§9/§10)</text>`;
    svg += `<text x="16" y="46" font-family="Segoe UI" font-size="12" fill="#9fb0c8">single_2d ON. Calçados deriva de FOCO_FINO.pes (fonte única). Editando tênis → olho para os pés.</text>`;
    shots.forEach((s, i) => {
      const ci = cam[s.c] || {};
      svg += `<text x="${pad + i * cw + cell / 2}" y="${head + cell + 16}" text-anchor="middle" font-family="Segoe UI" font-size="14" font-weight="800" fill="#9fe6bf">${s.c}</text>`;
      svg += `<text x="${pad + i * cw + cell / 2}" y="${head + cell + 32}" text-anchor="middle" font-family="Segoe UI" font-size="10" fill="#9fb0c8">${ci.corpo ? 'corpo' : 'busto'} · zoom ${ci.scale} · centroY ${ci.originYfrac}</text>`;
    });
    svg += `</svg>`;
    layers.push({ input: Buffer.from(svg), left: 0, top: 0 });
    writeFileSync(join(OUTPKG, '14_V43_CATEGORY_FOCUS_FINAL.png'), await sharp({ create: { width: BW, height: BH, channels: 3, background: { r: 15, g: 16, b: 21 } } }).composite(layers).png().toBuffer());
    console.log('  board → 14_V43_CATEGORY_FOCUS_FINAL.png');
  }
} catch (e) { console.error('  ✗ EXCEÇÃO:', e.message.slice(0, 160)); falhas++; } finally { await navegador.close(); }
console.log(falhas ? `\n✗ v43-category-focus: ${falhas} falha(s)` : '\n✓ v43-category-focus verde');
process.exit(falhas ? 1 : 0);
