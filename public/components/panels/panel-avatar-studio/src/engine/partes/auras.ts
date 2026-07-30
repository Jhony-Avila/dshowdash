// engine/partes/auras.ts — AURAS dedicadas (Expansão §20 — separadas dos
// efeitos: presença CONSTANTE atrás do personagem, nunca um evento).
// @version 1.0.0  @created 2026-07-30
//
// Pintadas entre o banner e os efeitos-atrás. Tingidas pelo DESTAQUE —
// mesma linguagem do aro contextual do header. SMIL leve (opacity/rotate).
import { alfa } from '../cores';
import type { ParteDef } from '../base-api';

export const AURAS: ParteDef[] = [
  {
    id: 'aur_neon',
    categoria: 'aura',
    nome: 'Aura Neon',
    descricao: 'Dois anéis de neon respirando em volta de você.',
    raridade: 'raro',
    tema: 'cyberpunk',
    usaCores: ['destaque'],
    render: (p, u) => `
      <g id="${u}an">
        <circle cx="120" cy="128" r="92" fill="none" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="3">
          <animate attributeName="opacity" values="0.9;0.45;0.9" dur="3.2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="120" cy="128" r="80" fill="none" stroke="${alfa(p.destaque.claro, 0.32)}" stroke-width="1.6">
          <animate attributeName="opacity" values="0.5;0.95;0.5" dur="3.2s" repeatCount="indefinite"/>
        </circle>
      </g>`,
  },
  {
    id: 'aur_plasma',
    categoria: 'aura',
    nome: 'Aura de Plasma',
    descricao: 'Camadas de plasma pulsando em ondas concêntricas.',
    raridade: 'epico',
    tema: 'sci-fi',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <radialGradient id="${u}apl" cx="0.5" cy="0.53" r="0.5">
          <stop offset="0.45" stop-color="${alfa(p.destaque.base, 0)}"/>
          <stop offset="0.72" stop-color="${alfa(p.destaque.base, 0.34)}"/>
          <stop offset="0.86" stop-color="${alfa(p.destaque.claro, 0.16)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0)}"/>
        </radialGradient>
      </defs>
      <circle cx="120" cy="128" r="104" fill="url(#${u}apl)">
        <animate attributeName="r" values="96;106;96" dur="4.2s" repeatCount="indefinite"/>
      </circle>
      <ellipse cx="120" cy="128" rx="88" ry="84" fill="none" stroke="${alfa(p.destaque.claro, 0.4)}" stroke-width="2">
        <animate attributeName="opacity" values="0.7;0.25;0.7" dur="2.8s" repeatCount="indefinite"/>
      </ellipse>`,
  },
  {
    id: 'aur_eletrica',
    categoria: 'aura',
    nome: 'Aura Elétrica',
    descricao: 'Arcos de eletricidade estalando no contorno.',
    raridade: 'epico',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p, u) => `
      <g id="${u}ae" fill="none" stroke-linecap="round">
        <path d="M42 92 L54 78 L48 96 L62 84" stroke="${alfa(p.destaque.claro, 0.85)}" stroke-width="2.4">
          <animate attributeName="opacity" values="0;1;0;0;1;0" dur="1.9s" repeatCount="indefinite"/>
        </path>
        <path d="M196 74 L184 90 L198 86 L186 104" stroke="${alfa(p.destaque.base, 0.8)}" stroke-width="2.2">
          <animate attributeName="opacity" values="1;0;0;1;0;1" dur="2.3s" repeatCount="indefinite"/>
        </path>
        <path d="M36 168 L52 160 L44 176 L60 170" stroke="${alfa(p.destaque.base, 0.7)}" stroke-width="2">
          <animate attributeName="opacity" values="0;0;1;0;1;0" dur="1.7s" repeatCount="indefinite"/>
        </path>
        <path d="M202 156 L188 166 L200 170 L186 182" stroke="${alfa(p.destaque.claro, 0.75)}" stroke-width="2.2">
          <animate attributeName="opacity" values="1;0;1;0;0;1" dur="2.1s" repeatCount="indefinite"/>
        </path>
        <circle cx="120" cy="128" r="95" stroke="${alfa(p.destaque.base, 0.28)}" stroke-width="1.4" stroke-dasharray="3 9">
          <animateTransform attributeName="transform" type="rotate" from="0 120 128" to="360 120 128" dur="14s" repeatCount="indefinite"/>
        </circle>
      </g>`,
  },
  {
    id: 'aur_cristal',
    categoria: 'aura',
    nome: 'Aura de Cristal',
    descricao: 'Lascas cristalinas orbitando em silêncio absoluto.',
    raridade: 'lendario',
    tema: 'fantasia',
    usaCores: ['destaque'],
    render: (p, u) => `
      <g id="${u}ac">
        <g>
          <path d="M120 26 L127 40 L120 54 L113 40 Z" fill="${alfa(p.destaque.claro, 0.85)}"/>
          <path d="M212 128 L200 135 L188 128 L200 121 Z" fill="${alfa(p.destaque.base, 0.7)}"/>
          <path d="M120 224 L113 212 L120 200 L127 212 Z" fill="${alfa(p.destaque.claro, 0.6)}"/>
          <path d="M28 128 L40 121 L52 128 L40 135 Z" fill="${alfa(p.destaque.base, 0.75)}"/>
          <animateTransform attributeName="transform" type="rotate" from="0 120 128" to="360 120 128" dur="22s" repeatCount="indefinite"/>
        </g>
        <circle cx="120" cy="128" r="88" fill="none" stroke="${alfa(p.destaque.claro, 0.22)}" stroke-width="6">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="5s" repeatCount="indefinite"/>
        </circle>
      </g>`,
  },
  {
    id: 'aur_dshow',
    categoria: 'aura',
    nome: 'Aura LED Dshow',
    descricao: 'O anel LED oficial da casa — segmentos varrendo a órbita.',
    raridade: 'exclusivo',
    tema: 'dshow',
    usaCores: ['destaque'],
    render: (p, u) => `
      <g id="${u}ad">
        <circle cx="120" cy="128" r="98" fill="none" stroke="${alfa(p.destaque.base, 0.62)}"
          stroke-width="5" stroke-dasharray="26 18" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 120 128" to="360 120 128" dur="9s" repeatCount="indefinite"/>
        </circle>
        <circle cx="120" cy="128" r="88" fill="none" stroke="${alfa(p.destaque.claro, 0.35)}"
          stroke-width="2" stroke-dasharray="6 14" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" from="360 120 128" to="0 120 128" dur="13s" repeatCount="indefinite"/>
        </circle>
      </g>`,
  },
  {
    id: 'aur_orbital',
    categoria: 'aura',
    nome: 'Anel Orbital',
    descricao: 'Um anel fino e constante, como um satélite fiel.',
    raridade: 'incomum',
    tema: 'espaço',
    usaCores: ['destaque'],
    render: (p, u) => `
      <g id="${u}ao" transform="rotate(-8 120 132)">
        <ellipse cx="120" cy="132" rx="98" ry="26" fill="none"
          stroke="${alfa(p.destaque.base, 0.45)}" stroke-width="2.4"/>
      </g>
      <circle cx="24" cy="120" r="4" fill="${p.destaque.claro}">
        <animate attributeName="opacity" values="1;0.4;1" dur="2.6s" repeatCount="indefinite"/>
      </circle>`,
  },
  {
    id: 'aur_gelo',
    categoria: 'aura',
    nome: 'Aura Glacial',
    descricao: 'Névoa fria e cristais suspensos — calma absoluta.',
    raridade: 'raro',
    tema: 'fantasia',
    usaCores: ['destaque'],
    render: (_p, u) => `
      <defs>
        <radialGradient id="${u}agl" cx="0.5" cy="0.55" r="0.52">
          <stop offset="0.5" stop-color="${alfa('#bfe8ff', 0)}"/>
          <stop offset="0.85" stop-color="${alfa('#bfe8ff', 0.3)}"/>
          <stop offset="1" stop-color="${alfa('#bfe8ff', 0)}"/>
        </radialGradient>
      </defs>
      <circle cx="120" cy="128" r="100" fill="url(#${u}agl)"/>
      <g fill="${alfa('#e6f6ff', 0.9)}">
        <path d="M58 92 l 3 6 l -3 6 l -3 -6 Z">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="3.4s" repeatCount="indefinite"/>
        </path>
        <path d="M186 110 l 2.6 5 l -2.6 5 l -2.6 -5 Z">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2.8s" repeatCount="indefinite"/>
        </path>
        <path d="M70 176 l 2.4 4.6 l -2.4 4.6 l -2.4 -4.6 Z">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3.9s" repeatCount="indefinite"/>
        </path>
      </g>`,
  },
  {
    id: 'aur_fenix',
    categoria: 'aura',
    nome: 'Aura de Fênix',
    descricao: 'Labaredas orbitando devagar — renasce a cada trimestre.',
    raridade: 'mitico',
    tema: 'fantasia',
    usaCores: ['destaque'],
    render: (_p, u) => `
      <g id="${u}afx">
        <g>
          <path d="M120 22 q 8 12 0 24 q -8 -12 0 -24 z" fill="${alfa('#ffb347', 0.85)}"/>
          <path d="M214 128 q -12 8 -24 0 q 12 -8 24 0 z" fill="${alfa('#ff7847', 0.8)}"/>
          <path d="M120 234 q -8 -12 0 -24 q 8 12 0 24 z" fill="${alfa('#ffb347', 0.75)}"/>
          <path d="M26 128 q 12 -8 24 0 q -12 8 -24 0 z" fill="${alfa('#ff7847', 0.85)}"/>
          <animateTransform attributeName="transform" type="rotate" from="0 120 128" to="360 120 128" dur="12s" repeatCount="indefinite"/>
        </g>
        <circle cx="120" cy="128" r="92" fill="none" stroke="${alfa('#ff9347', 0.3)}" stroke-width="8">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2.2s" repeatCount="indefinite"/>
        </circle>
      </g>`,
  },
];
