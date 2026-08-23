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

// ── onda 1427/Golden (BRIEFING_COMPLEMENTAR_03 §9–§16; #219): PREMIUM BODY
// SCAFFOLD. Anatomia ESTILIZADA real (não tubos) — só quando opcoes.premium.
// Legacy segue corpoInteiro() acima, byte-idêntico. FORMA→VOLUME→MATERIAL:
// silhueta com clavícula/ombro, tórax, cintura, quadril, braço com taper+
// cotovelo+punho, mão com palma/polegar, coxa/joelho/panturrilha/tornozelo/pé.
// Luz key superior-esquerda (§21). Pele nos membros; base neutra fitness
// (top+short) p/ a roupa premium (renderCorpoV2) sobrepor.
export type PerfilCorpo2D = 'slim' | 'standard' | 'athletic' | 'robust' | 'feminino';
interface DimsCorpo { ombro: number; peito: number; cintura: number; quadril: number; coxa: number; braco: number; anta: number; }
const DIMS_CORPO: Record<PerfilCorpo2D, DimsCorpo> = {
  //          ombro peito cint quad coxa braço antebraço
  slim:     { ombro: 46, peito: 40, cintura: 28, quadril: 34, coxa: 17, braco: 12, anta: 9 },
  standard: { ombro: 52, peito: 45, cintura: 32, quadril: 39, coxa: 20, braco: 14, anta: 10 },
  athletic: { ombro: 58, peito: 50, cintura: 33, quadril: 41, coxa: 23, braco: 16, anta: 12 },
  robust:   { ombro: 57, peito: 54, cintura: 45, quadril: 50, coxa: 27, braco: 18, anta: 13 },
  feminino: { ombro: 44, peito: 38, cintura: 27, quadril: 44, coxa: 21, braco: 11, anta: 8 },
};

