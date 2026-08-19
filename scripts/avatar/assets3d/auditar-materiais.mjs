#!/usr/bin/env node
// assets3d/auditar-materiais.mjs — onda 1408 (MEGA_BRIEFING_01 §1507,
// §1749.1, §2591–§2595; decisão #160): AUDITORIA dos materiais dos GLBs
// PUBLICADOS (lod0) em node puro — por asset: materiais (nome, metallic/
// roughness factors, mapas presentes, emissive, alphaMode, doubleSided),
// suspeitos (metallic=1 em tecido/pele; roughness=1 com normal map; emissive
// > teto) e o que o manifest v2 já declara em `materiais`. Saída
// determinística: docs/AVATAR-STUDIO-5/evidencias/materiais-3d.json (o diff
// no git é o relatório). Ferramenta de desenvolvimento (doutrina #83).
// Uso (da raiz): node scripts/avatar/assets3d/auditar-materiais.mjs [--json]
// @version 1.0.0  @created 2026-08-19
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { lerJsonDoGlb } from './validar-asset.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const ASSETS3D = join(RAIZ, 'public', 'assets', 'avatars', '3d');
const SO_JSON = process.argv.includes('--json');
const TETO_EMISSIVO = 2;

function auditarGlb(caminho) {
  const g = lerJsonDoGlb(caminho);
  const mats = (g.materials ?? []).map((m) => {
    const pbr = m.pbrMetallicRoughness ?? {};
    const mapas = [];
    if (pbr.baseColorTexture) mapas.push('baseColor');
    if (pbr.metallicRoughnessTexture) mapas.push('metallicRoughness');
    if (m.normalTexture) mapas.push('normal');
    if (m.occlusionTexture) mapas.push('occlusion');
    if (m.emissiveTexture) mapas.push('emissive');
    const emissiveFactor = m.emissiveFactor ?? [0, 0, 0];
    const emissivo = Math.max(...emissiveFactor);
    const ext = m.extensions ?? {};
    const strength = ext.KHR_materials_emissive_strength?.emissiveStrength ?? 1;
    return {
      nome: m.name ?? '(sem nome)',
      metallic: pbr.metallicFactor ?? 1,
      roughness: pbr.roughnessFactor ?? 1,
      baseColorFactor: pbr.baseColorFactor ?? [1, 1, 1, 1],
      mapas,
      emissivo: emissivo > 0 ? Math.round(emissivo * strength * 1000) / 1000 : 0,
      alphaMode: m.alphaMode ?? 'OPAQUE',
      doubleSided: !!m.doubleSided,
      extensoes: Object.keys(ext).sort(),
    };
  });
  const suspeitos = [];
  for (const m of mats) {
    const n = m.nome.toLowerCase();
    const pareceTecidoOuPele = /skin|pele|cloth|fabric|shirt|ranger|peasant|hair|beard|superhero|eyes|face/.test(n);
    // com metallicRoughness MAP os fatores são multiplicadores da textura (1 = neutro) — só é suspeito SEM mapa
    const semMR = !m.mapas.includes('metallicRoughness');
    if (m.metallic === 1 && semMR && pareceTecidoOuPele) suspeitos.push(`${m.nome}: metallic=1 sem mapa em material não-metálico (§1549/§1707 — fica escuro/espelhado)`);
    if (m.roughness === 1 && semMR && m.mapas.includes('normal') && /skin|pele|superhero/.test(n)) suspeitos.push(`${m.nome}: roughness=1 sem mapa em pele (§1519 — pele "de giz"; família skin)`);
    if (m.mapas.length === 0 && /skin|pele/.test(n)) suspeitos.push(`${m.nome}: pele sem textura (cor chapada — família skin/tier só compensa em parte, §1519)`);
    if (m.emissivo > TETO_EMISSIVO) suspeitos.push(`${m.nome}: emissivo ${m.emissivo} acima do teto ${TETO_EMISSIVO} (§1567)`);
    if (m.alphaMode === 'BLEND' && /hair|cabelo/.test(n)) suspeitos.push(`${m.nome}: cabelo com BLEND (§725/§1535 — preferir MASK; sorting)`);
  }
  return { materiais: mats, texturas: (g.textures ?? []).length, imagens: (g.images ?? []).length, suspeitos };
}

function varrer(pasta) {
  const dir = join(ASSETS3D, pasta);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => {
    const manifest = JSON.parse(readFileSync(join(dir, d.name, 'manifest.json'), 'utf8'));
    const a = auditarGlb(join(dir, d.name, 'modelo.lod0.glb'));
    const declarados = manifest.materiais ?? {};
    return {
      id: manifest.id, tipo: manifest.tipo, pasta,
      ...a,
      declaradosNoManifest: Object.keys(declarados).sort(),
      semMetadado: a.materiais.map((m) => m.nome).filter((n) => !declarados[n]).sort(),
    };
  }).sort((x, y) => x.id.localeCompare(y.id));
}

const assets = [...varrer('personagens'), ...varrer('partes')];
const resumo = {
  totalAssets: assets.length,
  totalMateriais: assets.reduce((n, a) => n + a.materiais.length, 0),
  comSuspeitos: assets.filter((a) => a.suspeitos.length).map((a) => a.id),
  comMetadadoManifest: assets.filter((a) => a.declaradosNoManifest.length).map((a) => a.id),
  porAlphaMode: assets.flatMap((a) => a.materiais).reduce((acc, m) => { acc[m.alphaMode] = (acc[m.alphaMode] ?? 0) + 1; return acc; }, {}),
  comNormalMap: assets.flatMap((a) => a.materiais).filter((m) => m.mapas.includes('normal')).length,
  semTextura: assets.flatMap((a) => a.materiais).filter((m) => m.mapas.length === 0).length,
};
const saida = { gerado_por: 'scripts/avatar/assets3d/auditar-materiais.mjs', resumo, assets };
const destino = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias');
mkdirSync(destino, { recursive: true });
writeFileSync(join(destino, 'materiais-3d.json'), `${JSON.stringify(saida, null, 2)}\n`);
if (SO_JSON) { console.log(JSON.stringify(saida)); process.exit(0); }
console.log(`Materiais 3D: ${resumo.totalMateriais} materiais em ${resumo.totalAssets} assets · com normal map ${resumo.comNormalMap} · sem textura ${resumo.semTextura} · alphaMode ${JSON.stringify(resumo.porAlphaMode)}`);
for (const a of assets.filter((x) => x.suspeitos.length)) console.log(`  ⚠ ${a.id}: ${a.suspeitos.join(' | ')}`);
console.log(`  metadados no manifest: ${resumo.comMetadadoManifest.join(', ') || 'nenhum'}`);
console.log('→ docs/AVATAR-STUDIO-5/evidencias/materiais-3d.json');
