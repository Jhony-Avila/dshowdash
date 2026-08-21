// engine/partes/premium/cabelos.ts — onda 1413 (MEGA_BRIEFING_01 §881–§897;
// decisões #159/#166): CABELOS PREMIUM — 10 `cab_px_*` em CAMADAS reais:
// massa traseira (renderAtras — atrás do pescoço/figura), sombra na testa,
// massa principal, franja, sombra interna, mechas de brilho, fios soltos e
// rim light. Hairline ancorada na geometria G (topo 49, cy 106, rx 50).
//
// Regras do trilho: zero filtros (§2510), defs por uid, tintaPremium por
// luminância (§2404 — LEGÍVEL em escuro, loiro e branco: sombras/realces
// escalam com a base). Canal secundário `destaque` DECLARADO nos estilos
// com mechas (coresCamada §73 recolore só a peça). Fit §897: PERFIL em
// engine/compat-cabelo.ts; o recorte por chapéu é do MOTOR (clipPath só
// em artes _px_ / opt-in params.cabelo.encaixe).
// @version 1.0.0  @created 2026-08-21
import { alfa, tintaPremium } from '../../cores';
import type { Paleta } from '../../cores';
import type { ParteDef, ParteRender } from '../../base-api';
import { HUMANOIDES } from '../cabelos';

type TP = ReturnType<typeof tintaPremium>;

function defsCab(u: string, t: TP): string {
  return `
    <linearGradient id="${u}pxc" x1="0.22" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${t.claro}"/>
      <stop offset="0.4" stop-color="${t.base}"/>
      <stop offset="0.78" stop-color="${t.meio}"/>
      <stop offset="1" stop-color="${t.escuro}"/>
    </linearGradient>
    <linearGradient id="${u}pxcat" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.meio}"/>
      <stop offset="1" stop-color="${t.profundo}"/>
    </linearGradient>`;
}

/** Sombra que o cabelo projeta na TESTA (§889) — desenhada sob a massa. */
const SOMBRA_TESTA = (t: TP, d: string): string =>
  `<path d="${d}" fill="${alfa(t.profundo, 0.22)}"/>`;

/** Mechas de brilho (§890): strokes finos seguindo o fluxo da massa. */
function mechas(t: TP, paths: string[], intensidade = 0.5): string {
  return paths.map((d, i) => `<path d="${d}" stroke="${alfa(i % 2 ? t.claro : t.brilho, intensidade)}" stroke-width="${2.4 - (i % 3) * 0.5}" stroke-linecap="round" fill="none"/>`).join('');
}

/** Fios soltos (§891): 2–3 strokes de 1px fora da silhueta. */
function fios(t: TP, paths: string[]): string {
  return paths.map((d) => `<path d="${d}" stroke="${alfa(t.escuro, 0.6)}" stroke-width="1.1" stroke-linecap="round" fill="none"/>`).join('');
}

/** Rim light no topo (§892) — mesma âncora do BRILHO clássico. */
const RIM = (t: TP): string =>
  `<path d="M86 64 a 48 42 0 0 1 36 -13" stroke="${alfa('#ffffff', 0.34)}" stroke-width="3.6" stroke-linecap="round" fill="none"/>
   <path d="M128 52 a 44 40 0 0 1 20 10" stroke="${alfa(t.brilho, 0.5)}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`;

interface CamadasCabelo {
  massa: string;                    // path da massa principal (fill gradiente)
  franja?: string;                  // path da franja (fill meio)
  sombraInterna?: string;           // path de oclusão dentro da massa
  sombraTesta: string;              // path da sombra projetada na testa
  mechas: string[];
  fios?: string[];
  /** mechas coloridas pelo canal `destaque` (estilos que o declaram) */
  mechasDestaque?: string[];
}

