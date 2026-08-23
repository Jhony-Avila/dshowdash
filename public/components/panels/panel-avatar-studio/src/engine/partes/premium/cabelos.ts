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
function mechas(t: TP, paths: string[], intensidade = 0.32): string {
  return paths.map((d, i) => `<path d="${d}" stroke="${alfa(i % 2 ? t.claro : t.brilho, intensidade)}" stroke-width="${2.1 - (i % 3) * 0.5}" stroke-linecap="round" fill="none"/>`).join('');
}

/** Fios soltos (§891): 2–3 strokes de 1px fora da silhueta. */
function fios(t: TP, paths: string[]): string {
  return paths.map((d) => `<path d="${d}" stroke="${alfa(t.escuro, 0.6)}" stroke-width="1.1" stroke-linecap="round" fill="none"/>`).join('');
}

// onda 1427/Golden §38: RIM light GLOBAL removido — era uma assinatura
// artificial repetida em todos os cabelos. O brilho agora é por-cabelo,
// fragmentado, seguindo o fluxo da massa (mechasDestaque/mechas de cada um).

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
      ${c.fios ? fios(t, c.fios) : ''}`;
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
    descricao: 'Corte baixo texturizado — calota cheia, hairline masculina.', usaCores: ['cabelo'],
    render: cabeloPremium({
      // onda 1424 (Fase B §23): calota SÓLIDA fechada na hairline (~y86) —
      // sem vazado. Hairline masculina reta com entradas curtas; textura
      // por mechas curtas por cima.
      massa: 'M72 88 c -4 -41 22 -61 48 -61 s 52 20 48 61 c -8 -6 -16 -9 -26 -10 c -1 -3 -2 -6 -2 -9 c -6 4 -13 6 -20 6 s -14 -2 -20 -6 c 0 3 -1 6 -2 9 c -10 1 -18 4 -26 10 z',
      sombraTesta: 'M80 86 c 11 -7 26 -10 40 -10 s 29 3 40 10 c -2 4 -4 6 -8 7 c -9 -5 -20 -8 -32 -8 s -23 3 -32 8 c -4 -1 -6 -3 -8 -7 z',
      sombraInterna: 'M74 84 c 0 -16 5 -29 14 -37 c -7 11 -10 24 -9 37 z',
      mechas: ['M84 68 q 12 -12 28 -13', 'M112 52 q 12 -2 26 2', 'M144 62 q 8 5 12 15', 'M92 58 q 10 -6 20 -7', 'M122 50 q 9 0 16 4', 'M78 80 q 6 -10 14 -15'],
      fios: ['M70 82 q -3 -7 -1 -13', 'M170 82 q 3 -7 1 -13', 'M96 46 q 2 -5 6 -7'],
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
    descricao: 'Repartido de lado, volume cheio caindo p/ a direita.', usaCores: ['cabelo'],
    render: cabeloPremium({
      // onda 1424 (Fase B §23): calota SÓLIDA com risca lateral — antes
      // mostrava couro. Hairline mais baixa à esquerda (repartido).
      massa: 'M68 110 c -4 -42 20 -63 52 -63 s 56 21 52 63 c -3 -18 -6 -28 -12 -35 c -8 6 -18 9 -30 9 c -6 0 -11 -1 -16 -3 c -2 4 -5 7 -9 9 c -6 3 -13 4 -20 5 c -3 5 -6 10 -9 16 z',
      franja: 'M78 76 c 6 -12 18 -18 34 -18 c 12 0 22 4 30 11 c -6 -2 -12 -2 -18 -1 c -10 5 -22 9 -34 12 c -5 1 -9 -1 -12 -4 z',
      sombraTesta: 'M80 88 c 12 -7 28 -10 42 -8 c -14 1 -28 5 -38 12 c -2 -1 -4 -2 -4 -4 z',
      sombraInterna: 'M100 54 c -10 6 -18 15 -22 26 c 0 -14 8 -26 22 -30 z',
      mechas: ['M84 74 q 20 -14 42 -12', 'M92 64 q 22 -8 40 -2', 'M140 68 q 8 6 12 15', 'M100 82 q 16 -6 32 -4'],
      fios: ['M66 100 q -3 -7 -1 -13', 'M172 98 q 2 -6 0 -12'],
    }),
  },
  {
    ...comum, id: 'cab_px_undercut', nome: 'Undercut Premium', tema: 'urbano',
    descricao: 'Bloco cheio no topo, laterais raspadas em meia-sombra.', usaCores: ['cabelo'],
    render: cabeloPremium({
      // onda 1424 (Fase B §23): TOPO cheio até a hairline (bloco sólido,
      // sem recuo) + laterais em meia-sombra. Fecha na testa ~y84.
      massa: 'M76 86 c -4 -38 18 -55 44 -55 s 48 17 44 55 c -8 -6 -16 -9 -24 -10 c -1 -2 -1 -5 -1 -7 c -6 4 -12 6 -19 6 s -13 -2 -19 -6 c 0 2 0 5 -1 7 c -8 1 -16 4 -24 10 z',
      sombraTesta: 'M84 84 c 10 -6 22 -9 36 -9 s 26 3 36 9 c -2 4 -4 6 -8 7 c -8 -4 -18 -7 -28 -7 s -20 3 -28 7 c -4 -1 -6 -3 -8 -7 z',
      // laterais raspadas: faixa de sombra suave nas têmporas (§urbano)
      sombraInterna: 'M72 104 c 2 -12 6 -22 14 -28 c -6 3 -11 9 -13 17 c -1 4 -1 8 -1 11 z M168 104 c -2 -12 -6 -22 -14 -28 c 6 3 11 9 13 17 c 1 4 1 8 1 11 z',
      mechas: ['M92 62 q 14 -12 30 -12', 'M122 48 q 12 0 20 7', 'M96 74 q 8 -9 18 -11', 'M118 54 q 12 0 20 5', 'M84 68 q 8 -9 16 -12'],
      fios: ['M106 40 q 3 -5 8 -6', 'M132 42 q 3 -4 7 -4'],
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
    // §44 LONGO LISO: queda RETA e sleeker, pontas arredondadas (não bloco).
    renderAtras: massaAtras('M74 100 c -10 42 -10 80 -2 106 c 5 6 14 5 18 -2 c -5 -32 -5 -68 1 -100 c 4 24 6 50 5 76 h 48 c -1 -26 1 -52 5 -76 c 6 32 6 68 1 100 c 4 7 13 8 18 2 c 8 -26 8 -64 -2 -106 z'),
 
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
    // §44 ONDULADO: silhueta externa mais LARGA e ONDULADA (não igual ao liso).
    renderAtras: massaAtras('M66 96 c -18 40 -20 82 -8 116 c 5 -5 7 -13 5 -21 c 5 9 5 19 1 28 c 6 3 13 1 17 -4 c -6 -12 -4 -26 2 -38 c -5 -26 -5 -54 3 -80 c 3 26 4 54 2 80 h 44 c -2 -26 -1 -54 2 -80 c 8 26 8 54 3 80 c 6 12 8 26 2 38 c 4 5 11 7 17 4 c -4 -9 -4 -19 1 -28 c -2 8 0 16 5 21 c 12 -34 10 -76 -8 -116 z'),
 
  },
  {
    ...comum, id: 'cab_px_rabo', nome: 'Rabo de Cavalo Premium', tema: 'gamer',
    descricao: 'Preso alto e puxado, superfície lisa, rabo atrás.', usaCores: ['cabelo'],
    render: cabeloPremium({
      // onda 1424 (Fase B §23): topo SÓLIDO e liso (puxado p/ trás) — antes
      // era anel mostrando couro. Mechas horizontais dão o "penteado".
      massa: 'M70 104 c -2 -38 20 -57 50 -57 s 52 19 50 57 c -3 -14 -6 -22 -12 -28 c -10 4 -22 6 -38 6 s -28 -2 -38 -6 c -6 6 -9 14 -12 28 z',
      sombraTesta: 'M84 86 c 10 -6 22 -9 36 -9 s 26 3 36 9 c -2 4 -4 6 -7 7 c -8 -4 -18 -7 -29 -7 s -21 3 -29 7 c -3 -1 -5 -3 -7 -7 z',
      sombraInterna: 'M74 96 c 2 -12 8 -22 18 -28 c -8 8 -13 18 -14 30 z',
      mechas: ['M80 78 q 40 -14 80 0', 'M84 68 q 36 -12 72 0', 'M90 58 q 30 -8 60 0', 'M96 88 q 24 -6 48 0'],
      fios: ['M118 44 q 2 -5 6 -7', 'M128 44 q 3 -4 7 -5'],
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
    descricao: 'Coroa esférica CHEIA com borda em nuvem e luz pontilhada.', usaCores: ['cabelo'],
    render: cabeloPremium({
      // onda 1427/Golden §40: DOMO CHEIO (coroa esférica) + bumps de nuvem
      // PREENCHIDOS (sweep-flag 1 = união no nonzero, não furo). Bug 1424: os
      // bumps tinham winding oposto → viravam BURACOS brancos. Agora somam.
      massa: 'M72 96 a 62 60 0 1 1 96 0 z'
        + ' M70 70 a 15 15 0 1 1 0.1 0 z M80 46 a 16 16 0 1 1 0.1 0 z M102 33 a 16 16 0 1 1 0.1 0 z'
        + ' M120 28 a 16 16 0 1 1 0.1 0 z M138 33 a 16 16 0 1 1 0.1 0 z M160 46 a 16 16 0 1 1 0.1 0 z M170 70 a 15 15 0 1 1 0.1 0 z'
        + ' M64 90 a 12 12 0 1 1 0.1 0 z M176 90 a 12 12 0 1 1 0.1 0 z',
      sombraTesta: 'M82 92 c 12 -6 25 -9 38 -9 s 26 3 38 9 c -2 4 -5 6 -8 7 c -9 -4 -19 -6 -30 -6 s -21 2 -30 6 c -3 -1 -6 -3 -8 -7 z',
      // separação de clumps (§40): sombras internas que dividem a coroa em massas
      sombraInterna: 'M120 40 c -14 8 -22 22 -24 40 c -6 -18 0 -38 14 -50 c 3 4 7 7 10 10 z M120 40 c 14 8 22 22 24 40 c 6 -18 0 -38 -14 -50 c -3 4 -7 7 -10 10 z M120 62 c -8 6 -12 16 -12 28 c -6 -12 -3 -26 6 -34 c 2 2 4 4 6 6 z',
      // realces pontilhados soft seguindo a curvatura (não faixa reta §43)
      mechas: ['M92 56 q 6 -4 12 -3', 'M120 48 q 8 -1 14 2', 'M150 60 q 5 4 7 10', 'M74 82 q 4 -6 10 -7', 'M164 84 q 3 6 3 12', 'M106 44 q 5 -3 10 -2'],
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
