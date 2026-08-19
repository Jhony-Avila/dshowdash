// services/Materiais3d.ts — MATERIAL MANAGER (megas 641–644 · §418–§421,
// lote 641–650, flag as5.materiais3d).
// @version 1.0.0  @created 2026-08-07
//
// Serviço CENTRAL de materiais §419: a UI fala CANAIS semânticos (§420 —
// o MESMO vocabulário §73 que o 2D já usa: pele/cabelo/roupa/destaque) e
// o renderer converte canal → materiais. Recoloração por PARÂMETRO
// (material.color multiplicativo sobre a textura — §421: nunca gerar
// textura nova por cor). Regras:
//   · canal vem de userData.canal3d (marcado pelo assembler §406 passo 10
//     por CATEGORIA da parte) ou do NOME do material (hair/beard/skin —
//     cobre o cabelo EMBUTIDO das bases UBC);
//   · cor original guardada UMA vez em userData.corOriginal → restauração
//     exata (byte-stability: sem cor personalizada, material intocado);
//   · instâncias COMPARTILHADAS deduplicadas (§419 — nada de material
//     novo por mesh);
//   · emissivos limitados ao teto §418.2;
//   · descarte de materiais E texturas (§419 "descartar recursos").
import * as THREE from 'three';
import { familiaDe, type FamiliaMaterialId } from './FamiliasMaterial'; // onda 1408 (#160)

/** Canais §420 = vocabulário §73 do 2D. */
export type Canal3d = 'pele' | 'cabelo' | 'roupa' | 'destaque';

/** §418.2: limite de emissão — intensidade acima do teto é grampeada. */
export const TETO_EMISSIVO = 2;

/** Categoria de parte §406 → canal de cor §420. */
export function canalDaCategoria(
  categoria: 'cabelo' | 'barba' | 'roupa' | 'acessorio',
): Canal3d {
  if (categoria === 'cabelo' || categoria === 'barba') return 'cabelo';
  if (categoria === 'roupa') return 'roupa';
  return 'destaque';
}

