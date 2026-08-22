// engine/partes/premium/faces.ts — onda 1412 (MEGA_BRIEFING_01 §595–§597,
// §701–§708, §736–§744; decisões #159/#162/#166): GOLDEN CLASSIC — rosto,
// olhos e boca premium. Arte NOVA (partes/* intocadas), IDs `_px_`.
//
// Regras do trilho: zero filtros SVG (§2510), defs prefixados por uid,
// tinta premium por luminância (§2404 — pele lê em claro/médio/escuro).
// Olhos premium NÃO têm sobrancelha (§703 — expressão superior vem da
// futura categoria própria; até lá a base carrega arcada neutra sutil).
// Íris (§705): 2 tons + 2 catchlights; a cor vem de `p.iris` (canal
// coresFace.iris — validarConfig/§73-espelho) com padrão âmbar-café.
// Catchlights ganham id `${uid}pxcatch*` — o shell (apresentação) desloca
// por CSS conforme a luz do palco (§707); o SVG salvo é estático.
// @version 1.0.0  @created 2026-08-20
import { alfa, tinta, tintaPremium } from '../../cores';
import type { Tinta } from '../../cores';
import { G, PATH_PESCOCO } from '../../base-api';
import type { ParteDef, ParteRender } from '../../base-api';
import type { Paleta } from '../../cores';

export const IRIS_PADRAO = '#4a3626';

// ── BASES PREMIUM (§736–§744): jawline/queixo/bochechas/orelhas/nariz
// integrado/sombreamento — 8 estruturas faciais ────────────────────────

function defsPelePremium(u: string, hexPele: string): string {
  const t = tintaPremium(hexPele);
  return `
    <radialGradient id="${u}pxpele" cx="0.36" cy="0.26" r="1.05">
      <stop offset="0" stop-color="${t.brilho}"/>
      <stop offset="0.32" stop-color="${t.claro}"/>
      <stop offset="0.62" stop-color="${t.base}"/>
      <stop offset="0.86" stop-color="${t.meio}"/>
      <stop offset="1" stop-color="${t.escuro}"/>
    </radialGradient>
    <linearGradient id="${u}pxpesc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.escuro}"/>
      <stop offset="1" stop-color="${t.base}"/>
    </linearGradient>`;
}

/** Orelha premium: concha + hélice + sombra interna (x espelhável). */
function orelhaPremium(x: number, t: ReturnType<typeof tintaPremium>, dir: 1 | -1): string {
  return `
    <ellipse cx="${x}" cy="${G.orelhaY}" rx="9.5" ry="13.5" fill="${t.base}"/>
    <path d="M${x + 3 * dir} ${G.orelhaY - 9} a 8 11 0 0 0 ${-2 * dir} 18" fill="none" stroke="${alfa(t.escuro, 0.65)}" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="${x + 1.5 * dir}" cy="${G.orelhaY + 2}" rx="3.4" ry="5.6" fill="${alfa(t.profundo, 0.5)}"/>
    <path d="M${x - 4 * dir} ${G.orelhaY - 10} a 9 12 0 0 1 ${6 * dir} -2" fill="none" stroke="${alfa('#ffffff', 0.28)}" stroke-width="1.6" stroke-linecap="round"/>`;
}

type TP = ReturnType<typeof tintaPremium>;

/** onda 1424 (Fase B §19–§21): NARIZ com FORMA própria por rosto — não é
 *  mais um traço único compartilhado. Cada estilo muda dorso, ponta,
 *  asas e sombra (identidade real, não detalhe). */
