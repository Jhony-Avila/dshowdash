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

/** Nariz INTEGRADO (§739): dorso em luz + base em meia-sombra + narinas. */
function narizPremium(t: ReturnType<typeof tintaPremium>, comprimento = 0): string {
  const yBase = 132 + comprimento;
  return `
    <path d="M120 112 q -2.4 ${12 + comprimento} -4.6 ${17 + comprimento}" stroke="${alfa(t.escuro, 0.34)}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    <path d="M118 110 q 3 ${10 + comprimento} 3.4 ${16 + comprimento}" stroke="${alfa('#ffffff', 0.22)}" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M113 ${yBase} q 7 5 14 0" stroke="${alfa(t.escuro, 0.42)}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    <ellipse cx="114.6" cy="${yBase + 0.6}" rx="1.7" ry="1.1" fill="${alfa(t.profundo, 0.5)}"/>
    <ellipse cx="125.4" cy="${yBase + 0.6}" rx="1.7" ry="1.1" fill="${alfa(t.profundo, 0.5)}"/>
    <ellipse cx="120" cy="${yBase - 3.4}" rx="3.2" ry="2" fill="${alfa('#ffffff', 0.14)}"/>`;
}

/** Bochechas (§740): meia-luz quente sutil — volume, não blush chapado. */
function bochechas(t: ReturnType<typeof tintaPremium>): string {
  return `
    <ellipse cx="97" cy="127" rx="10" ry="6.5" fill="${alfa(t.claro, 0.28)}"/>
    <ellipse cx="143" cy="127" rx="10" ry="6.5" fill="${alfa(t.meio, 0.24)}"/>`;
}

