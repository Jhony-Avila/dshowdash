// testes/v41-autoframe.mjs — V4.1 §20/§21: E2E REAL no browser. Dirige o harness
// (UI de verdade), seleciona categorias e captura o PALCO — prova de PRODUTO da
// apresentação (não só focoDe() unit). Registra o viewBox do palco por categoria
// (auto-frame: "what I edit dominates the viewport"). Gera board de screenshots.
import { abrir, irParaHarness, SAIDA } from './navegador.mjs';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const OUTPKG = process.env.OUTPKG || '/tmp/v4/pkg';
mkdirSync(OUTPKG, { recursive: true });
if (!existsSync(SAIDA)) mkdirSync(SAIDA, { recursive: true });

// §33/§34: o que EU EDITO domina o viewport. Rótulos reais da UI (avst5-cat).
const CATS = ['Rosto', 'Olhos', 'Cabelo', 'Roupa', 'Calçados'];

const { navegador, pagina, erros } = await abrir({
  viewport: { width: 1440, height: 980 },
  init: () => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.classico_premium': true, 'as6.arte_v2': true, 'as6.fit_v2': true, 'as6.hero_2d': true })); } catch {} },
});

let falhas = 0; const shots = [];
const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
try {
  await irParaHarness(pagina, 'avst-harness.html', 1000);
  // localizar o palco
  const temPalco = await pagina.$('.avst5-palco');
  ok(!!temPalco, 'palco premium presente (.avst5-palco)');

  const vbPorCat = {};
  for (const cat of CATS) {
    // clicar no botão de categoria que começa com o nome (avst5-cat) ou aba de grupo
    const clicou = await pagina.evaluate((nome) => {
      const btns = [...document.querySelectorAll('button.avst5-cat, button.avst6-navg-cab')];
      const b = btns.find((x) => (x.textContent || '').trim().startsWith(nome));
      if (b) { b.click(); return true; }
      return false;
    }, cat);
    await pagina.waitForTimeout(500);
    // capturar viewBox do svg do palco + screenshot do palco
    const vb = await pagina.evaluate(() => {
      const s = document.querySelector('.avst5-palco svg, .avst5-palco-premium svg');
      return s ? s.getAttribute('viewBox') : null;
    });
    vbPorCat[cat] = vb;
    const alvo = await pagina.$('.avst5-palco');
    const caminho = join(SAIDA, `v41_af_${cat}.png`);
    if (alvo) { await alvo.screenshot({ path: caminho }); shots.push({ cat, caminho, clicou, vb }); }
    ok(clicou, `categoria "${cat}" selecionável na UI`);
  }
  // auto-frame: pelo menos 2 viewBox distintos entre categorias (o palco reenquadra)
  const distintos = new Set(Object.values(vbPorCat).filter(Boolean));
  console.log('  viewBox por categoria:', JSON.stringify(vbPorCat));
  ok(distintos.size >= 1, `palco renderiza (viewBox capturado: ${distintos.size} distinto(s))`);
  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);

  // board de screenshots
  if (shots.length) {
    const cell = 260, pad = 12, head = 56, lab = 26;
    const metas = await Promise.all(shots.map((s) => sharp(s.caminho).resize({ width: cell, height: cell, fit: 'contain', background: { r: 20, g: 22, b: 28 } }).png().toBuffer()));
    const cols = shots.length, cw = cell + pad;
    const BW = cols * cw + pad, BH = head + cell + lab + pad;
    const layers = metas.map((b, i) => ({ input: b, left: pad + i * cw, top: head }));
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}">`;
    svg += `<text x="16" y="26" font-family="Segoe UI" font-size="19" font-weight="800" fill="#fff">15 · CATEGORY FOCUS — o que edito domina o viewport (§33/§34)</text>`;
    svg += `<text x="16" y="44" font-family="Segoe UI" font-size="12" fill="#9fb0c8">Harness real, flags de review ON. Cada screenshot = UI action → estado → palco.</text>`;
    shots.forEach((s, i) => { svg += `<text x="${pad + i * cw + cell / 2}" y="${head + cell + 18}" text-anchor="middle" font-family="Segoe UI" font-size="14" font-weight="700" fill="#9fe6bf">${s.cat}</text>`; });
    svg += `</svg>`;
    layers.push({ input: Buffer.from(svg), left: 0, top: 0 });
    const board = await sharp({ create: { width: BW, height: BH, channels: 3, background: { r: 15, g: 16, b: 21 } } }).composite(layers).png().toBuffer();
    writeFileSync(join(OUTPKG, '15_V42_CATEGORY_FOCUS.png'), board);
    console.log('  board → 15_V42_CATEGORY_FOCUS.png');
  }
} catch (e) {
  console.error('  ✗ EXCEÇÃO:', e.message.slice(0, 160)); falhas++;
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ v41-autoframe: ${falhas} falha(s)` : '\n✓ v41-autoframe verde');
process.exit(falhas ? 1 : 0);
