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
