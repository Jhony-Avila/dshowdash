// domain/expressoes.ts — onda 1414 (MEGA_BRIEFING_01 Partes 3/5; decisões
// #162/#186): REGISTRY SEMÂNTICO DE EXPRESSÕES — dado puro (zero DOM).
//
// Uma expressão é um conjunto de TRANSFORMS por camada facial (olhos, boca,
// sobrancelha), escalados por `intensidade` (0–1). O render aplica como
// WRAPPER `<g transform>` SÓ nas artes v2 (`_px_`/`sbr_`) e SÓ com a flag
// `as6.face_v2` — a arte em si nunca muda (mesmo princípio dos params §71).
// `neutra` existe como conceito mas NUNCA persiste (validarConfig omite) e
// não está no registry — ausência de expressão É a neutra.
// Valores pequenos de propósito: expressão aqui é POSTURA da face, não
// morfologia (morfos ficam para artes/3D §Partes 5).
// @version 1.0.0  @created 2026-08-21

/** Transform de uma camada: deslocamento (px do viewBox 240), rotação
 *  (graus, pivô no centro da feição) e escala Y opcional. */
export interface PoseCamadaFacial {
  ty?: number;
  rot?: number;
  sy?: number;
}

export interface ExpressaoDef {
  id: string;
  nome: string;
  olhos?: PoseCamadaFacial;
  boca?: PoseCamadaFacial;
  sobrancelha?: PoseCamadaFacial;
}

/** Pivôs (viewBox 240): olhos/sobrancelha na linha 108, boca em 150. */
const PIVO: Record<'olhos' | 'boca' | 'sobrancelha', [number, number]> = {
  olhos: [120, 108],
  sobrancelha: [120, 96],
  boca: [120, 150],
};

export const EXPRESSOES_FACE: ExpressaoDef[] = [
  { id: 'feliz', nome: 'Feliz', olhos: { ty: 0.6, sy: 0.94 }, boca: { ty: -0.8, sy: 1.06 }, sobrancelha: { ty: -0.8 } },
  { id: 'serio', nome: 'Sério', olhos: { sy: 0.9 }, boca: { ty: 0.6, sy: 0.94 }, sobrancelha: { ty: 0.9, rot: -1.5 } },
  { id: 'surpreso', nome: 'Surpreso', olhos: { sy: 1.1 }, boca: { ty: 0.8, sy: 1.12 }, sobrancelha: { ty: -2.2 } },
  { id: 'bravo', nome: 'Bravo', olhos: { sy: 0.86 }, boca: { ty: 0.8, rot: -1 }, sobrancelha: { ty: 1.4, rot: -3 } },
  { id: 'triste', nome: 'Triste', olhos: { ty: 0.8, sy: 0.92 }, boca: { ty: 1, rot: 1.2 }, sobrancelha: { ty: 0.6, rot: 2.4 } },
  { id: 'cansado', nome: 'Cansado', olhos: { ty: 1, sy: 0.8 }, boca: { ty: 0.5 }, sobrancelha: { ty: 1.2 } },
  { id: 'confiante', nome: 'Confiante', olhos: { sy: 0.95 }, boca: { ty: -0.5, rot: -0.8 }, sobrancelha: { ty: -0.5, rot: 1.2 } },
];

const POR_ID = new Map(EXPRESSOES_FACE.map((e) => [e.id, e]));

export function expressaoPorId(id: string | undefined): ExpressaoDef | undefined {
  return id ? POR_ID.get(id) : undefined;
}

const arr = (n: number): number => Math.round(n * 1000) / 1000;

/** Transform SVG do wrapper para uma camada facial (ou '' = sem wrapper). */
export function transformExpressao(
  camada: 'olhos' | 'boca' | 'sobrancelha',
  preset: string | undefined,
  intensidade = 1,
): string {
  const def = expressaoPorId(preset);
  const pose = def?.[camada];
  if (!pose) return '';
  const k = Math.max(0, Math.min(1, intensidade));
  if (k === 0) return '';
  const [px, py] = PIVO[camada];
  const partes: string[] = [];
  if (pose.ty) partes.push(`translate(0 ${arr(pose.ty * k)})`);
  if (pose.rot) partes.push(`rotate(${arr(pose.rot * k)} ${px} ${py})`);
  if (pose.sy !== undefined && pose.sy !== 1) {
    const sy = arr(1 + (pose.sy - 1) * k);
    if (sy !== 1) partes.push(`translate(${px} ${py}) scale(1 ${sy}) translate(${-px} ${-py})`);
  }
  return partes.join(' ');
}
