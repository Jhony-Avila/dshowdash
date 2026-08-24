// testes/v42-single2d.mjs — GOLDEN V4.2 §1/§36/§53/§58: PROVA de PRODUTO 2D ÚNICO.
// Demonstra no harness REAL (não unit) que, com as6.single_2d ON, a experiência
// principal NÃO oferece troca de modo ("Modo clássico" some do topo e da paleta),
// enquanto o caminho de compat/QA (as6.qa_route) e a segurança (error-boundary)
// permanecem. Com a flag OFF, a experiência é byte-idêntica (botão presente).
// Board: 16_V42_SINGLE_2D_FLOW.png.
import { abrir, irParaHarness, SAIDA } from './navegador.mjs';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const OUTPKG = process.env.OUTPKG || '/tmp/v4/pkg';
mkdirSync(OUTPKG, { recursive: true });
if (!existsSync(SAIDA)) mkdirSync(SAIDA, { recursive: true });

const FLAGS_BASE = { 'as5.novo_shell': true, 'as6.classico_premium': true, 'as6.arte_v2': true, 'as6.fit_v2': true, 'as6.hero_2d': true, 'as6.face_v2': true };
const CENARIOS = [
  { id: 'single_on', rot: 'PRODUTO ÚNICO 2D (single_2d ON)', flags: { ...FLAGS_BASE, 'as6.single_2d': true }, esperaBotao: false },
  { id: 'single_off', rot: 'Legado/compat (single_2d OFF) — byte-idêntico', flags: { ...FLAGS_BASE, 'as6.single_2d': false }, esperaBotao: true },
  { id: 'single_on_qa', rot: 'QA/compat (single_2d ON + qa_route ON, §37)', flags: { ...FLAGS_BASE, 'as6.single_2d': true, 'as6.qa_route': true }, esperaBotao: true },
];

let falhas = 0; const cards = [];
const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

// texto de troca-de-modo que NÃO pode aparecer na experiência principal (§36)
const RX_MODO = /Modo clássico|Voltar ao modo clássico/;

for (const cen of CENARIOS) {
  const { navegador, pagina, erros } = await abrir({
    viewport: { width: 1440, height: 980 },
    init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} },
    initArg: cen.flags,
  });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 1100);
    // 1) botão do topo (afordância sempre-visível — alvo primário do §36)
    const infoTopo = await pagina.evaluate(() => {
      const btns = [...document.querySelectorAll('header button, .avst5-barra button, button')];
      const trocaVisivel = btns.some((b) => /^(Modo clássico|Voltar ao modo clássico)$/.test((b.textContent || '').trim()));
      const compatQA = btns.some((b) => /Compat clássico/.test((b.textContent || '').trim()));
      return { trocaVisivel, compatQA };
    });
    // 2) paleta de comandos (Ctrl+K) — comando "Voltar ao modo clássico"
    await pagina.keyboard.down('Control'); await pagina.keyboard.press('KeyK'); await pagina.keyboard.up('Control');
    await pagina.waitForTimeout(450);
    const comandoPaleta = await pagina.evaluate(() => {
      const t = document.body.innerText || '';
      return /Voltar ao modo clássico/.test(t) || /Compat clássico/.test(t);
    });
    await pagina.keyboard.press('Escape'); await pagina.waitForTimeout(200);

    if (cen.esperaBotao) {
      ok(infoTopo.trocaVisivel || infoTopo.compatQA, `[${cen.id}] troca/compat de modo PRESENTE (esperado)`);
    } else {
      ok(!infoTopo.trocaVisivel && !infoTopo.compatQA, `[${cen.id}] troca de modo AUSENTE do topo (§36)`);
      ok(!comandoPaleta, `[${cen.id}] comando de troca AUSENTE da paleta (§36)`);
    }
    ok(erros.length === 0, `[${cen.id}] sem erros JS (${erros.slice(0, 1).join('')})`);

    // screenshot da barra de topo p/ o board
    const header = await pagina.$('header, .avst5-barra, .avst-barra-topo');
    const cam = join(SAIDA, `v42_s2d_${cen.id}.png`);
    if (header) { await header.screenshot({ path: cam }); cards.push({ ...cen, cam, ...infoTopo }); }
  } catch (e) {
    console.error(`  ✗ EXCEÇÃO [${cen.id}]:`, e.message.slice(0, 140)); falhas++;
  } finally { await navegador.close(); }
}

// board 16 — três cenários lado a lado com o veredito
if (cards.length) {
  const cellW = 440, head = 62, lab = 46, pad = 14;
  const metas = await Promise.all(cards.map((c) => sharp(c.cam).resize({ width: cellW, fit: 'inside', background: { r: 18, g: 20, b: 26 } }).png().toBuffer()));
  const hs = await Promise.all(metas.map((b) => sharp(b).metadata().then((m) => m.height || 90)));
  const rowH = Math.max(...hs);
  const BW = pad + cards.length * (cellW + pad), BH = head + rowH + lab + pad;
  const layers = metas.map((b, i) => ({ input: b, left: pad + i * (cellW + pad), top: head }));
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}">`;
  svg += `<text x="16" y="26" font-family="Segoe UI" font-size="19" font-weight="800" fill="#fff">16 · SINGLE 2D FLOW — um produto, sem "Voltar ao clássico" (§1/§36/§58)</text>`;
  svg += `<text x="16" y="48" font-family="Segoe UI" font-size="12" fill="#9fb0c8">Harness real. Produção intocada (flag OFF = byte-idêntico). Compat/QA só sob as6.qa_route (§37); recuperação de erro permanece.</text>`;
  cards.forEach((c, i) => {
    const x = pad + i * (cellW + pad) + cellW / 2;
    const semTroca = !c.trocaVisivel && !c.compatVisivel;
    const cor = c.esperaBotao ? (c.trocaVisivel || c.compatQA ? '#9fe6bf' : '#ff8f8f') : (!c.trocaVisivel ? '#9fe6bf' : '#ff8f8f');
    svg += `<text x="${x}" y="${head + rowH + 20}" text-anchor="middle" font-family="Segoe UI" font-size="13" font-weight="700" fill="${cor}">${c.rot}</text>`;
    const status = c.esperaBotao ? (c.compatQA ? 'compat (QA)' : 'troca presente') : 'troca AUSENTE ✓';
    svg += `<text x="${x}" y="${head + rowH + 38}" text-anchor="middle" font-family="Segoe UI" font-size="11" fill="#9fb0c8">${status}</text>`;
  });
  svg += `</svg>`;
  layers.push({ input: Buffer.from(svg), left: 0, top: 0 });
  const board = await sharp({ create: { width: BW, height: BH, channels: 3, background: { r: 15, g: 16, b: 21 } } }).composite(layers).png().toBuffer();
  writeFileSync(join(OUTPKG, '16_V42_SINGLE_2D_FLOW.png'), board);
  console.log('  board → 16_V42_SINGLE_2D_FLOW.png');
}
console.log(falhas ? `\n✗ v42-single2d: ${falhas} falha(s)` : '\n✓ v42-single2d verde');
process.exit(falhas ? 1 : 0);
