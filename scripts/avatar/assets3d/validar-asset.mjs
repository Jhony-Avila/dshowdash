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
// megas 611-613 (§631 texturas): maior DIMENSÃO permitida por LOD — o
// publicador v2 redimensiona; o validador cobra (fontes UBC vêm em 4096)
const LIMITES_TEXTURA = { lod0: 2048, lod1: 1024, lod2: 512 };
// EXCEÇÃO AUDITÁVEL (mega 8): fontes flat-shaded resistem a simplify (cada
// triângulo tem vértices próprios — sem arestas compartilhadas p/ colapsar).
// O manifest pode DECLARAR excecoes[lod] com justificativa; o validador
// aceita até o TETO ABSOLUTO com AVISO. Sem declaração = erro, sempre.
const TETO_ABSOLUTO = { lod0: 70_000, lod1: 30_000, lod2: 12_000 };
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

/** megas 611-613: bytes de um bufferView do GLB (chunk BIN). */
function bytesDoBufferView(buf, gltf, indice) {
  const bv = gltf.bufferViews?.[indice];
  if (!bv) return null;
  // chunk BIN começa após o header (12) + chunk JSON (8 + tamanho)
  const tamJson = buf.readUInt32LE(12);
  const inicioBin = 12 + 8 + tamJson + 8;
  const off = inicioBin + (bv.byteOffset ?? 0);
  return buf.subarray(off, off + bv.byteLength);
}

/** megas 611-613: dimensões de PNG/JPEG/WebP lendo SÓ o header (node puro). */
export function dimensoesDaImagem(bytes) {
  if (!bytes || bytes.length < 30) return null;
  // PNG: assinatura + IHDR nos bytes 16..24
  if (bytes.readUInt32BE(0) === 0x89504e47) {
    return { largura: bytes.readUInt32BE(16), altura: bytes.readUInt32BE(20) };
  }
  // WebP: RIFF....WEBP + VP8/VP8L/VP8X
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    const forma = bytes.toString('ascii', 12, 16);
    if (forma === 'VP8X') {
      return {
        largura: 1 + (bytes.readUIntLE(24, 3)),
        altura: 1 + (bytes.readUIntLE(27, 3)),
      };
    }
    if (forma === 'VP8L') {
      const b = bytes.readUInt32LE(21);
      return { largura: 1 + (b & 0x3fff), altura: 1 + ((b >> 14) & 0x3fff) };
    }
    if (forma === 'VP8 ') {
      return { largura: bytes.readUInt16LE(26) & 0x3fff, altura: bytes.readUInt16LE(28) & 0x3fff };
    }
    return null;
  }
  // JPEG: varre marcadores até um SOF (C0–CF, exceto C4/C8/CC)
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) { i += 1; continue; }
      const marcador = bytes[i + 1];
      if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
        return { largura: bytes.readUInt16BE(i + 7), altura: bytes.readUInt16BE(i + 5) };
      }
      i += 2 + (bytes.readUInt16BE(i + 2) ?? 0);
    }
  }
  return null;
}

