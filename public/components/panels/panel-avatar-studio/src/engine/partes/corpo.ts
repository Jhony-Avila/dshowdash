// engine/partes/corpo.ts — corpo inteiro do personagem (AS3 F2a).
// @version 1.0.0  @created 2026-07-29
//
// Usado SOMENTE no enquadramento 'corpo' do palco (o header/publicação segue
// no busto). Canvas 240×400: a cabeça do busto é reaproveitada em escala 0.62
// no topo; este módulo desenha o resto — torso, BRAÇOS (grupos animáveis
// data-anim="braco-esq/braco-dir" p/ as performances), pernas e sapatos.
// Roupa/pele vêm da paleta — o visual acompanha as cores escolhidas.
import { alfa } from '../cores';
import type { Paleta } from '../cores';

/** Geometria do corpo (viewBox 0 0 240 400). Cabeça ocupa y≈14–100. */
export const CORPO = {
  viewBox: '0 0 240 400',
  ombroY: 116,
  ombroEsqX: 86,
  ombroDirX: 154,
  cinturaY: 218,
  chaoY: 384,
} as const;

/**
 * Corpo genérico vestido (roupa da paleta + detalhes em destaque).
 * Ordem: pernas → sapatos → torso → braços (por cima do torso).
 */
export function corpoInteiro(p: Paleta, uid: string): string {
  const d = uid + 'cp';
  return `
    <defs>
      <linearGradient id="${d}t" x1="0.2" y1="0" x2="0.6" y2="1">
        <stop offset="0" stop-color="${p.roupa.claro}"/>
        <stop offset="0.45" stop-color="${p.roupa.base}"/>
        <stop offset="1" stop-color="${p.roupa.profundo}"/>
      </linearGradient>
      <linearGradient id="${d}c" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${p.roupa.escuro}"/>
        <stop offset="1" stop-color="${p.roupa.profundo}"/>
      </linearGradient>
      <linearGradient id="${d}b" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${p.roupa.claro}"/>
        <stop offset="1" stop-color="${p.roupa.escuro}"/>
      </linearGradient>
    </defs>

    <!-- sombra de contato no chão -->
    <ellipse cx="120" cy="${CORPO.chaoY + 4}" rx="58" ry="9" fill="${alfa('#000000', 0.3)}"/>

    <!-- quadril + pernas (calça) -->
    <path d="M90 206 h60 v16 h-60 z" fill="url(#${d}c)"/>
    <path d="M91 216 h26 l-3 114 c0 8 -20 8 -20 0 z" fill="url(#${d}c)"/>
    <path d="M123 216 h26 l-3 114 c0 8 -20 8 -20 0 z" fill="url(#${d}c)"/>
    <path d="M90 210 q 30 12 60 0 l 0 10 q -30 10 -60 0 z" fill="${alfa('#000000', 0.18)}"/>

    <!-- sapatos -->
    <path d="M90 328 h28 v32 c0 6 -4 10 -10 10 h-24 c-8 0 -10 -10 -2 -14 l 8 -5 z" fill="#1a1e2a"/>
    <path d="M122 328 h28 l 0 23 l 8 5 c 8 4 6 14 -2 14 h-24 c-6 0 -10 -4 -10 -10 z" fill="#1a1e2a"/>
    <path d="M82 366 h34 m 40 0 h34" stroke="${p.destaque.base}" stroke-width="3" stroke-linecap="round"/>

    <!-- torso -->
    <path d="M86 108 c 10 -8 58 -8 68 0 c 8 6 12 26 12 52 c 0 24 -4 44 -10 58 c -22 8 -50 8 -72 0 c -6 -14 -10 -34 -10 -58 c 0 -26 4 -46 12 -52 z" fill="url(#${d}t)"/>
    <path d="M120 112 v 106" stroke="${alfa('#000000', 0.14)}" stroke-width="2"/>
    <path d="M96 122 c 14 8 34 8 48 0" stroke="${alfa('#ffffff', 0.14)}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="120" cy="150" r="7" fill="${alfa(p.destaque.base, 0.85)}"/>
    <circle cx="120" cy="150" r="10" fill="none" stroke="${alfa(p.destaque.base, 0.4)}" stroke-width="2"/>

    <!-- braço esquerdo (dele) — gira no ombro p/ performances; LUVAS no tom
         da roupa (coerente p/ humanos E espécies — panda não tem mão de pele) -->
    <g data-anim="braco-dir" style="transform-box: view-box; transform-origin: ${CORPO.ombroEsqX}px ${CORPO.ombroY}px">
      <path d="M${CORPO.ombroEsqX} ${CORPO.ombroY - 8} c -14 4 -20 22 -20 42 c 0 20 4 38 10 50 l 14 -4 c -4 -12 -7 -28 -7 -46 c 0 -16 2 -30 3 -42 z" fill="url(#${d}b)"/>
      <circle cx="72" cy="206" r="10" fill="${p.roupa.profundo}"/>
      <circle cx="72" cy="206" r="10" fill="none" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="1.6"/>
      <circle cx="70" cy="203" r="3.4" fill="${alfa('#ffffff', 0.22)}"/>
    </g>

    <!-- braço direito (dele) -->
    <g data-anim="braco-esq" style="transform-box: view-box; transform-origin: ${CORPO.ombroDirX}px ${CORPO.ombroY}px">
      <path d="M${CORPO.ombroDirX} ${CORPO.ombroY - 8} c 14 4 20 22 20 42 c 0 20 -4 38 -10 50 l -14 -4 c 4 -12 7 -28 7 -46 c 0 -16 -2 -30 -3 -42 z" fill="url(#${d}b)"/>
      <circle cx="168" cy="206" r="10" fill="${p.roupa.profundo}"/>
      <circle cx="168" cy="206" r="10" fill="none" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="1.6"/>
      <circle cx="166" cy="203" r="3.4" fill="${alfa('#ffffff', 0.22)}"/>
    </g>

    <!-- gola/base do pescoço (encaixe da cabeça do busto) -->
    <path d="M100 104 c 12 8 28 8 40 0 l 2 10 c -14 8 -30 8 -44 0 z" fill="${p.roupa.profundo}"/>`;
}
