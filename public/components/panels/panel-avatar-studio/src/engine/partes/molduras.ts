// engine/partes/molduras.ts — molduras (aros de raridade) do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Desenhadas POR CIMA de tudo, rente à borda do quadro (240×240, raio 26).
// São o principal marcador visual de raridade no header/menu.
import { alfa } from '../cores';
import type { ParteDef } from '../base-api';

const R = 26; // raio dos cantos do quadro

export const MOLDURAS: ParteDef[] = [
  {
    id: 'mol_aro',
    categoria: 'moldura',
    nome: 'Aro Clean',
    descricao: 'Contorno fino e elegante.',
    raridade: 'comum',
    tema: 'clássico',
    usaCores: ['destaque'],
    render: (p) => `
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="4"/>`,
  },
  {
    id: 'mol_duplo',
    categoria: 'moldura',
    nome: 'Aro Duplo',
    descricao: 'Linha dupla com respiro interno.',
    raridade: 'incomum',
    tema: 'clássico',
    usaCores: ['destaque'],
    render: (p) => `
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="3.4"/>
      <rect x="10" y="10" width="220" height="220" rx="${R - 6}" fill="none" stroke="${alfa(p.destaque.base, 0.45)}" stroke-width="1.6"/>`,
  },
  {
    id: 'mol_tech',
    categoria: 'moldura',
    nome: 'Cantos Táticos',
    descricao: 'Suportes de HUD nos quatro cantos.',
    raridade: 'raro',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p) => {
      const c = p.destaque.base;
      return `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa(c, 0.35)}" stroke-width="2"/>
      <g stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round">
        <path d="M8 42 v-16 a 18 18 0 0 1 18 -18 h 16"/>
        <path d="M232 42 v-16 a 18 18 0 0 0 -18 -18 h -16"/>
        <path d="M8 198 v 16 a 18 18 0 0 0 18 18 h 16"/>
        <path d="M232 198 v 16 a 18 18 0 0 1 -18 18 h -16"/>
      </g>
      <circle cx="120" cy="8" r="3" fill="${c}"/>
      <circle cx="120" cy="232" r="3" fill="${c}"/>`;
    },
  },
  {
    id: 'mol_neon',
    categoria: 'moldura',
    nome: 'Neon Pulsante',
    descricao: 'Tubo de neon vivo respirando luz.',
    raridade: 'epico',
    tema: 'cyberpunk',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <filter id="${u}blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
      </defs>
      <rect x="5" y="5" width="230" height="230" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="7" filter="url(#${u}blur)" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.35;0.8" dur="2.6s" repeatCount="indefinite"/>
      </rect>
      <rect x="5" y="5" width="230" height="230" rx="${R}" fill="none" stroke="${p.destaque.claro}" stroke-width="2.6"/>`,
  },
  {
    id: 'mol_ouro',
    categoria: 'moldura',
    nome: 'Ouro Imperial',
    descricao: 'Moldura lendária cravejada de gemas.',
    raridade: 'lendario',
    tema: 'fantasia',
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}ouro" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffe89a"/>
          <stop offset="0.35" stop-color="#e8b64c"/>
          <stop offset="0.65" stop-color="#b07d1e"/>
          <stop offset="1" stop-color="#ffe89a"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="url(#${u}ouro)" stroke-width="7"/>
      <rect x="10" y="10" width="220" height="220" rx="${R - 6}" fill="none" stroke="${alfa('#8a5f10', 0.55)}" stroke-width="1.6"/>
      <circle cx="120" cy="7" r="4" fill="#ff5f8f" stroke="#8a5f10" stroke-width="1"/>
      <circle cx="120" cy="233" r="4" fill="#4cd9e8" stroke="#8a5f10" stroke-width="1"/>
      <circle cx="7" cy="120" r="4" fill="#7ce87c" stroke="#8a5f10" stroke-width="1"/>
      <circle cx="233" cy="120" r="4" fill="#c99aff" stroke="#8a5f10" stroke-width="1"/>`,
  },
  {
    id: 'mol_dshow',
    categoria: 'moldura',
    nome: 'Exclusiva Dshow',
    descricao: 'Moldura assinada da casa — edição exclusiva.',
    raridade: 'exclusivo',
    tema: 'dshow',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}dsh" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${p.destaque.claro}"/>
          <stop offset="0.5" stop-color="${p.destaque.base}"/>
          <stop offset="1" stop-color="#e8b64c"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="url(#${u}dsh)" stroke-width="5.5"/>
      <path d="M92 232 h 56" stroke="#0c0f18" stroke-width="10" stroke-linecap="round"/>
      <text x="120" y="236.5" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="700" fill="url(#${u}dsh)" letter-spacing="2">DSHOW</text>`,
  },
];
