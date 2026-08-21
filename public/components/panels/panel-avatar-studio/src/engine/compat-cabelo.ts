// engine/compat-cabelo.ts — onda 1413 (MEGA_BRIEFING_01 §881–§897; decisão
// #159): COMPATIBILIDADE CABELO × HEADWEAR (§897) como DADO puro.
//
// Estados: `visible` (chapéu e cabelo convivem) · `masked` (o topo do
// cabelo é recortado sob o chapéu — clipPath só em artes `_px_`/opt-in) ·
// `variant` (o cabelo continua aparecendo embaixo/atrás — comprimento
// vence o chapéu) · `hidden` (headwear fechado engole o cabelo).
// A matriz cruza o PERFIL do chapéu (aberto/justo/fechado) com o PERFIL
// do cabelo (altura × comprimento). Item fora dos registries usa o
// fallback conservador (aberto/medio) — nunca quebra, só não refina.
// @version 1.0.0  @created 2026-08-21

export type EstadoCabelo = 'visible' | 'masked' | 'variant' | 'hidden';

/** Perfil do headwear (slot cabeca): quanto ele OCUPA do topo da cabeça. */
export const PERFIL_HEADWEAR: Record<string, 'aberto' | 'justo' | 'fechado'> = {
  // abertos: apoiam sem cobrir a calota (tiaras, chifres, coroa, fones)
  ace_fone: 'aberto', ace_headset: 'aberto', ace_coroa: 'aberto',
  ace_chifres_oni: 'aberto', ace_tiara_led: 'aberto',
  // justos: cobrem a calota (bonés, boinas, gorros, chapéus)
  ace_bone: 'justo', ace_boina: 'justo', ace_gorro_natal: 'justo',
  ace_chapeu_mago: 'justo', ace_chapeu_bruxa: 'justo',
  // fechados: envolvem a cabeça inteira
  ace_viseira_vr: 'fechado',
};

/** Perfil do cabelo premium: altura da calota × comprimento. */
export const PERFIL_CABELO_PX: Record<string, { altura: 'baixo' | 'medio' | 'alto'; comprimento: 'curto' | 'medio' | 'longo' }> = {
  cab_px_curto: { altura: 'baixo', comprimento: 'curto' },
  cab_px_franja: { altura: 'medio', comprimento: 'curto' },
  cab_px_lateral: { altura: 'medio', comprimento: 'curto' },
  cab_px_undercut: { altura: 'baixo', comprimento: 'curto' },
  cab_px_longo_liso: { altura: 'medio', comprimento: 'longo' },
  cab_px_ondulado: { altura: 'medio', comprimento: 'longo' },
  cab_px_rabo: { altura: 'medio', comprimento: 'longo' },
  cab_px_coque: { altura: 'alto', comprimento: 'medio' },
  cab_px_afro: { altura: 'alto', comprimento: 'medio' },
  cab_px_cacheado: { altura: 'alto', comprimento: 'medio' },
};

/** §897: estado do cabelo dado o headwear equipado (null = sem chapéu). */
export function resolverEstadoCabelo(cabeloId: string | null | undefined, headwearId: string | null | undefined): EstadoCabelo {
  if (!cabeloId || cabeloId === 'nenhum') return 'hidden';
  if (!headwearId || headwearId === 'nenhum') return 'visible';
  const chapeu = PERFIL_HEADWEAR[headwearId] ?? 'aberto';
  const cab = PERFIL_CABELO_PX[cabeloId] ?? { altura: 'medio', comprimento: 'medio' };
  if (chapeu === 'aberto') return 'visible';
  if (chapeu === 'fechado') return cab.comprimento === 'longo' ? 'variant' : 'hidden';
  // justo: recorta a calota; comprimento longo continua aparecendo
  if (cab.comprimento === 'longo') return 'variant';
  return cab.altura === 'baixo' ? 'visible' : 'masked';
}

/** Profundidade do RECORTE (px do viewBox 240) por estado/opt-in §897.
 *  0 = sem clip. `encaixe` (params.cabelo, artes v2) força/ajusta. */
export function profundidadeRecorte(estado: EstadoCabelo, encaixe?: number): number {
  const manual = typeof encaixe === 'number' && encaixe > 0 ? Math.min(1, encaixe) * 22 : 0;
  if (estado === 'masked') return Math.max(14, manual);
  if (estado === 'variant') return Math.max(8, manual);
  return manual; // visible: só com opt-in explícito
}
