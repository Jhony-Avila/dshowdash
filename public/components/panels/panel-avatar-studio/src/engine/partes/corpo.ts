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
import type { AvatarConfig } from '../../domain/types';

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
  //          ombro peito cint quad coxa braço antebraço  (half-widths; V2 slimmer)
  slim:     { ombro: 44, peito: 37, cintura: 25, quadril: 30, coxa: 13, braco: 11, anta: 8 },
  standard: { ombro: 50, peito: 43, cintura: 29, quadril: 34, coxa: 15, braco: 13, anta: 9 },
  athletic: { ombro: 56, peito: 48, cintura: 31, quadril: 36, coxa: 17, braco: 15, anta: 10 },
  robust:   { ombro: 57, peito: 53, cintura: 42, quadril: 45, coxa: 21, braco: 17, anta: 12 },
  feminino: { ombro: 42, peito: 36, cintura: 24, quadril: 39, coxa: 16, braco: 10, anta: 7 },
};

// Golden V2 (#219): ANATOMIA COMPARTILHADA — âncoras (x meia-largura por
// altura + y) que o corpo E as roupas premium (renderCorpoV2) usam, para a
// peça SEMPRE vestir a silhueta certa (evita "roupa larga demais" nos perfis
// slim/feminino). Fonte única de verdade da proporção premium.
export interface AnatomiaCorpo {
  cx: number; ombro: number; peito: number; cintura: number; quadril: number;
  braco: number; anta: number;                 // meias-larguras do braço/antebraço
  armSh: number; armEl: number; armWr: number;  // meia-largura do EIXO do braço por altura
  yNuc: number; yOmb: number; yPei: number; yCin: number; yQua: number; yEnt: number;
  yCot: number; yPun: number; yJoe: number; yTor: number; yPe: number;
}
export function anatomiaCorpo(perfil: PerfilCorpo2D = 'standard'): AnatomiaCorpo {
  const D = DIMS_CORPO[perfil] ?? DIMS_CORPO.standard;
  return {
    cx: 120, ombro: D.ombro, peito: D.peito, cintura: D.cintura, quadril: D.quadril,
    braco: D.braco, anta: D.anta,
    armSh: D.ombro - 3, armEl: D.cintura + 8, armWr: D.quadril + 3,
    yNuc: 104, yOmb: 122, yPei: 150, yCin: 192, yQua: 220, yEnt: 236,
    yCot: 200, yPun: 250, yJoe: 298, yTor: 356, yPe: 372,
  };
}

// Golden V2 (#219): mapeia o AvatarConfig → PerfilCorpo2D do scaffold premium.
// corpoV2.preset vence; depois corpo (TipoCorporal legado); 'feminino' quando
// a base é 'coracao' (rosto/silhueta mais suaves). Default 'standard'.
export function perfilCorpoDe(config: AvatarConfig): PerfilCorpo2D {
  const preset = config.corpoV2?.preset ?? config.corpo;
  const porTipo: Record<string, PerfilCorpo2D> = {
    esbelto: 'slim', atletico: 'athletic', robusto: 'robust', compacto: 'standard',
  };
  if (preset && porTipo[preset]) return porTipo[preset];
  if (/coracao|suave|oval/.test(config.base ?? '') && /longo|rabo|coque|franja|ondulado|cacheado/.test(config.camadas?.cabelo ?? '')) {
    return 'feminino';
  }
  return 'standard';
}