function cabeloPremium(c: CamadasCabelo): ParteRender {
  return (p: Paleta, u: string) => {
    const t = tintaPremium(p.cabelo.base);
    return `
      <defs>${defsCab(u, t)}</defs>
      ${SOMBRA_TESTA(t, c.sombraTesta)}
      <path d="${c.massa}" fill="url(#${u}pxc)"/>
      ${c.franja ? `<path d="${c.franja}" fill="${t.meio}"/>` : ''}
      ${c.sombraInterna ? `<path d="${c.sombraInterna}" fill="${alfa(t.profundo, 0.4)}"/>` : ''}
      ${mechas(t, c.mechas)}
      ${c.mechasDestaque ? c.mechasDestaque.map((d) => `<path d="${d}" stroke="${alfa(p.destaque.claro, 0.6)}" stroke-width="2" stroke-linecap="round" fill="none"/>`).join('') : ''}
      ${c.fios ? fios(t, c.fios) : ''}
      ${RIM(t)}`;
  };
}

/** Massa traseira (renderAtras §884): pinta ATRÁS da figura no premium. */
function massaAtras(d: string, dSombra?: string): ParteRender {
  return (p: Paleta, u: string) => {
    const t = tintaPremium(p.cabelo.base);
    return `
      <defs><linearGradient id="${u}pxcatb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${t.meio}"/><stop offset="1" stop-color="${t.profundo}"/>
      </linearGradient></defs>
      <path d="${d}" fill="url(#${u}pxcatb)"/>
      ${dSombra ? `<path d="${dSombra}" fill="${alfa('#000000', 0.2)}"/>` : ''}`;
  };
}

const comum = { categoria: 'cabelo' as const, requerBase: HUMANOIDES, acabamento: 'premium' as const, raridade: 'raro' as const };

