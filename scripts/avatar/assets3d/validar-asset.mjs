#!/usr/bin/env node
// assets3d/validar-asset.mjs — VALIDADOR de asset 3D (AS5 F5 · §487).
// @version 1.0.0  @created 2026-08-03
//
// Valida a pasta de UM personagem publicado (contrato do pipeline
// docs/AVATAR-STUDIO-5/pipeline-assets-3d.md) ANTES de entrar no registry:
//   1. arquivos obrigatórios: modelo.lod{0,1,2}.glb, thumb.webp,
//      preview.webp, manifest.json;
//   2. manifest §517: campos obrigatórios + licença rastreada §511;
//   3. hashes sha256 do manifest CONFEREM com os GLBs no disco (§478);
//   4. limites do gate §631: triângulos por LOD (lod0≤60k, lod1≤25k,
//      lod2≤8k) — contados do chunk JSON do GLB em node PURO (sem three);
//   5. bones (§436): nomes ASCII sem espaço; se rig-ubc-v1.json tiver a
//      lista canônica preenchida, exige presença exata (vazia = aviso).
//
// Uso:   node scripts/avatar/validar… <pasta-do-personagem> [--json]
// Saída: relatório humano (ou JSON com --json); exit 0 = aprovado.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const LIMITES_TRIANGULOS = { lod0: 60_000, lod1: 25_000, lod2: 8_000 }; // §631/§468
const ARQUIVOS_OBRIGATORIOS = [
  'modelo.lod0.glb', 'modelo.lod1.glb', 'modelo.lod2.glb',
  'thumb.webp', 'preview.webp', 'manifest.json',
];
const CAMPOS_MANIFEST = ['id', 'tipo', 'versao', 'rig', 'lods', 'hashes', 'licenca', 'origem'];

/** Lê o chunk JSON de um GLB (glTF Binary v2) sem dependências. */
export function lerJsonDoGlb(caminho) {
  const buf = readFileSync(caminho);
  if (buf.length < 20 || buf.readUInt32LE(0) !== 0x46546c67) throw new Error('não é GLB (magic)');
  if (buf.readUInt32LE(4) !== 2) throw new Error('GLB não é versão 2');
  const tamChunk = buf.readUInt32LE(12);
  if (buf.readUInt32LE(16) !== 0x4e4f534a) throw new Error('primeiro chunk não é JSON');
  return JSON.parse(buf.subarray(20, 20 + tamChunk).toString('utf8'));
}

/** Conta triângulos de todas as primitivas de modo TRIANGLES (4/omitido). */
export function contarTriangulos(gltf) {
  let total = 0;
  for (const malha of gltf.meshes ?? []) {
    for (const prim of malha.primitives ?? []) {
      const modo = prim.mode ?? 4;
      if (modo !== 4) continue; // só TRIANGLES conta p/ o gate
      const acessor = prim.indices !== undefined
        ? gltf.accessors?.[prim.indices]
        : gltf.accessors?.[prim.attributes?.POSITION];
      total += Math.floor((acessor?.count ?? 0) / 3);
    }
  }
  return total;
}

/** Nomes dos bones (joints de todos os skins, sem repetição). */
export function nomesDosBones(gltf) {
  const nomes = new Set();
  for (const skin of gltf.skins ?? []) {
    for (const j of skin.joints ?? []) {
      const nome = gltf.nodes?.[j]?.name;
      if (typeof nome === 'string') nomes.add(nome);
    }
  }
  return [...nomes];
}

function sha256De(caminho) {
  return `sha256:${createHash('sha256').update(readFileSync(caminho)).digest('hex')}`;
}