function narizPremium(t: TP, estilo: 'reto' | 'largo' | 'fino' | 'arrebitado' | 'aquilino' | 'curto', comprimento = 0): string {
  const yBase = 132 + comprimento;
  const asa = (rx: number, alfaAsa: number) => `
    <path d="M${120 - rx - 2} ${yBase - 1} q 2.4 3.6 ${rx / 2} 4" fill="none" stroke="${alfa(t.escuro, alfaAsa)}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M${120 + rx + 2} ${yBase - 1} q -2.4 3.6 ${-rx / 2} 4" fill="none" stroke="${alfa(t.escuro, alfaAsa)}" stroke-width="1.8" stroke-linecap="round"/>`;
  const narinas = (dx: number, r: number) => `
    <ellipse cx="${120 - dx}" cy="${yBase + 0.6}" rx="${r}" ry="${r * 0.62}" fill="${alfa(t.profundo, 0.5)}"/>
    <ellipse cx="${120 + dx}" cy="${yBase + 0.6}" rx="${r}" ry="${r * 0.62}" fill="${alfa(t.profundo, 0.5)}"/>`;
  const dorso = (curva: string, luz: string) => `
    <path d="${curva}" stroke="${alfa(t.escuro, 0.34)}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    <path d="${luz}" stroke="${alfa('#ffffff', 0.24)}" stroke-width="2" stroke-linecap="round" fill="none"/>`;
  switch (estilo) {
    case 'largo': return `
      ${dorso(`M117 112 q -3.4 ${12 + comprimento} -6 ${16 + comprimento}`, `M121 110 q 3 ${10 + comprimento} 3.6 ${15 + comprimento}`)}
      <ellipse cx="120" cy="${yBase - 2}" rx="8.6" ry="4.6" fill="${alfa(t.meio, 0.5)}"/>
      <path d="M110 ${yBase} q 10 6.4 20 0" stroke="${alfa(t.escuro, 0.44)}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      ${narinas(6.4, 2.1)}${asa(9, 0.34)}
      <ellipse cx="120" cy="${yBase - 4}" rx="4" ry="2.2" fill="${alfa('#ffffff', 0.16)}"/>`;
    case 'fino': return `
      ${dorso(`M119.4 108 q -1.6 ${14 + comprimento} -3 ${20 + comprimento}`, `M120.6 107 q 1.8 ${13 + comprimento} 2 ${19 + comprimento}`)}
      <path d="M115 ${yBase} q 5 3.8 10 0" stroke="${alfa(t.escuro, 0.42)}" stroke-width="2" stroke-linecap="round" fill="none"/>
      ${narinas(4.2, 1.4)}
      <ellipse cx="120" cy="${yBase - 3.2}" rx="2.4" ry="1.7" fill="${alfa('#ffffff', 0.18)}"/>`;
    case 'arrebitado': return `
      ${dorso(`M119 112 q -2 ${9 + comprimento} -2.6 ${12 + comprimento}`, `M121 111 q 2 ${8 + comprimento} 2 ${11 + comprimento}`)}
      <ellipse cx="120" cy="${yBase - 3.4}" rx="5.2" ry="3.6" fill="${alfa(t.claro, 0.5)}"/>
      <path d="M114 ${yBase - 1.6} q 6 4.6 12 0" stroke="${alfa(t.escuro, 0.4)}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      ${narinas(4.6, 1.8)}
      <ellipse cx="119" cy="${yBase - 5.6}" rx="3" ry="2" fill="${alfa('#ffffff', 0.24)}"/>`;
    case 'aquilino': return `
      <path d="M118.6 106 q -4 ${8 + comprimento} -1.6 ${12 + comprimento} q -2.4 5 -3.6 7.4" stroke="${alfa(t.escuro, 0.4)}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
      <path d="M121 105 q 3.4 ${9 + comprimento} 2.6 ${14 + comprimento}" stroke="${alfa('#ffffff', 0.2)}" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M113.6 ${yBase} q 6.4 4.6 12.8 0" stroke="${alfa(t.escuro, 0.44)}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      ${narinas(5, 1.7)}${asa(7, 0.3)}
      <ellipse cx="121.6" cy="${yBase - 8}" rx="2.4" ry="3.4" fill="${alfa('#ffffff', 0.16)}"/>`;
    case 'curto': return `
      ${dorso(`M119 116 q -1.8 ${8 + comprimento} -3 ${11 + comprimento}`, `M120.8 115 q 2 ${7 + comprimento} 2.2 ${10 + comprimento}`)}
      <path d="M114.6 ${yBase - 2} q 5.4 4.2 10.8 0" stroke="${alfa(t.escuro, 0.4)}" stroke-width="2.1" stroke-linecap="round" fill="none"/>
      ${narinas(4.4, 1.6)}
      <ellipse cx="120" cy="${yBase - 5}" rx="3" ry="1.9" fill="${alfa('#ffffff', 0.15)}"/>`;
    default: return `
      ${dorso(`M120 112 q -2.4 ${12 + comprimento} -4.6 ${17 + comprimento}`, `M118 110 q 3 ${10 + comprimento} 3.4 ${16 + comprimento}`)}
      <path d="M113 ${yBase} q 7 5 14 0" stroke="${alfa(t.escuro, 0.42)}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      ${narinas(5.4, 1.7)}
      <ellipse cx="120" cy="${yBase - 3.4}" rx="3.2" ry="2" fill="${alfa('#ffffff', 0.14)}"/>`;
  }
}

/** Bochechas (§740) com ALTURA/volume por rosto — maçãs altas ≠ cheias. */
function bochechas(t: TP, y = 127, rx = 10, forca = 1): string {
  return `
    <ellipse cx="${120 - 23}" cy="${y}" rx="${rx}" ry="${rx * 0.65}" fill="${alfa(t.claro, 0.28 * forca)}"/>
    <ellipse cx="${120 + 23}" cy="${y}" rx="${rx}" ry="${rx * 0.65}" fill="${alfa(t.meio, 0.24 * forca)}"/>`;
}