// §9–§16: PREMIUM BODY (só opcoes.premium). Membros em pele; short base neutro.
// Cada segmento é um path anatômico (deltóide, taper, cotovelo, punho, mão com
// polegar; coxa, joelho, panturrilha, tornozelo, pé com direção). A luz é
// aplicada por overlays SUAVES — a FORMA precisa ler no FLAT/SILHOUETTE sem eles.
export function corpoInteiroPremium(p: Paleta, uid: string, perfil: PerfilCorpo2D = 'standard'): string {
  const d = uid + 'cpx';
  const D = DIMS_CORPO[perfil] ?? DIMS_CORPO.standard;
  const cx = 120;
  const pele = p.pele;
  const wear = p.roupa; // short base + pés (neutro)
  // âncoras verticais
  const yOmb = 126, yPei = 156, yCin = 198, yQua = 224;
  const yJoe = 300, yTor = 356, yPe = 372;

  // ── TORSO: pescoço→trapézio→ombro→tórax→cintura→quadril (V ou ampulheta)
  const torso = `M${cx - 11} 108
    C ${cx - 13} 116 ${cx - 20} 120 ${cx - D.ombro + 4} ${yOmb}
    C ${cx - D.ombro} ${yOmb + 3} ${cx - D.ombro + 2} ${yOmb + 12} ${cx - D.peito} ${yPei}
    C ${cx - D.cintura - 3} ${yPei + 20} ${cx - D.cintura} ${yCin - 8} ${cx - D.cintura} ${yCin}
    C ${cx - D.cintura} ${yCin + 10} ${cx - D.quadril + 2} ${yQua - 10} ${cx - D.quadril} ${yQua}
    C ${cx - D.quadril} ${yQua + 8} ${cx - D.quadril + 6} ${yQua + 12} ${cx - D.quadril + 10} ${yQua + 14}
    L ${cx + D.quadril - 10} ${yQua + 14}
    C ${cx + D.quadril - 6} ${yQua + 12} ${cx + D.quadril} ${yQua + 8} ${cx + D.quadril} ${yQua}
    C ${cx + D.quadril - 2} ${yQua - 10} ${cx + D.cintura} ${yCin + 10} ${cx + D.cintura} ${yCin}
    C ${cx + D.cintura} ${yCin - 8} ${cx + D.cintura + 3} ${yPei + 20} ${cx + D.peito} ${yPei}
    C ${cx + D.ombro - 2} ${yOmb + 12} ${cx + D.ombro} ${yOmb + 3} ${cx + D.ombro - 4} ${yOmb}
    C ${cx + 20} 120 ${cx + 13} 116 ${cx + 11} 108 Z`;

  // ── BRAÇO: deltóide → braço (taper) → cotovelo → antebraço → punho → mão.
  //   pende com leve abertura; separado do torso (gap lê na silhueta). s: lado.
  const braco = (s: 1 | -1, anim: string): string => {
    const sx = cx + s * (D.ombro - 6);      // raiz no ombro
    const b = D.braco, a = D.anta;
    const yCot = 196, yPun = 250;
    const ex = cx + s * (D.cintura + 6);     // cotovelo (levemente p/ fora da cintura)
    const wx = cx + s * (D.quadril - 2);     // punho ~ na altura do quadril
    return `<g data-anim="${anim}" style="transform-box: view-box; transform-origin: ${sx}px ${yOmb}px">
      <path d="M${sx - s * 4} ${yOmb - 2}
        C ${sx + s * (b + 4)} ${yOmb + 4} ${sx + s * (b + 6)} ${yOmb + 22} ${ex + s * (b - 2)} ${yCot}
        C ${ex + s * (a + 2)} ${yCot + 14} ${wx + s * (a + 1)} ${yPun - 16} ${wx + s * a} ${yPun}
        C ${wx + s * a} ${yPun + 4} ${wx - s * a} ${yPun + 4} ${wx - s * a} ${yPun}
        C ${wx - s * (a + 1)} ${yPun - 16} ${ex - s * (a - 1)} ${yCot + 16} ${ex - s * (b - 6)} ${yCot}
        C ${ex - s * (b - 4)} ${yCot - 20} ${sx - s * 2} ${yOmb + 16} ${sx - s * 6} ${yOmb + 6} Z" fill="url(#${d}sk)"/>
      <!-- cotovelo (dobra suave) --><path d="M${ex - s * (b - 8)} ${yCot - 2} q ${s * 6} 4 ${s * 2} 12" fill="none" stroke="${alfa(pele.escuro, 0.3)}" stroke-width="1.4"/>
      <!-- MÃO: palma + polegar + direção -->
      <path d="M${wx - s * a} ${yPun}
        C ${wx - s * (a + 3)} ${yPun + 10} ${wx - s * (a - 2)} ${yPun + 22} ${wx + s * 2} ${yPun + 22}
        C ${wx + s * (a + 4)} ${yPun + 22} ${wx + s * (a + 4)} ${yPun + 8} ${wx + s * a} ${yPun} Z" fill="${pele.base}"/>
      <path d="M${wx + s * (a + 1)} ${yPun + 4} c ${s * 5} 0 ${s * 6} 6 ${s * 1} 9" fill="none" stroke="${pele.base}" stroke-width="4" stroke-linecap="round"/>
      <path d="M${wx - s * 1} ${yPun + 10} q ${s * 3} 5 0 10" fill="none" stroke="${alfa(pele.escuro, 0.3)}" stroke-width="1"/>`
      + `</g>`;
  };

  // ── PERNA: quadril → coxa → joelho (estreita) → panturrilha → tornozelo → pé
  const perna = (s: 1 | -1): string => {
    const hx = cx + s * (D.quadril * 0.5);   // centro da coxa
    const c = D.coxa;
    return `<path d="M${hx - s * c} ${yQua + 8}
      C ${hx - s * (c + 1)} ${yQua + 40} ${hx - s * (c - 2)} ${yJoe - 34} ${hx - s * (c - 7)} ${yJoe}
      C ${hx - s * (c - 3)} ${yJoe + 18} ${hx - s * (c - 2)} ${yTor - 34} ${hx - s * (c - 8)} ${yTor - 6}
      C ${hx - s * (c - 9)} ${yTor - 2} ${hx - s * (c - 6)} ${yTor} ${hx - s * (c - 8)} ${yTor + 2}
      L ${hx + s * 3} ${yTor + 2}
      C ${hx + s * 5} ${yTor - 6} ${hx + s * 4} ${yJoe + 16} ${hx + s * 2} ${yJoe}
      C ${hx + s * 5} ${yJoe - 34} ${hx + s * 3} ${yQua + 44} ${hx + s * 2} ${yQua + 8} Z" fill="url(#${d}sk)"/>
      <!-- joelho --><path d="M${hx - s * (c - 7)} ${yJoe - 4} q ${-s * 5} 5 ${-s * 1} 11" fill="none" stroke="${alfa(pele.escuro, 0.3)}" stroke-width="1.3"/>
      <!-- PÉ (com direção do dedo) -->
      <path d="M${hx - s * (c - 8)} ${yTor}
        C ${hx - s * (c - 6)} ${yPe} ${hx - s * (c - 2)} ${yPe + 2} ${hx - s * (c - 20)} ${yPe + 4}
        C ${hx - s * (c - 30)} ${yPe + 4} ${hx - s * (c - 30)} ${yTor + 4} ${hx - s * (c - 22)} ${yTor + 2}
        C ${hx - s * (c - 14)} ${yTor} ${hx - s * (c - 10)} ${yTor} ${hx + s * 2} ${yTor + 1} Z" fill="${wear.escuro}"/>`;
  };

  return `
    <defs>
      <linearGradient id="${d}sk" x1="0.28" y1="0.05" x2="0.72" y2="0.95">
        <stop offset="0" stop-color="${pele.claro}"/><stop offset="0.55" stop-color="${pele.base}"/><stop offset="1" stop-color="${pele.escuro}"/>
      </linearGradient>
      <linearGradient id="${d}w" x1="0.3" y1="0" x2="0.7" y2="1">
        <stop offset="0" stop-color="${wear.base}"/><stop offset="1" stop-color="${wear.profundo}"/>
      </linearGradient>
    </defs>
    <ellipse cx="120" cy="${yPe + 8}" rx="50" ry="8" fill="${alfa('#000000', 0.26)}"/>
    ${perna(-1)}${perna(1)}
    ${braco(-1, 'braco-dir')}${braco(1, 'braco-esq')}
    <path d="${torso}" fill="url(#${d}sk)"/>
    <!-- short base (quadril → coxa alta), neutro -->
    <path d="M${cx - D.quadril + 4} ${yQua - 4} C ${cx - 16} ${yQua + 2} ${cx + 16} ${yQua + 2} ${cx + D.quadril - 4} ${yQua - 4} L ${cx + D.quadril - 8} ${yQua + 22} C ${cx + 10} ${yQua + 30} ${cx - 10} ${yQua + 30} ${cx - D.quadril + 8} ${yQua + 22} Z" fill="url(#${d}w)"/>
    <path d="M${cx} ${yQua + 2} v 24" stroke="${alfa('#000000', 0.22)}" stroke-width="2"/>
    <!-- VOLUME (overlays suaves; a forma já lê sem eles) -->
    <path d="M${cx - D.peito + 8} ${yPei - 6} C ${cx - 14} ${yPei + 4} ${cx + 14} ${yPei + 4} ${cx + D.peito - 8} ${yPei - 6}" fill="none" stroke="${alfa(pele.escuro, 0.28)}" stroke-width="2" stroke-linecap="round"/>
    <path d="M${cx} ${yPei + 4} v ${yCin - yPei - 4}" stroke="${alfa(pele.escuro, 0.22)}" stroke-width="1.5"/>
    <path d="M${cx - D.ombro + 10} ${yOmb + 4} C ${cx - 18} ${yOmb - 3} ${cx + 4} ${yOmb - 3} ${cx + 10} ${yOmb + 2}" fill="none" stroke="${alfa('#ffffff', 0.16)}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M${cx - 11} 110 C ${cx - 6} 118 ${cx + 6} 118 ${cx + 11} 110" fill="none" stroke="${alfa(pele.escuro, 0.25)}" stroke-width="1.6"/>`;
}

