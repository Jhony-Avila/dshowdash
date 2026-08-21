// services/ParidadeRenderer.ts — onda 1416 (MEGA_BRIEFING_01 P6-E; decisão
// #197): PARIDADE SEMÂNTICA entre renderers — um ID LÓGICO por conceito
// ("coroa", "asas de energia") apontando para a arte 2D clássica e o asset
// 3D do socket. Complementa `rendererSupport` (QualidadeVisual): aqui é o
// MAPA de equivalência; lá é a capacidade por item.
// Registry consultivo (UI: aviso "disponível só no 2D/3D") — nada persiste.
// @version 1.0.0  @created 2026-08-21
import { rendererSupport } from './QualidadeVisual';

export interface ParidadeItem {
  /** arte 2D clássica/premium (id do catálogo) */
  classic?: string;
  /** asset de socket 3D (poc3d/catalogo3d) */
  tresD?: string;
}

/** id lógico → equivalentes por renderer (#197). */
export const PARIDADE_RENDERER: Record<string, ParidadeItem> = {
  coroa: { classic: 'ace_px_coroa', tresD: 'soc_coroa' },
  aureola: { classic: 'ace_aureola', tresD: 'soc_halo' },
  oculos_neon: { classic: 'ace_px_oculos', tresD: 'soc_oculos_neon' },
  colar: { classic: 'ace_px_colar', tresD: 'soc_colar_estrela' },
  mochila_jato: { classic: 'ace_mochila_jato', tresD: 'soc_jetpack' },
  asas_energia: { classic: 'ace_px_asas', tresD: 'soc_asas_energia' },
  cetro: { classic: 'ace_px_cetro', tresD: 'soc_cetro' },
  drone: { classic: 'ace_px_drone', tresD: 'soc_drone' },
  robo_bit: { classic: 'ace_robo_bit', tresD: 'soc_pet_bit' },
};

const POR_CLASSIC = new Map(
  Object.entries(PARIDADE_RENDERER)
    .filter(([, v]) => v.classic)
    .map(([k, v]) => [v.classic as string, k]),
);

/** id lógico de um item 2D (null = sem par declarado). */
export function idLogicoDe(classicId: string): string | null {
  return POR_CLASSIC.get(classicId) ?? null;
}

/** Aviso de paridade para a UI (null = nada a avisar). */
export function avisoParidade(classicId: string): string | null {
  const logico = idLogicoDe(classicId);
  const suporte = rendererSupport(classicId);
  if (logico && PARIDADE_RENDERER[logico].tresD) return null; // tem par 3D
  if (suporte.length === 1 && suporte[0] === '2d') return 'Disponível só no renderizador 2D';
  if (suporte.length === 1 && suporte[0] === '3d') return 'Disponível só no renderizador 3D';
  return null;
}