/** Arcada superciliar com PESO por rosto (§703 — ossatura, não pelo). */
function arcada(t: TP, peso = 0.2, quebra = 0): string {
  return `
    <path d="M89 ${95 + quebra} q 11 -4.5 22 -1.5" stroke="${alfa(t.escuro, peso)}" stroke-width="${3 + quebra}" stroke-linecap="round" fill="none"/>
    <path d="M129 ${93.5 + quebra} q 11 -3 22 1.5" stroke="${alfa(t.escuro, peso)}" stroke-width="${3 + quebra}" stroke-linecap="round" fill="none"/>`;
}

/** onda 1424 (Fase B §19): PERFIL facial — cada base declara a PRÓPRIA
 *  combinação de crânio, maxilar, queixo, nariz, maçãs, testa e arcada.
 *  Fim do rosto único parametrizado que fazia todos parecerem irmãos. */
interface PerfilRosto {
  cabeca: string;
  jawline: string;
  /** sombra LATERAL do maxilar (d SVG) — dureza da mandíbula */
  maxilar?: string;
  /** QUEIXO próprio (fenda, ponta, achatado…) */
  queixo?: (t: TP) => string;
  nariz: { estilo: Parameters<typeof narizPremium>[1]; comprimento?: number };
  macas: { y?: number; rx?: number; forca?: number };
  arcada: { peso?: number; quebra?: number };
  /** highlight da TESTA (posição/tamanho — testa ampla ≠ curta) */
  testa: { cy: number; rx: number; ry: number; op?: number };
  extras?: (t: TP) => string;
}

function basePremium(perfil: PerfilRosto): ParteRender {
  return (p: Paleta, u: string) => {
    const t = tintaPremium(p.pele.base);
    return `
      <defs>${defsPelePremium(u, p.pele.base)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pxpesc)"/>
      <path d="M103 176 q 17 6 34 0 l -2 6 q -15 5 -30 0 z" fill="${alfa(t.profundo, 0.32)}"/>
      <path d="${perfil.cabeca}" fill="url(#${u}pxpele)"/>
      <path d="${perfil.jawline}" fill="none" stroke="${alfa(t.escuro, 0.35)}" stroke-width="2.6" stroke-linecap="round"/>
      ${perfil.maxilar ? `<path d="${perfil.maxilar}" fill="${alfa(t.meio, 0.4)}"/>` : ''}
      ${orelhaPremium(70, t, 1)}${orelhaPremium(170, t, -1)}
      ${bochechas(t, perfil.macas.y, perfil.macas.rx, perfil.macas.forca)}
      ${narizPremium(t, perfil.nariz.estilo, perfil.nariz.comprimento ?? 0)}
      ${arcada(t, perfil.arcada.peso, perfil.arcada.quebra)}
      ${perfil.queixo ? perfil.queixo(t) : `<ellipse cx="120" cy="152" rx="19" ry="6.4" fill="${alfa(t.profundo, 0.26)}"/>
      <path d="M120 156 q 4 2 0 4 q -4 -2 0 -4" fill="${alfa('#ffffff', 0.16)}"/>`}
      <ellipse cx="120" cy="${perfil.testa.cy}" rx="${perfil.testa.rx}" ry="${perfil.testa.ry}" fill="${alfa('#ffffff', perfil.testa.op ?? 0.1)}"/>
      <path d="M80 72 a 52 58 0 0 1 44 -22" stroke="${alfa('#ffffff', 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M158 78 a 52 58 0 0 1 8 26" stroke="${alfa(t.escuro, 0.3)}" stroke-width="4" stroke-linecap="round" fill="none"/>
      ${perfil.extras ? perfil.extras(t) : ''}`;
  };
}

