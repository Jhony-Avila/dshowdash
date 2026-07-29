// engine/partes/acessorios.ts — acessórios do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Renderizam ACIMA do cabelo (boné achata, headset envolve). Categoria opcional.
import { alfa } from '../cores';
import type { ParteDef } from '../base-api';

export const ACESSORIOS: ParteDef[] = [
  {
    id: 'ace_brinco',
    categoria: 'acessorio',
    nome: 'Brinco de Argola',
    descricao: 'Detalhe dourado discreto na orelha.',
    raridade: 'comum',
    tema: 'casual',
    render: () => `
      <circle cx="170" cy="124" r="5" fill="none" stroke="#e8b64c" stroke-width="2.6"/>
      <circle cx="168.5" cy="121" r="1.2" fill="#fff3c9"/>`,
  },
  {
    id: 'ace_oculos',
    categoria: 'acessorio',
    nome: 'Óculos de Grau',
    descricao: 'Armação redonda de intelectual.',
    raridade: 'comum',
    tema: 'executivo',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}lente" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa('#cfe0ff', 0.35)}"/>
          <stop offset="1" stop-color="${alfa('#cfe0ff', 0.08)}"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="108" r="15" fill="url(#${u}lente)" stroke="#20242e" stroke-width="3"/>
      <circle cx="140" cy="108" r="15" fill="url(#${u}lente)" stroke="#20242e" stroke-width="3"/>
      <path d="M115 106 q 5 -4 10 0" stroke="#20242e" stroke-width="3" fill="none"/>
      <line x1="85" y1="106" x2="72" y2="102" stroke="#20242e" stroke-width="3"/>
      <line x1="155" y1="106" x2="168" y2="102" stroke="#20242e" stroke-width="3"/>
      <path d="M92 100 a 15 15 0 0 1 8 -6" stroke="${alfa('#ffffff', 0.6)}" stroke-width="2" fill="none"/>`,
  },
  {
    id: 'ace_oculos_sol',
    categoria: 'acessorio',
    nome: 'Óculos Escuros',
    descricao: 'Deal fechado, sol na cara, estilo intacto.',
    raridade: 'incomum',
    tema: 'casual',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}sol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#262b38"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M84 98 h 32 a 5 5 0 0 1 5 5 v 6 a 12 12 0 0 1 -12 12 h -18 a 12 12 0 0 1 -12 -12 v -6 a 5 5 0 0 1 5 -5 z" fill="url(#${u}sol)" stroke="#14171f" stroke-width="2"/>
      <path d="M124 98 h 32 a 5 5 0 0 1 5 5 v 6 a 12 12 0 0 1 -12 12 h -18 a 12 12 0 0 1 -12 -12 v -6 a 5 5 0 0 1 5 -5 z" fill="url(#${u}sol)" stroke="#14171f" stroke-width="2"/>
      <path d="M116 103 h 8" stroke="#14171f" stroke-width="3"/>
      <line x1="79" y1="103" x2="70" y2="100" stroke="#14171f" stroke-width="3"/>
      <line x1="161" y1="103" x2="170" y2="100" stroke="#14171f" stroke-width="3"/>
      <path d="M88 102 l 20 14" stroke="${alfa('#ffffff', 0.22)}" stroke-width="4" stroke-linecap="round"/>
      <path d="M128 102 l 20 14" stroke="${alfa('#ffffff', 0.22)}" stroke-width="4" stroke-linecap="round"/>`,
  },
  {
    id: 'ace_fone',
    categoria: 'acessorio',
    nome: 'Fone Minimal',
    descricao: 'Headband slim para a playlist de foco.',
    raridade: 'incomum',
    tema: 'casual',
    usaCores: ['destaque'],
    render: (p) => `
      <path d="M66 108 c 0 -34 24 -54 54 -54 s 54 20 54 54" stroke="#20242e" stroke-width="7" fill="none" stroke-linecap="round"/>
      <rect x="58" y="100" width="16" height="26" rx="8" fill="#20242e"/>
      <rect x="166" y="100" width="16" height="26" rx="8" fill="#20242e"/>
      <rect x="62" y="106" width="8" height="14" rx="4" fill="${p.destaque.base}"/>
      <rect x="170" y="106" width="8" height="14" rx="4" fill="${p.destaque.base}"/>`,
  },
  {
    id: 'ace_bone',
    categoria: 'acessorio',
    nome: 'Boné Snapback',
    descricao: 'Aba reta com logo bordado.',
    raridade: 'raro',
    tema: 'casual',
    usaCores: ['roupa', 'destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}bone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.roupa.claro}"/>
          <stop offset="1" stop-color="${p.roupa.escuro}"/>
        </linearGradient>
      </defs>
      <path d="M70 92 c 0 -30 22 -46 50 -46 s 50 16 50 46 l -2 4 c -30 -10 -66 -10 -96 0 z" fill="url(#${u}bone)"/>
      <path d="M118 46 c 2 -6 6 -8 10 -6 c -2 2 -4 6 -4 8 z" fill="${p.roupa.escuro}"/>
      <path d="M166 90 h 30 a 6 6 0 0 1 6 6 c 0 4 -3 6 -8 6 l -30 -4 z" fill="${p.roupa.profundo}"/>
      <path d="M70 92 c 30 -10 66 -10 96 0 l 2 6 c -32 -10 -68 -10 -100 0 z" fill="${p.roupa.profundo}"/>
      <circle cx="120" cy="70" r="9" fill="${alfa('#000000', 0.25)}"/>
      <path d="M116 66 l 4 8 l 4 -8 m -8 4 h 8" stroke="${p.destaque.claro}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'ace_headset',
    categoria: 'acessorio',
    nome: 'Headset Pro Gamer',
    descricao: 'Conchas RGB com microfone articulado.',
    raridade: 'epico',
    tema: 'gamer',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}hs" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3a4152"/>
          <stop offset="1" stop-color="#161a24"/>
        </linearGradient>
      </defs>
      <path d="M62 110 c -2 -40 26 -62 58 -62 s 60 22 58 62" stroke="#161a24" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M64 108 c -2 -36 24 -56 56 -56" stroke="${alfa('#ffffff', 0.18)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="50" y="94" width="24" height="40" rx="12" fill="url(#${u}hs)"/>
      <rect x="166" y="94" width="24" height="40" rx="12" fill="url(#${u}hs)"/>
      <rect x="56" y="102" width="12" height="24" rx="6" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.8s" repeatCount="indefinite"/>
      </rect>
      <rect x="172" y="102" width="12" height="24" rx="6" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.8s" repeatCount="indefinite" begin="1.4s"/>
      </rect>
      <path d="M62 130 c 0 18 14 28 34 30" stroke="#161a24" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="102" cy="162" rx="8" ry="6" fill="#161a24"/>
      <circle cx="102" cy="162" r="2.4" fill="${p.destaque.claro}"/>`,
  },
  {
    id: 'ace_coroa',
    categoria: 'acessorio',
    nome: 'Coroa do Top 1',
    descricao: 'Ouro maciço para quem lidera o ranking.',
    raridade: 'lendario',
    tema: 'fantasia',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}coroa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffe89a"/>
          <stop offset="0.5" stop-color="#e8b64c"/>
          <stop offset="1" stop-color="#b07d1e"/>
        </linearGradient>
      </defs>
      <path d="M86 58 l 8 -26 l 14 18 l 12 -24 l 12 24 l 14 -18 l 8 26 c -22 -8 -46 -8 -68 0 z" fill="url(#${u}coroa)" stroke="#8a5f10" stroke-width="1.6"/>
      <path d="M86 58 c 22 -8 46 -8 68 0 l -2 8 c -20 -7 -44 -7 -64 0 z" fill="#b07d1e"/>
      <circle cx="120" cy="34" r="4" fill="#ff5f8f"/>
      <circle cx="97" cy="40" r="3" fill="#4cd9e8"/>
      <circle cx="143" cy="40" r="3" fill="#4cd9e8"/>
      <circle cx="120" cy="33" r="1.4" fill="#ffffff" opacity="0.9"/>`,
  },
];
