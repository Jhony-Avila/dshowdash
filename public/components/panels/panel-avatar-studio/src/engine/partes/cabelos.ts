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

/** Cabelos exigem cabeça humanoide (§35) — espécies/robôs têm o próprio topo.
 *  4.6 F2 Onda 1: os 6 rostos novos entram aqui (a lista É compartilhada —
 *  atualizar aqui atualiza requerBase de TODOS os cabelos). */
const HUMANOIDES = [
  'bas_classica', 'bas_angular', 'bas_holo',
  'bas_redonda', 'bas_coracao', 'bas_quadrada', 'bas_longa', 'bas_marcada', 'bas_sardas',
  // Onda 7
  'bas_triangular', 'bas_bochechudo', 'bas_diamante', 'bas_veterano', 'bas_juvenil', 'bas_meio_cyborg',
  // Onda 8
  'bas_madura', 'bas_sereno', 'bas_gotico', 'bas_estatua',
];

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
  // ── 4.6 F2 · Onda 1 (identidade) — 10 cabelos novos ───────────────
  {
    id: 'cab_rabo',
    categoria: 'cabelo',
    nome: 'Rabo de Cavalo',
    descricao: 'Preso alto, pronto para resolver qualquer sprint.',
    raridade: 'comum',
    tema: 'esportivo',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 100 c -2 -36 22 -55 50 -55 s 52 19 50 55 c -2 -8 -6 -14 -10 -18 c 2 -20 -16 -30 -40 -30 s -42 10 -40 30 c -4 4 -8 10 -10 18 z" fill="url(#${u}cab)"/>
      <path d="M158 62 c 14 -4 22 4 22 16 c 0 20 -8 44 -22 56 c 6 -20 8 -42 0 -60 z" fill="url(#${u}cab)"/>
      <ellipse cx="160" cy="66" rx="5" ry="7" fill="${alfa(p.cabelo.profundo, 0.8)}"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_lateral',
    categoria: 'cabelo',
    nome: 'Risca Lateral',
    descricao: 'Divisão milimétrica — pente e disciplina.',
    raridade: 'comum',
    tema: 'executivo',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 100 c -2 -36 22 -55 50 -55 s 52 19 50 55 c -2 -10 -6 -16 -10 -20 c 0 -8 -2 -14 -8 -18 l -48 4 c -14 4 -24 14 -24 26 c -4 2 -8 6 -10 8 z" fill="url(#${u}cab)"/>
      <path d="M104 62 l 44 -4 c 8 4 10 12 8 18 l -50 2 c -2 -6 -2 -12 -2 -16 z" fill="${alfa(p.cabelo.profundo, 0.55)}"/>
      <path d="M104 62 l 46 -4" stroke="${alfa(p.cabelo.claro, 0.5)}" stroke-width="1.6"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_buzz',
    categoria: 'cabelo',
    nome: 'Raspado',
    descricao: 'Máquina zero e foco total.',
    raridade: 'comum',
    tema: 'esportivo',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M72 96 a 50 55 0 0 1 96 0 c -1 -4 -3 -8 -6 -11 a 44 48 0 0 0 -84 0 c -3 3 -5 7 -6 11 z" fill="${alfa(p.cabelo.base, 0.85)}"/>
      <path d="M76 88 a 46 50 0 0 1 88 0" stroke="${alfa(p.cabelo.profundo, 0.35)}" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="2 4"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_afro',
    categoria: 'cabelo',
    nome: 'Afro',
    descricao: 'Coroa cheia com volume de respeito.',
    raridade: 'incomum',
    tema: 'clássico',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <circle cx="88" cy="70" r="20" fill="url(#${u}cab)"/>
      <circle cx="120" cy="58" r="24" fill="url(#${u}cab)"/>
      <circle cx="152" cy="70" r="20" fill="url(#${u}cab)"/>
      <circle cx="72" cy="92" r="16" fill="url(#${u}cab)"/>
      <circle cx="168" cy="92" r="16" fill="url(#${u}cab)"/>
      <path d="M72 100 c -2 -34 20 -52 48 -52 s 50 18 48 52 c -10 -22 -26 -32 -48 -32 s -38 10 -48 32 z" fill="url(#${u}cab)"/>
      <circle cx="100" cy="56" r="3" fill="${alfa('#ffffff', 0.22)}"/>
      <circle cx="132" cy="52" r="3" fill="${alfa('#ffffff', 0.22)}"/>
      <circle cx="82" cy="76" r="2.5" fill="${alfa('#ffffff', 0.18)}"/>`,
  },
  {
    id: 'cab_trancas',
    categoria: 'cabelo',
    nome: 'Tranças Box',
    descricao: 'Fileiras alinhadas e tranças com contas de luz.',
    raridade: 'raro',
    tema: 'urbano',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo', 'destaque'],
    render: (p, u) => {
      // fileiras (cornrows) SÓ no couro cabeludo + tranças penduradas nas
      // laterais — nunca sobre o rosto
      let fileiras = '';
      for (let i = 0; i < 5; i++) {
        const x = 92 + i * 14;
        fileiras += `<path d="M${x} 48 q ${(x - 120) * 0.35} 16 ${(x - 120) * 0.55} 26" stroke="${alfa(p.cabelo.profundo, 0.55)}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
      }
      let laterais = '';
      for (const dir of [-1, 1]) {
        for (let j = 0; j < 2; j++) {
          const x = 120 + dir * (46 + j * 8);
          laterais += `<path d="M${x} ${92 + j * 6} q ${dir * 6} 30 ${dir * 3} ${56 - j * 10}" stroke="url(#${u}cab)" stroke-width="8" stroke-linecap="round" fill="none"/>`;
          for (let k = 0; k < 3; k++) {
            laterais += `<ellipse cx="${x + dir * (2 + k)}" cy="${106 + j * 4 + k * 15}" rx="4.2" ry="3" fill="${alfa(p.cabelo.profundo, 0.55)}"/>`;
          }
          laterais += `<circle cx="${x + dir * 4}" cy="${150 - j * 6}" r="3.2" fill="${p.destaque.base}" opacity="0.9"/>`;
        }
      }
      return `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M72 100 c -4 -34 20 -54 48 -54 s 52 20 48 54 c -8 -20 -26 -30 -48 -30 s -40 10 -48 30 z" fill="url(#${u}cab)"/>
      ${fileiras}
      ${laterais}
      ${BRILHO}`;
    },
  },
  {
    id: 'cab_medio',
    categoria: 'cabelo',
    nome: 'Médio Despojado',
    descricao: 'Na altura do queixo, do jeito que acordou.',
    raridade: 'comum',
    tema: 'casual',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M68 132 c -6 -52 20 -87 52 -87 s 58 35 52 87 c -4 -8 -8 -12 -12 -14 l 2 -18 c -4 6 -8 8 -12 8 c 2 -12 -2 -22 -10 -28 c 2 8 0 14 -4 18 c -6 -10 -16 -14 -26 -12 c 4 4 6 8 6 12 c -12 -4 -24 2 -30 12 l 2 20 c -8 2 -16 -4 -20 2 z" fill="url(#${u}cab)"/>
      <path d="M70 128 q -4 10 2 18 M170 128 q 4 10 -2 18" stroke="url(#${u}cab)" stroke-width="10" stroke-linecap="round" fill="none"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_franja_longa',
    categoria: 'cabelo',
    nome: 'Longo com Franja',
    descricao: 'Cortina lisa até os ombros com franja reta.',
    raridade: 'incomum',
    tema: 'clássico',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M66 170 c -8 -70 18 -125 54 -125 s 62 55 54 125 l -14 6 c 4 -40 0 -70 -8 -88 l 0 14 l -64 0 l 0 -14 c -8 18 -12 48 -8 88 z" fill="url(#${u}cab)"/>
      <path d="M88 68 h 64 c 2 8 2 16 0 22 l -8 -8 l -8 10 l -8 -10 l -8 10 l -8 -10 l -8 10 l -8 -8 c -2 -6 -2 -14 0 -16 z" fill="url(#${u}cab)"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_meio_coque',
    categoria: 'cabelo',
    nome: 'Meio Coque',
    descricao: 'Metade presa, metade solta — equilíbrio perfeito.',
    raridade: 'raro',
    tema: 'urbano',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <circle cx="120" cy="38" r="15" fill="url(#${u}cab)"/>
      <path d="M108 46 q 12 8 24 0" stroke="${alfa(p.cabelo.profundo, 0.5)}" stroke-width="3" fill="none"/>
      <path d="M70 118 c -4 -44 20 -66 50 -66 s 54 22 50 66 c -4 -8 -8 -12 -12 -14 c 2 -24 -14 -36 -38 -36 s -40 12 -38 36 c -4 2 -8 6 -12 14 z" fill="url(#${u}cab)"/>
      <path d="M72 116 q -4 14 4 24 M168 116 q 4 14 -4 24" stroke="url(#${u}cab)" stroke-width="9" stroke-linecap="round" fill="none"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_ondas_curtas',
    categoria: 'cabelo',
    nome: 'Ondas Curtas',
    descricao: 'Textura viva sem esforço nenhum.',
    raridade: 'incomum',
    tema: 'casual',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 100 c -2 -36 22 -55 50 -55 s 52 19 50 55 c -3 -7 -6 -12 -10 -16 c 3 -19 -16 -30 -40 -30 s -43 11 -40 30 c -4 4 -7 9 -10 16 z" fill="url(#${u}cab)"/>
      <g stroke="${alfa(p.cabelo.profundo, 0.45)}" stroke-width="2.6" fill="none" stroke-linecap="round">
        <path d="M88 62 q 4 -4 8 0 q 4 4 8 0"/>
        <path d="M112 54 q 4 -4 8 0 q 4 4 8 0"/>
        <path d="M136 62 q 4 -4 8 0"/>
        <path d="M98 74 q 4 -4 8 0 q 4 4 8 0"/>
        <path d="M126 72 q 4 -4 8 0"/>
      </g>
      ${BRILHO}`,
  },
  {
    id: 'cab_picos_neon',
    categoria: 'cabelo',
    nome: 'Picos Neon',
    descricao: 'Espetado com pontas mergulhadas em luz.',
    raridade: 'epico',
    tema: 'cyberpunk',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo', 'destaque'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}
        <linearGradient id="${u}pico" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="${p.cabelo.base}"/>
          <stop offset="0.62" stop-color="${p.cabelo.base}"/>
          <stop offset="1" stop-color="${p.destaque.base}"/>
        </linearGradient>
      </defs>
      <path d="M74 96 c 0 -12 4 -22 10 -30 l 2 -22 l 10 16 l 8 -22 l 8 18 l 8 -24 l 8 24 l 8 -18 l 8 22 l 10 -16 l 2 22 c 6 8 10 18 10 30 c -10 -18 -26 -26 -46 -26 s -36 8 -46 26 z" fill="url(#${u}pico)"/>
      <path d="M86 44 l 10 16 M110 36 l 8 18 M134 36 l -8 18 M158 44 l -10 16" stroke="${alfa(p.destaque.claro, 0.35)}" stroke-width="2" stroke-linecap="round"/>
      ${BRILHO}`,
  },
  // ── 4.6 F2 · Onda 6 (identidade) — 14 cabelos novos ───────────────
  {
    id: 'cab_pixie',
    categoria: 'cabelo',
    nome: 'Pixie',
    descricao: 'Curto, prático e cheio de atitude.',
    raridade: 'comum',
    tema: 'casual',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 102 c -4 -36 20 -56 50 -56 s 54 20 50 56 c -2 -8 -6 -14 -10 -17 c 3 -18 -14 -29 -40 -29 s -43 11 -40 29 c -4 3 -8 9 -10 17 z" fill="url(#${u}cab)"/>
      <path d="M78 88 q 8 -6 14 -2 l -6 10 z M150 84 q 8 2 12 8 l -10 4 z" fill="url(#${u}cab)"/>
      <path d="M112 58 q 10 -4 20 2" stroke="${alfa(p.cabelo.profundo, 0.5)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_repicado_longo',
    categoria: 'cabelo',
    nome: 'Repicado Longo',
    descricao: 'Camadas em movimento até os ombros.',
    raridade: 'incomum',
    tema: 'casual',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M66 176 c -8 -66 16 -122 54 -122 s 62 56 54 122 l -12 4 c 4 -34 2 -62 -6 -80 l -2 12 l -10 -18 l -6 14 l -12 -20 l -12 20 l -6 -14 l -10 18 l -2 -12 c -8 18 -10 46 -6 80 z" fill="url(#${u}cab)"/>
      <path d="M70 150 q -4 14 4 24 M170 150 q 4 14 -4 24" stroke="url(#${u}cab)" stroke-width="8" stroke-linecap="round" fill="none"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_dreads',
    categoria: 'cabelo',
    nome: 'Dreads',
    descricao: 'Cordas grossas com peso e presença.',
    raridade: 'raro',
    tema: 'urbano',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => {
      let dreads = '';
      for (let i = 0; i < 7; i++) {
        const x = 78 + i * 14;
        const alt = 118 + ((i * 17) % 26);
        dreads += `<path d="M${x} 62 q ${(i % 2 ? 4 : -4)} ${alt / 2} ${(i % 2 ? 2 : -2)} ${alt}" stroke="url(#${u}cab)" stroke-width="10" stroke-linecap="round" fill="none"/>`;
        dreads += `<path d="M${x - 2} ${70 + (i % 3) * 20} h 5 M${x - 2} ${94 + (i % 3) * 18} h 5" stroke="${alfa(p.cabelo.profundo, 0.55)}" stroke-width="2.4"/>`;
      }
      return `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      ${dreads}
      <path d="M72 98 c -4 -34 20 -54 48 -54 s 52 20 48 54 c -8 -20 -26 -30 -48 -30 s -40 10 -48 30 z" fill="url(#${u}cab)"/>
      ${BRILHO}`;
    },
  },
  {
    id: 'cab_mullet',
    categoria: 'cabelo',
    nome: 'Mullet',
    descricao: 'Negócios na frente, festa atrás. Sempre foi assim.',
    raridade: 'incomum',
    tema: 'retrô',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 100 c -2 -36 22 -55 50 -55 s 52 19 50 55 c -3 -8 -6 -13 -10 -16 c 3 -18 -16 -30 -40 -30 s -43 12 -40 30 c -4 3 -7 8 -10 16 z" fill="url(#${u}cab)"/>
      <path d="M62 96 c -6 34 -2 62 10 78 l 8 -10 q -8 -26 -4 -52 z" fill="url(#${u}cab)"/>
      <path d="M178 96 c 6 34 2 62 -10 78 l -8 -10 q 8 -26 4 -52 z" fill="url(#${u}cab)"/>
      <path d="M70 168 q 25 16 50 16 t 50 -16 l -6 14 q -22 14 -44 14 t -44 -14 z" fill="url(#${u}cab)" opacity="0.9"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_pompadour',
    categoria: 'cabelo',
    nome: 'Pompadour',
    descricao: 'Volume esculpido com gel e convicção.',
    raridade: 'raro',
    tema: 'retrô',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M72 96 c -2 -20 6 -38 22 -48 c 22 -14 50 -12 66 4 c 10 10 12 26 8 44 c -4 -10 -10 -16 -16 -18 c 6 -16 -2 -28 -16 -30 c 4 8 4 14 0 18 c -10 -12 -30 -14 -42 -6 c -10 6 -14 18 -12 30 c -4 1 -8 3 -10 6 z" fill="url(#${u}cab)"/>
      <path d="M84 56 q 20 -14 44 -6" stroke="${alfa('#ffffff', 0.28)}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M76 84 q 12 -8 24 -6 M96 62 q 14 -6 28 -2" stroke="${alfa(p.cabelo.profundo, 0.4)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'cab_chanel',
    categoria: 'cabelo',
    nome: 'Chanel',
    descricao: 'Corte reto no queixo — geometria impecável.',
    raridade: 'incomum',
    tema: 'executivo',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M68 148 c -6 -58 16 -100 52 -100 s 58 42 52 100 l -16 4 v -44 c -4 6 -8 8 -12 8 c 2 -10 0 -18 -6 -24 c 0 6 -2 10 -6 12 c -4 -8 -12 -12 -20 -10 c 3 3 5 7 5 11 c -10 -2 -18 4 -21 12 l 0 35 z" fill="url(#${u}cab)"/>
      <path d="M68 146 h 16 M156 146 h 16" stroke="${alfa(p.cabelo.profundo, 0.6)}" stroke-width="3"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_coques_duplos',
    categoria: 'cabelo',
    nome: 'Coques Duplos',
    descricao: 'Simetria espacial: dois módulos de personalidade.',
    raridade: 'raro',
    tema: 'urbano',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <circle cx="82" cy="44" r="14" fill="url(#${u}cab)"/>
      <circle cx="158" cy="44" r="14" fill="url(#${u}cab)"/>
      <path d="M72 50 q 10 6 20 1 M148 51 q 10 5 20 -1" stroke="${alfa(p.cabelo.profundo, 0.5)}" stroke-width="2.6" fill="none"/>
      <path d="M70 100 c -2 -36 22 -55 50 -55 s 52 19 50 55 c -3 -8 -6 -13 -10 -16 c 3 -18 -16 -30 -40 -30 s -43 12 -40 30 c -4 3 -7 8 -10 16 z" fill="url(#${u}cab)"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_grisalho',
    categoria: 'cabelo',
    nome: 'Grisalho Sábio',
    descricao: 'Cada fio prata é um incidente resolvido.',
    raridade: 'raro',
    tema: 'clássico',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 104 c -2 -38 22 -57 50 -57 s 52 19 50 57 c -1 -6 -4 -12 -8 -16 c 2 -22 -18 -32 -42 -32 s -44 10 -42 32 c -4 4 -7 10 -8 16 z" fill="url(#${u}cab)"/>
      <g stroke="#d8dde8" stroke-width="2.4" stroke-linecap="round" opacity="0.8">
        <path d="M84 74 q 6 -10 14 -14"/>
        <path d="M104 58 q 8 -4 16 -4"/>
        <path d="M138 58 q 10 4 16 12"/>
        <path d="M156 78 q 4 6 5 12"/>
      </g>
      ${BRILHO}`,
  },
  {
    id: 'cab_emo',
    categoria: 'cabelo',
    nome: 'Franja Emo',
    descricao: 'Um olho coberto, o outro julgando o backlog.',
    raridade: 'incomum',
    tema: 'retrô',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 108 c -4 -40 20 -61 50 -61 s 54 21 50 61 c -2 -8 -6 -14 -10 -18 c 2 -20 -16 -30 -40 -30 s -42 10 -40 30 c -4 4 -8 10 -10 18 z" fill="url(#${u}cab)"/>
      <path d="M74 66 c 20 -12 42 -10 54 6 l -14 46 c -8 -6 -16 -8 -24 -6 l -12 -22 c -4 -8 -6 -16 -4 -24 z" fill="url(#${u}cab)"/>
      <path d="M80 76 q 14 -10 32 -4 M86 94 q 10 -6 20 -4" stroke="${alfa(p.cabelo.profundo, 0.45)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_lambido',
    categoria: 'cabelo',
    nome: 'Liso Lambido',
    descricao: 'Pente fino, gel firme, reunião às 8.',
    raridade: 'comum',
    tema: 'executivo',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M72 98 c -2 -32 18 -52 48 -52 s 50 20 48 52 c -2 -6 -5 -11 -9 -14 c 2 -20 -15 -30 -39 -30 s -41 10 -39 30 c -4 3 -7 8 -9 14 z" fill="url(#${u}cab)"/>
      <g stroke="${alfa(p.cabelo.profundo, 0.4)}" stroke-width="1.8" fill="none">
        <path d="M84 62 q 36 -14 72 0"/>
        <path d="M82 72 q 38 -14 76 0"/>
        <path d="M82 82 q 38 -12 76 0"/>
      </g>
      <path d="M88 58 a 46 40 0 0 1 30 -10" stroke="${alfa('#ffffff', 0.4)}" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'cab_cachos_soltos',
    categoria: 'cabelo',
    nome: 'Cachos Soltos',
    descricao: 'Molas naturais em queda livre controlada.',
    raridade: 'incomum',
    tema: 'casual',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => {
      let cachos = '';
      const pos: Array<[number, number, number]> = [
        [76, 96, 9], [70, 120, 8], [76, 144, 9], [164, 96, 9], [170, 120, 8], [164, 144, 9], [86, 164, 7], [154, 164, 7],
      ];
      for (const [x, y, r] of pos) {
        cachos += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}cab)"/>
        <path d="M${x - r / 2} ${y} a ${r / 2} ${r / 2} 0 0 1 ${r} 0" stroke="${alfa(p.cabelo.profundo, 0.45)}" stroke-width="1.8" fill="none"/>`;
      }
      return `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      ${cachos}
      <path d="M70 104 c -4 -38 20 -58 50 -58 s 54 20 50 58 c -8 -22 -26 -34 -50 -34 s -42 12 -50 34 z" fill="url(#${u}cab)"/>
      <circle cx="94" cy="56" r="8" fill="url(#${u}cab)"/>
      <circle cx="120" cy="48" r="9" fill="url(#${u}cab)"/>
      <circle cx="146" cy="56" r="8" fill="url(#${u}cab)"/>
      ${BRILHO}`;
    },
  },
  {
    id: 'cab_viking',
    categoria: 'cabelo',
    nome: 'Trança Viking',
    descricao: 'Laterais raspadas e uma trança que já viu batalhas.',
    raridade: 'epico',
    tema: 'aventura',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M78 92 a 50 55 0 0 1 84 0 c -2 -4 -4 -7 -7 -9 a 44 48 0 0 0 -70 0 c -3 2 -5 5 -7 9 z" fill="${alfa(p.cabelo.base, 0.55)}"/>
      <path d="M96 84 c -2 -26 10 -40 24 -40 s 26 14 24 40 c -6 -10 -14 -14 -24 -14 s -18 4 -24 14 z" fill="url(#${u}cab)"/>
      <path d="M138 52 q 24 14 28 48 q 3 30 -2 56" stroke="url(#${u}cab)" stroke-width="11" stroke-linecap="round" fill="none"/>
      <g fill="${alfa(p.cabelo.profundo, 0.55)}">
        <ellipse cx="158" cy="80" rx="5.6" ry="4"/>
        <ellipse cx="163" cy="98" rx="5.6" ry="4"/>
        <ellipse cx="165" cy="116" rx="5.6" ry="4"/>
        <ellipse cx="166" cy="134" rx="5.4" ry="3.8"/>
        <ellipse cx="165" cy="150" rx="5" ry="3.6"/>
      </g>
      <circle cx="164" cy="160" r="3.4" fill="#e8b64c"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_holo_gradiente',
    categoria: 'cabelo',
    nome: 'Holo Gradiente',
    descricao: 'As pontas dissolvem em luz de destaque.',
    raridade: 'epico',
    tema: 'cyberpunk',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo', 'destaque'],
    render: (p, u) => `
      <defs>
        <linearGradient id="${u}holo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.cabelo.base}"/>
          <stop offset="0.55" stop-color="${p.cabelo.base}"/>
          <stop offset="1" stop-color="${p.destaque.base}"/>
        </linearGradient>
      </defs>
      <path d="M66 168 c -8 -64 18 -116 54 -116 s 62 52 54 116 l -14 4 c 4 -34 0 -62 -8 -78 l -4 14 l -28 -24 l -28 24 l -4 -14 c -8 16 -12 44 -8 78 z" fill="url(#${u}holo)"/>
      <path d="M74 160 q 46 18 92 0" stroke="${alfa(p.destaque.claro, 0.5)}" stroke-width="2.4" fill="none">
        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2.6s" repeatCount="indefinite"/>
      </path>
      ${BRILHO}`,
  },
  {
    id: 'cab_tigela',
    categoria: 'cabelo',
    nome: 'Corte Tigela',
    descricao: 'A tigela foi calibrada em laboratório. Confie.',
    raridade: 'comum',
    tema: 'retrô',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 96 a 50 46 0 0 1 100 0 l -4 8 h -92 z" fill="url(#${u}cab)"/>
      <path d="M74 104 h 92" stroke="${alfa(p.cabelo.profundo, 0.6)}" stroke-width="3"/>
      ${BRILHO}`,
  },
  // ── 4.6 F2 · Onda 8 (final §28) — 17 cabelos novos (50 ✓) ─────────
  {
    id: 'cab_rabo_baixo',
    categoria: 'cabelo',
    nome: 'Rabo Baixo',
    descricao: 'Discrição na nuca, eficiência no resto.',
    raridade: 'comum',
    tema: 'executivo',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 102 c -2 -36 22 -55 50 -55 s 52 19 50 55 c -2 -7 -5 -12 -9 -15 c 2 -20 -17 -31 -41 -31 s -43 11 -41 31 c -4 3 -7 8 -9 15 z" fill="url(#${u}cab)"/>
      <path d="M162 116 q 14 20 8 46 q -6 -4 -8 -10 q -2 8 -8 12 q -2 -26 2 -48 z" fill="url(#${u}cab)"/>
      <ellipse cx="161" cy="120" rx="4.6" ry="6" fill="${alfa(p.cabelo.profundo, 0.75)}"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_franjinha',
    categoria: 'cabelo',
    nome: 'Franjinha Reta',
    descricao: 'Régua e tesoura: precisão milimétrica na testa.',
    raridade: 'comum',
    tema: 'casual',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 104 c -2 -38 22 -57 50 -57 s 52 19 50 57 c -2 -8 -5 -13 -9 -16 c 2 -20 -17 -32 -41 -32 s -43 12 -41 32 c -4 3 -7 8 -9 16 z" fill="url(#${u}cab)"/>
      <path d="M86 62 h 68 v 16 l -6 -4 l -6 5 l -6 -5 l -5 5 l -6 -5 l -6 5 l -5 -5 l -6 5 l -6 -4 l -6 4 l -6 -5 z" fill="url(#${u}cab)"/>
      <path d="M88 76 h 64" stroke="${alfa(p.cabelo.profundo, 0.35)}" stroke-width="2"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_ondas_longas',
    categoria: 'cabelo',
    nome: 'Ondas Longas',
    descricao: 'Movimento de comercial de shampoo em cada reunião.',
    raridade: 'incomum',
    tema: 'clássico',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M64 180 c -10 -70 16 -128 56 -128 s 66 58 56 128 l -14 4 c 6 -34 4 -64 -6 -84 q -2 12 -10 18 q 2 -14 -4 -24 q -6 8 -16 8 t -16 -8 q -6 10 -4 24 q -8 -6 -10 -18 c -10 20 -12 50 -6 84 z" fill="url(#${u}cab)"/>
      <path d="M68 130 q -8 18 -2 38 q 6 -4 8 -12 M172 130 q 8 18 2 38 q -6 -4 -8 -12" stroke="url(#${u}cab)" stroke-width="9" stroke-linecap="round" fill="none"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_sidecut',
    categoria: 'cabelo',
    nome: 'Sidecut',
    descricao: 'Um lado corporativo, outro lado revolução.',
    raridade: 'raro',
    tema: 'urbano',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M74 92 a 50 55 0 0 1 46 -44 l 0 10 a 44 48 0 0 0 -40 38 z" fill="${alfa(p.cabelo.base, 0.5)}"/>
      <path d="M78 86 l 10 -14 M76 96 l 14 -18" stroke="${alfa(p.cabelo.profundo, 0.4)}" stroke-width="2" stroke-linecap="round"/>
      <path d="M120 47 c 28 0 50 20 48 55 c -2 -8 -6 -14 -10 -17 c 3 -18 -14 -29 -38 -29 l -10 12 c -4 -8 -2 -16 10 -21 z" fill="url(#${u}cab)"/>
      <path d="M112 58 c 20 -6 40 2 46 18 l 2 20 c -8 -18 -26 -28 -48 -26 z" fill="url(#${u}cab)"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_juba',
    categoria: 'cabelo',
    nome: 'Juba Rebelde',
    descricao: 'Escova? Nunca ouviu falar. E funciona.',
    raridade: 'incomum',
    tema: 'casual',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => {
      let tufos = '';
      for (let i = 0; i < 9; i++) {
        const ang = (-160 + i * 20) * (Math.PI / 180);
        const x = 120 + Math.cos(ang) * 52;
        const y = 78 + Math.sin(ang) * 40;
        tufos += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="13" ry="9" fill="url(#${u}cab)" transform="rotate(${(-60 + i * 15).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      }
      return `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      ${tufos}
      <path d="M70 102 c -4 -38 20 -58 50 -58 s 54 20 50 58 c -8 -22 -26 -34 -50 -34 s -42 12 -50 34 z" fill="url(#${u}cab)"/>
      ${BRILHO}`;
    },
  },
  {
    id: 'cab_sabio',
    categoria: 'cabelo',
    nome: 'Sábio Calvo',
    descricao: 'O topo aberto para as ideias entrarem direto.',
    raridade: 'incomum',
    tema: 'clássico',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M68 104 q 2 24 12 34 q 6 -14 2 -32 q -6 -6 -14 -2 z" fill="url(#${u}cab)"/>
      <path d="M172 104 q -2 24 -12 34 q -6 -14 -2 -32 q 6 -6 14 -2 z" fill="url(#${u}cab)"/>
      <path d="M70 106 a 50 57 0 0 1 4 -22 q 4 10 2 22 z M170 106 a 50 57 0 0 0 -4 -22 q -4 10 -2 22 z" fill="${alfa(p.cabelo.base, 0.8)}"/>
      <path d="M96 56 a 50 40 0 0 1 12 -6" stroke="${alfa(p.cabelo.base, 0.5)}" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'cab_tranca_unica',
    categoria: 'cabelo',
    nome: 'Trança Única',
    descricao: 'Uma trança no ombro e nenhuma pressa no mundo.',
    raridade: 'incomum',
    tema: 'clássico',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 104 c -2 -38 22 -57 50 -57 s 52 19 50 57 c -2 -8 -6 -14 -10 -17 c 3 -19 -16 -31 -40 -31 s -43 12 -40 31 c -4 3 -8 9 -10 17 z" fill="url(#${u}cab)"/>
      <path d="M74 100 q -6 30 2 52 q 6 -6 8 -14 q 2 20 12 30 q 4 -10 2 -22" fill="none" stroke="url(#${u}cab)" stroke-width="10" stroke-linecap="round"/>
      <g fill="${alfa(p.cabelo.profundo, 0.55)}">
        <ellipse cx="76" cy="116" rx="5.4" ry="4"/>
        <ellipse cx="78" cy="134" rx="5.4" ry="4"/>
        <ellipse cx="84" cy="152" rx="5.2" ry="3.8"/>
        <ellipse cx="92" cy="166" rx="5" ry="3.6"/>
      </g>
      <circle cx="96" cy="176" r="3.2" fill="#e8b64c"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_babyliss',
    categoria: 'cabelo',
    nome: 'Babyliss',
    descricao: 'Cachos de salão prontos para a foto do crachá.',
    raridade: 'incomum',
    tema: 'clássico',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M68 150 c -6 -60 18 -103 52 -103 s 58 43 52 103 l -12 2 v -40 q -4 8 -10 10 q 2 -12 -2 -20 q -6 6 -12 6 q 2 -10 -4 -16 q -8 6 -18 4 q 0 8 -6 12 q -4 -6 -12 -6 l 0 48 z" fill="url(#${u}cab)"/>
      <g fill="none" stroke="${alfa(p.cabelo.profundo, 0.4)}" stroke-width="2.6" stroke-linecap="round">
        <path d="M74 128 q 6 4 4 12 q -2 8 4 12"/>
        <path d="M164 126 q -6 4 -4 12 q 2 8 -4 12"/>
      </g>
      ${BRILHO}`,
  },
  {
    id: 'cab_espetadinho',
    categoria: 'cabelo',
    nome: 'Espetadinho',
    descricao: 'Gel matinal e cinco minutos de espelho.',
    raridade: 'comum',
    tema: 'casual',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M74 96 c 0 -10 3 -19 8 -26 l 4 10 l 6 -16 l 6 12 l 8 -16 l 6 14 l 8 -16 l 8 16 l 6 -14 l 8 16 l 6 -12 l 6 16 l 4 -10 c 5 7 8 16 8 26 c -10 -16 -26 -24 -46 -24 s -36 8 -46 24 z" fill="url(#${u}cab)"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_permanente80',
    categoria: 'cabelo',
    nome: 'Permanente 80s',
    descricao: 'Volume que precisa de crachá próprio.',
    raridade: 'raro',
    tema: 'retrô',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => {
      let bolhas = '';
      const pos: Array<[number, number, number]> = [
        [78, 66, 16], [100, 50, 17], [124, 44, 18], [148, 52, 16], [166, 70, 15],
        [70, 92, 14], [172, 96, 13], [68, 118, 12], [174, 120, 11],
      ];
      for (const [x, y, r] of pos) {
        bolhas += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}cab)"/>`;
      }
      return `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      ${bolhas}
      <path d="M72 104 c -4 -36 20 -56 48 -56 s 52 20 48 56 c -8 -20 -26 -30 -48 -30 s -40 10 -48 30 z" fill="url(#${u}cab)"/>
      <circle cx="92" cy="58" r="3" fill="${alfa('#ffffff', 0.25)}"/>
      <circle cx="136" cy="48" r="3" fill="${alfa('#ffffff', 0.25)}"/>
      ${BRILHO}`;
    },
  },
  {
    id: 'cab_wolf',
    categoria: 'cabelo',
    nome: 'Wolf Cut',
    descricao: 'Camadas selvagens domesticadas só na aparência.',
    raridade: 'raro',
    tema: 'urbano',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 106 c -4 -40 20 -61 50 -61 s 54 21 50 61 c -2 -8 -6 -14 -10 -18 c 2 -20 -16 -30 -40 -30 s -42 10 -40 30 c -4 4 -8 10 -10 18 z" fill="url(#${u}cab)"/>
      <path d="M86 60 l 10 18 l -14 -4 l 8 16 l -14 -6 M154 60 l -10 18 l 14 -4 l -8 16 l 14 -6" fill="none" stroke="url(#${u}cab)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M66 110 q -4 26 6 44 q 4 -8 4 -18 q 4 12 12 18 q 2 -10 -2 -22 M174 110 q 4 26 -6 44 q -4 -8 -4 -18 q -4 12 -12 18 q -2 -10 2 -22" fill="url(#${u}cab)"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_slick_rabo',
    categoria: 'cabelo',
    nome: 'Slick + Rabo',
    descricao: 'Liso espelhado na frente, rabo executivo atrás.',
    raridade: 'incomum',
    tema: 'executivo',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M72 98 c -2 -32 18 -51 48 -51 s 50 19 48 51 c -2 -6 -5 -11 -9 -14 c 2 -19 -15 -29 -39 -29 s -41 10 -39 29 c -4 3 -7 8 -9 14 z" fill="url(#${u}cab)"/>
      <g stroke="${alfa(p.cabelo.claro, 0.35)}" stroke-width="1.8" fill="none">
        <path d="M86 60 q 34 -12 68 0"/>
        <path d="M84 70 q 36 -12 72 0"/>
      </g>
      <path d="M156 108 q 18 10 16 34 q -6 -4 -10 -10 q 0 10 -6 16 q -6 -20 -4 -40 z" fill="url(#${u}cab)"/>
      <ellipse cx="157" cy="112" rx="4.4" ry="5.6" fill="${alfa(p.cabelo.profundo, 0.75)}"/>`,
  },
  {
    id: 'cab_cortina',
    categoria: 'cabelo',
    nome: 'Cortina',
    descricao: 'Repartido ao meio como um bom orçamento.',
    raridade: 'comum',
    tema: 'casual',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 104 c -2 -38 22 -57 50 -57 s 52 19 50 57 c -2 -8 -5 -13 -9 -16 c 2 -20 -17 -32 -41 -32 s -43 12 -41 32 c -4 3 -7 8 -9 16 z" fill="url(#${u}cab)"/>
      <path d="M118 56 c -14 2 -24 14 -26 30 l -8 18 c -4 -14 -2 -30 6 -40 c 6 -8 16 -10 28 -8 z" fill="url(#${u}cab)"/>
      <path d="M122 56 c 14 2 24 14 26 30 l 8 18 c 4 -14 2 -30 -6 -40 c -6 -8 -16 -10 -28 -8 z" fill="url(#${u}cab)"/>
      <path d="M120 56 v 10" stroke="${alfa(p.cabelo.profundo, 0.5)}" stroke-width="2"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_estrela_raspada',
    categoria: 'cabelo',
    nome: 'Estrela Raspada',
    descricao: 'Arte na máquina zero — barbeiro artista, cliente lenda.',
    raridade: 'epico',
    tema: 'urbano',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo', 'destaque'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M72 96 a 50 55 0 0 1 96 0 c -1 -4 -3 -8 -6 -11 a 44 48 0 0 0 -84 0 c -3 3 -5 7 -6 11 z" fill="${alfa(p.cabelo.base, 0.85)}"/>
      <path d="M150 74 l 2.2 4.6 l 5 0.7 l -3.6 3.5 l 0.8 5 l -4.4 -2.4 l -4.4 2.4 l 0.8 -5 l -3.6 -3.5 l 5 -0.7 z" fill="none" stroke="${p.destaque.base}" stroke-width="2"/>
      <path d="M84 82 q 4 -8 10 -12" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="2" stroke-linecap="round" fill="none"/>
      ${BRILHO}`,
  },
  {
    id: 'cab_flamejante',
    categoria: 'cabelo',
    nome: 'Cabelo Flamejante',
    descricao: 'Não é tinta. É temperatura de entrega.',
    raridade: 'lendario',
    tema: 'fantasia',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (_p, u) => `
      <defs>
        <linearGradient id="${u}flam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#ff5230"/>
          <stop offset="0.55" stop-color="#ff8a3d"/>
          <stop offset="1" stop-color="#ffd75e"/>
        </linearGradient>
      </defs>
      <path d="M74 96 c -2 -14 2 -26 10 -34 q 2 10 8 12 q -4 -14 4 -24 q 4 10 12 12 q -2 -12 8 -18 q 4 10 12 12 q 2 -10 10 -14 q 2 12 10 16 q 6 -6 6 -14 c 10 10 14 24 12 38 c -10 -16 -26 -24 -46 -24 s -36 8 -46 24 z" fill="url(#${u}flam)">
        <animateTransform attributeName="transform" type="scale" values="1 1;1 1.06;1 1" dur="1.4s" repeatCount="indefinite" additive="sum"/>
      </path>
      <path d="M92 62 q 4 -8 2 -14 M124 50 q 4 -6 2 -12 M150 64 q 6 -6 6 -12" stroke="${alfa('#ffd75e', 0.6)}" stroke-width="2.4" stroke-linecap="round" fill="none">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.1s" repeatCount="indefinite"/>
      </path>`,
  },
  {
    id: 'cab_fibra_otica',
    categoria: 'cabelo',
    nome: 'Fibra Óptica',
    descricao: 'Cada fio transmite 10Gbps de personalidade.',
    raridade: 'epico',
    tema: 'cyberpunk',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo', 'destaque'],
    render: (p, u) => {
      let fios = '';
      for (let i = 0; i < 8; i++) {
        const x = 82 + i * 11;
        const desl = (i % 2 ? 6 : -5);
        fios += `<path d="M${x} 62 q ${desl} 30 ${desl * 1.5} 62" stroke="${p.cabelo.base}" stroke-width="4" stroke-linecap="round" fill="none"/>
        <circle cx="${x + desl * 1.5}" cy="124" r="2.6" fill="${p.destaque.claro}">
          <animate attributeName="opacity" values="1;0.25;1" dur="${(1.2 + (i % 4) * 0.4).toFixed(1)}s" repeatCount="indefinite"/>
        </circle>`;
      }
      return `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      ${fios}
      <path d="M72 100 c -4 -36 20 -55 48 -55 s 52 19 48 55 c -8 -20 -26 -30 -48 -30 s -40 10 -48 30 z" fill="url(#${u}cab)"/>
      ${BRILHO}`;
    },
  },
  {
    id: 'cab_algodao',
    categoria: 'cabelo',
    nome: 'Algodão-Doce',
    descricao: 'Fofo, alto e levemente comestível na aparência.',
    raridade: 'raro',
    tema: 'casual',
    requerBase: HUMANOIDES,
    usaCores: ['cabelo'],
    render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <circle cx="92" cy="58" r="19" fill="url(#${u}cab)"/>
      <circle cx="120" cy="44" r="23" fill="url(#${u}cab)"/>
      <circle cx="148" cy="58" r="19" fill="url(#${u}cab)"/>
      <circle cx="76" cy="84" r="15" fill="url(#${u}cab)"/>
      <circle cx="164" cy="84" r="15" fill="url(#${u}cab)"/>
      <path d="M72 100 c -4 -34 20 -52 48 -52 s 52 18 48 52 c -10 -20 -26 -30 -48 -30 s -38 10 -48 30 z" fill="url(#${u}cab)"/>
      <circle cx="104" cy="46" r="3" fill="${alfa('#ffffff', 0.35)}"/>
      <circle cx="136" cy="40" r="2.6" fill="${alfa('#ffffff', 0.3)}"/>
      <circle cx="86" cy="70" r="2.4" fill="${alfa('#ffffff', 0.25)}"/>
      ${BRILHO}`,
  },
];
