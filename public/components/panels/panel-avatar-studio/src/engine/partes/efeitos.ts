// engine/partes/efeitos.ts — efeitos especiais do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// `atras: true` renderiza logo após o fundo (aura, chuva digital) — o resto
// vai por cima de tudo, desenhado nas bordas para nunca cobrir o rosto.
// Animações são SMIL nativas (autocontidas no SVG salvo/exportado).
import { alfa } from '../cores';
import type { ParteDef } from '../base-api';

export const EFEITOS: ParteDef[] = [
  {
    id: 'efe_aura',
    categoria: 'efeito',
    nome: 'Aura de Poder',
    descricao: 'Halo de energia irradiando atrás do personagem.',
    raridade: 'raro',
    tema: 'fantasia',
    usaCores: ['destaque'],
    atras: true,
    render: (p, u) => `
      <defs>
        <radialGradient id="${u}aura" cx="0.5" cy="0.55" r="0.55">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.55)}"/>
          <stop offset="0.6" stop-color="${alfa(p.destaque.base, 0.28)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0)}"/>
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}aura)">
        <animate attributeName="opacity" values="1;0.6;1" dur="3.4s" repeatCount="indefinite"/>
      </rect>`,
  },
  {
    id: 'efe_chuva',
    categoria: 'efeito',
    nome: 'Chuva Digital',
    descricao: 'Colunas de código escorrendo atrás de você.',
    raridade: 'raro',
    tema: 'cyberpunk',
    usaCores: ['destaque'],
    atras: true,
    render: (p, u) => {
      let colunas = '';
      for (let i = 0; i < 9; i++) {
        const x = 14 + i * 26;
        const alt = 40 + ((i * 37) % 60);
        const dur = (2.2 + ((i * 13) % 20) / 10).toFixed(1);
        const atraso = ((i * 7) % 20) / 10;
        colunas += `
        <line x1="${x}" y1="-${alt}" x2="${x}" y2="0" stroke="url(#${u}chv)" stroke-width="2.4">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 ${240 + alt}" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </line>`;
      }
      return `
      <defs>
        <linearGradient id="${u}chv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.base, 0)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.claro, 0.8)}"/>
        </linearGradient>
      </defs>${colunas}`;
    },
  },
  {
    id: 'efe_scanlines',
    categoria: 'efeito',
    nome: 'Scanlines CRT',
    descricao: 'Textura de monitor retrô sobre a cena.',
    raridade: 'incomum',
    tema: 'retrô',
    render: (_p, u) => `
      <defs>
        <pattern id="${u}scan" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="1.4" fill="rgba(0,0,0,0.22)"/>
        </pattern>
      </defs>
      <rect width="240" height="240" fill="url(#${u}scan)"/>
      <rect width="240" height="240" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="16"/>`,
  },
  {
    id: 'efe_particulas',
    categoria: 'efeito',
    nome: 'Partículas Flutuantes',
    descricao: 'Pontos de luz subindo lentamente pelas bordas.',
    raridade: 'raro',
    tema: 'fantasia',
    usaCores: ['destaque'],
    render: (p) => {
      let pts = '';
      const pos: Array<[number, number]> = [
        [18, 200], [34, 150], [22, 96], [44, 52], [206, 190], [222, 140], [214, 84], [196, 44], [60, 224], [180, 226],
      ];
      pos.forEach(([x, y], i) => {
        const dur = (3 + (i % 4)).toFixed(0);
        pts += `
        <circle cx="${x}" cy="${y}" r="${2 + (i % 3)}" fill="${alfa(p.destaque.claro, 0.85)}">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -26; 0 0" dur="${dur}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.85;0.2;0.85" dur="${dur}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite"/>
        </circle>`;
      });
      return pts;
    },
  },
  {
    id: 'efe_portal',
    categoria: 'efeito',
    nome: 'Portal Dimensional',
    descricao: 'Anéis giratórios de outra dimensão atrás de você.',
    raridade: 'lendario',
    tema: 'sci-fi',
    usaCores: ['destaque'],
    atras: true,
    render: (p, u) => `
      <defs>
        <radialGradient id="${u}ptl" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stop-color="${alfa(p.destaque.base, 0)}"/>
          <stop offset="0.8" stop-color="${alfa(p.destaque.base, 0.3)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0)}"/>
        </radialGradient>
      </defs>
      <circle cx="120" cy="118" r="92" fill="url(#${u}ptl)"/>
      <g stroke="${alfa(p.destaque.claro, 0.7)}" stroke-width="2.4" fill="none" stroke-dasharray="26 18">
        <circle cx="120" cy="118" r="86">
          <animateTransform attributeName="transform" type="rotate" from="0 120 118" to="360 120 118" dur="14s" repeatCount="indefinite"/>
        </circle>
      </g>
      <g stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="1.6" fill="none" stroke-dasharray="10 14">
        <circle cx="120" cy="118" r="74">
          <animateTransform attributeName="transform" type="rotate" from="360 120 118" to="0 120 118" dur="10s" repeatCount="indefinite"/>
        </circle>
      </g>`,
  },
  {
    id: 'efe_raio',
    categoria: 'efeito',
    nome: 'Tempestade Elétrica',
    descricao: 'Relâmpagos estalando ao redor — cuidado ao apertar a mão.',
    raridade: 'epico',
    tema: 'fantasia',
    usaCores: ['destaque'],
    render: (p) => {
      const raio = (d: string, dur: string, atraso: string) => `
        <path d="${d}" stroke="${p.destaque.claro}" stroke-width="2.6" fill="none" stroke-linejoin="round" opacity="0">
          <animate attributeName="opacity" values="0;1;0;0" keyTimes="0;0.06;0.16;1" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </path>`;
      return `
      ${raio('M30 40 l 12 22 l -10 4 l 14 26', '2.8', '0')}
      ${raio('M208 60 l -12 20 l 10 5 l -13 23', '3.4', '1.1')}
      ${raio('M44 190 l 10 -18 l -8 -4 l 12 -20', '3.1', '2.0')}
      ${raio('M198 186 l -9 -16 l 8 -5 l -11 -19', '2.6', '0.7')}`;
    },
  },
  {
    id: 'efe_glitch',
    categoria: 'efeito',
    nome: 'Glitch',
    descricao: 'A realidade desincroniza por um instante. Você não.',
    raridade: 'epico',
    tema: 'cyberpunk',
    render: () => `
      <g opacity="0">
        <rect x="0" y="58" width="240" height="7" fill="rgba(76,217,232,0.5)"/>
        <rect x="0" y="132" width="240" height="5" fill="rgba(255,95,143,0.5)"/>
        <animate attributeName="opacity" values="0;1;0;0;1;0;0" keyTimes="0;0.03;0.08;0.5;0.53;0.58;1" dur="3.6s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="translate" values="0 0; -8 0; 6 0; 0 0" dur="3.6s" repeatCount="indefinite"/>
      </g>
      <g opacity="0">
        <rect x="0" y="90" width="240" height="4" fill="rgba(76,217,232,0.45)"/>
        <rect x="0" y="182" width="240" height="6" fill="rgba(255,95,143,0.45)"/>
        <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.3;0.34;0.4;1" dur="4.4s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="translate" values="0 0; 9 0; -5 0; 0 0" dur="4.4s" repeatCount="indefinite"/>
      </g>`,
  },
  {
    id: 'efe_fogo',
    categoria: 'efeito',
    nome: 'Chamas Vivas',
    descricao: 'O fogo de quem carrega a meta do time inteiro.',
    raridade: 'mitico',
    tema: 'fantasia',
    atras: true,
    render: (_p, u) => {
      const chama = (x: number, esc: number, dur: string, atraso: string) => `
        <g transform="translate(${x} 236) scale(${esc})">
          <path d="M0 0 c -12 -14 -8 -30 0 -42 c 3 10 10 12 8 24 c 6 -6 6 -14 4 -20 c 8 10 10 26 -2 38 z" fill="url(#${u}fg1)">
            <animateTransform attributeName="transform" type="scale" values="1;1.14 0.92;1" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite" additive="sum"/>
          </path>
        </g>`;
      return `
      <defs>
        <linearGradient id="${u}fg1" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#ff5230"/>
          <stop offset="0.6" stop-color="#ff9a3d"/>
          <stop offset="1" stop-color="#ffd76e"/>
        </linearGradient>
      </defs>
      ${chama(28, 1, '0.9', '0')}
      ${chama(54, 0.7, '1.1', '0.3')}
      ${chama(186, 0.75, '1.0', '0.5')}
      ${chama(212, 1.05, '0.85', '0.2')}
      ${chama(40, 0.5, '1.2', '0.6')}
      ${chama(200, 0.55, '1.15', '0.1')}`;
    },
  },
  {
    id: 'efe_confete',
    categoria: 'efeito',
    nome: 'Confete Eterno',
    descricao: 'A festa do Colecionador nunca termina.',
    raridade: 'lendario',
    tema: 'conquista',
    bloqueadoPor: 'conquista:colecionador_5',
    render: () => {
      const CORES = ['#ff5f6e', '#ffb74c', '#4cd97c', '#4c9de8', '#b06ce8', '#ffd76e'];
      let pedacos = '';
      for (let i = 0; i < 16; i++) {
        const x = ((i * 61) % 224) + 8;
        const dur = (3 + (i % 5) * 0.5).toFixed(1);
        const atraso = ((i * 7) % 30) / 10;
        const rot = 40 + (i % 4) * 70;
        pedacos += `
        <rect x="${x}" y="-14" width="7" height="11" rx="1.5" fill="${CORES[i % CORES.length]}" opacity="0.9" transform="rotate(${rot} ${x} 0)">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 268" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite" additive="sum"/>
        </rect>`;
      }
      return pedacos;
    },
  },
  {
    id: 'efe_faiscas',
    categoria: 'efeito',
    nome: 'Faíscas Lendárias',
    descricao: 'Cintilações douradas em cruz — brilho de troféu.',
    raridade: 'lendario',
    tema: 'fantasia',
    render: () => {
      const faisca = (x: number, y: number, s: number, d: string, atraso: string) => `
        <path d="M${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y} L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28} L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z" fill="#ffe89a">
          <animate attributeName="opacity" values="0;1;0" dur="${d}s" begin="${atraso}s" repeatCount="indefinite"/>
        </path>`;
      return `
      ${faisca(36, 60, 9, '2.4', '0')}
      ${faisca(206, 90, 7, '2.8', '0.9')}
      ${faisca(210, 196, 10, '3.1', '1.6')}
      ${faisca(30, 176, 6, '2.2', '0.5')}
      ${faisca(120, 26, 8, '2.9', '1.2')}
      ${faisca(66, 222, 5, '2.5', '1.9')}`;
    },
  },
];