// ── Golden V2 (#219 §9–§16): PREMIUM BODY = FIGURA VESTIDA estilizada
// (não "top+short" nu — a arte anterior deixava pernas de pele à mostra sob a
// roupa de torso). Contrato de camadas do render: corpoInteiroPremium desenha
// a base VESTIDA (calça neutra + sapato + top neutro) e PELE só onde aparece
// (pescoço, braços, mãos); a peça de torso (renderCorpoV2) pinta POR CIMA do
// top e das mangas. FORMA lê no SILHOUETTE/FLAT sem depender dos overlays.
// Neutros derivados da paleta p/ coesão, mas independentes da cor da roupa
// (calça charcoal) — evita "pernas roxas" quando a camiseta é roxa.
export function corpoInteiroPremium(p: Paleta, uid: string, perfil: PerfilCorpo2D = 'standard'): string {
  const d = uid + 'cpx';
  const D = DIMS_CORPO[perfil] ?? DIMS_CORPO.standard;
  const cx = 120;
  const pele = p.pele;
  const fem = perfil === 'feminino';
  // neutros da FIGURA VESTIDA (independentes da cor da peça de torso)
  const CAL = { claro: '#3d4453', base: '#333a47', escuro: '#272d38', prof: '#1e232c' }; // calça charcoal
  const SAP = { base: '#20242e', sola: '#111318', luz: '#3a4150' };                        // sapato
  const TOP = { claro: '#5a6474', base: '#4b5464', escuro: '#3a4250' };                     // top neutro (coberto)

  // âncoras verticais (240×396): cabeça acima ~y14–104
  const yNuc = 104, yOmb = 122, yPei = 150, yCin = 192, yQua = 220, yEnt = 236;
  const yJoe = 298, yTor = 356, yPe = 372;

  // ══ TORSO (top neutro): pescoço→ombro→tórax→cintura→quadril
  const torso = `M${cx - 12} ${yNuc}
    C ${cx - 15} ${yOmb - 4} ${cx - 24} ${yOmb - 2} ${cx - D.ombro} ${yOmb + 4}
    C ${cx - D.ombro - 2} ${yOmb + 8} ${cx - D.peito - 2} ${yPei - 8} ${cx - D.peito} ${yPei}
    C ${cx - D.peito + 1} ${yPei + 18} ${cx - D.cintura - 2} ${yCin - 10} ${cx - D.cintura} ${yCin}
    C ${cx - D.cintura + 1} ${yCin + 12} ${cx - D.quadril} ${yQua - 12} ${cx - D.quadril} ${yQua}
    C ${cx - D.quadril} ${yQua + 6} ${cx - D.quadril + 4} ${yEnt - 2} ${cx - D.quadril + 8} ${yEnt}
    L ${cx + D.quadril - 8} ${yEnt}
    C ${cx + D.quadril - 4} ${yEnt - 2} ${cx + D.quadril} ${yQua + 6} ${cx + D.quadril} ${yQua}
    C ${cx + D.quadril} ${yQua - 12} ${cx + D.cintura - 1} ${yCin + 12} ${cx + D.cintura} ${yCin}
    C ${cx + D.cintura + 2} ${yCin - 10} ${cx + D.peito - 1} ${yPei + 18} ${cx + D.peito} ${yPei}
    C ${cx + D.peito + 2} ${yPei - 8} ${cx + D.ombro + 2} ${yOmb + 8} ${cx + D.ombro} ${yOmb + 4}
    C ${cx + 24} ${yOmb - 2} ${cx + 15} ${yOmb - 4} ${cx + 12} ${yNuc} Z`;

  // ══ BRAÇO em pele: deltóide→bíceps(taper)→cotovelo→antebraço→punho→MÃO.
  //    Pende junto ao corpo (silhueta limpa). A manga da peça pinta por cima.
  const braco = (s: 1 | -1, anim: string): string => {
    const b = D.braco, a = D.anta;
    const sx = cx + s * (D.ombro - 3);   // raiz ombro
    const yCot = 200, yPun = 250;
    const ex = cx + s * (D.cintura + 8); // cotovelo p/ fora → abre vão na silhueta
    const wx = cx + s * (D.quadril + 3); // punho junto ao quadril, mas com folga
    const hy = yPun + 22;                 // fim da mão
    return `<g data-anim="${anim}" style="transform-box: view-box; transform-origin: ${sx}px ${yOmb + 4}px">
      <path d="M${sx - s * 6} ${yOmb - 2}
        C ${sx + s * (b + 5)} ${yOmb + 6} ${sx + s * (b + 4)} ${yOmb + 26} ${ex + s * (b - 3)} ${yCot}
        C ${ex + s * (a + 1)} ${yCot + 16} ${wx + s * (a + 1)} ${yPun - 18} ${wx + s * a} ${yPun}
        C ${wx + s * (a + 2)} ${yPun + 8} ${wx + s * (a + 2)} ${yPun + 16} ${wx + s * (a - 1)} ${hy}
        C ${wx + s} ${hy + 5} ${wx - s * (a - 1)} ${hy + 5} ${wx - s * a} ${hy}
        C ${wx - s * (a + 1)} ${yPun + 14} ${wx - s * (a + 1)} ${yPun} ${wx - s * a} ${yPun}
        C ${wx - s * (a + 1)} ${yPun - 18} ${ex - s * (a - 1)} ${yCot + 16} ${ex - s * (b - 7)} ${yCot}
        C ${ex - s * (b - 5)} ${yCot - 22} ${sx - s * 2} ${yOmb + 18} ${sx - s * 8} ${yOmb + 6} Z" fill="url(#${d}sk)"/>
      <!-- polegar --><path d="M${wx - s * a} ${yPun + 6} c ${-s * 5} 1 ${-s * 5} 9 ${-s * 1} 11" fill="url(#${d}sk)"/>
      <!-- dedos (sulcos) --><path d="M${wx - s * 2} ${yPun + 10} l ${s * 6} 0 M${wx - s * 2} ${hy - 3} l ${s * 6} 0" stroke="${alfa(pele.escuro, 0.35)}" stroke-width="0.9" stroke-linecap="round"/>
      <!-- cotovelo --><path d="M${ex - s * (b - 9)} ${yCot - 3} q ${s * 5} 5 ${s * 1} 13" fill="none" stroke="${alfa(pele.escuro, 0.28)}" stroke-width="1.3"/>
      </g>`;
  };

  // ══ PERNA CALÇADA (charcoal): quadril→coxa→joelho→panturrilha→tornozelo + SAPATO
  const perna = (s: 1 | -1): string => {
    const hx = cx + s * (D.quadril * 0.5);
    const co = D.coxa, pa = Math.max(8, D.coxa - 4); // coxa / panturrilha
    const ax = hx - s * 1;                                // eixo tornozelo
    return `<path d="M${hx - s * co} ${yEnt - 6}
      C ${hx - s * (co + 1)} ${yQua + 44} ${hx - s * (co - 1)} ${yJoe - 30} ${ax - s * pa} ${yJoe}
      C ${ax - s * (pa + 1)} ${yJoe + 22} ${ax - s * (pa - 1)} ${yTor - 30} ${ax - s * (pa - 3)} ${yTor - 4}
      L ${ax + s * (pa - 4)} ${yTor - 4}
      C ${ax + s * (pa - 2)} ${yTor - 30} ${ax + s * 4} ${yJoe + 20} ${ax + s * 3} ${yJoe}
      C ${ax + s * 5} ${yJoe - 30} ${hx + s * 3} ${yQua + 44} ${hx + s * 2} ${yEnt - 6} Z" fill="url(#${d}cal)"/>
      <!-- vinco/prega da calça --><path d="M${ax - s * (pa - 5)} ${yJoe + 6} C ${ax - s * (pa - 6)} ${yTor - 40} ${ax - s * (pa - 6)} ${yTor - 20} ${ax - s * (pa - 5)} ${yTor - 8}" fill="none" stroke="${alfa('#000000', 0.18)}" stroke-width="1.4"/>
      <!-- vinco do joelho --><path d="M${ax - s * (pa - 2)} ${yJoe - 2} q ${-s * 5} 6 ${-s * 1} 12" fill="none" stroke="${alfa('#000000', 0.2)}" stroke-width="1.2"/>
      <!-- SAPATO (bico p/ fora) -->
      <path d="M${ax - s * (pa - 3)} ${yTor - 5}
        C ${ax - s * (pa - 1)} ${yPe - 2} ${ax - s * (pa + 1)} ${yPe + 4} ${ax - s * (pa + 12)} ${yPe + 5}
        C ${ax - s * (pa + 22)} ${yPe + 6} ${ax - s * (pa + 21)} ${yTor + 1} ${ax - s * (pa + 8)} ${yTor - 3}
        C ${ax - s * (pa - 2)} ${yTor - 6} ${ax + s * (pa - 4)} ${yTor - 7} ${ax + s * (pa - 4)} ${yTor - 5} Z" fill="${SAP.base}"/>
      <path d="M${ax - s * (pa + 12)} ${yPe + 5} C ${ax - s * (pa + 20)} ${yPe + 6} ${ax - s * (pa + 21)} ${yPe + 8} ${ax - s * (pa + 8)} ${yPe + 8} L ${ax + s * (pa - 4)} ${yPe + 7} l 0 ${-s * 0 - 2} Z" fill="${SAP.sola}"/>
      <path d="M${ax - s * (pa - 2)} ${yTor} q ${-s * 6} 4 ${-s * 12} 4" fill="none" stroke="${alfa(SAP.luz, 0.7)}" stroke-width="1.3" stroke-linecap="round"/>`;
  };

  return `
    <defs>
      <linearGradient id="${d}sk" x1="0.28" y1="0.05" x2="0.72" y2="0.95">
        <stop offset="0" stop-color="${pele.claro}"/><stop offset="0.55" stop-color="${pele.base}"/><stop offset="1" stop-color="${pele.escuro}"/>
      </linearGradient>
      <linearGradient id="${d}cal" x1="0.3" y1="0" x2="0.7" y2="1">
        <stop offset="0" stop-color="${CAL.base}"/><stop offset="0.6" stop-color="${CAL.escuro}"/><stop offset="1" stop-color="${CAL.prof}"/>
      </linearGradient>
      <linearGradient id="${d}top" x1="0.28" y1="0" x2="0.66" y2="1">
        <stop offset="0" stop-color="${TOP.claro}"/><stop offset="0.5" stop-color="${TOP.base}"/><stop offset="1" stop-color="${TOP.escuro}"/>
      </linearGradient>
    </defs>
    <ellipse cx="${cx}" cy="${yPe + 8}" rx="48" ry="8" fill="${alfa('#000000', 0.28)}"/>
    <!-- PESCOÇO (pele) atrás do top -->
    <path d="M${cx - 12} ${yNuc - 16} q ${12} 8 ${24} 0 l 1 14 q ${-13} 8 ${-26} 0 Z" fill="url(#${d}sk)"/>
    <path d="M${cx - 12} ${yNuc - 3} q 12 7 24 0 l 0 4 q -12 7 -24 0 Z" fill="${alfa('#000000', 0.22)}"/>
    ${perna(-1)}${perna(1)}
    <!-- cós/cintura da calça sob o top -->
    <path d="M${cx - D.quadril + 4} ${yQua - 2} C ${cx - 12} ${yEnt - 2} ${cx + 12} ${yEnt - 2} ${cx + D.quadril - 4} ${yQua - 2} L ${cx + D.quadril - 8} ${yEnt + 4} C ${cx + 8} ${yEnt + 10} ${cx - 8} ${yEnt + 10} ${cx - D.quadril + 8} ${yEnt + 4} Z" fill="url(#${d}cal)"/>
    ${braco(-1, 'braco-dir')}${braco(1, 'braco-esq')}
    <!-- TORSO (top neutro) por cima das raízes dos braços -->
    <path d="${torso}" fill="url(#${d}top)"/>
    <!-- mangas curtas do top (cobrem o ombro nu) -->
    <path d="M${cx - D.ombro + 2} ${yOmb + 2} C ${cx - D.ombro - 4} ${yOmb + 12} ${cx - D.ombro - 3} ${yOmb + 24} ${cx - D.peito + 2} ${yOmb + 30} C ${cx - D.peito - 2} ${yOmb + 16} ${cx - D.ombro - 2} ${yOmb + 6} ${cx - D.ombro + 6} ${yOmb - 2} Z" fill="url(#${d}top)"/>
    <path d="M${cx + D.ombro - 2} ${yOmb + 2} C ${cx + D.ombro + 4} ${yOmb + 12} ${cx + D.ombro + 3} ${yOmb + 24} ${cx + D.peito - 2} ${yOmb + 30} C ${cx + D.peito + 2} ${yOmb + 16} ${cx + D.ombro + 2} ${yOmb + 6} ${cx + D.ombro - 6} ${yOmb - 2} Z" fill="url(#${d}top)"/>
    <!-- VOLUME do top (a forma já lê sem estes overlays) -->
    <path d="M${cx - D.ombro + 6} ${yOmb + 2} C ${cx - 20} ${yOmb - 6} ${cx + 20} ${yOmb - 6} ${cx + D.ombro - 6} ${yOmb + 2}" fill="none" stroke="${alfa('#ffffff', 0.14)}" stroke-width="3" stroke-linecap="round"/>
    <path d="M${cx - D.peito + 6} ${yPei + 2} C ${cx - 10} ${yPei + 14} ${cx + 10} ${yPei + 14} ${cx + D.peito - 6} ${yPei + 2}" fill="none" stroke="${alfa('#000000', 0.14)}" stroke-width="2"/>
    ${fem
      ? `<path d="M${cx - 15} ${yPei - 2} q 8 12 0 20 M${cx + 15} ${yPei - 2} q -8 12 0 20" fill="none" stroke="${alfa('#000000', 0.12)}" stroke-width="1.6"/>`
      : `<path d="M${cx} ${yPei + 4} v ${yCin - yPei - 6}" stroke="${alfa('#000000', 0.13)}" stroke-width="1.4"/>`}
    <path d="M${cx - D.cintura + 2} ${yCin} C ${cx - 8} ${yCin + 8} ${cx + 8} ${yCin + 8} ${cx + D.cintura - 2} ${yCin}" fill="none" stroke="${alfa('#000000', 0.12)}" stroke-width="1.6"/>`;
}