// onda 1424 (Fase B §19): SILHUETAS de crânio mais distintas — o topo
// fica estável (~y49, meia-largura ≤54 — o encaixe de cabelo §897 depende
// dele); a IDENTIDADE mora na metade de baixo (têmporas/maxilar/queixo).
const CAB_OVAL = 'M120 49 a 50 57 0 0 1 50 57 a 50 57 0 0 1 -100 0 a 50 57 0 0 1 50 -57';
const CAB_ANGULAR = 'M120 49 c 30 0 50 24 50 55 c 0 22 -10 42 -28 53 l -22 10 l -22 -10 c -18 -11 -28 -31 -28 -53 c 0 -31 20 -55 50 -55';
const CAB_CORACAO = 'M120 49 c 33 0 54 22 52 52 c -2 24 -22 44 -36 54 l -16 13 l -16 -13 c -14 -10 -34 -30 -36 -54 c -2 -30 19 -52 52 -52';
const CAB_QUADRADA = 'M120 50 c 29 0 49 19 49 48 l 0 22 c 0 22 -16 40 -37 45 l -12 3 l -12 -3 c -21 -5 -37 -23 -37 -45 l 0 -22 c 0 -29 20 -48 49 -48';
const CAB_REDONDA = 'M120 52 a 54 54 0 0 1 54 54 a 54 54 0 0 1 -108 0 a 54 54 0 0 1 54 -52';
const CAB_ALONGADA = 'M120 47 a 43 62 0 0 1 43 62 a 43 62 0 0 1 -86 0 a 43 62 0 0 1 43 -62';
const CAB_DIAMANTE = 'M120 49 c 24 3 40 20 44 44 c 4 24 -14 50 -30 62 l -14 12 l -14 -12 c -16 -12 -34 -38 -30 -62 c 4 -24 20 -41 44 -44';
const CAB_SUAVE = 'M120 50 a 49 56 0 0 1 49 56 c 0 26 -18 48 -38 55 l -11 4 l -11 -4 c -20 -7 -38 -29 -38 -55 a 49 56 0 0 1 49 -56';

const comumBase = { categoria: 'base' as const, raridade: 'raro' as const, usaCores: ['pele' as const], acabamento: 'premium' as const };

