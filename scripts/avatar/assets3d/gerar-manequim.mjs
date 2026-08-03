#!/usr/bin/env node
// assets3d/gerar-manequim.mjs — MANEQUIM procedural rigged (AS5 F5 · dev).
// @version 1.0.0  @created 2026-08-03
//
// Gera um personagem SINTÉTICO com geometria real (esferas UV trianguladas
// por parte do corpo) e esqueleto básico compatível com as regras §436
// (nomes ASCII sem espaço). Serve para: (1) provar o pipeline inteiro
// (publicar → validar → thumbs → registro) ANTES do zip UBC; (2) manequim
// de desenvolvimento no palco 3D. NÃO é arte final — é infraestrutura.
//
// Uso: node scripts/avatar/assets3d/gerar-manequim.mjs <saida.glb> [--denso]
//   --denso: ~45k triângulos (lod0 acima do gate lod1 → o simplify TRABALHA)
import { basename, resolve } from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';

/** Partes do corpo: [nomeBone, pai, translação(x,y,z), raio, escalaY]. */
const PARTES = [
  ['Hips', null, [0, 0.95, 0], 0.16, 0.8],
  ['Spine', 'Hips', [0, 0.18, 0], 0.15, 1.0],
  ['Chest', 'Spine', [0, 0.20, 0], 0.17, 1.1],
  ['Head', 'Chest', [0, 0.30, 0], 0.12, 1.15],
  ['UpperArmL', 'Chest', [0.24, 0.16, 0], 0.06, 2.2],
  ['LowerArmL', 'UpperArmL', [0.02, -0.30, 0], 0.05, 2.0],
  ['HandL', 'LowerArmL', [0.0, -0.26, 0], 0.05, 1.0],
  ['UpperArmR', 'Chest', [-0.24, 0.16, 0], 0.06, 2.2],
  ['LowerArmR', 'UpperArmR', [-0.02, -0.30, 0], 0.05, 2.0],
  ['HandR', 'LowerArmR', [0.0, -0.26, 0], 0.05, 1.0],
  ['UpperLegL', 'Hips', [0.10, -0.10, 0], 0.08, 2.6],
  ['LowerLegL', 'UpperLegL', [0.0, -0.42, 0], 0.06, 2.4],
  ['FootL', 'LowerLegL', [0.0, -0.42, 0.05], 0.06, 0.8],
  ['UpperLegR', 'Hips', [-0.10, -0.10, 0], 0.08, 2.6],
  ['LowerLegR', 'UpperLegR', [0.0, -0.42, 0], 0.06, 2.4],
  ['FootR', 'LowerLegR', [0.0, -0.42, 0.05], 0.06, 0.8],
];

/** Esfera UV achatável — devolve { pos, nrm, idx } triangulada. */
function esfera(raio, escalaY, segmentos) {
  const pos = [];
  const nrm = [];
  const idx = [];
  for (let lat = 0; lat <= segmentos; lat += 1) {
    const teta = (lat / segmentos) * Math.PI;
    for (let lon = 0; lon <= segmentos; lon += 1) {
      const fi = (lon / segmentos) * 2 * Math.PI;
      const x = Math.sin(teta) * Math.cos(fi);
      const y = Math.cos(teta);
      const z = Math.sin(teta) * Math.sin(fi);
      pos.push(x * raio, y * raio * escalaY, z * raio);
      nrm.push(x, y, z);
    }
  }
  const passo = segmentos + 1;
  for (let lat = 0; lat < segmentos; lat += 1) {
    for (let lon = 0; lon < segmentos; lon += 1) {
      const a = lat * passo + lon;
      idx.push(a, a + passo, a + 1, a + 1, a + passo, a + passo + 1);
    }
  }
  return { pos, nrm, idx };
}

/** Posição GLOBAL de cada bone (acumula a cadeia de pais). */
function posicoesGlobais() {
  const porNome = new Map(PARTES.map((p) => [p[0], p]));
  const global = new Map();
  const resolver = (nome) => {
    if (global.has(nome)) return global.get(nome);
    const [, pai, t] = porNome.get(nome);
    const base = pai ? resolver(pai) : [0, 0, 0];
    const g = [base[0] + t[0], base[1] + t[1], base[2] + t[2]];
    global.set(nome, g);
    return g;
  };
  for (const [nome] of PARTES) resolver(nome);
  return global;
}

