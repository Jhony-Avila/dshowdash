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
  // ── 4.6 F2 · Onda 1 (identidade) — 8 olhares novos ────────────────
  {
    id: 'olh_sonolento',
    categoria: 'olhos',
    nome: 'Sonolento',
    descricao: 'Café ainda não fez efeito.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['cabelo'],
    render: (p) => `
      <path d="M90 108 a 10.5 8 0 0 0 20 2" fill="none" stroke="#14100c" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M130 110 a 10.5 8 0 0 0 20 0" fill="none" stroke="#14100c" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="101" cy="111" r="3.4" fill="#14100c"/>
      <circle cx="141" cy="111" r="3.4" fill="#14100c"/>
      <path d="M90 104 h 20 M130 104 h 20" stroke="${alfa(p.pele.escuro, 0.55)}" stroke-width="4" stroke-linecap="round"/>
      ${sobrancelha(100, 96, 2, p.cabelo.escuro)}${sobrancelha(140, 96, 2, p.cabelo.escuro)}
      <path d="M160 84 l 5 -5 h -5 l 5 -5" stroke="${alfa('#8b93a7', 0.8)}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'olh_desconfiado',
    categoria: 'olhos',
    nome: 'Desconfiado',
    descricao: 'Uma sobrancelha no alto: "tem certeza desse número?"',
    raridade: 'incomum',
    tema: 'executivo',
    usaCores: ['cabelo'],
    render: (p) => `
      ${olhoHumano(100, 108)}
      <ellipse cx="140" cy="109" rx="10.5" ry="5.6" fill="#fdfdfa"/>
      <circle cx="140" cy="109.5" r="4.4" fill="${IRIS}"/>
      <circle cx="140" cy="109.5" r="2.2" fill="#14100c"/>
      <path d="M129 106 h 22" stroke="${alfa(p.pele.escuro, 0.5)}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M88 88 q 12 -8 24 -2" stroke="${p.cabelo.escuro}" stroke-width="4.4" stroke-linecap="round" fill="none"/>
      <path d="M129 96 l 22 2" stroke="${p.cabelo.escuro}" stroke-width="4.4" stroke-linecap="round"/>`,
  },
  {
    id: 'olh_apaixonado',
    categoria: 'olhos',
    nome: 'Apaixonado',
    descricao: 'Quando o resultado do mês chega verde.',
    raridade: 'raro',
    tema: 'casual',
    usaCores: ['cabelo'],
    render: (p) => {
      const coracao = (x: number, y: number) => `
        <path d="M${x} ${y + 5} l -6.5 -6.5 a 4.5 4.5 0 1 1 6.5 -5 a 4.5 4.5 0 1 1 6.5 5 z" fill="#ff5f8f">
          <animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur="1.2s" repeatCount="indefinite" additive="sum"/>
        </path>`;
      return `
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      ${coracao(100, 105)}${coracao(140, 105)}
      ${sobrancelha(100, 92, 1, p.cabelo.escuro)}${sobrancelha(140, 92, 1, p.cabelo.escuro)}`;
    },
  },
  {
    id: 'olh_cifrao',
    categoria: 'olhos',
    nome: 'Cifrão',
    descricao: 'ROI detectado. Pupilas em modo faturamento.',
    raridade: 'epico',
    tema: 'executivo',
    usaCores: ['cabelo'],
    render: (p) => {
      const cifra = (x: number) => `
        <ellipse cx="${x}" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
        <circle cx="${x}" cy="108" r="6" fill="#1d7a46"/>
        <text x="${x}" y="112" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="800" fill="#aef4c4">$</text>`;
      return `
      ${cifra(100)}${cifra(140)}
      ${sobrancelha(100, 92, 0, p.cabelo.escuro)}${sobrancelha(140, 92, 0, p.cabelo.escuro)}`;
    },
  },
  {
    id: 'olh_estrela',
    categoria: 'olhos',
    nome: 'Estrelado',
    descricao: 'Viu o lançamento e virou fã na hora.',
    raridade: 'raro',
    tema: 'gamer',
    usaCores: ['cabelo', 'destaque'],
    render: (p) => {
      const estrela = (x: number, y: number) => {
        let d = '';
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
          const b = a + Math.PI / 5;
          d += `${i === 0 ? 'M' : 'L'}${(x + Math.cos(a) * 6.5).toFixed(1)} ${(y + Math.sin(a) * 6.5).toFixed(1)} L${(x + Math.cos(b) * 2.8).toFixed(1)} ${(y + Math.sin(b) * 2.8).toFixed(1)} `;
        }
        return `<path d="${d}z" fill="${p.destaque.base}"/>`;
      };
      return `
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      ${estrela(100, 108)}${estrela(140, 108)}
      ${sobrancelha(100, 92, 1, p.cabelo.escuro)}${sobrancelha(140, 92, 1, p.cabelo.escuro)}`;
    },
  },
  {
    id: 'olh_arregalado',
    categoria: 'olhos',
    nome: 'Arregalado',
    descricao: 'Plot twist na daily.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['cabelo'],
    render: (p) => `
      <circle cx="100" cy="108" r="10" fill="#fdfdfa" stroke="${alfa('#14100c', 0.3)}" stroke-width="1.4"/>
      <circle cx="140" cy="108" r="10" fill="#fdfdfa" stroke="${alfa('#14100c', 0.3)}" stroke-width="1.4"/>
      <circle cx="100" cy="108" r="3.2" fill="#14100c"/>
      <circle cx="140" cy="108" r="3.2" fill="#14100c"/>
      <circle cx="101.5" cy="106" r="1.1" fill="#ffffff"/>
      <circle cx="141.5" cy="106" r="1.1" fill="#ffffff"/>
      ${sobrancelha(100, 88, -2, p.cabelo.escuro)}${sobrancelha(140, 88, -2, p.cabelo.escuro)}`,
  },
  {
    id: 'olh_emocionado',
    categoria: 'olhos',
    nome: 'Emocionado',
    descricao: 'Lágrima de alegria — bateu a meta do trimestre.',
    raridade: 'incomum',
    tema: 'casual',
    usaCores: ['cabelo'],
    render: (p) => `
      <path d="M90 110 q 10 -10 20 0" stroke="#14100c" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M130 110 q 10 -10 20 0" stroke="#14100c" stroke-width="4" stroke-linecap="round" fill="none"/>
      ${sobrancelha(100, 94, 1, p.cabelo.escuro)}${sobrancelha(140, 94, 1, p.cabelo.escuro)}
      <path d="M152 112 q 5 8 0 12 q -5 -4 0 -12 z" fill="#69c8ff" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.8s" repeatCount="indefinite"/>
      </path>`,
  },
  {
    id: 'olh_pixel',
    categoria: 'olhos',
    nome: 'Pixel Retro',
    descricao: 'Óptica 8-bit direto do fliperama.',
    raridade: 'epico',
    tema: 'gamer',
    piscar: false, // tela não pisca — sem pálpebras no idle
    usaCores: ['destaque'],
    render: (p) => {
      const px = (x: number) => `
        <rect x="${x - 8}" y="100" width="16" height="16" fill="#0f131d"/>
        <rect x="${x - 5}" y="103" width="6" height="6" fill="${p.destaque.base}"/>
        <rect x="${x + 1}" y="109" width="4" height="4" fill="${alfa(p.destaque.claro, 0.9)}"/>
        <rect x="${x - 8}" y="100" width="16" height="2" fill="${alfa('#ffffff', 0.18)}"/>`;
      return `
      ${px(100)}${px(140)}
      <rect x="88" y="92" width="24" height="4" fill="${p.destaque.profundo}"/>
      <rect x="128" y="92" width="24" height="4" fill="${p.destaque.profundo}"/>`;
    },
  },
  // ── 4.6 F2 · Onda 6 (identidade) — 12 olhares novos ───────────────
  {
    id: 'olh_gentil',
    categoria: 'olhos',
    nome: 'Gentil',
    descricao: 'O code review mais educado da empresa.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['cabelo'],
    render: (p) => `
      ${olhoHumano(100, 109)}${olhoHumano(140, 109)}
      <path d="M89 101 q 11 -7 22 -2" stroke="${p.cabelo.escuro}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M129 99 q 11 -5 22 2" stroke="${p.cabelo.escuro}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M92 118 q 8 3 16 1 M132 119 q 8 2 16 -1" stroke="${alfa(p.pele.escuro, 0.35)}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'olh_furia',
    categoria: 'olhos',
    nome: 'Fúria',
    descricao: 'Alguém deu force push na main.',
    raridade: 'raro',
    tema: 'fantasia',
    usaCores: ['cabelo'],
    render: (p) => `
      <ellipse cx="100" cy="109" rx="10.5" ry="7" fill="#ffe8e4"/>
      <ellipse cx="140" cy="109" rx="10.5" ry="7" fill="#ffe8e4"/>
      <circle cx="100" cy="109.5" r="4.6" fill="#c1272d"/>
      <circle cx="140" cy="109.5" r="4.6" fill="#c1272d"/>
      <circle cx="100" cy="109.5" r="2" fill="#3d0508"/>
      <circle cx="140" cy="109.5" r="2" fill="#3d0508"/>
      <circle cx="100" cy="109.5" r="7" fill="none" stroke="rgba(255,82,48,0.5)" stroke-width="2">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="140" cy="109.5" r="7" fill="none" stroke="rgba(255,82,48,0.5)" stroke-width="2">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.4s" repeatCount="indefinite"/>
      </circle>
      <path d="M87 88 l 24 9 M153 88 l -24 9" stroke="${p.cabelo.escuro}" stroke-width="4.8" stroke-linecap="round"/>`,
  },
  {
    id: 'olh_hipnotico',
    categoria: 'olhos',
    nome: 'Hipnótico',
    descricao: 'Você já concordou com a proposta. Só não sabe ainda.',
    raridade: 'epico',
    tema: 'fantasia',
    piscar: false,
    usaCores: ['destaque'],
    render: (p) => {
      const espiral = (x: number, sentido: number) => `
        <g transform="translate(${x} 108)">
          <circle r="9.5" fill="#fdfdfa"/>
          <g>
            <path d="M0 0 m 0 -1.5 a 1.5 1.5 0 0 1 1.5 1.5 a 3 3 0 0 1 -3 3 a 4.8 4.8 0 0 1 -4.8 -4.8 a 6.8 6.8 0 0 1 6.8 -6.8 a 8.6 8.6 0 0 1 8.6 8.6" fill="none" stroke="${p.destaque.profundo}" stroke-width="2.2"/>
            <animateTransform attributeName="transform" type="rotate" values="0;${sentido * 360}" dur="3.2s" repeatCount="indefinite"/>
          </g>
        </g>`;
      return `${espiral(100, 1)}${espiral(140, -1)}`;
    },
  },
  {
    id: 'olh_scanner',
    categoria: 'olhos',
    nome: 'Scanner',
    descricao: 'Linha única varrendo o ambiente por métricas fracas.',
    raridade: 'raro',
    tema: 'sci-fi',
    piscar: false,
    usaCores: ['destaque'],
    render: (p) => `
      <rect x="86" y="103" width="28" height="10" rx="5" fill="#0c0f1a"/>
      <rect x="126" y="103" width="28" height="10" rx="5" fill="#0c0f1a"/>
      <rect x="90" y="106" width="6" height="4" rx="2" fill="${p.destaque.claro}">
        <animate attributeName="x" values="90;104;90" dur="2.2s" repeatCount="indefinite"/>
      </rect>
      <rect x="130" y="106" width="6" height="4" rx="2" fill="${p.destaque.claro}">
        <animate attributeName="x" values="144;130;144" dur="2.2s" repeatCount="indefinite"/>
      </rect>`,
  },
  {
    id: 'olh_gatinho',
    categoria: 'olhos',
    nome: 'Delineado Gatinho',
    descricao: 'O traço que corta qualquer reunião ao meio.',
    raridade: 'incomum',
    tema: 'clássico',
    usaCores: ['cabelo'],
    render: (p) => `
      ${olhoHumano(100, 108)}${olhoHumano(140, 108)}
      <path d="M89 103 q 10 -6 21 -1 l 4 3 M110 105 l 6 -4" stroke="#14100c" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M129 102 q 11 -5 22 1 l -4 2 M150 104 l 7 -5" stroke="#14100c" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      ${sobrancelha(100, 92, 1, p.cabelo.escuro)}${sobrancelha(140, 92, 1, p.cabelo.escuro)}`,
  },
  {
    id: 'olh_heterocromia',
    categoria: 'olhos',
    nome: 'Heterocromia',
    descricao: 'Um olho natural, um olho na cor da sua energia.',
    raridade: 'epico',
    tema: 'fantasia',
    usaCores: ['cabelo', 'destaque'],
    render: (p) => `
      ${olhoHumano(100, 108)}
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      <circle cx="140" cy="108.5" r="5.2" fill="${p.destaque.base}"/>
      <circle cx="140" cy="108.5" r="2.5" fill="#14100c"/>
      <circle cx="141.8" cy="106.4" r="1.5" fill="#ffffff" opacity="0.9"/>
      <path d="M130 106 a 10.5 8 0 0 1 21 0" fill="none" stroke="${alfa('#14100c', 0.25)}" stroke-width="1.4"/>
      ${sobrancelha(100, 93, 0, p.cabelo.escuro)}${sobrancelha(140, 93, 0, p.cabelo.escuro)}`,
  },
  {
    id: 'olh_zen',
    categoria: 'olhos',
    nome: 'Zen',
    descricao: 'Inbox zero por dentro e por fora.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['cabelo'],
    render: (p) => `
      <path d="M90 108 q 10 4 20 0" stroke="#14100c" stroke-width="3.6" stroke-linecap="round" fill="none"/>
      <path d="M130 108 q 10 4 20 0" stroke="#14100c" stroke-width="3.6" stroke-linecap="round" fill="none"/>
      ${sobrancelha(100, 95, 1, p.cabelo.escuro)}${sobrancelha(140, 95, 1, p.cabelo.escuro)}`,
  },
  {
    id: 'olh_na_mira',
    categoria: 'olhos',
    nome: 'Na Mira',
    descricao: 'Meta adquirida. Distância: um trimestre.',
    raridade: 'raro',
    tema: 'gamer',
    piscar: false,
    usaCores: ['destaque'],
    render: (p) => {
      const mira = (x: number) => `
        <g transform="translate(${x} 108)">
          <circle r="9" fill="#fdfdfa"/>
          <circle r="7" fill="none" stroke="${p.destaque.profundo}" stroke-width="1.6"/>
          <circle r="2.2" fill="${p.destaque.profundo}"/>
          <path d="M0 -9 v 4 M0 9 v -4 M-9 0 h 4 M9 0 h -4" stroke="${p.destaque.profundo}" stroke-width="1.6"/>
        </g>`;
      return `${mira(100)}${mira(140)}`;
    },
  },
  {
    id: 'olh_anime',
    categoria: 'olhos',
    nome: 'Brilho de Anime',
    descricao: 'Reflexos gigantes de protagonista no episódio final.',
    raridade: 'raro',
    tema: 'fantasia',
    usaCores: ['cabelo', 'destaque'],
    render: (p) => {
      const olho = (x: number) => `
        <ellipse cx="${x}" cy="108" rx="11" ry="10" fill="#fdfdfa"/>
        <ellipse cx="${x}" cy="109" rx="7.5" ry="8" fill="${p.destaque.profundo}"/>
        <ellipse cx="${x}" cy="110" rx="4" ry="4.6" fill="#14100c"/>
        <ellipse cx="${x - 2.6}" cy="104.5" rx="3" ry="2.4" fill="#ffffff"/>
        <circle cx="${x + 3.4}" cy="112" r="1.6" fill="#ffffff" opacity="0.85"/>
        <circle cx="${x + 1}" cy="106" r="0.9" fill="#ffffff"/>`;
      return `
      ${olho(100)}${olho(140)}
      ${sobrancelha(100, 91, 1, p.cabelo.escuro)}${sobrancelha(140, 91, 1, p.cabelo.escuro)}`;
    },
  },
  {
    id: 'olh_calculista',
    categoria: 'olhos',
    nome: 'Calculista',
    descricao: 'Dá para ver as planilhas refletidas na íris.',
    raridade: 'incomum',
    tema: 'executivo',
    usaCores: ['cabelo'],
    render: (p) => `
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      <circle cx="100" cy="108.5" r="5.2" fill="#1d4a3a"/>
      <circle cx="140" cy="108.5" r="5.2" fill="#1d4a3a"/>
      <path d="M97 107 h 6 M100 104 v 7 M137 107 h 6 M140 104 v 7" stroke="#aef4c4" stroke-width="1"/>
      ${sobrancelha(100, 92, -1, p.cabelo.escuro)}${sobrancelha(140, 92, -1, p.cabelo.escuro)}`,
  },
  {
    id: 'olh_prisma',
    categoria: 'olhos',
    nome: 'Prisma',
    descricao: 'A íris decidiu ser todas as cores ao mesmo tempo.',
    raridade: 'lendario',
    tema: 'fantasia',
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}pri" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ff5f8f"/>
          <stop offset="0.35" stop-color="#e8b64c"/>
          <stop offset="0.7" stop-color="#4cd97c"/>
          <stop offset="1" stop-color="#4c9de8"/>
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      <circle cx="100" cy="108.5" r="5.4" fill="url(#${u}pri)"/>
      <circle cx="140" cy="108.5" r="5.4" fill="url(#${u}pri)"/>
      <circle cx="100" cy="108.5" r="2.2" fill="#14100c"/>
      <circle cx="140" cy="108.5" r="2.2" fill="#14100c"/>
      <circle cx="101.8" cy="106.2" r="1.4" fill="#ffffff"/>
      <circle cx="141.8" cy="106.2" r="1.4" fill="#ffffff"/>
      ${sobrancelha(100, 92, 0, p.cabelo.escuro)}${sobrancelha(140, 92, 0, p.cabelo.escuro)}`,
  },
  {
    id: 'olh_vazio',
    categoria: 'olhos',
    nome: 'Void',
    descricao: 'Olhou para o abismo do legado. O abismo pediu refactor.',
    raridade: 'mitico',
    tema: 'fantasia',
    piscar: false,
    render: () => `
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="#050308"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="#050308"/>
      <circle cx="100" cy="108" r="1.4" fill="#ffffff">
        <animate attributeName="opacity" values="1;0.4;1" dur="2.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="140" cy="108" r="1.4" fill="#ffffff">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2.8s" repeatCount="indefinite"/>
      </circle>
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="none" stroke="rgba(124,92,255,0.35)" stroke-width="1.6"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="none" stroke="rgba(124,92,255,0.35)" stroke-width="1.6"/>`,
  },
  // ── 4.6 F2 · Onda 7 — 9 olhares finais (meta §28: 40 ✓) ───────────
  {
    id: 'olh_lagrima',
    categoria: 'olhos',
    nome: 'Lágrima Solitária',
    descricao: 'O commit foi revertido. A lágrima, não.',
    raridade: 'incomum',
    tema: 'casual',
    usaCores: ['cabelo'],
    render: (p) => `
      ${olhoHumano(100, 108)}${olhoHumano(140, 108)}
      ${sobrancelha(100, 94, 2, p.cabelo.escuro)}${sobrancelha(140, 94, 2, p.cabelo.escuro)}
      <path d="M92 118 q 3 6 0 10 q -3 -4 0 -10 z" fill="#69c8ff" opacity="0.9"/>`,
  },
  {
    id: 'olh_chamas',
    categoria: 'olhos',
    nome: 'Olhos em Chamas',
    descricao: 'A meta do trimestre olhou de volta — e pegou fogo.',
    raridade: 'lendario',
    tema: 'fantasia',
    piscar: false,
    render: (_p, u) => {
      const chama = (x: number) => `
        <ellipse cx="${x}" cy="108" rx="10.5" ry="8" fill="#1c0a06"/>
        <path d="M${x} 113 c -4 -1 -5 -5 -3 -8 c 1 1.5 2 2 3 2 c -1 -2 0 -4 2 -5.5 c 0 2 0.6 3.4 2 4.2 c 1.4 -0.8 2 -2 2 -3.4 c 1.6 3 0.6 7 -2.6 8.6 c -1 0.6 -2.4 1.4 -3.4 2.1 z" fill="url(#${u}fla${x})"/>
        <defs>
          <linearGradient id="${u}fla${x}" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stop-color="#ff5230"/>
            <stop offset="1" stop-color="#ffd75e"/>
          </linearGradient>
        </defs>`;
      return `${chama(100)}${chama(140)}
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="none" stroke="rgba(255,138,61,0.5)" stroke-width="1.8">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.2s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="none" stroke="rgba(255,138,61,0.5)" stroke-width="1.8">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.2s" repeatCount="indefinite"/>
      </ellipse>`;
    },
  },
  {
    id: 'olh_congelante',
    categoria: 'olhos',
    nome: 'Congelante',
    descricao: 'O feedback veio em temperatura negativa.',
    raridade: 'raro',
    tema: 'clima',
    usaCores: ['cabelo'],
    render: (p) => `
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="#eef8ff"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="#eef8ff"/>
      <circle cx="100" cy="108.5" r="5" fill="#7cc8f0"/>
      <circle cx="140" cy="108.5" r="5" fill="#7cc8f0"/>
      <circle cx="100" cy="108.5" r="2.2" fill="#0c2a3d"/>
      <circle cx="140" cy="108.5" r="2.2" fill="#0c2a3d"/>
      <path d="M88 100 l 4 3 m 4 -6 l 2 4 M152 100 l -4 3 m -4 -6 l -2 4" stroke="#bfe8ff" stroke-width="1.8" stroke-linecap="round"/>
      ${sobrancelha(100, 92, -1, p.cabelo.escuro)}${sobrancelha(140, 92, -1, p.cabelo.escuro)}`,
  },
  {
    id: 'olh_relogio',
    categoria: 'olhos',
    nome: 'Contra o Relógio',
    descricao: 'Cada piscada custa 15 minutos de sprint.',
    raridade: 'epico',
    tema: 'executivo',
    piscar: false,
    render: () => {
      const relogio = (x: number, dur: string) => `
        <g transform="translate(${x} 108)">
          <circle r="9.5" fill="#fdfdfa" stroke="#3a4054" stroke-width="1.6"/>
          <path d="M0 -7.5 v 1.6 M0 7.5 v -1.6 M-7.5 0 h 1.6 M7.5 0 h -1.6" stroke="#3a4054" stroke-width="1.2"/>
          <path d="M0 0 v -5.5" stroke="#14100c" stroke-width="1.8" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0;360" dur="${dur}s" repeatCount="indefinite"/>
          </path>
          <path d="M0 0 h 3.6" stroke="#ff5230" stroke-width="1.4" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0;360" dur="3" repeatCount="indefinite"/>
          </path>
          <circle r="1.2" fill="#14100c"/>
        </g>`;
      return `${relogio(100, '12')}${relogio(140, '12')}`;
    },
  },
  {
    id: 'olh_lente',
    categoria: 'olhos',
    nome: 'Lente de Câmera',
    descricao: 'Abertura f/1.4 — captura até ideia mal iluminada.',
    raridade: 'raro',
    tema: 'tecnologia',
    piscar: false,
    render: () => {
      const lente = (x: number) => `
        <g transform="translate(${x} 108)">
          <circle r="9.5" fill="#0c0f18"/>
          <circle r="7" fill="none" stroke="#3a4054" stroke-width="1.4"/>
          <path d="M-5 -3 L0 -6 L5 -3 L6 2 L0 6 L-6 2 Z" fill="none" stroke="#5a6274" stroke-width="1.2"/>
          <circle r="2.6" fill="#1d3a5c"/>
          <circle cx="-2.4" cy="-3" r="1.6" fill="rgba(160,200,255,0.65)"/>
        </g>`;
      return `${lente(100)}${lente(140)}`;
    },
  },
  {
    id: 'olh_timido',
    categoria: 'olhos',
    nome: 'Tímido',
    descricao: 'Olhando para o chão e para as próprias ideias boas.',
    raridade: 'comum',
    tema: 'casual',
    usaCores: ['cabelo'],
    render: (p) => `
      <ellipse cx="100" cy="109" rx="10" ry="7" fill="#fdfdfa"/>
      <ellipse cx="140" cy="109" rx="10" ry="7" fill="#fdfdfa"/>
      <circle cx="97" cy="112" r="4.4" fill="${IRIS}"/>
      <circle cx="137" cy="112" r="4.4" fill="${IRIS}"/>
      <circle cx="97" cy="112" r="2" fill="#14100c"/>
      <circle cx="137" cy="112" r="2" fill="#14100c"/>
      ${sobrancelha(100, 95, 2, p.cabelo.escuro)}${sobrancelha(140, 95, 2, p.cabelo.escuro)}
      <ellipse cx="88" cy="121" rx="6" ry="3.4" fill="${alfa('#ff6b6b', 0.28)}"/>
      <ellipse cx="152" cy="121" rx="6" ry="3.4" fill="${alfa('#ff6b6b', 0.28)}"/>`,
  },
  {
    id: 'olh_penetrante',
    categoria: 'olhos',
    nome: 'Penetrante',
    descricao: 'Atravessa a desculpa e chega direto na causa raiz.',
    raridade: 'incomum',
    tema: 'executivo',
    usaCores: ['cabelo'],
    render: (p) => `
      <path d="M89 106 q 11 -6 22 0 q -11 8 -22 0 z" fill="#fdfdfa"/>
      <path d="M129 106 q 11 -6 22 0 q -11 8 -22 0 z" fill="#fdfdfa"/>
      <circle cx="100" cy="107.5" r="3.8" fill="${IRIS}"/>
      <circle cx="140" cy="107.5" r="3.8" fill="${IRIS}"/>
      <circle cx="100" cy="107.5" r="1.8" fill="#14100c"/>
      <circle cx="140" cy="107.5" r="1.8" fill="#14100c"/>
      <path d="M88 94 l 23 3 M152 94 l -23 3" stroke="${p.cabelo.escuro}" stroke-width="4.4" stroke-linecap="round"/>`,
  },
  {
    id: 'olh_galaxia',
    categoria: 'olhos',
    nome: 'Galáxia',
    descricao: 'Duas espirais de estrelas no lugar do olhar.',
    raridade: 'epico',
    tema: 'espaço',
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>
        <radialGradient id="${u}gal" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stop-color="#c99aff"/>
          <stop offset="0.5" stop-color="#3d2a6e"/>
          <stop offset="1" stop-color="#0c0a2e"/>
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="url(#${u}gal)"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="url(#${u}gal)"/>
      <circle cx="97" cy="106" r="0.9" fill="#ffffff"/>
      <circle cx="103" cy="110" r="0.7" fill="#ffffff" opacity="0.8"/>
      <circle cx="137" cy="110" r="0.9" fill="#ffffff"/>
      <circle cx="143" cy="106" r="0.7" fill="#ffffff" opacity="0.8"/>
      <circle cx="100" cy="108" r="1.6" fill="#ffffff">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="140" cy="108" r="1.6" fill="#ffffff">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.6s" repeatCount="indefinite"/>
      </circle>
      ${sobrancelha(100, 92, 0, p.cabelo.escuro)}${sobrancelha(140, 92, 0, p.cabelo.escuro)}`,
  },
  {
    id: 'olh_buscando_sinal',
    categoria: 'olhos',
    nome: 'Buscando Sinal',
    descricao: 'Carregando resposta… não desligue o colaborador.',
    raridade: 'incomum',
    tema: 'tecnologia',
    piscar: false,
    render: () => {
      const pontos = (x: number, atraso: number) => `
        <ellipse cx="${x}" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
        <circle cx="${x - 5}" cy="108" r="1.8" fill="#3a4054">
          <animate attributeName="opacity" values="0.25;1;0.25" dur="1.4s" begin="${atraso}s" repeatCount="indefinite"/>
        </circle>
        <circle cx="${x}" cy="108" r="1.8" fill="#3a4054">
          <animate attributeName="opacity" values="0.25;1;0.25" dur="1.4s" begin="${atraso + 0.25}s" repeatCount="indefinite"/>
        </circle>
        <circle cx="${x + 5}" cy="108" r="1.8" fill="#3a4054">
          <animate attributeName="opacity" values="0.25;1;0.25" dur="1.4s" begin="${atraso + 0.5}s" repeatCount="indefinite"/>
        </circle>`;
      return `${pontos(100, 0)}${pontos(140, 0.15)}`;
    },
  },
];