export const BASES_PREMIUM: ParteDef[] = [
  {
    ...comumBase, id: 'bas_px_oval', nome: 'Oval Premium', tema: 'clássico',
    descricao: 'Estrutura oval clássica com volume real de estúdio.',
    render: basePremium({
      cabeca: CAB_OVAL, jawline: 'M92 148 q 28 22 56 0',
      nariz: { estilo: 'reto' }, macas: { y: 127, rx: 10, forca: 1 },
      arcada: { peso: 0.2 }, testa: { cy: 78, rx: 22, ry: 9 },
      extras: (t) => `<path d="M108 166 q 12 5 24 0" stroke="${alfa(t.escuro, 0.22)}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
    }),
  },
  {
    ...comumBase, id: 'bas_px_angular', nome: 'Angular Premium', tema: 'clássico',
    descricao: 'Maxilar duro, queixo com fenda, arcada pesada — protagonista.',
    render: basePremium({
      cabeca: CAB_ANGULAR, jawline: 'M88 140 l 16 20 l 16 8 l 16 -8 l 16 -20',
      maxilar: 'M88 138 l 15 20 l -4 3 q -9 -10 -13 -19 z M152 138 l -15 20 l 4 3 q 9 -10 13 -19 z',
      nariz: { estilo: 'aquilino', comprimento: 1 },
      macas: { y: 124, rx: 8, forca: 0.7 },
      arcada: { peso: 0.34, quebra: 1 }, testa: { cy: 76, rx: 20, ry: 8, op: 0.08 },
      queixo: (t) => `
        <path d="M108 160 q 12 8 24 0 l -3 8 q -9 5 -18 0 z" fill="${alfa(t.meio, 0.45)}"/>
        <path d="M120 163 l 0 6" stroke="${alfa(t.escuro, 0.5)}" stroke-width="2" stroke-linecap="round"/>
        <path d="M112 158 q 8 4 16 0" stroke="${alfa('#ffffff', 0.18)}" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
    }),
  },
  {
    ...comumBase, id: 'bas_px_coracao', nome: 'Coração Premium', tema: 'clássico',
    descricao: 'Testa ampla, maçãs altas e queixo delicado em ponta.',
    render: basePremium({
      cabeca: CAB_CORACAO, jawline: 'M96 142 q 24 24 48 0',
      nariz: { estilo: 'arrebitado', comprimento: -2 },
      macas: { y: 122, rx: 11, forca: 1.15 },
      arcada: { peso: 0.16 }, testa: { cy: 82, rx: 30, ry: 12, op: 0.14 },
      queixo: (t) => `
        <path d="M113 157 q 7 7 14 0 q -5 8 -7 9 q -2 -1 -7 -9" fill="${alfa(t.meio, 0.26)}"/>
        <ellipse cx="120" cy="155" rx="7" ry="3" fill="${alfa('#ffffff', 0.16)}"/>`,
    }),
  },
  {
    ...comumBase, id: 'bas_px_quadrada', nome: 'Quadrada Premium', tema: 'executivo',
    descricao: 'Mandíbula larga, queixo chato, presença de capa de revista.',
    render: basePremium({
      cabeca: CAB_QUADRADA, jawline: 'M84 138 l 8 20 l 28 12 l 28 -12 l 8 -20',
      maxilar: 'M84 136 l 8 20 l -5 2 q -5 -12 -6 -21 z M156 136 l -8 20 l 5 2 q 5 -12 6 -21 z',
      nariz: { estilo: 'largo', comprimento: 1 },
      macas: { y: 128, rx: 9, forca: 0.8 },
      arcada: { peso: 0.3 }, testa: { cy: 74, rx: 24, ry: 8, op: 0.09 },
      queixo: (t) => `
        <path d="M106 162 h 28 l -4 7 h -20 z" fill="${alfa(t.meio, 0.42)}"/>
        <path d="M108 160 h 24" stroke="${alfa('#ffffff', 0.16)}" stroke-width="1.8" stroke-linecap="round"/>`,
    }),
  },
  {
    ...comumBase, id: 'bas_px_redonda', nome: 'Redonda Premium', tema: 'casual',
    descricao: 'Bochechas cheias, queixo curto, simpatia imediata.',
    render: basePremium({
      cabeca: CAB_REDONDA, jawline: 'M94 150 q 26 16 52 0',
      nariz: { estilo: 'curto', comprimento: -1 },
      macas: { y: 131, rx: 13, forca: 1.5 },
      arcada: { peso: 0.15 }, testa: { cy: 80, rx: 24, ry: 10 },
      queixo: (t) => `
        <ellipse cx="120" cy="153" rx="14" ry="5" fill="${alfa(t.profundo, 0.2)}"/>
        <ellipse cx="120" cy="150" rx="8" ry="3" fill="${alfa('#ffffff', 0.16)}"/>
        <ellipse cx="97" cy="133" rx="8" ry="5.4" fill="${alfa(t.claro, 0.3)}"/>
        <ellipse cx="143" cy="133" rx="8" ry="5.4" fill="${alfa(t.claro, 0.24)}"/>`,
    }),
  },
  {
    ...comumBase, id: 'bas_px_alongada', nome: 'Alongada Premium', tema: 'clássico',
    descricao: 'Rosto esguio e vertical, nariz longo, maçãs escavadas.',
    render: basePremium({
      cabeca: CAB_ALONGADA, jawline: 'M98 152 q 22 18 44 0',
      nariz: { estilo: 'fino', comprimento: 4 },
      macas: { y: 124, rx: 8, forca: 0.9 },
      arcada: { peso: 0.24 }, testa: { cy: 74, rx: 17, ry: 11, op: 0.11 },
      queixo: (t) => `
        <path d="M112 159 q 8 6 16 0 q -6 8 -8 9 q -2 -1 -8 -9" fill="${alfa(t.meio, 0.28)}"/>
        <ellipse cx="120" cy="158" rx="6" ry="2.6" fill="${alfa('#ffffff', 0.14)}"/>`,
      extras: (t) => `<path d="M92 118 q 3 12 9 17 M148 118 q -3 12 -9 17" stroke="${alfa(t.meio, 0.5)}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,
    }),
  },
  {
    ...comumBase, id: 'bas_px_diamante', nome: 'Diamante Premium', tema: 'clássico', raridade: 'epico',
    descricao: 'Têmporas recuadas, zigomático saliente, queixo em lâmina.',
    render: basePremium({
      cabeca: CAB_DIAMANTE, jawline: 'M94 138 q 26 30 52 0',
      maxilar: 'M94 136 q 12 18 22 24 l -3 4 q -12 -8 -22 -24 z M146 136 q -12 18 -22 24 l 3 4 q 12 -8 22 -24 z',
      nariz: { estilo: 'fino', comprimento: 1 },
      macas: { y: 120, rx: 10, forca: 1.2 },
      arcada: { peso: 0.26 }, testa: { cy: 72, rx: 16, ry: 8, op: 0.1 },
      queixo: (t) => `
        <path d="M114 156 q 6 6 12 0 q -4 10 -6 12 q -2 -2 -6 -12" fill="${alfa(t.meio, 0.32)}"/>
        <ellipse cx="120" cy="155" rx="5.4" ry="2.4" fill="${alfa('#ffffff', 0.14)}"/>`,
      extras: (t) => `
        <path d="M90 116 l 10 9 M150 116 l -10 9" stroke="${alfa('#ffffff', 0.3)}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M96 128 q 6 6 14 8 M144 128 q -6 6 -14 8" stroke="${alfa(t.escuro, 0.2)}" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
    }),
  },
  {
    ...comumBase, id: 'bas_px_suave', nome: 'Suave Premium', tema: 'casual',
    descricao: 'Contornos difusos e sombreamento sedoso — nada de arestas.',
    render: basePremium({
      cabeca: CAB_SUAVE, jawline: 'M96 148 q 24 18 48 0',
      nariz: { estilo: 'curto' },
      macas: { y: 129, rx: 11, forca: 1.05 },
      arcada: { peso: 0.13 }, testa: { cy: 80, rx: 26, ry: 11 },
      extras: (t) => `<ellipse cx="120" cy="142" rx="30" ry="10" fill="${alfa(t.claro, 0.1)}"/>`,
    }),
  },
];

