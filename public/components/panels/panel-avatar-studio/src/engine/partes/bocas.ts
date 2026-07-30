// engine/partes/bocas.ts — bocas e expressões inferiores do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Ancoradas em y≈146 (centro x=120).
import { alfa } from '../cores';
import type { ParteDef } from '../base-api';

export const BOCAS: ParteDef[] = [
  {
    id: 'boc_sorriso',
    categoria: 'boca',
    nome: 'Sorriso',
    descricao: 'Sorriso leve e seguro.',
    raridade: 'comum',
    tema: 'clássico',
    render: (p) => `
      <path d="M104 142 q 16 14 32 0" stroke="#5a2e26" stroke-width="4.6" stroke-linecap="round" fill="none"/>
      <path d="M108 150 q 12 6 24 0" stroke="${alfa(p.pele.escuro, 0.5)}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'boc_neutra',
    categoria: 'boca',
    nome: 'Neutra',
    descricao: 'Expressão serena de poker face.',
    raridade: 'comum',
    tema: 'executivo',
    render: (p) => `
      <line x1="108" y1="145" x2="132" y2="145" stroke="#5a2e26" stroke-width="4.4" stroke-linecap="round"/>
      <line x1="110" y1="151" x2="130" y2="151" stroke="${alfa(p.pele.escuro, 0.4)}" stroke-width="2" stroke-linecap="round"/>`,
  },
  {
    id: 'boc_larga',
    categoria: 'boca',
    nome: 'Gargalhada',
    descricao: 'Sorriso aberto com dentes — vitória garantida.',
    raridade: 'comum',
    tema: 'casual',
    render: () => `
      <path d="M102 140 q 18 22 36 0 q -18 8 -36 0 z" fill="#431d18"/>
      <path d="M105 141 q 15 6 30 0 l -2 5 q -13 5 -26 0 z" fill="#ffffff"/>
      <path d="M111 152 q 9 5 18 0 q -4 5 -9 5 t -9 -5 z" fill="#c2554d"/>`,
  },
  {
    id: 'boc_lado',
    categoria: 'boca',
    nome: 'Sorriso de Canto',
    descricao: 'Meio sorriso de quem sabe o que está fazendo.',
    raridade: 'incomum',
    tema: 'gamer',
    render: (p) => `
      <path d="M104 146 q 16 6 34 -6" stroke="#5a2e26" stroke-width="4.6" stroke-linecap="round" fill="none"/>
      <path d="M136 141 l 4 -2" stroke="#5a2e26" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M108 152 q 10 4 20 0" stroke="${alfa(p.pele.escuro, 0.4)}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'boc_determinada',
    categoria: 'boca',
    nome: 'Determinada',
    descricao: 'Lábios firmes antes da jogada decisiva.',
    raridade: 'incomum',
    tema: 'executivo',
    render: (p) => `
      <path d="M106 147 q 14 -5 28 0" stroke="#5a2e26" stroke-width="4.6" stroke-linecap="round" fill="none"/>
      <path d="M110 153 q 10 2 20 0" stroke="${alfa(p.pele.escuro, 0.4)}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'boc_surpresa',
    categoria: 'boca',
    nome: 'Surpresa',
    descricao: 'Quando o CTR dobra sem ninguém mexer em nada.',
    raridade: 'comum',
    tema: 'casual',
    render: () => `
      <ellipse cx="120" cy="146" rx="8" ry="10" fill="#431d18"/>
      <ellipse cx="120" cy="150" rx="4.5" ry="5" fill="#c2554d"/>
      <ellipse cx="117" cy="141" rx="2.4" ry="3" fill="${alfa('#ffffff', 0.35)}"/>`,
  },
  {
    id: 'boc_lingua',
    categoria: 'boca',
    nome: 'Deboche',
    descricao: 'Resposta oficial para "isso não vai funcionar".',
    raridade: 'incomum',
    tema: 'casual',
    render: () => `
      <path d="M103 141 q 17 16 34 0 q -17 6 -34 0 z" fill="#431d18"/>
      <path d="M116 148 q 8 3 15 -1 l 2 8 c 1 6 -4 10 -9 10 s -10 -4 -9 -10 z" fill="#d9625a"/>
      <path d="M122 150 l 1 12" stroke="#b04840" stroke-width="1.6"/>`,
  },
  {
    id: 'boc_bigode',
    categoria: 'boca',
    nome: 'Bigode de Respeito',
    descricao: 'Aprovado em todas as reuniões desde 1974.',
    raridade: 'incomum',
    tema: 'clássico',
    usaCores: ['cabelo'],
    render: (p) => `
      <path d="M106 143 q 14 -5 28 0" stroke="#5a2e26" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M120 136 c -4 -6 -14 -7 -19 -2 c -4 4 -3 10 2 11 c 6 1 13 -3 17 -9 z" fill="${p.cabelo.base}"/>
      <path d="M120 136 c 4 -6 14 -7 19 -2 c 4 4 3 10 -2 11 c -6 1 -13 -3 -17 -9 z" fill="${p.cabelo.base}"/>
      <path d="M104 132 q 8 -3 14 2 m 4 0 q 6 -5 14 -2" stroke="${alfa(p.cabelo.escuro, 0.6)}" stroke-width="1.6" fill="none"/>`,
  },
  {
    id: 'boc_vilao',
    categoria: 'boca',
    nome: 'Sorriso de Vilão',
    descricao: 'O plano está em movimento. Há semanas.',
    raridade: 'raro',
    tema: 'fantasia',
    render: () => `
      <path d="M100 140 q 20 18 40 -2 q -8 12 -20 12 t -20 -10 z" fill="#431d18"/>
      <path d="M106 143 l 4 8 l 5 -6 z" fill="#fdfdfa"/>
      <path d="M134 141 l -4 8 l -5 -6 z" fill="#fdfdfa"/>`,
  },
  {
    id: 'boc_grade',
    categoria: 'boca',
    nome: 'Grade Sintética',
    descricao: 'Alto-falante de androide com filete de luz.',
    raridade: 'raro',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p) => `
      <rect x="103" y="138" width="34" height="15" rx="7" fill="#0c0f1a" stroke="${alfa('#000000', 0.4)}" stroke-width="1"/>
      <g stroke="${p.destaque.base}" stroke-width="2" stroke-linecap="round" opacity="0.9">
        <line x1="110" y1="142" x2="110" y2="149"/>
        <line x1="117" y1="142" x2="117" y2="149"/>
        <line x1="124" y1="142" x2="124" y2="149"/>
        <line x1="131" y1="142" x2="131" y2="149"/>
      </g>`,
  },
];
