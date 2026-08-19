// testes/visual/comparar-visual.mjs — onda 1407 (MEGA_BRIEFING_01 §2690–§2705,
// §2972–§2975; decisão #158): DIFF PERCEPTUAL entre dois PNGs com `sharp`
// (já dependência do repo — zero lib nova).
//
//   compararPng(a, b, { limiarDeltaE = 6, tolerânciaPct = 0.5 })
//     → { iguais, mesmoTamanho, pctDiferente, deltaEMedio, bbox, classe }
//   classe: 'identico' (sha igual) · 'expected' (dentro da tolerância) ·
//           'unexpected' (acima) · 'needs_review' (tamanho diferente ou
//           baseline ausente — humano decide, §2695)
//   ΔE = CIE76 em Lab (suficiente p/ AA/antialias; 3D headless usa
//   tolerância maior e é AVISO, nunca tripwire — #158).
// Sem DOM, sem navegador: node puro.
// @version 1.0.0  @created 2026-08-19
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

export const TOLERANCIA_PADRAO = { '2d': 0.5, '3d': 2.0, ui: 1.0 }; // % de pixels acima do limiar ΔE

function srgbParaLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function rgbParaLab(r, g, b) {
  const R = srgbParaLinear(r); const G = srgbParaLinear(g); const B = srgbParaLinear(b);
  // sRGB D65 → XYZ
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.0;
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export function sha256De(caminho) {
  return createHash('sha256').update(readFileSync(caminho)).digest('hex');
}

/** Lê PNG → { largura, altura, dados: Buffer RGB } via sharp (raw). */
export async function lerRgb(caminho) {
  const { data, info } = await sharp(caminho).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { largura: info.width, altura: info.height, dados: data, canais: info.channels };
}

/**
 * Compara dois PNGs. `opcoes.renderer` escolhe a tolerância padrão
 * ('2d' | '3d' | 'ui'); `opcoes.toleranciaPct` sobrescreve.
 */
export async function compararPng(caminhoA, caminhoB, opcoes = {}) {
  const limiar = opcoes.limiarDeltaE ?? 6;
  const tol = opcoes.toleranciaPct ?? TOLERANCIA_PADRAO[opcoes.renderer ?? '2d'] ?? 0.5;
  if (sha256De(caminhoA) === sha256De(caminhoB)) {
    return { iguais: true, mesmoTamanho: true, pctDiferente: 0, deltaEMedio: 0, bbox: null, classe: 'identico', tolerancia: tol };
  }
  const a = await lerRgb(caminhoA);
  const b = await lerRgb(caminhoB);
  if (a.largura !== b.largura || a.altura !== b.altura) {
    return { iguais: false, mesmoTamanho: false, pctDiferente: 100, deltaEMedio: null, bbox: null, classe: 'needs_review', tolerancia: tol,
      motivo: `tamanho diferente ${a.largura}×${a.altura} vs ${b.largura}×${b.altura}` };
  }
  const total = a.largura * a.altura;
  let diferentes = 0; let somaDe = 0;
  let minX = a.largura; let minY = a.altura; let maxX = -1; let maxY = -1;
  for (let i = 0; i < total; i += 1) {
    const o = i * 3;
    const r1 = a.dados[o]; const g1 = a.dados[o + 1]; const b1 = a.dados[o + 2];
    const r2 = b.dados[o]; const g2 = b.dados[o + 1]; const b2 = b.dados[o + 2];
    if (r1 === r2 && g1 === g2 && b1 === b2) continue;
    const [L1, A1, B1] = rgbParaLab(r1, g1, b1);
    const [L2, A2, B2] = rgbParaLab(r2, g2, b2);
    const de = Math.sqrt((L1 - L2) ** 2 + (A1 - A2) ** 2 + (B1 - B2) ** 2);
    somaDe += de;
    if (de > limiar) {
      diferentes += 1;
      const x = i % a.largura; const y = Math.floor(i / a.largura);
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const pct = Math.round((diferentes / total) * 10000) / 100;
  const bbox = maxX >= 0 ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : null;
  return {
    iguais: diferentes === 0, mesmoTamanho: true, pctDiferente: pct,
    deltaEMedio: Math.round((somaDe / total) * 1000) / 1000, bbox, tolerancia: tol,
    classe: diferentes === 0 ? 'expected' : pct <= tol ? 'expected' : 'unexpected',
  };
}

/** Gera um PNG de diff (pixels diferentes em magenta sobre o A escurecido) — só para relatório/revisão humana. */
export async function gerarDiffPng(caminhoA, caminhoB, saida, limiarDeltaE = 6) {
  const a = await lerRgb(caminhoA);
  const b = await lerRgb(caminhoB);
  if (a.largura !== b.largura || a.altura !== b.altura) return false;
  const out = Buffer.alloc(a.largura * a.altura * 3);
  for (let i = 0; i < a.largura * a.altura; i += 1) {
    const o = i * 3;
    const [L1, A1, B1] = rgbParaLab(a.dados[o], a.dados[o + 1], a.dados[o + 2]);
    const [L2, A2, B2] = rgbParaLab(b.dados[o], b.dados[o + 1], b.dados[o + 2]);
    const de = Math.sqrt((L1 - L2) ** 2 + (A1 - A2) ** 2 + (B1 - B2) ** 2);
    if (de > limiarDeltaE) { out[o] = 255; out[o + 1] = 0; out[o + 2] = 200; }
    else { out[o] = a.dados[o] >> 2; out[o + 1] = a.dados[o + 1] >> 2; out[o + 2] = a.dados[o + 2] >> 2; }
  }
  await sharp(out, { raw: { width: a.largura, height: a.altura, channels: 3 } }).png().toFile(saida);
  return true;
}

// CLI: node comparar-visual.mjs a.png b.png [--3d]
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const [a, b] = process.argv.slice(2).filter((x) => !x.startsWith('--'));
  if (!a || !b) { console.error('uso: node comparar-visual.mjs a.png b.png [--3d] [--diff saida.png]'); process.exit(2); }
  const renderer = process.argv.includes('--3d') ? '3d' : '2d';
  const r = await compararPng(a, b, { renderer });
  const iDiff = process.argv.indexOf('--diff');
  if (iDiff > 0 && process.argv[iDiff + 1]) await gerarDiffPng(a, b, process.argv[iDiff + 1]);
  console.log(JSON.stringify(r));
  process.exit(r.classe === 'unexpected' ? 1 : 0);
}