// ── OLHOS PREMIUM (§701–§708): esclera quente, íris 2 tons, 2 catch-
// lights, pálpebras/cílios — SEM sobrancelha ─────────────────────────

interface OpcoesOlho { ry?: number; tilt?: number; irisR?: number; palpebra?: number }

/** Olho premium (x espelha em dir): esclera quente + íris 2 tons + 2
 *  catchlights (id `${u}pxcatch<L|R>` p/ a luz do palco §707) + pálpebra. */
export function olhoPremium(x: number, y: number, iris: Tinta, u: string, lado: 'L' | 'R', o: OpcoesOlho = {}): string {
  const ry = o.ry ?? 8;
  const tilt = o.tilt ?? 0;
  const irisR = o.irisR ?? 5.4;
  const palp = o.palpebra ?? 0;
  const dir = lado === 'L' ? -1 : 1; // canto interno (lacrimal) aponta p/ o nariz
  // onda 1424 (Fase B §20): CAVIDADE ocular (sombra superior), canto
  // lacrimal, linha d'água inferior, íris com raios + limbo escuro e
  // catchlight principal em GOTA — volume de ilustração, não clipart
  return `
    <g transform="rotate(${tilt} ${x} ${y})">
      <ellipse cx="${x}" cy="${y - ry + 0.6}" rx="12.4" ry="4.2" fill="${alfa('#1a120a', 0.13)}"/>
      <ellipse cx="${x}" cy="${y}" rx="10.8" ry="${ry}" fill="#f8f3ea"/>
      <path d="M${x - 10.4} ${y - 1} a 10.8 ${ry} 0 0 1 21.6 0" fill="${alfa('#c9b8a4', 0.35)}"/>
      <ellipse cx="${x - 10.2 * dir}" cy="${y + 0.8}" rx="1.7" ry="1.2" fill="${alfa('#c96b5a', 0.55)}"/>
      <circle cx="${x}" cy="${y + 0.4}" r="${irisR}" fill="${iris.escuro}"/>
      <circle cx="${x}" cy="${y + 0.4}" r="${irisR - 1.2}" fill="${iris.base}"/>
      <path d="M${x} ${y + 0.4 - irisR + 1.4} v 1.7 M${x + irisR - 1.5} ${y + 0.4} h -1.7 M${x - irisR + 1.5} ${y + 0.4} h 1.7 M${x - 2.6} ${y + irisR - 1.4} l 0.7 -1.5 M${x + 2.6} ${y + irisR - 1.4} l -0.7 -1.5" stroke="${iris.claro}" stroke-width="0.9" opacity="0.6"/>
      <path d="M${x - irisR + 2.1} ${y + 1.8} a ${irisR - 1.7} ${irisR - 1.7} 0 0 0 ${2 * (irisR - 1.7) - 0.8} 0" fill="none" stroke="${iris.claro}" stroke-width="1.1" opacity="0.75"/>
      <circle cx="${x}" cy="${y + 0.4}" r="${irisR}" fill="none" stroke="${alfa('#0d0906', 0.55)}" stroke-width="0.9"/>
      <circle cx="${x}" cy="${y + 0.4}" r="2.3" fill="#100c08"/>
      <g id="${u}pxcatch${lado}">
        <path d="M${x + 1.2} ${y - 2.8} a 1.9 1.9 0 1 1 1.6 3.1 q -1.8 -0.6 -1.6 -3.1" fill="#ffffff" opacity="0.95"/>
        <circle cx="${x - 2.4}" cy="${y + 2.2}" r="0.8" fill="#ffffff" opacity="0.55"/>
      </g>
      <path d="M${x - 10.6} ${y - 2 - palp} a 10.8 ${ry} 0 0 1 21.2 0" fill="none" stroke="${alfa('#141008', 0.55)}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M${x - 11} ${y - 4.6 - palp} a 12 ${ry + 1} 0 0 1 22 -0.6" fill="none" stroke="${alfa('#141008', 0.2)}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M${x + 9.4} ${y - 4.2} l 2.6 -1.8 M${x + 10.6} ${y - 1.6} l 2.8 -0.8" stroke="${alfa('#141008', 0.5)}" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M${x - 9.8} ${y + ry - 2.4} a 11 ${ry} 0 0 0 19.6 0" fill="none" stroke="${alfa('#ffffff', 0.3)}" stroke-width="1.2"/>
      <path d="M${x - 8.6} ${y + ry - 1.2} a 10 ${ry} 0 0 0 17.2 0" fill="none" stroke="${alfa('#8a6a52', 0.28)}" stroke-width="1"/>
    </g>`;
}