/** Materiais únicos da subárvore (instâncias compartilhadas 1×). */
export function materiaisDe(raiz: THREE.Object3D): THREE.Material[] {
  const unicos = new Set<THREE.Material>();
  raiz.traverse((n) => {
    const bruto = (n as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    for (const m of Array.isArray(bruto) ? bruto : bruto ? [bruto] : []) unicos.add(m);
  });
  return [...unicos];
}

/** Marca o canal §420 nos materiais da subárvore (assembler passo 10).
 *  userData não entra na serialização de estado — byte-stability. */
export function marcarCanal(raiz: THREE.Object3D, canal: Canal3d): number {
  const mats = materiaisDe(raiz);
  for (const m of mats) m.userData.canal3d = canal;
  return mats.length;
}

/** Canal do material: marca explícita > nome (cabelo embutido das bases;
 *  pele SÓ por nome explícito — nunca chuta o material do corpo §418). */
export function canalDoMaterial(m: THREE.Material): Canal3d | null {
  const marcado = m.userData?.canal3d as Canal3d | undefined;
  if (marcado) return marcado;
  const nome = (m.name ?? '').toLowerCase();
  if (/hair|cabelo|beard|barba/.test(nome)) return 'cabelo';
  if (/skin|pele/.test(nome)) return 'pele';
  return null;
}

/** onda 1408 (MEGA_BRIEFING_01 §695–§697, §1512, §1516–§1518; #160/#165a):
 *  METADADOS DE MATERIAL vindos do manifest §517 v2 (`materiais`): canal
 *  §73 explícito (resolve o skin tint das bases UBC cujo material se chama
 *  MI_Superhero_* — nunca por regex mais agressiva), `naoTingir` (olhos,
 *  dentes, logos, metais nobres) e `familia` (FamiliasMaterial, aplicada
 *  só por aplicarFamilias). Marca em userData (fora da serialização). */
export interface MetadadoMaterialManifest {
  canal?: Canal3d;
  naoTingir?: boolean;
  familia?: FamiliaMaterialId | string;
  overrides?: Partial<Record<'roughness' | 'metalness' | 'env' | 'normalScale' | 'emissive', number>>;
}
export function marcarMateriaisPorManifest(
  raiz: THREE.Object3D,
  materiais: Record<string, MetadadoMaterialManifest> | null | undefined,
): { marcados: number; naoTingir: number; comFamilia: number } {
  const r = { marcados: 0, naoTingir: 0, comFamilia: 0 };
  if (!materiais) return r;
  for (const m of materiaisDe(raiz)) {
    const meta = materiais[m.name];
    if (!meta) continue;
    if (meta.canal) { m.userData.canal3d = meta.canal; r.marcados += 1; }
    if (meta.naoTingir) { m.userData.naoTingir = true; r.naoTingir += 1; }
    if (meta.familia) { m.userData.familia = meta.familia; m.userData.familiaOverrides = meta.overrides ?? null; r.comFamilia += 1; }
  }
  return r;
}

/** onda 1408 (#160): aplica a FAMÍLIA marcada (userData.familia) nos
 *  parâmetros PBR do material — só materiais com família declarada (o
 *  resto fica byte a byte). Guarda os valores originais uma vez
 *  (userData.pbrOriginal) para restauração exata. Idempotente. */
export function aplicarFamilias(raiz: THREE.Object3D, tier: 'economico' | 'medio' | 'alto' = 'medio'): number {
  let aplicados = 0;
  for (const m of materiaisDe(raiz)) {
    const fam = familiaDe(m.userData?.familia as string | undefined);
    const ms = m as THREE.MeshStandardMaterial;
    if (!fam || typeof ms.roughness !== 'number') continue;
    if (!ms.userData.pbrOriginal) {
      ms.userData.pbrOriginal = { roughness: ms.roughness, metalness: ms.metalness, envMapIntensity: ms.envMapIntensity, normalScaleX: ms.normalScale?.x ?? 1, emissiveIntensity: ms.emissiveIntensity };
    }
    const o = ms.userData.pbrOriginal as { roughness: number; metalness: number; envMapIntensity: number; normalScaleX: number; emissiveIntensity: number };
    ms.roughness = o.roughness; ms.metalness = o.metalness; ms.envMapIntensity = o.envMapIntensity; ms.emissiveIntensity = o.emissiveIntensity;
    if (ms.normalScale) ms.normalScale.set(o.normalScaleX, o.normalScaleX);
    const p = { ...fam.padrao, ...(tier === 'alto' ? fam.ultra ?? {} : {}), ...(ms.userData.familiaOverrides ?? {}) } as typeof fam.padrao;
    ms.roughness = p.roughness; ms.metalness = p.metalness; ms.envMapIntensity = p.env;
    if (ms.normalMap && ms.normalScale && p.normalScale !== undefined) ms.normalScale.set(p.normalScale, p.normalScale);
    if (p.emissive !== undefined) ms.emissiveIntensity = Math.min(TETO_EMISSIVO, p.emissive);
    ms.needsUpdate = true;
    aplicados += 1;
  }
  return aplicados;
}

export interface OpcoesPipelineCores {
  /** cores §73 PERSONALIZADAS por canal (ausente/null = arte original) */
  cores?: Partial<Record<Canal3d, string>> | null;
  /** tinta de destaque mega 81 (lerp APÓS os canais) */
  tinta?: { cor: string; forca: number } | null;
}

/** Pipeline ÚNICO de cor (§419–§421): restaura o original, aplica canal
 *  (multiplicativo — preserva o detalhe da textura), aplica a tinta de
 *  destaque, grampeia emissivos. Idempotente: N aplicações = 1 aplicação. */
export function aplicarPipelineCores(
  raiz: THREE.Object3D,
  opcoes: OpcoesPipelineCores = {},
): { tingidos: number; porCanal: Partial<Record<Canal3d, number>> } {
  let tingidos = 0;
  const porCanal: Partial<Record<Canal3d, number>> = {};
  for (const m of materiaisDe(raiz)) {
    const ms = m as THREE.MeshStandardMaterial;
    if (!ms.color) continue;
    if (ms.userData.corOriginal === undefined) ms.userData.corOriginal = ms.color.getHex();
    ms.color.setHex(ms.userData.corOriginal as number);
    if (typeof ms.emissiveIntensity === 'number' && ms.emissiveIntensity > TETO_EMISSIVO) {
      ms.emissiveIntensity = TETO_EMISSIVO; // §418.2
    }
    const canal = canalDoMaterial(ms);
    // onda 1408 (§1516, #160): naoTingir (olhos/dentes/logos/metais nobres)
    // marcado pelo manifest — a cor do canal NÃO se aplica
    const cor = canal && !ms.userData.naoTingir ? opcoes.cores?.[canal] : undefined;
    if (canal && cor) {
      ms.color.multiply(new THREE.Color(cor));
      tingidos += 1;
      porCanal[canal] = (porCanal[canal] ?? 0) + 1;
    }
    if (opcoes.tinta) ms.color.lerp(new THREE.Color(opcoes.tinta.cor), opcoes.tinta.forca);
  }
  return { tingidos, porCanal };
}

/** §419 "descartar recursos": dispose dos materiais E das texturas.
 *  Seguro aqui porque cada GLB é um parse FRESCO (cena exclusiva). */
const MAPAS = [
  'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap',
  'emissiveMap', 'alphaMap',
] as const;
export function descartarMateriais(raiz: THREE.Object3D): number {
  const mats = materiaisDe(raiz);
  for (const m of mats) {
    const ms = m as unknown as Record<string, { dispose?: () => void } | undefined>;
    for (const chave of MAPAS) ms[chave]?.dispose?.();
    m.dispose();
  }
  return mats.length;
}