/** Arcada superciliar NEUTRA (§703: olhos premium vêm sem sobrancelha). */
function arcada(t: ReturnType<typeof tintaPremium>): string {
  return `
    <path d="M89 95 q 11 -4.5 22 -1.5" stroke="${alfa(t.escuro, 0.20)}" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M129 93.5 q 11 -3 22 1.5" stroke="${alfa(t.escuro, 0.20)}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
}

/** Construtor da base premium: cabeça (path), maxilar, queixo e extras. */
function basePremium(cabeca: string, jawline: string, extras: (t: ReturnType<typeof tintaPremium>) => string, comprimentoNariz = 0): ParteRender {
  return (p: Paleta, u: string) => {
    const t = tintaPremium(p.pele.base);
    return `
      <defs>${defsPelePremium(u, p.pele.base)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pxpesc)"/>
      <path d="M103 176 q 17 6 34 0 l -2 6 q -15 5 -30 0 z" fill="${alfa(t.profundo, 0.32)}"/>
      <path d="${cabeca}" fill="url(#${u}pxpele)"/>
      <path d="${jawline}" fill="none" stroke="${alfa(t.escuro, 0.35)}" stroke-width="2.6" stroke-linecap="round"/>
      ${orelhaPremium(70, t, 1)}${orelhaPremium(170, t, -1)}
      ${bochechas(t)}
      ${narizPremium(t, comprimentoNariz)}
      ${arcada(t)}
      <ellipse cx="120" cy="152" rx="19" ry="6.4" fill="${alfa(t.profundo, 0.26)}"/>
      <path d="M120 156 q 4 2 0 4 q -4 -2 0 -4" fill="${alfa('#ffffff', 0.16)}"/>
      <path d="M80 72 a 52 58 0 0 1 44 -22" stroke="${alfa('#ffffff', 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M158 78 a 52 58 0 0 1 8 26" stroke="${alfa(t.escuro, 0.3)}" stroke-width="4" stroke-linecap="round" fill="none"/>
      ${extras(t)}`;
  };
}

const CAB_OVAL = 'M120 49 a 50 57 0 0 1 50 57 a 50 57 0 0 1 -100 0 a 50 57 0 0 1 50 -57';
const CAB_ANGULAR = 'M120 49 c 30 0 50 24 50 55 c 0 24 -14 44 -32 54 l -18 8 l -18 -8 c -18 -10 -32 -30 -32 -54 c 0 -31 20 -55 50 -55';
const CAB_CORACAO = 'M120 49 c 32 0 52 22 50 52 c -2 26 -20 46 -34 56 l -16 9 l -16 -9 c -14 -10 -32 -30 -34 -56 c -2 -30 18 -52 50 -52';
const CAB_QUADRADA = 'M120 50 c 28 0 48 20 48 50 l 0 14 c 0 24 -20 44 -48 48 c -28 -4 -48 -24 -48 -48 l 0 -14 c 0 -30 20 -50 48 -50';
const CAB_REDONDA = 'M120 51 a 52 55 0 0 1 52 55 a 52 55 0 0 1 -104 0 a 52 55 0 0 1 52 -55';
const CAB_ALONGADA = 'M120 47 a 46 60 0 0 1 46 60 a 46 60 0 0 1 -92 0 a 46 60 0 0 1 46 -60';
const CAB_DIAMANTE = 'M120 49 c 26 4 44 24 46 50 c 2 22 -16 46 -30 56 l -16 10 l -16 -10 c -14 -10 -32 -34 -30 -56 c 2 -26 20 -46 46 -50';
const CAB_SUAVE = 'M120 50 a 49 56 0 0 1 49 56 c 0 26 -18 48 -38 55 l -11 4 l -11 -4 c -20 -7 -38 -29 -38 -55 a 49 56 0 0 1 49 -56';

export const BASES_PREMIUM: ParteDef[] = [
  { id: 'bas_px_oval', categoria: 'base', nome: 'Oval Premium', descricao: 'Estrutura oval clássica com volume real de estúdio.', raridade: 'raro', tema: 'clássico', usaCores: ['pele'], acabamento: 'premium', render: basePremium(CAB_OVAL, 'M92 148 q 28 22 56 0', (t) => `<path d="M108 166 q 12 5 24 0" stroke="${alfa(t.escuro, 0.22)}" stroke-width="2" stroke-linecap="round" fill="none"/>`) },
  { id: 'bas_px_angular', categoria: 'base', nome: 'Angular Premium', descricao: 'Maxilar desenhado e queixo firme de protagonista.', raridade: 'raro', tema: 'clássico', usaCores: ['pele'], acabamento: 'premium', render: basePremium(CAB_ANGULAR, 'M90 142 l 14 18 l 16 8 l 16 -8 l 14 -18', (t) => `<path d="M112 168 h 16" stroke="${alfa(t.profundo, 0.3)}" stroke-width="2.4" stroke-linecap="round"/>`) },
  { id: 'bas_px_coracao', categoria: 'base', nome: 'Coração Premium', descricao: 'Testa ampla e queixo delicado — luz que abraça.', raridade: 'raro', tema: 'clássico', usaCores: ['pele'], acabamento: 'premium', render: basePremium(CAB_CORACAO, 'M94 144 q 26 26 52 0', () => `<ellipse cx="120" cy="90" rx="26" ry="8" fill="${alfa('#ffffff', 0.12)}"/>`, -2) },
  { id: 'bas_px_quadrada', categoria: 'base', nome: 'Quadrada Premium', descricao: 'Linhas fortes e presença de capa de revista.', raridade: 'raro', tema: 'executivo', usaCores: ['pele'], acabamento: 'premium', render: basePremium(CAB_QUADRADA, 'M88 140 l 10 16 l 22 10 l 22 -10 l 10 -16', (t) => `<path d="M96 158 l 8 6 M144 158 l -8 6" stroke="${alfa(t.escuro, 0.25)}" stroke-width="2" stroke-linecap="round"/>`, 1) },
  { id: 'bas_px_redonda', categoria: 'base', nome: 'Redonda Premium', descricao: 'Suavidade circular com bochechas em meia-luz.', raridade: 'raro', tema: 'casual', usaCores: ['pele'], acabamento: 'premium', render: basePremium(CAB_REDONDA, 'M94 150 q 26 18 52 0', (t) => `<ellipse cx="98" cy="130" rx="8" ry="5" fill="${alfa(t.claro, 0.2)}"/>`) },
  { id: 'bas_px_alongada', categoria: 'base', nome: 'Alongada Premium', descricao: 'Rosto esguio, maçãs altas, elegância vertical.', raridade: 'raro', tema: 'clássico', usaCores: ['pele'], acabamento: 'premium', render: basePremium(CAB_ALONGADA, 'M96 150 q 24 20 48 0', (t) => `<path d="M92 118 q 4 10 10 14 M148 118 q -4 10 -10 14" stroke="${alfa(t.meio, 0.4)}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`, 3) },
  { id: 'bas_px_diamante', categoria: 'base', nome: 'Diamante Premium', descricao: 'Maçãs salientes e têmporas recuadas — geometria rara.', raridade: 'epico', tema: 'clássico', usaCores: ['pele'], acabamento: 'premium', render: basePremium(CAB_DIAMANTE, 'M92 140 q 28 30 56 0', () => `<path d="M90 118 l 8 8 M150 118 l -8 8" stroke="${alfa('#ffffff', 0.2)}" stroke-width="2.2" stroke-linecap="round"/>`, 0) },
  { id: 'bas_px_suave', categoria: 'base', nome: 'Suave Premium', descricao: 'Contornos gentis com sombreamento sedoso.', raridade: 'raro', tema: 'casual', usaCores: ['pele'], acabamento: 'premium', render: basePremium(CAB_SUAVE, 'M96 148 q 24 18 48 0', (t) => `<ellipse cx="120" cy="142" rx="30" ry="10" fill="${alfa(t.claro, 0.1)}"/>`, -1) },
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
  return `
    <g transform="rotate(${tilt} ${x} ${y})">
      <ellipse cx="${x}" cy="${y}" rx="10.8" ry="${ry}" fill="#f8f3ea"/>
      <path d="M${x - 10.4} ${y - 1} a 10.8 ${ry} 0 0 1 21.6 0" fill="${alfa('#c9b8a4', 0.35)}"/>
      <circle cx="${x}" cy="${y + 0.4}" r="${irisR}" fill="${iris.escuro}"/>
      <circle cx="${x}" cy="${y + 0.4}" r="${irisR - 1.6}" fill="${iris.base}"/>
      <path d="M${x - irisR + 2.1} ${y + 1.8} a ${irisR - 1.7} ${irisR - 1.7} 0 0 0 ${2 * (irisR - 1.7) - 0.8} 0" fill="none" stroke="${iris.claro}" stroke-width="1.1" opacity="0.75"/>
      <circle cx="${x}" cy="${y + 0.4}" r="2.3" fill="#100c08"/>
      <g id="${u}pxcatch${lado}">
        <circle cx="${x + 2}" cy="${y - 1.9}" r="1.6" fill="#ffffff" opacity="0.95"/>
        <circle cx="${x - 2.4}" cy="${y + 2.2}" r="0.8" fill="#ffffff" opacity="0.55"/>
      </g>
      <path d="M${x - 10.6} ${y - 2 - palp} a 10.8 ${ry} 0 0 1 21.2 0" fill="none" stroke="${alfa('#141008', 0.55)}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M${x - 11} ${y - 4.6 - palp} a 12 ${ry + 1} 0 0 1 22 -0.6" fill="none" stroke="${alfa('#141008', 0.2)}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M${x + 9.4} ${y - 4.2} l 2.6 -1.8 M${x + 10.6} ${y - 1.6} l 2.8 -0.8" stroke="${alfa('#141008', 0.5)}" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M${x - 9.8} ${y + ry - 2.4} a 11 ${ry} 0 0 0 19.6 0" fill="none" stroke="${alfa('#ffffff', 0.3)}" stroke-width="1.2"/>
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
    const labio = tintaPremium('#8a4a3e');
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
