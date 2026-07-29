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