/** Gera o GLB e devolve o total de triângulos. Exportado p/ o teste. */
export async function gerarManequim(saida, { denso = false } = {}) {
  const segmentos = denso ? 38 : 10; // 38 → ~46k tri (16 partes × 2·38²):
  // acima do gate lod1 (25k) de propósito — os DOIS níveis de simplify
  // trabalham quando o pipeline roda no manequim denso
  const doc = new Document();
  doc.createScene('manequim');
  const buffer = doc.createBuffer();
  const globais = posicoesGlobais();

  // esqueleto: um node por bone, hierarquia real
  const bones = new Map();
  for (const [nome, pai, t] of PARTES) {
    const node = doc.createNode(nome).setTranslation(t);
    bones.set(nome, node);
    if (pai) bones.get(pai).addChild(node);
  }
  const raiz = bones.get('Hips');
  doc.getRoot().listScenes()[0].addChild(raiz);

  const skin = doc.createSkin('esqueleto');
  const ibm = [];
  for (const [nome] of PARTES) {
    skin.addJoint(bones.get(nome));
    const [gx, gy, gz] = globais.get(nome);
    // inverseBindMatrix = translação inversa (bones sem rotação no bind)
    ibm.push(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -gx, -gy, -gz, 1);
  }
  skin.setInverseBindMatrices(
    doc.createAccessor().setType('MAT4').setArray(new Float32Array(ibm)).setBuffer(buffer),
  );

  // uma malha com N primitivas — cada parte 100% no seu bone (peso rígido)
  const malha = doc.createMesh('corpo');
  const material = doc.createMaterial('manequim')
    .setBaseColorFactor([0.62, 0.66, 0.74, 1]).setRoughnessFactor(0.8).setMetallicFactor(0);
  let totalTri = 0;
  PARTES.forEach(([nome, , , raio, escalaY], indiceBone) => {
    const g = globais.get(nome);
    const { pos, nrm, idx } = esfera(raio, escalaY, segmentos);
    const n = pos.length / 3;
    const posGlobal = new Float32Array(pos.length);
    for (let i = 0; i < n; i += 1) {
      posGlobal[i * 3] = pos[i * 3] + g[0];
      posGlobal[i * 3 + 1] = pos[i * 3 + 1] + g[1];
      posGlobal[i * 3 + 2] = pos[i * 3 + 2] + g[2];
    }
    const joints = new Uint8Array(n * 4);
    const pesos = new Float32Array(n * 4);
    for (let i = 0; i < n; i += 1) { joints[i * 4] = indiceBone; pesos[i * 4] = 1; }
    const prim = doc.createPrimitive()
      .setMode(4)
      .setMaterial(material)
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(posGlobal).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nrm)).setBuffer(buffer))
      .setAttribute('JOINTS_0', doc.createAccessor().setType('VEC4').setArray(joints).setBuffer(buffer))
      .setAttribute('WEIGHTS_0', doc.createAccessor().setType('VEC4').setArray(pesos).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(idx)).setBuffer(buffer));
    malha.addPrimitive(prim);
    totalTri += idx.length / 3;
  });

  const nodeMalha = doc.createNode('manequim_corpo').setMesh(malha).setSkin(skin);
  doc.getRoot().listScenes()[0].addChild(nodeMalha);

  await new NodeIO().write(resolve(saida), doc);
  return { triangulos: totalTri, bones: PARTES.length };
}

// ── CLI ─────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const saida = process.argv[2];
  if (!saida) { console.error('uso: gerar-manequim.mjs <saida.glb> [--denso]'); process.exit(2); }
  gerarManequim(saida, { denso: process.argv.includes('--denso') })
    .then((r) => console.log(`MANEQUIM_OK ${saida} · ${r.triangulos} triângulos · ${r.bones} bones`))
    .catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