function parOlhos(o: OpcoesOlho = {}, oDir: OpcoesOlho | null = null): ParteRender {
  return (p: Paleta, u: string) => {
    const iris = p.iris ?? tinta(IRIS_PADRAO);
    return olhoPremium(100, 108, iris, u, 'L', o) + olhoPremium(140, 108, iris, u, 'R', { ...o, ...(oDir ?? {}), tilt: -(oDir?.tilt ?? o.tilt ?? 0) });
  };
}

export const OLHOS_PREMIUM: ParteDef[] = [
  { id: 'olh_px_confiante', categoria: 'olhos', nome: 'Confiante Premium', descricao: 'Olhar direto com catchlight duplo de estúdio.', raridade: 'raro', tema: 'clássico', usaCores: ['pele'], acabamento: 'premium', render: parOlhos({}) },
  { id: 'olh_px_sereno', categoria: 'olhos', nome: 'Sereno Premium', descricao: 'Pálpebra baixa e calma de quem já resolveu tudo.', raridade: 'raro', tema: 'clássico', usaCores: ['pele'], acabamento: 'premium', render: parOlhos({ ry: 6.6, palpebra: -1.2 }) },
  { id: 'olh_px_focado', categoria: 'olhos', nome: 'Focado Premium', descricao: 'Fenda estreita, alvo travado.', raridade: 'raro', tema: 'gamer', usaCores: ['pele'], acabamento: 'premium', render: parOlhos({ ry: 5.8, irisR: 5 }) },
  { id: 'olh_px_amendoado', categoria: 'olhos', nome: 'Amendoado Premium', descricao: 'Cantos elevados com inclinação elegante.', raridade: 'raro', tema: 'clássico', usaCores: ['pele'], acabamento: 'premium', render: parOlhos({ tilt: 6, ry: 7 }) },
  { id: 'olh_px_intenso', categoria: 'olhos', nome: 'Intenso Premium', descricao: 'Íris grande, presença magnética.', raridade: 'epico', tema: 'clássico', usaCores: ['pele'], acabamento: 'premium', render: parOlhos({ ry: 8.6, irisR: 6.2 }) },
  { id: 'olh_px_gentil', categoria: 'olhos', nome: 'Gentil Premium', descricao: 'Curva caída e doçura genuína.', raridade: 'raro', tema: 'casual', usaCores: ['pele'], acabamento: 'premium', render: parOlhos({ tilt: -5, ry: 7.4 }) },
  { id: 'olh_px_felino', categoria: 'olhos', nome: 'Felino Premium', descricao: 'Inclinação alta e brilho de caçador.', raridade: 'epico', tema: 'místico', usaCores: ['pele'], acabamento: 'premium', render: parOlhos({ tilt: 9, ry: 6.4, irisR: 5.8 }) },
  { id: 'olh_px_determinado', categoria: 'olhos', nome: 'Determinado Premium', descricao: 'Meta na mira, pálpebra firme.', raridade: 'raro', tema: 'executivo', usaCores: ['pele'], acabamento: 'premium', render: parOlhos({ ry: 6.8, palpebra: 1 }) },
];

// ── BOCAS PREMIUM (§742–§744): lábios em 2 tons + luz ────────────────

function labios(dSuperior: string, dInferior: string, dLuz: string, extra = ''): ParteRender {
  return (p: Paleta) => {
    const t = tintaPremium(p.pele.base);
    // onda 1414 (#162): canal coresFace.labios (injetado só com as6.face_v2)
    // — ausente cai no tom padrão de sempre, byte a byte
    const labio = tintaPremium(p.labios?.base ?? '#8a4a3e');
    return `
      <path d="${dSuperior}" fill="${labio.escuro}"/>
      <path d="${dInferior}" fill="${labio.base}"/>
      <path d="${dLuz}" fill="${alfa('#ffffff', 0.28)}"/>
      <path d="M104 152 q 16 8 32 0" stroke="${alfa(t.escuro, 0.25)}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
      ${extra}`;
  };
}

