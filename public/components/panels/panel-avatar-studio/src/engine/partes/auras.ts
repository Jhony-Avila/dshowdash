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
  // ── 4.6 F2 · Onda 3 (poderes) — 7 auras novas (meta §28: 15 ✓) ────
  {
    id: 'aur_solar',
    categoria: 'aura',
    nome: 'Aura Solar',
    descricao: 'Raios dourados girando devagar, como um amanhecer fiel.',
    raridade: 'raro',
    tema: 'fantasia',
    render: (_p, u) => {
      let raios = '';
      for (let i = 0; i < 12; i++) {
        raios += `<rect x="-2.4" y="-104" width="4.8" height="26" rx="2.4" fill="${alfa('#ffd75e', 0.55)}" transform="rotate(${i * 30})"/>`;
      }
      return `
      <g id="${u}asol" transform="translate(120 128)">
        <g>${raios}
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur="26s" repeatCount="indefinite"/>
        </g>
        <circle r="86" fill="none" stroke="${alfa('#ffb54d', 0.4)}" stroke-width="3">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="3.4s" repeatCount="indefinite"/>
        </circle>
      </g>`;
    },
  },
  {
    id: 'aur_sombria',
    categoria: 'aura',
    nome: 'Aura Sombria',
    descricao: 'A penumbra que chega junto — e sai por último.',
    raridade: 'epico',
    tema: 'fantasia',
    render: (_p, u) => `
      <defs>
        <radialGradient id="${u}asb" cx="0.5" cy="0.55" r="0.52">
          <stop offset="0.5" stop-color="${alfa('#0b0614', 0)}"/>
          <stop offset="0.8" stop-color="${alfa('#1b0f33', 0.55)}"/>
          <stop offset="1" stop-color="${alfa('#0b0614', 0)}"/>
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}asb)"/>
      <g fill="${alfa('#3a2a5e', 0.6)}">
        <circle cx="52" cy="150" r="7"><animateTransform attributeName="transform" type="translate" values="0 0;-6 -34" dur="4.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="4.2s" repeatCount="indefinite"/></circle>
        <circle cx="190" cy="170" r="9"><animateTransform attributeName="transform" type="translate" values="0 0;8 -40" dur="5.1s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="5.1s" repeatCount="indefinite"/></circle>
        <circle cx="120" cy="216" r="6"><animateTransform attributeName="transform" type="translate" values="0 0;0 -30" dur="3.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.65;0" dur="3.6s" repeatCount="indefinite"/></circle>
      </g>`,
  },
  {
    id: 'aur_runica',
    categoria: 'aura',
    nome: 'Aura Rúnica',
    descricao: 'Glifos antigos orbitando em vigília silenciosa.',
    raridade: 'lendario',
    tema: 'fantasia',
    usaCores: ['destaque'],
    render: (p, u) => {
      const glifos = ['M-4 4 L0 -5 L4 4 M-2 1 H2', 'M-3 -4 V4 M-3 -4 Q4 -4 -3 1', 'M0 -5 V5 M-4 -2 L4 2', 'M-4 -4 L4 4 M4 -4 L-4 4', 'M-3 -4 H3 V4 H-3 Z', 'M0 -5 L4 0 L0 5 L-4 0 Z'];
      let orbita = '';
      for (let i = 0; i < 6; i++) {
        const ang = (i * 60 * Math.PI) / 180;
        const x = Math.cos(ang) * 94;
        const y = Math.sin(ang) * 94;
        orbita += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
          <path d="${glifos[i]}" stroke="${p.destaque.claro}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <circle r="9" fill="none" stroke="${alfa(p.destaque.base, 0.4)}" stroke-width="1.2"/>
        </g>`;
      }
      return `
      <g id="${u}arun" transform="translate(120 128)">
        <g>${orbita}
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur="30s" repeatCount="indefinite"/>
        </g>
        <circle r="94" fill="none" stroke="${alfa(p.destaque.base, 0.25)}" stroke-width="1.4" stroke-dasharray="4 8"/>
      </g>`;
    },
  },
  {
    id: 'aur_prisma',
    categoria: 'aura',
    nome: 'Aura Prisma',
    descricao: 'Todo o espectro concorda com você.',
    raridade: 'epico',
    tema: 'fantasia',
    render: (_p, u) => `
      <g id="${u}apr" transform="translate(120 128)">
        <circle r="90" fill="none" stroke="#ff5f8f" stroke-width="2.6" opacity="0.55" stroke-dasharray="70 400">
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur="9s" repeatCount="indefinite"/>
        </circle>
        <circle r="90" fill="none" stroke="#4cd97c" stroke-width="2.6" opacity="0.55" stroke-dasharray="70 400">
          <animateTransform attributeName="transform" type="rotate" values="120;480" dur="9s" repeatCount="indefinite"/>
        </circle>
        <circle r="90" fill="none" stroke="#4c9de8" stroke-width="2.6" opacity="0.55" stroke-dasharray="70 400">
          <animateTransform attributeName="transform" type="rotate" values="240;600" dur="9s" repeatCount="indefinite"/>
        </circle>
      </g>`,
  },
  {
    id: 'aur_vento',
    categoria: 'aura',
    nome: 'Aura de Vento',
    descricao: 'Correntes de ar desenhando espirais ao redor.',
    raridade: 'incomum',
    tema: 'natureza',
    render: (_p, u) => `
      <g id="${u}avt" fill="none" stroke="${alfa('#cfe8f0', 0.5)}" stroke-width="2.4" stroke-linecap="round">
        <path d="M28 96 q 30 -16 58 -4">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.8s" repeatCount="indefinite"/>
        </path>
        <path d="M154 88 q 34 -10 58 6">
          <animate attributeName="opacity" values="0.25;0.7;0.25" dur="3.2s" repeatCount="indefinite"/>
        </path>
        <path d="M22 170 q 28 14 60 6">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite"/>
        </path>
        <path d="M158 180 q 30 10 60 -2">
          <animate attributeName="opacity" values="0.2;0.65;0.2" dur="2.6s" repeatCount="indefinite"/>
        </path>
        <circle cx="46" cy="92" r="3"/><circle cx="196" cy="182" r="3"/>
      </g>`,
  },
  {
    id: 'aur_estelar',
    categoria: 'aura',
    nome: 'Aura Estelar',
    descricao: 'Uma constelação pessoal cintilando em círculo.',
    raridade: 'raro',
    tema: 'espaço',
    usaCores: ['destaque'],
    render: (p, u) => {
      let estrelas = '';
      for (let i = 0; i < 10; i++) {
        const ang = (i * 36 * Math.PI) / 180;
        const r = 88 + (i % 3) * 6;
        const x = 120 + Math.cos(ang) * r;
        const y = 128 + Math.sin(ang) * r * 0.92;
        estrelas += `<path d="M${x.toFixed(1)} ${(y - 4).toFixed(1)} l 1.4 2.8 l 3 0.5 l -2.2 2.1 l 0.5 3 l -2.7 -1.4 l -2.7 1.4 l 0.5 -3 l -2.2 -2.1 l 3 -0.5 z" fill="${i % 2 ? p.destaque.claro : '#fff2c8'}" opacity="0.85">
          <animate attributeName="opacity" values="0.85;0.25;0.85" dur="${(2 + (i % 4) * 0.5).toFixed(1)}s" repeatCount="indefinite"/>
        </path>`;
      }
      return `<g id="${u}aest">${estrelas}</g>`;
    },
  },
  {
    id: 'aur_toxica',
    categoria: 'aura',
    nome: 'Aura Tóxica',
    descricao: 'Vapor esverdeado — cuidado ao se aproximar do ranking.',
    raridade: 'raro',
    tema: 'sci-fi',
    render: (_p, u) => `
      <defs>
        <radialGradient id="${u}atx" cx="0.5" cy="0.6" r="0.5">
          <stop offset="0.55" stop-color="${alfa('#3ddc84', 0)}"/>
          <stop offset="0.85" stop-color="${alfa('#3ddc84', 0.28)}"/>
          <stop offset="1" stop-color="${alfa('#3ddc84', 0)}"/>
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}atx)">
        <animate attributeName="opacity" values="1;0.6;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <g fill="${alfa('#7dffb0', 0.5)}">
        <circle cx="60" cy="180" r="4"><animateTransform attributeName="transform" type="translate" values="0 0;-4 -26" dur="3.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="3.4s" repeatCount="indefinite"/></circle>
        <circle cx="184" cy="164" r="5"><animateTransform attributeName="transform" type="translate" values="0 0;6 -30" dur="4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.55;0" dur="4s" repeatCount="indefinite"/></circle>
      </g>`,
  },
];
