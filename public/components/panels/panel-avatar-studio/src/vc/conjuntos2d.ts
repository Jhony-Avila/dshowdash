// vc/conjuntos2d.ts — GERADO pela auditoria geométrica (decisão #52, refinada).
// Um "conjunto" (look de corpo inteiro) é a peça de `roupa` cujo renderCorpo cobre
// EFETIVAMENTE as pernas/pés (medido em measure-vestuario.mjs: maxY >= cintura no
// canvas de corpo 240x400). Classificação por GEOMETRIA, nunca por nome. Equipar um
// conjunto limpa `roupa_inferior`; equipar calça com conjunto ativo limpa o conjunto
// (VisualComposer.aplicarPeca) — atômico, desfazível.
//
// Auditoria (maxY medido por peça):
//   rou_camiseta         maxY=   198  -> superior  (até ~198 (tronco))
//   rou_regata           maxY=   134  -> superior  (até ~134 (tronco))
//   rou_social           maxY=   210  -> superior  (até ~210 (tronco))
//   rou_hoodie           maxY=   202  -> superior  (até ~202 (tronco))
//   rou_jaqueta          maxY=   212  -> superior  (até ~212 (tronco))
//   rou_gamer            maxY=   208  -> superior  (até ~208 (tronco))
//   rou_terno            maxY=   166  -> superior  (até ~166 (tronco))
//   rou_kimono           maxY=   208  -> superior  (até ~208 (tronco))
//   rou_astronauta       maxY=   174  -> superior  (até ~174 (tronco))
//   rou_moletom_dshow    maxY=   170  -> superior  (até ~170 (tronco))
//   rou_armadura         maxY=   202  -> superior  (até ~202 (tronco))
//   rou_polo             maxY=   193  -> superior  (até ~193 (tronco))
//   rou_flanela          maxY=   194  -> superior  (até ~194 (tronco))
//   rou_colete           maxY=   194  -> superior  (até ~194 (tronco))
//   rou_smoking          maxY=   192  -> superior  (até ~192 (tronco))
//   rou_jersey           maxY=   194  -> superior  (até ~194 (tronco))
//   rou_sobretudo        maxY=   198  -> superior  (até ~198 (tronco))
//   rou_jaleco           maxY=   194  -> superior  (até ~194 (tronco))
//   rou_neon_racer       maxY=   194  -> superior  (até ~194 (tronco))
//   rou_havaiana         maxY=   192  -> superior  (até ~192 (tronco))
//   rou_suspensorios     maxY=   194  -> superior  (até ~194 (tronco))
//   rou_tricot           maxY=   182  -> superior  (até ~182 (tronco))
//   rou_capa_chuva       maxY=   194  -> superior  (até ~194 (tronco))
//   rou_chef             maxY=   194  -> superior  (até ~194 (tronco))
//   rou_blazer_power     maxY=   192  -> superior  (até ~192 (tronco))
//   rou_regata_quadra    maxY=   134  -> superior  (até ~134 (tronco))
//   rou_tunica_arcana    maxY=   202  -> superior  (até ~202 (tronco))
//   rou_exoesqueleto     maxY=   194  -> superior  (até ~194 (tronco))
//   rou_pijama           maxY= 153.8  -> superior  (até ~153.8 (tronco))
//   rou_gala_dshow       maxY=   196  -> superior  (até ~196 (tronco))
//   rou_px_terno         maxY=   166  -> superior  (até ~166 (tronco))
//   rou_px_jaqueta       maxY=   206  -> superior  (até ~206 (tronco))
//   rou_px_camiseta      maxY=  None  -> superior  (sem renderCorpo (só busto))
//   rou_px_camisa        maxY=  None  -> superior  (sem renderCorpo (só busto))
//   rou_px_hoodie        maxY=  None  -> superior  (sem renderCorpo (só busto))
//   rou_px_blazer        maxY=  None  -> superior  (sem renderCorpo (só busto))
//   rou_px_polo          maxY=  None  -> superior  (sem renderCorpo (só busto))
//   rou_px_colete        maxY=  None  -> superior  (sem renderCorpo (só busto))
//   rou_px_sobretudo     maxY=  None  -> superior  (sem renderCorpo (só busto))
//   rou_px_gala          maxY=  None  -> superior  (sem renderCorpo (só busto))

/** @version 2 (geométrica) — ids cuja arte de corpo cobre pernas/pés. */
export const CONJUNTOS_CORPO_INTEIRO: Readonly<Record<string, true>> = {
  // (nenhuma peça superior cobre pernas/pés na arte 2D atual — nenhum conjunto)
};

/** true se a peça superior ocupa também a região inferior (conjunto). */
export function ehConjunto(id?: string | null): boolean {
  return !!id && Object.prototype.hasOwnProperty.call(CONJUNTOS_CORPO_INTEIRO, id);
}