export const CABELOS_PREMIUM: ParteDef[] = [
  {
    ...comum, id: 'cab_px_curto', nome: 'Curto Premium', tema: 'executivo',
    descricao: 'Corte baixo texturizado com fluxo real de mechas.', usaCores: ['cabelo'],
    render: cabeloPremium({
      massa: 'M70 104 c -2 -38 22 -57 50 -57 s 52 19 50 57 c -1 -7 -4 -13 -8 -17 c 2 -22 -18 -32 -42 -32 s -44 10 -42 32 c -4 4 -7 10 -8 17 z',
      sombraTesta: 'M78 88 c 10 -8 26 -12 42 -12 s 32 4 42 12 c -2 4 -4 6 -8 7 c -9 -6 -21 -9 -34 -9 s -25 3 -34 9 c -4 -1 -6 -3 -8 -7 z',
      sombraInterna: 'M74 96 c 0 -10 4 -18 10 -24 c -4 8 -5 16 -4 24 z',
      mechas: ['M84 70 q 10 -9 22 -11', 'M112 56 q 12 -1 22 3', 'M142 64 q 8 5 12 12', 'M78 84 q 6 -8 14 -12'],
      fios: ['M70 92 q -3 -6 -1 -12', 'M170 92 q 3 -6 1 -12'],
    }),
 
  },
  {
    ...comum, id: 'cab_px_franja', nome: 'Franja Premium', tema: 'casual',
    descricao: 'Franja reta viva com sombra honesta na testa.', usaCores: ['cabelo'],
    render: cabeloPremium({
      massa: 'M68 110 c -4 -42 22 -63 52 -63 s 56 21 52 63 c -2 -8 -5 -14 -9 -18 c 1 -6 1 -12 0 -17 c -6 8 -16 12 -27 12 h -32 c -11 0 -21 -4 -27 -12 c -1 5 -1 11 0 17 c -4 4 -7 10 -9 18 z',
      franja: 'M88 66 c 8 -6 20 -9 32 -9 s 24 3 32 9 c 2 8 1 16 -3 22 c -3 -6 -6 -9 -10 -10 c 1 4 0 7 -2 9 c -5 -6 -11 -9 -17 -9 s -12 3 -17 9 c -2 -2 -3 -5 -2 -9 c -4 1 -7 4 -10 10 c -4 -6 -5 -14 -3 -22 z',
      sombraTesta: 'M86 88 c 10 -5 22 -8 34 -8 s 24 3 34 8 c -1 4 -3 6 -6 8 c -8 -4 -18 -6 -28 -6 s -20 2 -28 6 c -3 -2 -5 -4 -6 -8 z',
      mechas: ['M96 60 q 4 8 2 16', 'M120 57 q 0 9 0 17', 'M144 60 q -4 8 -2 16', 'M84 74 q 2 8 6 13'],
      fios: ['M67 100 q -2 -8 0 -14'],
    }),
 
  },
  {
    ...comum, id: 'cab_px_lateral', nome: 'Lateral Premium', tema: 'executivo',
    descricao: 'Repartido de lado com queda suave e brilho de pente.', usaCores: ['cabelo'],
    render: cabeloPremium({
      massa: 'M68 108 c -4 -40 20 -61 52 -61 c 34 0 56 23 52 61 c -2 -8 -5 -14 -9 -18 c 2 -16 -6 -28 -18 -33 c 8 10 10 20 6 28 c -10 -14 -28 -20 -46 -16 c -14 3 -24 13 -28 25 c -4 4 -7 8 -9 14 z',
      sombraTesta: 'M84 86 c 12 -7 28 -10 44 -8 c -14 1 -28 5 -38 12 c -3 -1 -5 -2 -6 -4 z',
      sombraInterna: 'M126 55 c 8 4 13 11 14 19 c -5 -8 -11 -14 -19 -17 z',
      mechas: ['M88 72 q 16 -12 36 -12', 'M100 62 q 18 -6 34 0', 'M140 66 q 8 6 11 14'],
      fios: ['M66 98 q -3 -7 -1 -13', 'M172 96 q 2 -6 0 -12'],
    }),
 
  },
  {
    ...comum, id: 'cab_px_undercut', nome: 'Undercut Premium', tema: 'urbano',
    descricao: 'Laterais raspadas em meia-sombra, topo com movimento.', usaCores: ['cabelo'],
    render: cabeloPremium({
      massa: 'M84 92 c -2 -28 12 -45 36 -45 s 38 17 36 45 c -3 -6 -6 -10 -10 -12 c 2 -16 -10 -24 -26 -24 s -28 8 -26 24 c -4 2 -7 6 -10 12 z',
      sombraTesta: 'M92 84 c 8 -5 18 -7 28 -7 s 20 2 28 7 c -2 3 -4 5 -7 6 c -6 -3 -13 -5 -21 -5 s -15 2 -21 5 c -3 -1 -5 -3 -7 -6 z',
      sombraInterna: 'M70 104 c 0 -12 4 -22 10 -30 c -2 10 -2 20 0 30 z M170 104 c 0 -12 -4 -22 -10 -30 c 2 10 2 20 0 30 z',
      mechas: ['M100 60 q 10 -7 22 -6', 'M128 55 q 8 3 12 9', 'M96 70 q 6 -6 14 -8'],
    }),
 
  },
  {
    ...comum, id: 'cab_px_longo_liso', nome: 'Longo Liso Premium', tema: 'clássico', raridade: 'epico',
    descricao: 'Cortina lisa com massa real caindo atrás dos ombros.', usaCores: ['cabelo', 'destaque'],
    render: cabeloPremium({
      massa: 'M66 132 c -6 -56 20 -80 54 -80 s 60 24 54 80 l -10 -6 c 2 -12 1 -24 -3 -33 c -7 9 -18 14 -31 14 h -20 c -13 0 -24 -5 -31 -14 c -4 9 -5 21 -3 33 z',
      sombraTesta: 'M88 90 c 10 -6 21 -9 32 -9 s 22 3 32 9 c -2 4 -4 6 -7 7 c -7 -4 -16 -6 -25 -6 s -18 2 -25 6 c -3 -1 -5 -3 -7 -7 z',
      mechas: ['M80 80 q -4 24 -6 44', 'M160 80 q 4 24 6 44', 'M96 62 q -4 10 -5 22'],
      mechasDestaque: ['M104 58 q -2 14 -2 28'],
      fios: ['M64 120 q -3 -10 -2 -18', 'M176 120 q 3 -10 2 -18'],
    }),
    renderAtras: massaAtras('M70 100 c -8 40 -8 74 -2 100 h 104 c 6 -26 6 -60 -2 -100 c -6 22 -8 48 -6 74 h -88 c 2 -26 0 -52 -6 -74 z', 'M78 172 h 84 c 0 3 0 6 -1 8 h -82 c -1 -2 -1 -5 -1 -8 z'),
 
  },
  {
    ...comum, id: 'cab_px_ondulado', nome: 'Ondulado Premium', tema: 'clássico', raridade: 'epico',
    descricao: 'Ondas em S com brilho alternado e queda viva.', usaCores: ['cabelo', 'destaque'],
    render: cabeloPremium({
      massa: 'M66 128 c -8 -52 18 -76 54 -76 s 62 24 54 76 c -4 -6 -8 -10 -12 -12 c 4 -10 3 -20 -2 -28 c -6 10 -17 15 -30 15 h -20 c -13 0 -24 -5 -30 -15 c -5 8 -6 18 -2 28 c -4 2 -8 6 -12 12 z',
      sombraTesta: 'M88 88 c 10 -6 21 -8 32 -8 s 22 2 32 8 c -2 4 -4 6 -7 7 c -7 -4 -16 -5 -25 -5 s -18 1 -25 5 c -3 -1 -5 -3 -7 -7 z',
      mechas: ['M82 76 q -8 12 -2 24 q 6 12 -2 22', 'M158 76 q 8 12 2 24 q -6 12 2 22', 'M98 60 q -6 8 -2 16'],
      mechasDestaque: ['M142 62 q 6 9 2 18'],
      fios: ['M63 116 q -4 -8 -2 -16', 'M177 116 q 4 -8 2 -16'],
    }),
    renderAtras: massaAtras('M72 98 c -12 36 -14 70 -4 102 c 6 -8 8 -18 6 -28 c 8 10 10 22 6 34 h 80 c -4 -12 -2 -24 6 -34 c -2 10 0 20 6 28 c 10 -32 8 -66 -4 -102 c -8 20 -10 44 -8 68 h -80 c 2 -24 0 -48 -8 -68 z'),
 
  },
  {
    ...comum, id: 'cab_px_rabo', nome: 'Rabo de Cavalo Premium', tema: 'gamer',
    descricao: 'Preso alto com rabo em movimento atrás da figura.', usaCores: ['cabelo'],
    render: cabeloPremium({
      massa: 'M70 102 c -2 -36 20 -55 50 -55 s 52 19 50 55 c -2 -7 -5 -12 -9 -15 c 2 -20 -16 -30 -41 -30 s -43 10 -41 30 c -4 3 -7 8 -9 15 z',
      sombraTesta: 'M84 86 c 10 -6 22 -9 36 -9 s 26 3 36 9 c -2 4 -4 6 -7 7 c -8 -4 -18 -7 -29 -7 s -21 3 -29 7 c -3 -1 -5 -3 -7 -7 z',
      mechas: ['M92 62 q 12 -9 28 -10', 'M130 54 q 10 3 16 10', 'M86 76 q 6 -9 16 -13'],
      fios: ['M120 44 q 2 -5 6 -7', 'M128 44 q 3 -4 7 -5'],
    }),
    renderAtras: massaAtras('M132 52 c 18 4 30 22 30 44 c 0 28 -10 54 -28 72 c 8 -24 12 -48 8 -70 c -3 12 -8 22 -16 30 c 8 -26 10 -52 -4 -70 c 4 -3 7 -5 10 -6 z'),
 
  },
  {
    ...comum, id: 'cab_px_coque', nome: 'Coque Premium', tema: 'executivo',
    descricao: 'Coque alto polido com base torcida e brilho sedoso.', usaCores: ['cabelo'],
    render: cabeloPremium({
      massa: 'M72 100 c -2 -32 18 -50 48 -50 s 50 18 48 50 c -2 -6 -5 -10 -9 -13 c 2 -18 -14 -27 -39 -27 s -41 9 -39 27 c -4 3 -7 7 -9 13 z M96 46 a 24 17 0 1 1 48 0 a 24 17 0 1 1 -48 0 z',
      sombraTesta: 'M86 84 c 10 -5 21 -8 34 -8 s 24 3 34 8 c -2 4 -4 6 -7 7 c -8 -4 -17 -6 -27 -6 s -19 2 -27 6 c -3 -1 -5 -3 -7 -7 z',
      sombraInterna: 'M100 46 a 20 13 0 0 0 12 12 a 26 15 0 0 1 -12 -12 z',
      mechas: ['M102 36 q 9 -5 20 -4', 'M126 33 q 8 2 12 8', 'M104 52 q 8 4 16 4'],
      fios: ['M94 40 q -4 -3 -5 -8', 'M146 40 q 4 -3 5 -8'],
    }),
 
  },
  {
    ...comum, id: 'cab_px_afro', nome: 'Afro Premium', tema: 'urbano', raridade: 'epico',
    descricao: 'Coroa cheia com volume esférico e luz pontilhada.', usaCores: ['cabelo'],
    render: cabeloPremium({
      massa: 'M60 96 a 60 52 0 1 1 120 0 c -2 -6 -5 -10 -9 -13 a 14 12 0 0 0 -10 -18 a 15 13 0 0 0 -18 -12 a 16 13 0 0 0 -23 -6 a 16 13 0 0 0 -23 6 a 15 13 0 0 0 -18 12 a 14 12 0 0 0 -10 18 c -4 3 -7 7 -9 13 z',
      sombraTesta: 'M82 84 c 12 -6 25 -9 38 -9 s 26 3 38 9 c -2 4 -5 6 -8 7 c -9 -4 -19 -6 -30 -6 s -21 2 -30 6 c -3 -1 -6 -3 -8 -7 z',
      sombraInterna: 'M64 92 a 56 48 0 0 1 12 -30 a 66 56 0 0 0 -8 30 z',
      mechas: ['M84 56 q 5 -3 10 -3', 'M118 42 q 5 -1 10 1', 'M148 54 q 5 3 8 7', 'M72 76 q 3 -5 8 -8', 'M162 74 q 4 4 6 9'],
    }),
 
  },
  {
    ...comum, id: 'cab_px_cacheado', nome: 'Cacheado Premium', tema: 'casual',
    descricao: 'Cachos definidos quicando com brilho por anel.', usaCores: ['cabelo', 'destaque'],
    render: cabeloPremium({
      massa: 'M66 108 c -6 -44 18 -66 54 -66 s 60 22 54 66 c -3 -6 -6 -10 -10 -13 a 12 11 0 0 0 -8 -16 a 13 12 0 0 0 -14 -12 a 14 12 0 0 0 -22 -4 a 14 12 0 0 0 -22 4 a 13 12 0 0 0 -14 12 a 12 11 0 0 0 -8 16 c -4 3 -7 7 -10 13 z',
      sombraTesta: 'M86 88 c 10 -6 21 -9 34 -9 s 24 3 34 9 c -2 4 -4 6 -7 7 c -8 -4 -17 -6 -27 -6 s -19 2 -27 6 c -3 -1 -5 -3 -7 -7 z',
      mechas: ['M88 64 a 8 8 0 0 1 10 -6', 'M116 50 a 8 8 0 0 1 10 -2', 'M146 60 a 8 8 0 0 1 8 6', 'M76 84 a 8 8 0 0 1 6 -8'],
      mechasDestaque: ['M132 54 a 8 8 0 0 1 9 0'],
      fios: ['M64 100 q -3 -6 -2 -12', 'M176 100 q 3 -6 2 -12'],
    }),
 
  },
];
