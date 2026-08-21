// services/LookFace.ts — onda 1418 (MEGA_BRIEFING_01 P3-G, P4-H 2D;
// decisão #203): PRESET "LOOK FACE" + RANDOMIZE FACIAL HOMOLOGADO.
//
// "Look Face" aplica um ROSTO completo curado (base + olhos + boca +
// sobrancelha + nariz + coresFace) sem tocar no resto do avatar; o
// randomize facial sorteia SÓ entre artes HOMOLOGADAS (production/premium
// — nunca prototype/legacy, §2559) com determinismo por semente.
// Gated na UI por as6.face_v2 (+ classico_premium p/ os _px_).
// @version 1.0.0  @created 2026-08-21
import type { AvatarConfig } from '../domain/types';
import { itensDe, validarConfig } from './AvatarCatalog';
import { qualidadeVisualDe } from './QualidadeVisual';
import { flag } from '../nucleo/flags';

export interface LookFaceDef {
  id: string;
  nome: string;
  base: string;
  olhos: string;
  boca: string;
  sobrancelha?: string;
  nariz?: string;
  barba?: string;
  coresFace?: { iris?: string; sobrancelha?: string; barba?: string; labios?: string };
}

/** Rostos completos curados (§2559 — combinações homologadas). */
export const LOOKS_FACE: LookFaceDef[] = [
  { id: 'lf_confianca', nome: 'Confiança', base: 'bas_px_angular', olhos: 'olh_px_confiante', boca: 'boc_px_sorriso', sobrancelha: 'sbr_marcada', nariz: 'nar_reto', coresFace: { iris: '#4a3626' } },
  { id: 'lf_serenidade', nome: 'Serenidade', base: 'bas_px_suave', olhos: 'olh_px_sereno', boca: 'boc_px_suave', sobrancelha: 'sbr_suave', nariz: 'nar_suave', coresFace: { iris: '#2f5d43' } },
  { id: 'lf_intensidade', nome: 'Intensidade', base: 'bas_px_diamante', olhos: 'olh_px_intenso', boca: 'boc_px_determinada', sobrancelha: 'sbr_angular', nariz: 'nar_aquilino', coresFace: { iris: '#3a6ea8' } },
  { id: 'lf_carisma', nome: 'Carisma', base: 'bas_px_oval', olhos: 'olh_px_gentil', boca: 'boc_px_riso', sobrancelha: 'sbr_arqueada', nariz: 'nar_botao', coresFace: { iris: '#6b4a2a' } },
  { id: 'lf_presenca', nome: 'Presença', base: 'bas_px_quadrada', olhos: 'olh_px_determinado', boca: 'boc_px_neutra', sobrancelha: 'sbr_grossa', nariz: 'nar_forte', barba: 'brb_aparada', coresFace: { iris: '#3a2a1e' } },
];

/** Aplica um Look Face — SÓ as camadas do rosto; o resto fica. */
export function aplicarLookFace(config: AvatarConfig, look: LookFaceDef): AvatarConfig {
  return validarConfig({
    ...config,
    base: look.base,
    camadas: {
      ...config.camadas,
      olhos: look.olhos,
      boca: look.boca,
      ...(look.sobrancelha ? { sobrancelha: look.sobrancelha } : {}),
      ...(look.nariz ? { nariz: look.nariz } : {}),
      ...(look.barba ? { barba: look.barba } : {}),
    },
    ...(look.coresFace ? { coresFace: { ...config.coresFace, ...look.coresFace } } : {}),
    acabamento: 'premium',
  });
}

/** Itens HOMOLOGADOS de uma categoria (§2559: nunca prototype/legacy). */
function homologados(categoria: Parameters<typeof itensDe>[0]): string[] {
  return itensDe(categoria)
    .filter((x) => ['production', 'premium', 'hero'].includes(qualidadeVisualDe(x.id)))
    .map((x) => x.id);
}

/** PRNG determinístico (mulberry32) — mesma semente, mesmo rosto. */
function prng(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Randomize FACIAL homologado (#203): sorteia rosto entre aprovados. */
export function randomizeFacial(config: AvatarConfig, semente: number): AvatarConfig {
  const rnd = prng(semente);
  const escolher = (ids: string[], atual?: string): string | undefined =>
    ids.length ? ids[Math.floor(rnd() * ids.length)] : atual;
  const camadas = { ...config.camadas };
  const bases = homologados('base');
  const olhos = escolher(homologados('olhos'), camadas.olhos);
  const boca = escolher(homologados('boca'), camadas.boca);
  if (olhos) camadas.olhos = olhos;
  if (boca) camadas.boca = boca;
  if (flag('as6.brow_slot')) {
    const sbr = escolher(homologados('sobrancelha'));
    if (sbr) camadas.sobrancelha = sbr;
  }
  if (flag('as6.face_v2')) {
    const nar = escolher(homologados('nariz'));
    if (nar) camadas.nariz = nar;
  }
  return validarConfig({
    ...config,
    base: escolher(bases, config.base) ?? config.base,
    camadas,
  });
}
