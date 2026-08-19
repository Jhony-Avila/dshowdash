// testes/visual-diff.mjs — onda 1407 (decisão #158): unidade do DIFF
// perceptual (visual/comparar-visual.mjs) com imagens sintéticas via sharp
// (node puro, sem navegador): idêntico · expected (poucos pixels) ·
// unexpected (bloco grande, bbox correto) · needs_review (tamanhos
// diferentes) · tolerância por renderer · PNG de diff gerado.
// @version 1.0.0  @created 2026-08-19
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { compararPng, gerarDiffPng, TOLERANCIA_PADRAO } from './visual/comparar-visual.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const tmp = mkdtempSync(join(tmpdir(), 'avst-diff-'));

async function png(nome, w, h, pintar) {
  const buf = Buffer.alloc(w * h * 3, 40); // cinza escuro
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
    const c = pintar(x, y); if (!c) continue;
    const o = (y * w + x) * 3; buf[o] = c[0]; buf[o + 1] = c[1]; buf[o + 2] = c[2];
  }
  const p = join(tmp, nome);
  await sharp(buf, { raw: { width: w, height: h, channels: 3 } }).png().toFile(p);
  return p;
}

try {
  const a = await png('a.png', 200, 100, () => null);
  const a2 = await png('a2.png', 200, 100, () => null);
  const poucos = await png('poucos.png', 200, 100, (x, y) => (x < 4 && y < 4 ? [255, 0, 0] : null)); // 16 px = 0,08%
  const bloco = await png('bloco.png', 200, 100, (x, y) => (x >= 50 && x < 100 && y >= 20 && y < 60 ? [255, 255, 255] : null)); // 2000 px = 10%
  const outro = await png('outro.png', 100, 100, () => null);

  const r1 = await compararPng(a, a2);
  ok(r1.classe === 'identico' && r1.pctDiferente === 0, `idêntico falhou: ${JSON.stringify(r1)}`);
  const r2 = await compararPng(a, poucos, { renderer: '2d' });
  ok(r2.classe === 'expected' && r2.pctDiferente > 0 && r2.pctDiferente <= TOLERANCIA_PADRAO['2d'], `poucos pixels deveria ser expected: ${JSON.stringify(r2)}`);
  const r3 = await compararPng(a, bloco, { renderer: '2d' });
  ok(r3.classe === 'unexpected' && Math.abs(r3.pctDiferente - 10) < 0.2, `bloco deveria ser unexpected ~10%: ${JSON.stringify(r3)}`);
  ok(r3.bbox && r3.bbox.x === 50 && r3.bbox.y === 20 && r3.bbox.w === 50 && r3.bbox.h === 40, `bbox errado: ${JSON.stringify(r3.bbox)}`);
  const r3b = await compararPng(a, bloco, { toleranciaPct: 15 });
  ok(r3b.classe === 'expected', 'tolerância por caso (15%) deveria classificar como expected');
  const r4 = await compararPng(a, outro);
  ok(r4.classe === 'needs_review' && r4.mesmoTamanho === false, `tamanhos diferentes deveriam ser needs_review: ${JSON.stringify(r4)}`);
  const diffPng = join(tmp, 'diff.png');
  ok(await gerarDiffPng(a, bloco, diffPng) && existsSync(diffPng), 'PNG de diff não gerado');
  const meta = await sharp(diffPng).metadata();
  ok(meta.width === 200 && meta.height === 100, 'PNG de diff com tamanho errado');
  ok(TOLERANCIA_PADRAO['3d'] > TOLERANCIA_PADRAO.ui && TOLERANCIA_PADRAO.ui > TOLERANCIA_PADRAO['2d'], 'tolerâncias padrão fora da ordem 2d < ui < 3d');
} finally { rmSync(tmp, { recursive: true, force: true }); }

console.log('[visual-diff] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