/** megas 611-613 (§631): maior dimensão de textura embutida no GLB. */
export function maiorTexturaDoGlb(caminho) {
  const buf = readFileSync(caminho);
  const gltf = lerJsonDoGlb(caminho);
  let maior = 0;
  let total = 0;
  for (const img of gltf.images ?? []) {
    if (img.bufferView === undefined) continue; // uri externa não entra no GLB
    const bytes = bytesDoBufferView(buf, gltf, img.bufferView);
    const dim = dimensoesDaImagem(bytes);
    if (dim) {
      maior = Math.max(maior, dim.largura, dim.altura);
      total += 1;
    }
  }
  return { maior, texturas: total };
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

  // 1. arquivos obrigatórios — thumbs ausentes NÃO abortam as demais
  // checagens (lição mega 8: o return antecipado mascarava violação de
  // gate §631 quando só faltavam thumbs); GLB/manifest ausentes abortam.
  for (const nome of ARQUIVOS_OBRIGATORIOS) {
    if (!existsSync(join(dir, nome))) erros.push(`arquivo obrigatório ausente: ${nome}`);
  }
  const faltaCritico = erros.some((e) => e.includes('.glb') || e.includes('manifest.json'));
  if (faltaCritico) return { aprovado: false, erros, avisos, medidas }; // sem base p/ seguir

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
        const excecao = manifest.excecoes?.[lod];
        if (excecao && tri <= TETO_ABSOLUTO[lod]) {
          avisos.push(`${lod} com ${tri} triângulos acima do gate §631 (máx ${LIMITES_TRIANGULOS[lod]}) — EXCEÇÃO declarada no manifest: ${excecao}`);
        } else {
          erros.push(`${lod} com ${tri} triângulos — acima do gate §631 (máx ${LIMITES_TRIANGULOS[lod]}${excecao ? `; exceção declarada mas TETO ABSOLUTO é ${TETO_ABSOLUTO[lod]}` : '; sem exceção declarada'})`);
        }
      }
      if (tri === 0) avisos.push(`${lod} sem triângulos TRIANGLES — conferir exportação`);
      // megas 611-613 (§631): dimensão máxima de textura POR LOD
      const tex = maiorTexturaDoGlb(arquivo);
      if (tex.texturas > 0) {
        (medidas.texturas ??= {})[lod] = tex.maior;
        if (tex.maior > LIMITES_TEXTURA[lod]) {
          erros.push(`${lod} com textura de ${tex.maior}px — acima do gate §631 (máx ${LIMITES_TEXTURA[lod]}px; o publicador v2 redimensiona)`);
        }
      }
      // 5. bones (uma vez, no lod0 — o rig é o mesmo)
      if (lod === 'lod0') {
        const bones = nomesDosBones(gltf);
        medidas.bones = bones.length;
        for (const b of bones) {
          if (!/^[\x20-\x7e]+$/.test(b) || /\s/.test(b)) {
            erros.push(`bone "${b}" com espaço/não-ASCII — o GLTFLoader sanitiza e o retargeting §436 quebra`);
          }
        }
        // megas 611-620: lista canônica POR NOME DE RIG (rig-<nome>.json) —
        // o manifest declara o rig e o validador cobra a lista DELE; rig
        // sem lista registrada = aviso (nunca cobrar esqueleto errado:
        // os 6 legados têm rigs próprios, corrigidos nos manifests)
        const nomeRig = String(manifest.rig ?? 'ubc-v1');
        const canonico = opcoes.rigCanonico ?? lerRigCanonico(nomeRig);
        if (canonico.length === 0) {
          avisos.push(`rig "${nomeRig}" sem lista canônica registrada (rig-${nomeRig}.json) — checagem de presença PULADA`);
        } else {
          for (const b of canonico) {
            if (!bones.includes(b)) erros.push(`bone canônico "${b}" ausente do rig ${nomeRig} (§436)`);
          }
        }
      }
    } catch (e) {
      erros.push(`${lod}: GLB ilegível (${e.message})`);
    }
  }

  // ── lote 701-710 (§487): checagens ampliadas — RESSALVAS, nunca
  // reprovação retroativa de asset já publicado ──
  if (!manifest.licenca) {
    avisos.push('sem metadados de licença (§511) — regularizar na próxima republicação');
  }
  try {
    const gltf0 = lerJsonDoGlb(join(dir, 'modelo.lod0.glb'));
    // materiais §487/§488 (informativo + teto do gate)
    medidas.materiais = (gltf0.materials ?? []).length;
    if (medidas.materiais > 8) avisos.push(`${medidas.materiais} materiais no lod0 — conferir consolidação (§467)`);
    // UV §487: primitiva com material TEXTURIZADO precisa de TEXCOORD_0
    const materiaisComTextura = new Set();
    (gltf0.materials ?? []).forEach((m, i) => {
      if (m.pbrMetallicRoughness?.baseColorTexture || m.normalTexture || m.emissiveTexture) materiaisComTextura.add(i);
    });
    let semUv = 0;
    for (const malha of gltf0.meshes ?? []) {
      for (const prim of malha.primitives ?? []) {
        if (materiaisComTextura.has(prim.material) && prim.attributes?.TEXCOORD_0 === undefined) semUv += 1;
      }
    }
    if (semUv > 0) avisos.push(`${semUv} primitiva(s) texturizada(s) SEM TEXCOORD_0 (§487 — textura vira cor chapada)`);
    // escala §487: altura do bounding box do POSITION (personagens 0.8–3m)
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const malha of gltf0.meshes ?? []) {
      for (const prim of malha.primitives ?? []) {
        const acc = gltf0.accessors?.[prim.attributes?.POSITION];
        if (acc?.min && acc?.max) { yMin = Math.min(yMin, acc.min[1]); yMax = Math.max(yMax, acc.max[1]); }
      }
    }
    if (Number.isFinite(yMin) && Number.isFinite(yMax)) {
      medidas.alturaM = Math.round((yMax - yMin) * 100) / 100;
      if (String(manifest.tipo) === 'personagem_base' && (medidas.alturaM < 0.8 || medidas.alturaM > 3)) {
        avisos.push(`altura ${medidas.alturaM}m fora da faixa 0,8–3m (§487 escala) — conferir unidade`);
      }
    }
  } catch { /* lod0 ilegível já reportado acima */ }

  return { aprovado: erros.length === 0, erros, avisos, medidas };
}

/** §488: RELATÓRIO de validação — status + linhas humanas por item. */
export function relatorioDeValidacao(pasta) {
  const r = validarAsset(pasta);
  const status = !r.aprovado ? 'reprovado'
    : r.avisos.length ? 'aprovado com ressalvas' : 'aprovado';
  const linhas = [
    `Status: ${status}`,
    `Triângulos: lod0=${r.medidas.triangulos.lod0 ?? '?'} lod1=${r.medidas.triangulos.lod1 ?? '?'} lod2=${r.medidas.triangulos.lod2 ?? '?'}`,
    `Bones: ${r.medidas.bones}`,
    ...(r.medidas.materiais !== undefined ? [`Materiais: ${r.medidas.materiais}`] : []),
    ...(r.medidas.texturas ? [`Texturas (máx px): ${Object.entries(r.medidas.texturas).map(([l, v]) => `${l}=${v}`).join(' ')}`] : []),
    ...(r.medidas.alturaM !== undefined ? [`Altura: ${r.medidas.alturaM}m`] : []),
    ...r.erros.map((e) => `ERRO: ${e}`),
    ...r.avisos.map((a) => `Ressalva: ${a}`),
  ];
  return { status, linhas, ...r };
}

function lerRigCanonico(rig = 'ubc-v1') {
  try {
    if (!/^[a-z0-9-]+$/.test(rig)) return []; // nome fora do padrão = sem lista
    const r = JSON.parse(readFileSync(join(import.meta.dirname, `rig-${rig}.json`), 'utf8'));
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
