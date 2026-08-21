// engine/partes/premium/corpo.ts — onda 1415 (MEGA_BRIEFING_01 P10-D,
// §2402–§2427; decisão #191): SCAFFOLD V2 do corpo inteiro — sombreamento
// premium pintado POR CIMA do scaffold clássico (`corpoInteiro` intocado).
// Consumido pelo render SÓ com opcoes.premium; sem premium = ''.
// Zero filtros (§2510); defs prefixados por uid; determinístico.
// @version 1.0.0  @created 2026-08-21
import { alfa, tintaPremium } from '../../cores';
import type { Paleta } from '../../cores';

/** Luz de estúdio no corpo 240×400: key alto-esquerda, oclusão nas
 *  laterais, core shadow no torso e meia-luz nas pernas. */
export function corpoPremium(p: Paleta, uid: string): string {
  const t = tintaPremium(p.roupa.base);
  const u = `${uid}pxcv2`;
  return `
    <defs>
      <linearGradient id="${u}l" x1="0" y1="0" x2="1" y2="0.25">
        <stop offset="0" stop-color="${alfa(t.brilho, 0.22)}"/>
        <stop offset="0.45" stop-color="${alfa(t.brilho, 0)}"/>
      </linearGradient>
      <linearGradient id="${u}s" x1="1" y1="0" x2="0" y2="0.2">
        <stop offset="0" stop-color="${alfa('#0b0e1a', 0.26)}"/>
        <stop offset="0.5" stop-color="${alfa('#0b0e1a', 0)}"/>
      </linearGradient>
    </defs>
    <path d="M86 108 c 10 -8 58 -8 68 0 c 8 6 12 26 12 52 c 0 24 -4 44 -10 58 c -22 8 -50 8 -72 0 c -6 -14 -10 -34 -10 -58 c 0 -26 4 -46 12 -52 z" fill="url(#${u}l)"/>
    <path d="M86 108 c 10 -8 58 -8 68 0 c 8 6 12 26 12 52 c 0 24 -4 44 -10 58 c -22 8 -50 8 -72 0 c -6 -14 -10 -34 -10 -58 c 0 -26 4 -46 12 -52 z" fill="url(#${u}s)"/>
    <path d="M120 118 c 2 34 2 66 0 96" stroke="${alfa(t.profundo, 0.14)}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M91 216 h26 l-1 40 q -12 4 -24 0 z" fill="${alfa(t.brilho, 0.08)}"/>
    <path d="M123 216 h26 l-1 40 q -12 4 -24 0 z" fill="${alfa('#0b0e1a', 0.1)}"/>
    <path d="M96 330 q 12 -60 10 -112 M144 330 q -12 -60 -10 -112" stroke="${alfa('#0b0e1a', 0.12)}" stroke-width="3" fill="none"/>`;
}
