// engine/partes/emblemas.ts — EMBLEMAS (Expansão §18): insígnias pequenas
// presas à roupa (peito direito, ~152,206), pintadas logo APÓS a roupa.
// @version 1.0.0  @created 2026-07-30
import { alfa } from '../cores';
import type { ParteDef } from '../base-api';

/** Pino base do emblema: disco + conteúdo centrado em (152, 206). */
function pino(u: string, chave: string, fundo: string, borda: string, conteudo: string): string {
  return `
    <g id="${u}${chave}" transform="translate(152 206)">
      <circle r="13" fill="${fundo}" stroke="${borda}" stroke-width="2"/>
      ${conteudo}
    </g>`;
}

export const EMBLEMAS: ParteDef[] = [
  {
    id: 'emb_dshow',
    categoria: 'emblema',
    nome: 'Emblema Dshow',
    descricao: 'O pixel fundador, preso ao peito de quem é da casa.',
    raridade: 'exclusivo',
    tema: 'dshow',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'eds', '#0a0e18', p.destaque.base, `
      <rect x="-5" y="-5" width="10" height="10" rx="2" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.6s" repeatCount="indefinite"/>
      </rect>`),
  },
  {
    id: 'emb_nexus',
    categoria: 'emblema',
    nome: 'Selo Nexus',
    descricao: 'O hexágono da rede — todos os nós respondem a você.',
    raridade: 'epico',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'enx', '#101726', alfa(p.destaque.base, 0.8), `
      <path d="M0 -7 L6 -3.5 L6 3.5 L0 7 L-6 3.5 L-6 -3.5 Z"
        fill="none" stroke="${p.destaque.claro}" stroke-width="2"/>
      <circle r="1.8" fill="${p.destaque.claro}"/>`),
  },
  {
    id: 'emb_elite',
    categoria: 'emblema',
    nome: 'Estrela Elite',
    descricao: 'Cinco pontas. Zero sorte. Só resultado.',
    raridade: 'lendario',
    tema: 'executivo',
    usaCores: [],
    render: (_p, u) => pino(u, 'eel', '#221a08', '#e8b64c', `
      <path d="M0 -7 L2 -2.2 L7 -2.2 L3 1.2 L4.4 6.4 L0 3.4 L-4.4 6.4 L-3 1.2 L-7 -2.2 L-2 -2.2 Z"
        fill="#e8b64c"/>`),
  },
  {
    id: 'emb_cyber',
    categoria: 'emblema',
    nome: 'Divisa Cyber',
    descricao: 'Duas divisas aceleradas — patente das vielas de neon.',
    raridade: 'raro',
    tema: 'cyberpunk',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'ecy', '#0c1220', alfa(p.destaque.base, 0.75), `
      <g fill="none" stroke="${p.destaque.claro}" stroke-width="2.2" stroke-linecap="round">
        <path d="M-5 3 L0 -3 L5 3"/>
        <path d="M-5 8 L0 2 L5 8" opacity="0.55"/>
      </g>`),
  },
  {
    id: 'emb_diamond',
    categoria: 'emblema',
    nome: 'Broche Diamond',
    descricao: 'Lapidado sob pressão, como todo trimestre fechado.',
    raridade: 'lendario',
    tema: 'executivo',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'edm', '#101726', alfa(p.destaque.claro, 0.9), `
      <path d="M-6 -2 L-3 -6 L3 -6 L6 -2 L0 7 Z"
        fill="${alfa(p.destaque.claro, 0.85)}" stroke="${p.destaque.base}" stroke-width="1.4"/>
      <path d="M-6 -2 L6 -2 M-3 -6 L0 7 M3 -6 L0 7"
        fill="none" stroke="${alfa('#0a0e18', 0.5)}" stroke-width="0.9"/>`),
  },
  {
    id: 'emb_raio',
    categoria: 'emblema',
    nome: 'Pino Relâmpago',
    descricao: 'Energia de sobra para o sprint que vier.',
    raridade: 'incomum',
    tema: 'gamer',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'erl', '#141926', alfa(p.destaque.base, 0.8), `
      <path d="M1 -8 L-4 1 L0 1 L-1 8 L5 -2 L1 -2 Z" fill="${p.destaque.claro}"/>`),
  },
  {
    id: 'emb_alvo',
    categoria: 'emblema',
    nome: 'Alvo Certeiro',
    descricao: 'Três círculos. Um destino: o centro.',
    raridade: 'raro',
    tema: 'executivo',
    usaCores: ['destaque'],
    render: (p, u) => pino(u, 'eal', '#101726', alfa(p.destaque.base, 0.75), `
      <circle r="7" fill="none" stroke="${alfa(p.destaque.claro, 0.8)}" stroke-width="1.6"/>
      <circle r="3.6" fill="none" stroke="${alfa(p.destaque.claro, 0.9)}" stroke-width="1.6"/>
      <circle r="1.4" fill="${p.destaque.claro}"/>`),
  },
  {
    id: 'emb_coroa',
    categoria: 'emblema',
    nome: 'Coroa de Bolso',
    descricao: 'Realeza discreta, presa à lapela.',
    raridade: 'lendario',
    tema: 'fantasia',
    usaCores: [],
    render: (_p, u) => pino(u, 'eco', '#221a08', '#e8b64c', `
      <path d="M-6 3 L-6 -2 L-3 1 L0 -5 L3 1 L6 -2 L6 3 Z" fill="#e8b64c"/>
      <path d="M-6 5 h12 v2 h-12 z" fill="${alfa('#e8b64c', 0.7)}"/>`),
  },
];
