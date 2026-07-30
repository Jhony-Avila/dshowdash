// engine/partes/olhos.ts — olhos e expressões do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Ancorados em (100,108) e (140,108). Sobrancelhas fazem parte do item —
// são elas que dão a expressão. Íris usa tom neutro; estilos tech usam destaque.
import { alfa } from '../cores';
import type { ParteDef } from '../base-api';

const IRIS = '#4a3626';

/** Olho humano completo: esclera + íris + pupila + brilho. */
function olhoHumano(x: number, y: number): string {
  return `
    <ellipse cx="${x}" cy="${y}" rx="10.5" ry="8" fill="#fdfdfa"/>
    <circle cx="${x}" cy="${y + 0.5}" r="5.2" fill="${IRIS}"/>
    <circle cx="${x}" cy="${y + 0.5}" r="2.5" fill="#14100c"/>
    <circle cx="${x + 1.8}" cy="${y - 1.6}" r="1.5" fill="#ffffff" opacity="0.9"/>
    <path d="M${x - 10} ${y - 2} a 10.5 8 0 0 1 21 0" fill="none" stroke="${alfa('#14100c', 0.25)}" stroke-width="1.4"/>`;
}

function sobrancelha(x: number, y: number, inclinacao: number, cor: string): string {
  return `<path d="M${x - 11} ${y + inclinacao} q 11 ${-6 - inclinacao} 22 ${-inclinacao * 2}" stroke="${cor}" stroke-width="4.4" stroke-linecap="round" fill="none"/>`;
}

