#!/usr/bin/env node
// art-intake/identity.mjs — DIAGNÓSTICO DE IDENTIDADE (CHARACTER_IDENTITY §39).
// GOLDEN V4.3 FINAL — vive em caminho RASTREADO (não em scratch efêmero como
// o antigo tools-golden/v42face.ts).
//
// PROBLEMA que mede: “SIBLING SYNDROME” — faces/heróis que deveriam ser
// personagens distintos saem quase idênticos (V4.2 mediu 12 faces diferindo
// ~1.2/255). Aqui a métrica é objetiva e REUSA a infra de diff perceptual já
// existente (testes/visual/comparar-visual → ΔE CIE76 + % de pixels diferentes).
//
// O que faz: pega os FINAL renders que o art-intake.mjs já produziu para os
// assets da família "rosto" (status TECHNICAL_PASS) e calcula a matriz de
// DISTINTIVIDADE par-a-par. Assets que se parecem demais (pct diferente < limiar)
// viram **CANDIDATOS a sibling** — para o Jhony olhar. NÃO é veredito de arte:
// não aprova nem reprova; só entrega número + evidência (mesma filosofia do
// contact-sheet §53/§73).
//
// USO: node scripts/avatar/art-intake/identity.mjs [OUTDIR_do_intake]
//   (default OUTDIR = scripts/avatar/testes/saida/art-intake; exige que o
//    art-intake.mjs tenha rodado antes — reusa os FINAL, não re-renderiza.)
// @version 1.0.0  @created 2026-08-27
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { compararPng } from '../testes/visual/comparar-visual.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const OUTDIR = resolve(process.argv[2] || join(RAIZ, 'scripts', 'avatar', 'testes', 'saida', 'art-intake'));
const LIMIAR_SIBLING = 12; // % de pixels diferentes ABAIXO disto = candidato a sibling (olho humano decide)

async function main() {
  const repPath = join(OUTDIR, 'ART_INTAKE_REPORT.json');
  if (!existsSync(repPath)) {
    console.error(`✗ identity: relatório não encontrado em ${repPath}. Rode antes: node scripts/avatar/art-intake.mjs`);
    process.exit(2);
  }
  const rel = JSON.parse(readFileSync(repPath, 'utf8'));
  const rostos = rel.assets.filter((a) => a.familia === 'rosto' && a.status === 'TECHNICAL_PASS_AWAITING_HUMAN_ART_REVIEW' && a.renders && a.renders.FINAL);
  console.log(`\n━━ CHARACTER IDENTITY — distintividade (família rosto: ${rostos.length}) ━━`);
  if (rostos.length < 2) {
    console.log('  (menos de 2 rostos PASS — nada a comparar; sem sibling possível.)');
    writeFileSync(join(OUTDIR, 'ART_INTAKE_IDENTITY.json'), JSON.stringify({ rostos: rostos.map((r) => r.nome), pares: [], candidatosSibling: [], nota: 'menos de 2 rostos' }, null, 2));
    process.exit(0);
  }

  const pares = [];
  const candidatos = [];
  for (let i = 0; i < rostos.length; i++) {
    for (let j = i + 1; j < rostos.length; j++) {
      const a = rostos[i]; const b = rostos[j];
      const pa = join(OUTDIR, a.renders.FINAL);
      const pb = join(OUTDIR, b.renders.FINAL);
      const cmp = await compararPng(pa, pb, { renderer: '2d' });
      const pct = +(cmp.pctDiferente ?? 0).toFixed(2);
      const de = +(cmp.deltaEMedio ?? 0).toFixed(2);
      const par = { a: a.nome, b: b.nome, pctDiferente: pct, deltaEMedio: de, classe: cmp.classe, sibling: pct < LIMIAR_SIBLING };
      pares.push(par);
      const marca = par.sibling ? '  ⚠ CANDIDATO SIBLING' : '  ✓ distintos';
      console.log(`${marca}: ${a.nome} × ${b.nome} — ${pct}% dif · ΔE ${de}`);
      if (par.sibling) candidatos.push(par);
    }
  }

  // board de identidade: os rostos lado a lado + matriz
  const finais = rostos.map((r) => join(OUTDIR, r.renders.FINAL));
  const cell = 200, pad = 12, head = 56, lab = 26;
  const metas = await Promise.all(finais.map((f) => sharp(f).resize({ width: cell, height: cell, fit: 'contain', background: { r: 20, g: 22, b: 28 } }).png().toBuffer()));
  const cw = cell + pad, BW = Math.max(rostos.length * cw + pad, 520), BH = head + cell + lab + pad;
  const layers = metas.map((b, i) => ({ input: b, left: pad + i * cw, top: head }));
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}">`;
  svg += `<text x="16" y="26" font-family="Segoe UI" font-size="18" font-weight="800" fill="#fff">CHARACTER IDENTITY — distintividade (anti sibling-syndrome §39)</text>`;
  svg += `<text x="16" y="44" font-family="Segoe UI" font-size="11" fill="#9fb0c8">Número, não nota. Pares &lt; ${LIMIAR_SIBLING}% de diferença = CANDIDATO a sibling p/ o olho humano do Jhony.</text>`;
  rostos.forEach((r, i) => { svg += `<text x="${pad + i * cw + cell / 2}" y="${head + cell + 18}" text-anchor="middle" font-family="Segoe UI" font-size="12" font-weight="700" fill="#9fe6bf">${r.nome}</text>`; });
  svg += `</svg>`;
  layers.push({ input: Buffer.from(svg), left: 0, top: 0 });
  const boardPath = join(OUTDIR, 'ART_INTAKE_IDENTITY.png');
  await sharp({ create: { width: BW, height: BH, channels: 3, background: { r: 15, g: 16, b: 21 } } }).composite(layers).png().toFile(boardPath);

  const out = { limiarSiblingPct: LIMIAR_SIBLING, rostos: rostos.map((r) => r.nome), pares, candidatosSibling: candidatos, board: 'ART_INTAKE_IDENTITY.png', nota: 'Diagnóstico técnico. NÃO aprova arte — só mede distintividade para revisão humana.' };
  writeFileSync(join(OUTDIR, 'ART_INTAKE_IDENTITY.json'), JSON.stringify(out, null, 2));
  console.log(`\n  board → ART_INTAKE_IDENTITY.png · candidatos a sibling: ${candidatos.length}`);
  console.log('  (diagnóstico — a decisão MERGE/VARIANT/REWORK é do Jhony)');
  process.exit(0);
}
main().catch((e) => { console.error('✗ identity EXCEÇÃO:', e); process.exit(1); });
