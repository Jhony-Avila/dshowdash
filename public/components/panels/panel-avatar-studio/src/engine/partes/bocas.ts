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
  // ── 4.6 F2 · Onda 1 (identidade) — 8 bocas/expressões novas ───────
  {
    id: 'boc_assobio',
    categoria: 'boca',
    nome: 'Assobiando',
    descricao: 'Disfarçando depois de dar deploy na sexta.',
    raridade: 'incomum',
    tema: 'casual',
    render: (p) => `
      <ellipse cx="118" cy="146" rx="6" ry="7" fill="#431d18"/>
      <ellipse cx="118" cy="144" rx="3" ry="3.4" fill="${alfa(p.pele.escuro, 0.55)}"/>
      <g fill="none" stroke="#8fb7ff" stroke-width="2" stroke-linecap="round" opacity="0.85">
        <path d="M136 140 q 5 -3 4 -8"/>
        <path d="M142 146 q 6 -2 6 -8"/>
        <animate attributeName="opacity" values="0.85;0.4;0.85" dur="1.6s" repeatCount="indefinite"/>
      </g>`,
  },
  {
    id: 'boc_travessa',
    categoria: 'boca',
    nome: 'Sorriso Travesso',
    descricao: 'Serrinha de quem já sabe o final da história.',
    raridade: 'raro',
    tema: 'gamer',
    render: () => `
      <path d="M102 142 q 18 16 36 0 l 0 2 l -6 -2 l -6 4 l -6 -4 l -6 4 l -6 -4 l -6 2 z" fill="#431d18"/>
      <path d="M104 143 l 5 3 l 6 -4 l 6 4 l 6 -4 l 6 4 l 5 -3 q -8 6 -17 6 t -17 -6 z" fill="#ffffff"/>`,
  },
  {
    id: 'boc_mascara',
    categoria: 'boca',
    nome: 'Máscara Ninja',
    descricao: 'Metade do rosto em segredo, cem por cento presença.',
    raridade: 'epico',
    tema: 'aventura',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}masc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.roupa.claro}"/>
          <stop offset="1" stop-color="${p.roupa.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M76 128 c 26 14 62 14 88 0 l -4 34 c -18 14 -62 14 -80 0 z" fill="url(#${u}masc)"/>
      <path d="M80 134 q 40 14 80 0" stroke="${alfa(p.destaque.base, 0.8)}" stroke-width="2.4" fill="none"/>
      <path d="M92 148 q 28 8 56 0" stroke="${alfa('#000000', 0.25)}" stroke-width="2" fill="none"/>`,
  },
  {
    id: 'boc_palito',
    categoria: 'boca',
    nome: 'Palito',
    descricao: 'Mastigando o palito enquanto o build compila.',
    raridade: 'incomum',
    tema: 'urbano',
    render: (p) => `
      <path d="M106 145 q 14 6 28 -2" stroke="#5a2e26" stroke-width="4.4" stroke-linecap="round" fill="none"/>
      <path d="M130 143 l 22 -8" stroke="#d8a05c" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="152" cy="135" r="1.8" fill="#b9834a"/>
      <path d="M108 151 q 10 4 20 0" stroke="${alfa(p.pele.escuro, 0.4)}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'boc_chiclete',
    categoria: 'boca',
    nome: 'Chiclete',
    descricao: 'Bola de chiclete no limite da física.',
    raridade: 'raro',
    tema: 'urbano',
    render: () => `
      <path d="M104 143 q 12 8 26 2" stroke="#5a2e26" stroke-width="4.2" stroke-linecap="round" fill="none"/>
      <circle cx="138" cy="152" r="12" fill="#ff8fb8" opacity="0.92">
        <animate attributeName="r" values="12;14;12" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <ellipse cx="134" cy="147" rx="4" ry="3" fill="#ffc2da" opacity="0.85"/>`,
  },
  {
    id: 'boc_barba',
    categoria: 'boca',
    nome: 'Barba Cheia',
    descricao: 'Barba fechada com sorriso de mentor.',
    raridade: 'incomum',
    tema: 'clássico',
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}brb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.cabelo.base}"/>
          <stop offset="1" stop-color="${p.cabelo.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M78 122 c 8 26 20 40 42 40 s 34 -14 42 -40 c -6 4 -12 8 -18 10 c 2 8 -4 16 -10 18 c -4 2 -10 2 -14 2 s -10 0 -14 -2 c -6 -2 -12 -10 -10 -18 c -6 -2 -12 -6 -18 -10 z" fill="url(#${u}brb)"/>
      <path d="M108 142 q 12 8 24 0" stroke="#431d18" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M88 132 q 4 8 10 12 M152 132 q -4 8 -10 12" stroke="${alfa(p.cabelo.claro, 0.35)}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'boc_cavanhaque',
    categoria: 'boca',
    nome: 'Cavanhaque',
    descricao: 'Moldura fina para decisões afiadas.',
    raridade: 'comum',
    tema: 'clássico',
    usaCores: ['cabelo'],
    render: (p) => `
      <path d="M104 142 q 16 12 32 0" stroke="#5a2e26" stroke-width="4.4" stroke-linecap="round" fill="none"/>
      <path d="M104 140 q 16 22 32 0 l 2 8 q -18 20 -36 0 z" fill="none" stroke="${p.cabelo.profundo}" stroke-width="5" stroke-linecap="round"/>
      <path d="M114 158 q 6 4 12 0 l -2 6 q -4 3 -8 0 z" fill="${p.cabelo.profundo}"/>
      <path d="M112 134 h 16" stroke="${alfa(p.cabelo.profundo, 0.75)}" stroke-width="3.4" stroke-linecap="round"/>`,
  },
  {
    id: 'boc_uau',
    categoria: 'boca',
    nome: 'Uau',
    descricao: 'O "o" involuntário da demo perfeita.',
    raridade: 'comum',
    tema: 'casual',
    render: (p) => `
      <ellipse cx="120" cy="147" rx="8" ry="9" fill="#431d18"/>
      <ellipse cx="120" cy="150" rx="4.6" ry="4" fill="#c2554d"/>
      <path d="M112 141 a 8 9 0 0 1 16 0" fill="none" stroke="${alfa(p.pele.escuro, 0.4)}" stroke-width="2"/>`,
  },
];
