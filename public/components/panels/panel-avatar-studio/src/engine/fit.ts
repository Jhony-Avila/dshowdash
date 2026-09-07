// engine/fit.ts — decisão A+ §15/§16: CLASSES DE CAIMENTO (fit) — a folga que
// uma peça adiciona sobre a ANATOMIA (engine/partes/corpo) deixa de ser número
// mágico espalhado em cada roupa e vira DADO nomeado. Uma peça declara sua
// classe (FITTED/REGULAR/RELAXED/OVERSIZED/STRUCTURED) e o motor deriva a
// silhueta vestida sobre QUALQUER perfil — a MESMA peça veste slim, standard,
// atlético, robusto e feminino com o caimento certo (§13 body fit matrix).
//
// Modelo: ease (folga em meia-largura, px) por landmark + `seguirCintura`
// (0..1: quanto a peça marca a cintura real vs. cair reto) + `drape` (metadado
// de quão solto é o tecido, p/ dobras futuras). STRUCTURED segura a forma
// (alfaiataria): folga média mas cintura pouco marcada e ombro firme.
// @version 1.0.0  @created 2026-08-23 (decisão A+)
import type { AnatomiaCorpo } from './partes/corpo';

export type FitClass = 'FITTED' | 'REGULAR' | 'RELAXED' | 'OVERSIZED' | 'STRUCTURED';

export const FIT_CLASSES: readonly FitClass[] = ['FITTED', 'REGULAR', 'RELAXED', 'OVERSIZED', 'STRUCTURED'];

export interface EaseFit {
  ombro: number; peito: number; cintura: number; quadril: number;
  /** 0..1: 1 = marca a cintura real (justo); 0 = cai reto (caixa). */
  seguirCintura: number;
  /** 0..1: metadado de "quão solto" (dobras/parallax futuros). */
  drape: number;
  nome: string; desc: string;
}

export const FIT: Record<FitClass, EaseFit> = {
  FITTED:     { ombro: 1, peito: 2, cintura: 2, quadril: 2, seguirCintura: 1.0, drape: 0.10, nome: 'Justo', desc: 'Segue o corpo; cintura marcada (segunda pele).' },
  REGULAR:    { ombro: 2, peito: 4, cintura: 6, quadril: 5, seguirCintura: 0.7, drape: 0.25, nome: 'Regular', desc: 'Folga natural; leve marcação de cintura.' },
  RELAXED:    { ombro: 3, peito: 7, cintura: 11, quadril: 9, seguirCintura: 0.4, drape: 0.45, nome: 'Solto', desc: 'Amplo e confortável; cintura suave.' },
  OVERSIZED:  { ombro: 6, peito: 12, cintura: 18, quadril: 14, seguirCintura: 0.15, drape: 0.70, nome: 'Oversized', desc: 'Volumoso; silhueta em caixa (streetwear).' },
  STRUCTURED: { ombro: 3, peito: 5, cintura: 9, quadril: 6, seguirCintura: 0.30, drape: 0.20, nome: 'Estruturado', desc: 'Alfaiataria; segura a forma independentemente do corpo.' },
};

export interface SilhuetaFit {
  ombroW: number; peitoW: number; cinturaW: number; quadrilW: number;
  fit: FitClass; ease: EaseFit;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Meias-larguras VESTIDAS de uma peça `fit` sobre a anatomia `A`. A cintura é
 * interpolada entre a cintura REAL (justo) e a média tórax↔quadril (cai reto)
 * conforme `seguirCintura`, e então recebe a folga. É isto que uma silhueta de
 * roupa autoral usa para envolver qualquer perfil coerentemente.
 */
export function silhuetaFit(A: Pick<AnatomiaCorpo, 'ombro' | 'peito' | 'cintura' | 'quadril'>, fit: FitClass): SilhuetaFit {
  const e = FIT[fit] ?? FIT.REGULAR;
  const cinturaBase = lerp((A.peito + A.quadril) / 2, A.cintura, e.seguirCintura);
  return {
    ombroW: A.ombro + e.ombro,
    peitoW: A.peito + e.peito,
    cinturaW: cinturaBase + e.cintura,
    quadrilW: A.quadril + e.quadril,
    fit, ease: e,
  };
}