export const OLHOS: ParteDef[] = [
  {
    id: 'olh_padrao',
    categoria: 'olhos',
    nome: 'Confiante',
    descricao: 'Olhar direto e tranquilo.',
    raridade: 'comum',
    tema: 'clássico',
    usaCores: ['cabelo'],
    render: (p) => `
      ${olhoHumano(100, 108)}${olhoHumano(140, 108)}
      ${sobrancelha(100, 93, 0, p.cabelo.escuro)}${sobrancelha(140, 93, 0, p.cabelo.escuro)}`,
  },
  {
    id: 'olh_focado',
    categoria: 'olhos',
    nome: 'Focado',
    descricao: 'Sobrancelhas firmes: modo competitivo ligado.',
    raridade: 'comum',
    tema: 'gamer',
    usaCores: ['cabelo'],
    render: (p) => `
      ${olhoHumano(100, 109)}${olhoHumano(140, 109)}
      <path d="M88 90 l 23 6" stroke="${p.cabelo.escuro}" stroke-width="4.6" stroke-linecap="round"/>
      <path d="M152 90 l -23 6" stroke="${p.cabelo.escuro}" stroke-width="4.6" stroke-linecap="round"/>`,
  },
  {
    id: 'olh_feliz',
    categoria: 'olhos',
    nome: 'Alegre',
    descricao: 'Olhos fechados de quem bateu a meta.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['cabelo'],
    render: (p) => `
      <path d="M90 110 q 10 -10 20 0" stroke="#14100c" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M130 110 q 10 -10 20 0" stroke="#14100c" stroke-width="4" stroke-linecap="round" fill="none"/>
      ${sobrancelha(100, 94, 1, p.cabelo.escuro)}${sobrancelha(140, 94, 1, p.cabelo.escuro)}
      <ellipse cx="88" cy="122" rx="7" ry="4" fill="${alfa('#ff6b6b', 0.25)}"/>
      <ellipse cx="152" cy="122" rx="7" ry="4" fill="${alfa('#ff6b6b', 0.25)}"/>`,
  },
  {
    id: 'olh_serio',
    categoria: 'olhos',
    nome: 'Analítico',
    descricao: 'Meio-olhar de quem está auditando seus números.',
    raridade: 'incomum',
    tema: 'executivo',
    usaCores: ['cabelo'],
    render: (p) => `
      <path d="M89 104 h 22 a 11 9 0 0 1 -22 0 z" fill="#fdfdfa"/>
      <path d="M129 104 h 22 a 11 9 0 0 1 -22 0 z" fill="#fdfdfa"/>
      <circle cx="100" cy="108" r="4.6" fill="${IRIS}"/><circle cx="100" cy="108" r="2.2" fill="#14100c"/>
      <circle cx="140" cy="108" r="4.6" fill="${IRIS}"/><circle cx="140" cy="108" r="2.2" fill="#14100c"/>
      <line x1="89" y1="104" x2="111" y2="104" stroke="#14100c" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="129" y1="104" x2="151" y2="104" stroke="#14100c" stroke-width="2.4" stroke-linecap="round"/>
      ${sobrancelha(100, 92, -1, p.cabelo.escuro)}${sobrancelha(140, 92, -1, p.cabelo.escuro)}`,
  },
  {
    id: 'olh_brilho',
    categoria: 'olhos',
    nome: 'Estelar',
    descricao: 'Pupilas em estrela — encantado com o resultado.',
    raridade: 'raro',
    tema: 'fantasia',
    usaCores: ['cabelo', 'destaque'],
    render: (p) => {
      const estrela = (x: number, y: number) =>
        `<path d="M${x} ${y - 5} l 1.5 3.4 l 3.7 0.4 l -2.8 2.5 l 0.8 3.7 l -3.2 -2 l -3.2 2 l 0.8 -3.7 l -2.8 -2.5 l 3.7 -0.4 z" fill="${p.destaque.base}"/>`;
      return `
      <ellipse cx="100" cy="108" rx="10.5" ry="8.5" fill="#fdfdfa"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8.5" fill="#fdfdfa"/>
      <circle cx="100" cy="108" r="6" fill="${p.destaque.profundo}"/>
      <circle cx="140" cy="108" r="6" fill="${p.destaque.profundo}"/>
      ${estrela(100, 108)}${estrela(140, 108)}
      ${sobrancelha(100, 93, 1, p.cabelo.escuro)}${sobrancelha(140, 93, 1, p.cabelo.escuro)}`;
    },
  },
  {
    id: 'olh_led',
    categoria: 'olhos',
    nome: 'LED Sintético',
    descricao: 'Óptica de androide com brilho constante.',
    raridade: 'raro',
    tema: 'tecnologia',
    usaCores: ['destaque'],
    render: (p) => `
      <rect x="88" y="102" width="24" height="11" rx="5.5" fill="#0a0d16"/>
      <rect x="128" y="102" width="24" height="11" rx="5.5" fill="#0a0d16"/>
      <rect x="92" y="105" width="16" height="5" rx="2.5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.55;1" dur="3.2s" repeatCount="indefinite"/>
      </rect>
      <rect x="132" y="105" width="16" height="5" rx="2.5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.55;1" dur="3.2s" repeatCount="indefinite"/>
      </rect>
      <circle cx="94" cy="107.5" r="1.2" fill="#ffffff" opacity="0.9"/>
      <circle cx="134" cy="107.5" r="1.2" fill="#ffffff" opacity="0.9"/>`,
  },
  {
    id: 'olh_brincalhao',
    categoria: 'olhos',
    nome: 'Piscadela',
    descricao: 'Um olho no gráfico, outro na sexta-feira.',
    raridade: 'incomum',
    tema: 'casual',
    usaCores: ['cabelo'],
    render: (p) => `
      ${olhoHumano(100, 108)}
      <path d="M130 110 q 10 -8 20 0" stroke="#14100c" stroke-width="4" stroke-linecap="round" fill="none"/>
      ${sobrancelha(100, 91, 2, p.cabelo.escuro)}${sobrancelha(140, 95, 0, p.cabelo.escuro)}`,
  },
  {
    id: 'olh_cansado',
    categoria: 'olhos',
    nome: 'Pós-Deploy',
    descricao: 'Sobreviveu à virada. As olheiras contam a história.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['cabelo'],
    render: (p) => `
      ${olhoHumano(100, 109)}${olhoHumano(140, 109)}
      <path d="M90 104 h20 a 10 8 0 0 0 -20 0 z" fill="${alfa(p.pele.escuro, 0.55)}"/>
      <path d="M130 104 h20 a 10 8 0 0 0 -20 0 z" fill="${alfa(p.pele.escuro, 0.55)}"/>
      <path d="M92 120 q 8 4 16 0 m 24 0 q 8 4 16 0" stroke="${alfa(p.pele.escuro, 0.5)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${sobrancelha(100, 95, 1, p.cabelo.escuro)}${sobrancelha(140, 95, 1, p.cabelo.escuro)}`,
  },
  {
    id: 'olh_misterioso',
    categoria: 'olhos',
    nome: 'Misterioso',
    descricao: 'Ninguém sabe o que ele planeja. Nem o roadmap.',
    raridade: 'raro',
    tema: 'fantasia',
    usaCores: ['destaque'],
    render: (p) => `
      <path d="M66 88 h108 v22 q -54 14 -108 0 z" fill="${alfa('#0c0f1a', 0.62)}"/>
      <ellipse cx="100" cy="106" rx="6" ry="4.5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.6;1" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="140" cy="106" rx="6" ry="4.5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.6;1" dur="3s" repeatCount="indefinite"/>
      </ellipse>`,
  },
  {
    id: 'olh_vilao',
    categoria: 'olhos',
    nome: 'Vilão',
    descricao: 'Todo herói de meta precisa de um rival à altura.',
    raridade: 'mitico',
    tema: 'fantasia',
    usaCores: ['cabelo'],
    render: (p) => `
      <path d="M88 104 l 24 4 a 11 8 0 0 1 -22 2 z" fill="#fdfdfa"/>
      <path d="M152 104 l -24 4 a 11 8 0 0 0 22 2 z" fill="#fdfdfa"/>
      <circle cx="102" cy="109" r="4.6" fill="#a11a1a"/><circle cx="102" cy="109" r="2" fill="#2a0505"/>
      <circle cx="138" cy="109" r="4.6" fill="#a11a1a"/><circle cx="138" cy="109" r="2" fill="#2a0505"/>
      <circle cx="103.5" cy="107.5" r="1.1" fill="#ff8f8f"/>
      <circle cx="139.5" cy="107.5" r="1.1" fill="#ff8f8f"/>
      <path d="M86 92 l 26 10" stroke="${p.cabelo.escuro}" stroke-width="4.8" stroke-linecap="round"/>
      <path d="M154 92 l -26 10" stroke="${p.cabelo.escuro}" stroke-width="4.8" stroke-linecap="round"/>`,
  },
  {
    id: 'olh_visor',
    categoria: 'olhos',
    nome: 'Visor Tático',
    descricao: 'Faixa de visor translúcida com HUD de combate.',
    raridade: 'epico',
    tema: 'cyberpunk',
    usaCores: ['destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}vis" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.9)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.profundo, 0.82)}"/>
        </linearGradient>
      </defs>
      <path d="M72 96 h 96 a 8 8 0 0 1 8 8 v 8 a 8 8 0 0 1 -8 8 h -96 a 8 8 0 0 1 -8 -8 v -8 a 8 8 0 0 1 8 -8 z" fill="url(#${u}vis)" stroke="${p.destaque.profundo}" stroke-width="2"/>
      <path d="M70 100 h 100" stroke="${alfa('#ffffff', 0.5)}" stroke-width="1.6"/>
      <rect x="86" y="104" width="26" height="6" rx="3" fill="${alfa('#ffffff', 0.75)}"/>
      <rect x="128" y="104" width="26" height="6" rx="3" fill="${alfa('#ffffff', 0.75)}"/>
      <path d="M150 113 h 12 m -6 -6 v 12" stroke="${alfa('#ffffff', 0.5)}" stroke-width="1"/>
      <rect x="64" y="96" width="8" height="24" rx="4" fill="${p.destaque.profundo}"/>
      <rect x="168" y="96" width="8" height="24" rx="4" fill="${p.destaque.profundo}"/>`,
  },
];