/** Valida a pasta e devolve { aprovado, erros, avisos, medidas }. */
export function validarAsset(pasta, opcoes = {}) {
  const erros = [];
  const avisos = [];
  const medidas = { triangulos: {}, bones: 0 };
  const dir = resolve(pasta);

  // 1. arquivos obrigatórios
  for (const nome of ARQUIVOS_OBRIGATORIOS) {
    if (!existsSync(join(dir, nome))) erros.push(`arquivo obrigatório ausente: ${nome}`);
  }
  if (erros.length) return { aprovado: false, erros, avisos, medidas }; // sem base p/ seguir

  // 2. manifest §517
  let manifest;
  try { manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')); }
  catch (e) { return { aprovado: false, erros: [`manifest.json inválido: ${e.message}`], avisos, medidas }; }
  for (const campo of CAMPOS_MANIFEST) {
    if (manifest[campo] === undefined) erros.push(`manifest sem o campo obrigatório "${campo}" (§517)`);
  }
  if (manifest.licenca && (!manifest.licenca.tipo || !manifest.licenca.comprovante)) {
    erros.push('licença precisa de tipo + comprovante rastreável (§511)');
  }
  if (manifest.id && !/^[a-z0-9_]+$/.test(manifest.id)) {
    erros.push(`id "${manifest.id}" fora do padrão snake_case ASCII (§ nomenclatura)`);
  }

  // 3–4. por LOD: hash confere + triângulos dentro do gate §631
  for (const lod of ['lod0', 'lod1', 'lod2']) {
    const arquivo = join(dir, `modelo.${lod}.glb`);
    const esperado = manifest.hashes?.[lod];
    if (!esperado) {
      erros.push(`manifest sem hash do ${lod} (§478)`);
    } else if (sha256De(arquivo) !== esperado) {
      erros.push(`hash do ${lod} NÃO confere com o arquivo (§478 — regenerar manifest ou arquivo corrompido)`);
    }
    try {
      const gltf = lerJsonDoGlb(arquivo);
      const tri = contarTriangulos(gltf);
      medidas.triangulos[lod] = tri;
      if (tri > LIMITES_TRIANGULOS[lod]) {
        erros.push(`${lod} com ${tri} triângulos — acima do gate §631 (máx ${LIMITES_TRIANGULOS[lod]})`);
      }
      if (tri === 0) avisos.push(`${lod} sem triângulos TRIANGLES — conferir exportação`);
      // 5. bones (uma vez, no lod0 — o rig é o mesmo)
      if (lod === 'lod0') {
        const bones = nomesDosBones(gltf);
        medidas.bones = bones.length;
        for (const b of bones) {
          if (!/^[\x20-\x7e]+$/.test(b) || /\s/.test(b)) {
            erros.push(`bone "${b}" com espaço/não-ASCII — o GLTFLoader sanitiza e o retargeting §436 quebra`);
          }
        }
        const canonico = opcoes.rigCanonico ?? lerRigCanonico();
        if (canonico.length === 0) {
          avisos.push('lista canônica do rig ubc-v1 ainda vazia (preencher com o 1º GLB real do UBC) — checagem de presença PULADA');
        } else {
          for (const b of canonico) {
            if (!bones.includes(b)) erros.push(`bone canônico "${b}" ausente do rig (§436)`);
          }
        }
      }
    } catch (e) {
      erros.push(`${lod}: GLB ilegível (${e.message})`);
    }
  }

  return { aprovado: erros.length === 0, erros, avisos, medidas };
}

function lerRigCanonico() {
  try {
    const r = JSON.parse(readFileSync(join(import.meta.dirname, 'rig-ubc-v1.json'), 'utf8'));
    return Array.isArray(r.bones) ? r.bones : [];
  } catch { return []; }
}

// ── CLI ─────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const pasta = process.argv[2];
  const comoJson = process.argv.includes('--json');
  if (!pasta) {
    console.error('uso: node scripts/avatar/assets3d/validar-asset.mjs <pasta-do-personagem> [--json]');
    process.exit(2);
  }
  const r = validarAsset(pasta);
  if (comoJson) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(`── validador §487 · ${pasta}`);
    for (const e of r.erros) console.log(`✗ ${e}`);
    for (const a of r.avisos) console.log(`⚠ ${a}`);
    console.log(`triângulos: ${JSON.stringify(r.medidas.triangulos)} · bones: ${r.medidas.bones}`);
    console.log(r.aprovado ? 'APROVADO' : 'REPROVADO');
  }
  process.exit(r.aprovado ? 0 : 1);
}
