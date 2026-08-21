// engine/compat-rosto.ts — onda 1414 (MEGA_BRIEFING_01 Partes 3/4; decisões
// #162/#186): COMPATIBILIDADE BARBA × MÁSCARA/CACHECOL como dado puro —
// irmão do compat-cabelo (§897, #182). Estados binários por decisão #186:
// `visible` ou `hidden` (recorte fino fica para quando uma arte o exigir,
// mesmo racional do #183). Item fora dos registries = fallback conservador
// (barba media, acessório neutro) — nunca quebra, só não refina.
// @version 1.0.0  @created 2026-08-21

export type EstadoBarba = 'visible' | 'hidden';

/** Acessórios de ROSTO que cobrem o terço inferior (engolem a barba). */
export const MASCARAS_ROSTO_FECHADAS = [
  'ace_mascara_neon', 'ace_mascara_oni', 'ace_mascara_kitsune',
  'ace_mascara_teatro', 'ace_mascara_hoquei',
];

/** Acessórios de PESCOÇO volumosos (conflitam com barba LONGA). */
export const PESCOCO_VOLUMOSO = ['ace_cachecol', 'ace_lenco_bandana'];

/** Perfil da barba premium: comprimento decide o conflito com o pescoço. */
export const PERFIL_BARBA: Record<string, 'curta' | 'media' | 'longa'> = {
  brb_rala: 'curta', brb_aparada: 'curta', brb_bigode: 'curta',
  brb_cavanhaque: 'media', brb_costeleta: 'curta', brb_cheia: 'media',
  brb_longa: 'longa', brb_lenhador: 'longa',
};

/** Famílias de estrutura facial (beard fit #162): a barba é a MESMA arte,
 *  o motor ajusta a largura por família da base (wrapper, arte intocada). */
export const FAMILIA_FACE: Record<string, 'suave' | 'anguloso' | 'largo'> = {
  bas_px_oval: 'suave', bas_px_alongada: 'suave', bas_px_suave: 'suave',
  bas_px_coracao: 'suave',
  bas_px_angular: 'anguloso', bas_px_quadrada: 'anguloso', bas_px_diamante: 'anguloso',
  bas_px_redonda: 'largo',
};

/** Fator de largura da barba por base (fallback conservador = 1). */
export function fatorBarba(baseId: string | undefined): number {
  const fam = baseId ? FAMILIA_FACE[baseId] : undefined;
  return fam === 'anguloso' ? 1.05 : fam === 'largo' ? 1.1 : 1;
}

/** Estado da barba dado o que está no rosto/pescoço (null = nada). */
export function resolverEstadoBarba(
  barbaId: string | null | undefined,
  acessorioRosto: string | null | undefined,
  acessorioPescoco: string | null | undefined,
): EstadoBarba {
  if (!barbaId || barbaId === 'nenhum') return 'hidden';
  if (acessorioRosto && MASCARAS_ROSTO_FECHADAS.includes(acessorioRosto)) return 'hidden';
  const perfil = PERFIL_BARBA[barbaId] ?? 'media';
  if (perfil === 'longa' && acessorioPescoco && PESCOCO_VOLUMOSO.includes(acessorioPescoco)) return 'hidden';
  return 'visible';
}
