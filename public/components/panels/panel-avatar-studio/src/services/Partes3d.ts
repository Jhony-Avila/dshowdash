// services/Partes3d.ts — PARTES 3D publicadas (megas 625–626 · §406/§423,
// lote 621–630, flag as5.assembler3d).
// @version 1.0.0  @created 2026-08-07
//
// Espelho do Personagens3d para a pasta de PARTES (cabelo/barba/roupa/
// acessório riggados no rig ubc-v1). Mesmo contrato §517 de manifest,
// mesma resolução de LOD por tier. Índice derivado (index.json) com a
// MESMA cadeia fail-safe: erro/vazio nunca bloqueia (§481) — a UI
// simplesmente não oferece partes.
import type { QualidadeTier } from '../nucleo/contratos';
import { lodPorQualidade } from './Personagens3d';
import type { ManifestPersonagem3d } from './Personagens3d';

export const BASE_PARTES_3D = '/assets/avatars/3d/partes';

/** Bones canônicos do rig ubc-v1 (espelho de scripts/avatar/assets3d/
 *  rig-ubc-v1.json — 65 bones verificados no lote 611–620). O assembler
 *  §406 usa esta lista no passo 2 (validar rig) em runtime. */
export const BONES_UBC_V1: string[] = [
  'root', 'pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'Head',
  'clavicle_l', 'upperarm_l', 'lowerarm_l', 'hand_l',
  'index_01_l', 'index_02_l', 'index_03_l', 'index_04_leaf_l',
  'middle_01_l', 'middle_02_l', 'middle_03_l', 'middle_04_leaf_l',
  'pinky_01_l', 'pinky_02_l', 'pinky_03_l', 'pinky_04_leaf_l',
  'ring_01_l', 'ring_02_l', 'ring_03_l', 'ring_04_leaf_l',
  'thumb_01_l', 'thumb_02_l', 'thumb_03_l', 'thumb_04_leaf_l',
  'clavicle_r', 'upperarm_r', 'lowerarm_r', 'hand_r',
  'index_01_r', 'index_02_r', 'index_03_r', 'index_04_leaf_r',
  'middle_01_r', 'middle_02_r', 'middle_03_r', 'middle_04_leaf_r',
  'pinky_01_r', 'pinky_02_r', 'pinky_03_r', 'pinky_04_leaf_r',
  'ring_01_r', 'ring_02_r', 'ring_03_r', 'ring_04_leaf_r',
  'thumb_01_r', 'thumb_02_r', 'thumb_03_r', 'thumb_04_leaf_r',
  'thigh_l', 'calf_l', 'foot_l', 'ball_l', 'ball_leaf_l',
  'thigh_r', 'calf_r', 'foot_r', 'ball_r', 'ball_leaf_r',
];

export interface EntradaIndiceParte {
  slug: string;
  nome: string;
  tipo: string; // parte_cabelo | parte_barba | parte_roupa | parte_acessorio
  rig: string;
  thumb: string;
}

/** Carrega o manifest §517 de uma parte publicada. */
export async function carregarManifestParte(
  slug: string,
  base: string = BASE_PARTES_3D,
): Promise<ManifestPersonagem3d> {
  const r = await fetch(`${base}/${slug}/manifest.json`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`manifest da parte "${slug}" indisponível (${r.status})`);
  const m = (await r.json()) as ManifestPersonagem3d;
  if (!m?.id || !m?.lods?.lod0) throw new Error(`manifest de "${slug}" fora do contrato §517`);
  return m;
}

/** URL do GLB da parte no tier pedido (mesma régua §423 dos personagens). */
export function urlDaParte(
  manifest: ManifestPersonagem3d,
  qualidade: QualidadeTier | 'auto',
  base: string = BASE_PARTES_3D,
): string {
  return `${base}/${manifest.id}/${manifest.lods[lodPorQualidade(qualidade)]}`;
}

/** Índice de partes (derivado; §481: null = UI segue sem partes). */
export async function carregarIndicePartes(
  base: string = BASE_PARTES_3D,
): Promise<EntradaIndiceParte[] | null> {
  try {
    const r = await fetch(`${base}/index.json`, { cache: 'no-store' });
    if (!r.ok) return null;
    const corpo = await r.json() as { personagens?: EntradaIndiceParte[] };
    const lista = corpo?.personagens; // mesmo gerador → mesma chave
    return Array.isArray(lista) && lista.length ? lista : null;
  } catch { return null; }
}

/** Categoria da UI a partir do tipo do manifest (fail-safe: acessório). */
export function categoriaDaParte(tipo: string): 'cabelo' | 'barba' | 'roupa' | 'acessorio' {
  if (tipo === 'parte_cabelo') return 'cabelo';
  if (tipo === 'parte_barba') return 'barba';
  if (tipo === 'parte_roupa') return 'roupa';
  return 'acessorio';
}