export const BOCAS_PREMIUM: ParteDef[] = [
  { id: 'boc_px_sorriso', categoria: 'boca', nome: 'Sorriso Premium', descricao: 'Curva segura com lábio em dois tons.', raridade: 'raro', tema: 'clássico', usaCores: ['pele'], acabamento: 'premium', render: labios('M104 142 q 16 6 32 0 q -16 8 -32 0', 'M106 146 q 14 9 28 0 q -14 6 -28 0', 'M112 149 q 8 3 16 0 q -8 2 -16 0') },
  { id: 'boc_px_neutra', categoria: 'boca', nome: 'Neutra Premium', descricao: 'Serenidade com volume real.', raridade: 'raro', tema: 'executivo', usaCores: ['pele'], acabamento: 'premium', render: labios('M106 143 h 28 q -14 4 -28 0', 'M107 146 q 13 5 26 0 q -13 4 -26 0', 'M113 147.5 q 7 2 14 0 q -7 1.6 -14 0') },
  { id: 'boc_px_meio', categoria: 'boca', nome: 'Meio Sorriso Premium', descricao: 'Canto erguido, plano em andamento.', raridade: 'raro', tema: 'casual', usaCores: ['pele'], acabamento: 'premium', render: labios('M105 144 q 16 2 31 -3 q -14 8 -31 3', 'M107 146 q 14 7 27 -1 q -12 6 -27 1', 'M112 148 q 8 2.6 15 -0.6 q -7 2 -15 0.6') },
  { id: 'boc_px_seria', categoria: 'boca', nome: 'Séria Premium', descricao: 'Linha firme de decisão tomada.', raridade: 'raro', tema: 'executivo', usaCores: ['pele'], acabamento: 'premium', render: labios('M105 144 q 15 -2 30 0 q -15 3 -30 0', 'M107 146.6 q 13 3.4 26 0 q -13 3 -26 0', 'M114 147.4 q 6 1.4 12 0 q -6 1.2 -12 0') },
  { id: 'boc_px_riso', categoria: 'boca', nome: 'Riso Premium', descricao: 'Sorriso aberto com dentes e brilho.', raridade: 'epico', tema: 'casual', usaCores: ['pele'], acabamento: 'premium', render: labios('M102 141 q 18 20 36 0 q -18 9 -36 0', 'M105 143 q 15 6 30 0 l -2.4 4.6 q -12 4.6 -25.2 0 z', 'M109 143.6 q 11 3.6 22 0 l -0.8 1.8 q -10 3 -20.4 0 z', '<path d="M108 152 q 12 6 24 0" fill="none" stroke="rgba(20,12,8,0.5)" stroke-width="1.6" stroke-linecap="round"/>') },
  { id: 'boc_px_pensativa', categoria: 'boca', nome: 'Pensativa Premium', descricao: 'Deslocada de lado, avaliando a jogada.', raridade: 'raro', tema: 'clássico', usaCores: ['pele'], acabamento: 'premium', render: labios('M109 144 q 14 -1 26 2 q -13 5 -26 -2', 'M111 147 q 12 5 22 0.6 q -11 4 -22 -0.6', 'M116 148 q 6 2 12 0.4 q -6 1.6 -12 -0.4') },
  { id: 'boc_px_suave', categoria: 'boca', nome: 'Suave Premium', descricao: 'Quase-sorriso com luz no lábio inferior.', raridade: 'raro', tema: 'casual', usaCores: ['pele'], acabamento: 'premium', render: labios('M106 143.5 q 14 4 28 0 q -14 6 -28 0', 'M108 146.5 q 12 7 24 0 q -12 5 -24 0', 'M113 148.5 q 7 2.6 14 0 q -7 2 -14 0') },
  { id: 'boc_px_determinada', categoria: 'boca', nome: 'Determinada Premium', descricao: 'Pressão sutil de quem não recua.', raridade: 'raro', tema: 'gamer', usaCores: ['pele'], acabamento: 'premium', render: labios('M106 144 q 15 -3 29 -0.6 q -15 4 -29 0.6', 'M108 146 q 13 4 25 -0.6 q -12 4 -25 0.6', 'M115 147 q 6 1.4 11 -0.2 q -5 1.4 -11 0.2') },
];

// ── EXPRESSÕES como PRESETS (§744): pares olhos+boca — SEM campo novo
// no config (a expressão é só uma escolha guiada de itens) ────────────
export const EXPRESSOES_PREMIUM: ReadonlyArray<{ id: string; nome: string; olhos: string; boca: string }> = [
  { id: 'exp_confianca', nome: 'Confiança', olhos: 'olh_px_confiante', boca: 'boc_px_sorriso' },
  { id: 'exp_foco', nome: 'Foco total', olhos: 'olh_px_focado', boca: 'boc_px_determinada' },
  { id: 'exp_serenidade', nome: 'Serenidade', olhos: 'olh_px_sereno', boca: 'boc_px_suave' },
  { id: 'exp_carisma', nome: 'Carisma', olhos: 'olh_px_amendoado', boca: 'boc_px_meio' },
  { id: 'exp_alegria', nome: 'Alegria', olhos: 'olh_px_gentil', boca: 'boc_px_riso' },
  { id: 'exp_estrategia', nome: 'Estrategista', olhos: 'olh_px_determinado', boca: 'boc_px_pensativa' },
  { id: 'exp_misterio', nome: 'Mistério', olhos: 'olh_px_felino', boca: 'boc_px_seria' },
  { id: 'exp_presenca', nome: 'Presença', olhos: 'olh_px_intenso', boca: 'boc_px_neutra' },
];
