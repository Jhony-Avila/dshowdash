// engine/partes/cabelos.ts — cabelos do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Desenhados SOBRE a cabeça (cy=106, rx=50, ry=57, topo≈49). Slot `cabelo`
// com gradiente de volume + arco de brilho. Categoria opcional ('nenhum').
import { alfa } from '../cores';
import type { ParteDef } from '../base-api';

function defsCabelo(u: string, claro: string, base: string, profundo: string): string {
  return `
    <linearGradient id="${u}cab" x1="0.2" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${claro}"/>
      <stop offset="0.45" stop-color="${base}"/>
      <stop offset="1" stop-color="${profundo}"/>
    </linearGradient>`;
}

/** Cabelos exigem cabeça humanoide (§35) — espécies/robôs têm o próprio topo. */
const HUMANOIDES = ['bas_classica', 'bas_angular', 'bas_holo'];

const BRILHO = `<path d="M88 66 a 46 40 0 0 1 34 -12" stroke="${alfa('#ffffff', 0.3)}" stroke-width="4" stroke-linecap="round" fill="none"/>`;

export const CABELOS: ParteDef[] = [
  {
    id: 'cab_curto',
    categoria: 'cabelo',
    nome: 'Curto Social',
    descricao: 'Corte baixo e alinhado, pronto para a reunião.',
    raridade: 'comum',
    tema: 'executivo',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 104 c -2 -38 22 -57 50 -57 s 52 19 50 57 c -1 -6 -4 -12 -8 -16 c 2 -22 -18 -32 -42 -32 s -44 10 -42 32 c -4 4 -7 10 -8 16 z" fill="url(#${u}cab)"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_topete',
    categoria: 'cabelo',
    nome: 'Topete',
    descricao: 'Volume para cima com atitude clássica.',
    raridade: 'comum',
    tema: 'clássico',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 102 c -4 -30 10 -48 24 -56 c 20 -12 46 -10 60 2 c 14 12 18 32 16 54 c -4 -10 -8 -16 -14 -20 c 4 -14 -4 -24 -14 -26 c 4 8 2 12 -2 16 c -8 -12 -26 -16 -40 -10 c -14 6 -22 20 -22 34 c -4 2 -6 4 -8 6 z" fill="url(#${u}cab)"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_franja',
    categoria: 'cabelo',
    nome: 'Franja Repicada',
    descricao: 'Mechas caindo sobre a testa em camadas.',
    raridade: 'comum',
    tema: 'casual',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 106 c -3 -40 22 -59 50 -59 s 53 19 50 59 l -6 -14 l -8 12 l -6 -18 l -10 14 l -8 -18 l -10 16 l -10 -16 l -8 18 l -10 -14 l -6 18 l -8 -12 z" fill="url(#${u}cab)"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_ondulado',
    categoria: 'cabelo',
    nome: 'Ondulado',
    descricao: 'Ondas volumosas emoldurando o rosto.',
    raridade: 'incomum',
    tema: 'casual',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M66 120 c -8 -50 24 -74 54 -74 s 62 24 54 74 c -6 -8 -8 -18 -8 -26 c -4 6 -10 8 -16 8 c 2 -8 0 -14 -4 -18 c -4 8 -12 12 -22 12 c 4 -6 4 -12 2 -16 c -8 10 -22 14 -34 12 c 2 4 2 10 0 14 c -8 -2 -14 -6 -16 -12 c -2 8 -4 18 -10 26 z" fill="url(#${u}cab)"/>
      <path d="M66 118 c -4 10 -2 20 4 26 c -8 0 -12 -4 -14 -8 c 0 8 4 16 12 20 c -2 -12 0 -26 -2 -38 z" fill="${p.cabelo.escuro}"/>
      <path d="M174 118 c 4 10 2 20 -4 26 c 8 0 12 -4 14 -8 c 0 8 -4 16 -12 20 c 2 -12 0 -26 2 -38 z" fill="${p.cabelo.escuro}"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_coque',
    categoria: 'cabelo',
    nome: 'Coque Samurai',
    descricao: 'Preso no alto, disciplina e estilo.',
    raridade: 'incomum',
    tema: 'casual',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <circle cx="120" cy="38" r="15" fill="url(#${u}cab)"/>
      <rect x="108" y="48" width="24" height="7" rx="3.5" fill="${p.cabelo.profundo}"/>
      <path d="M71 102 c -2 -36 21 -55 49 -55 s 51 19 49 55 c -2 -8 -5 -13 -9 -17 c 3 -20 -17 -30 -40 -30 s -43 10 -40 30 c -4 4 -7 9 -9 17 z" fill="url(#${u}cab)"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_cacheado',
    categoria: 'cabelo',
    nome: 'Cacheado Power',
    descricao: 'Coroa de cachos com presença e volume.',
    raridade: 'incomum',
    tema: 'casual',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => {
      let cachos = '';
      const pontos: Array<[number, number, number]> = [
        [78, 74, 15], [95, 60, 16], [120, 54, 17], [145, 60, 16], [162, 74, 15],
        [70, 92, 13], [170, 92, 13], [88, 58, 12], [152, 58, 12], [107, 50, 13], [133, 50, 13],
      ];
      for (const [x, y, r] of pontos) cachos += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}cab)"/>`;
      return `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      ${cachos}
      <path d="M72 100 c 0 -20 18 -34 48 -34 s 48 14 48 34 c -10 -12 -26 -18 -48 -18 s -38 6 -48 18 z" fill="url(#${u}cab)"/>
      <circle cx="96" cy="60" r="5" fill="${alfa('#ffffff', 0.22)}"/>
      <circle cx="126" cy="52" r="4" fill="${alfa('#ffffff', 0.22)}"/>`;
    },
  },
  {
    id: 'cab_longo',
    categoria: 'cabelo',
    nome: 'Longo Lendário',
    descricao: 'Cabelo longo escorrendo pelos ombros.',
    raridade: 'raro',
    tema: 'clássico',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M74 82 C 60 110 56 150 60 186 c 8 8 20 12 30 10 c -6 -34 -6 -66 -2 -96 c -10 -4 -18 -8 -24 -14 z" fill="url(#${u}cab)"/>
      <path d="M166 82 C 180 110 184 150 180 186 c -8 8 -20 12 -30 10 c 6 -34 6 -66 2 -96 c 10 -4 18 -8 24 -14 z" fill="url(#${u}cab)"/>
      <path d="M70 104 c -4 -38 22 -57 50 -57 s 54 19 50 57 c -5 -14 -13 -22 -22 -26 c 3 -9 -8 -16 -28 -16 s -31 7 -28 16 c -9 4 -17 12 -22 26 z" fill="url(#${u}cab)"/>
      <path d="M92 78 c 8 -6 18 -9 28 -9 s 20 3 28 9" stroke="${alfa(p.cabelo.profundo, 0.5)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_moicano',
    categoria: 'cabelo',
    nome: 'Moicano',
    descricao: 'Crista desafiadora de quem não segue manada.',
    raridade: 'raro',
    tema: 'punk',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M104 62 l 4 -34 l 8 26 l 4 -30 l 4 30 l 8 -26 l 4 34 c 0 6 -8 10 -16 10 s -16 -4 -16 -10 z" fill="url(#${u}cab)"/>
      <path d="M100 66 c 0 -10 9 -16 20 -16 s 20 6 20 16 l -2 10 c -4 -6 -10 -8 -18 -8 s -14 2 -18 8 z" fill="url(#${u}cab)"/>
      <path d="M74 92 a 50 57 0 0 1 14 -26" stroke="${alfa(p.cabelo.profundo, 0.4)}" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M166 92 a 50 57 0 0 0 -14 -26" stroke="${alfa(p.cabelo.profundo, 0.4)}" stroke-width="6" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'cab_cyber',
    categoria: 'cabelo',
    nome: 'Undercut Neon',
    descricao: 'Undercut futurista com trilhas de luz raspadas.',
    raridade: 'epico',
    tema: 'cyberpunk',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo', 'destaque'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M74 86 a 50 57 0 0 1 92 0 c -4 -6 -10 -10 -16 -12 l 8 -6 c -8 -2 -14 0 -20 4 c -2 -8 -8 -12 -14 -14 c 2 4 2 8 0 12 c -6 -6 -14 -8 -22 -6 c 4 2 6 6 6 10 c -14 -4 -26 2 -34 12 z" fill="url(#${u}cab)"/>
      <path d="M120 64 c 18 -2 34 8 42 22 l 4 18 c -8 -18 -26 -28 -46 -28 z" fill="${alfa(p.cabelo.profundo, 0.5)}"/>
      <g stroke="${p.destaque.base}" stroke-width="2" stroke-linecap="round" opacity="0.85">
        <path d="M76 96 l 14 -8"/>
        <path d="M78 104 l 16 -9"/>
        <path d="M164 96 l -14 -8"/>
        <path d="M162 104 l -16 -9"/>
      </g>
      ${BRILHO}`,
  },
];
