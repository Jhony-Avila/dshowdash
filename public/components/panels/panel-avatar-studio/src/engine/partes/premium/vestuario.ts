// engine/partes/premium/vestuario.ts — onda 1415 (MEGA_BRIEFING_01 P10-D,
// P5-B, P5-C; decisões #166/#191): VESTUÁRIO PREMIUM — 8 roupas `rou_px_*`
// novas, 2 sobrepeças `sob_px_*`, 3 roupas inferiores `rin_*` e 3 calçados
// premium no slot `pes`. Arte NOVA (partes/* intocadas).
//
// Regras do trilho: zero filtros (§2510), defs por uid, tokens de material
// (materiais2d) em toda peça, canal `secundario` (#191) nos forros/camadas
// internas com fallback determinístico (`secundarioPadraoDe`), sombra de
// contato padrão do motor (peça só declara quando tem forma própria).
// `rin_*`/calçados: busto NÃO desenha (render vazio — byte-stability
// trivial); a arte vive no `renderCorpo` (corpo inteiro 240×400).
// @version 1.0.0  @created 2026-08-21
import { alfa, secundarioPadraoDe, tintaPremium } from '../../cores';
import type { Paleta } from '../../cores';
import { material2d } from '../../materiais2d';
import { PATH_OMBROS } from '../../base-api';
import type { ParteDef } from '../../base-api';

const SOMBRA_PESCOCO = `<path d="M96 186 c 6 10 42 10 48 0 c -2 12 -46 12 -48 0 z" fill="rgba(0,0,0,0.25)"/>`;

/** Canal secundário efetivo (#191): escolhido OU derivado da roupa. */
const sec = (p: Paleta): ReturnType<typeof tintaPremium> =>
  tintaPremium(p.secundario?.base ?? secundarioPadraoDe(p.roupa.base));

// ── 8 ROUPAS PREMIUM NOVAS (busto) ──────────────────────────────────────

export const ROUPAS_PREMIUM_1415: ParteDef[] = [
  {
    id: 'rou_px_camiseta', materialToken: 'cotton', categoria: 'roupa', nome: 'Camiseta Premium',
    descricao: 'Algodão com caimento real e gola viva.', raridade: 'comum',
    tema: 'casual', usaCores: ['roupa', 'destaque'], acabamento: 'premium',
    render: (p, u) => {
      const alg = material2d('cotton', p.roupa.base);
      return `<defs>${alg.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${alg.fill(u)}"/>
      <path d="M104 186 q 16 14 32 0 q -4 12 -16 12 q -12 0 -16 -12 z" fill="${alg.tinta.escuro}"/>
      <path d="M106 188 q 14 11 28 0" stroke="${alfa(alg.tinta.brilho, 0.5)}" stroke-width="1.6" fill="none"/>
      <path d="M88 206 q 4 14 2 30 M152 206 q -4 14 -2 30" stroke="${alfa(alg.tinta.profundo, 0.4)}" stroke-width="1.6" fill="none"/>
      <circle cx="146" cy="226" r="3.4" fill="${p.destaque.base}"/>
      ${SOMBRA_PESCOCO}`;
    },
    // §56 CAMISETA: manga curta, ombro suave, chest drape, cintura, barra.
    // Silhueta FITTED (a mais justa das 4).
    renderCorpoV2: (p, u) => {
      const m = material2d('cotton', p.roupa.base);
      const sleeves = `M${120 - 46} 130 C ${120 - 58} 140 ${120 - 58} 158 ${120 - 50} 166 L ${120 - 34} 162 C ${120 - 38} 150 ${120 - 40} 138 ${120 - 40} 132 Z`
        + ` M${120 + 46} 130 C ${120 + 58} 140 ${120 + 58} 158 ${120 + 50} 166 L ${120 + 34} 162 C ${120 + 38} 150 ${120 + 40} 138 ${120 + 40} 132 Z`;
      const torso = 'M80 130 C 74 158 76 196 84 228 L 156 228 C 164 196 166 158 160 130 C 146 122 94 122 80 130 Z';
      return `<defs>${m.defs(u)}</defs>
      <path d="${sleeves}" fill="${m.fill(u)}"/>
      <path d="${torso}" fill="${m.fill(u)}"/>
      ${m.realce(u, torso)}
      <path d="M104 128 q 16 14 32 0 q -3 11 -16 11 q -13 0 -16 -11 z" fill="${m.tinta.escuro}"/>`;
    },
  },
  {
    id: 'rou_px_camisa', materialToken: 'cotton', categoria: 'roupa', nome: 'Camisa Premium',
    descricao: 'Colarinho firme, botões e forro no punho.', raridade: 'incomum',
    tema: 'executivo', usaCores: ['roupa', 'destaque', 'secundario'], acabamento: 'premium',
    render: (p, u) => {
      const alg = material2d('cotton', p.roupa.base);
      const forro = sec(p);
      return `<defs>${alg.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${alg.fill(u)}"/>
      <path d="M104 186 l 12 10 v 44 h -8 z M136 186 l -12 10 v 44 h 8 z" fill="${alg.tinta.claro}"/>
      <path d="M104 186 l 12 10 l -6 8 l -10 -10 z M136 186 l -12 10 l 6 8 l 10 -10 z" fill="${forro.base}"/>
      <path d="M120 198 v 42" stroke="${alfa(alg.tinta.profundo, 0.5)}" stroke-width="1.4"/>
      <circle cx="120" cy="208" r="1.5" fill="${forro.claro}"/><circle cx="120" cy="220" r="1.5" fill="${forro.claro}"/><circle cx="120" cy="232" r="1.5" fill="${forro.claro}"/>
      ${SOMBRA_PESCOCO}`;
    },
  },
  {
    id: 'rou_px_hoodie', materialToken: 'wool', categoria: 'roupa', nome: 'Hoodie Premium',
    descricao: 'Moletom com capuz de forro vivo e cordões.', raridade: 'incomum',
    tema: 'urbano', usaCores: ['roupa', 'destaque', 'secundario'], acabamento: 'premium',
    render: (p, u) => {
      const mol = material2d('wool', p.roupa.base);
      const forro = sec(p);
      return `<defs>${mol.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${mol.fill(u)}"/>
      <path d="M94 196 q 26 26 52 0 q 2 10 -6 14 q -20 10 -40 0 q -8 -4 -6 -14 z" fill="${mol.tinta.escuro}"/>
      <path d="M98 196 q 22 20 44 0 q -2 -8 -22 -8 q -20 0 -22 8 z" fill="${forro.base}"/>
      <path d="M100 197 q 20 16 40 0" stroke="${alfa(forro.claro, 0.6)}" stroke-width="1.6" fill="none"/>
      <path d="M112 210 q -1 12 1 20 M128 210 q 1 12 -1 20" stroke="${p.destaque.base}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <circle cx="113" cy="232" r="2" fill="${p.destaque.escuro}"/><circle cx="127" cy="232" r="2" fill="${p.destaque.escuro}"/>
      <path d="M92 226 h 18 q 2 8 -2 12 h -14 z M148 226 h -18 q -2 8 2 12 h 14 z" fill="${alfa(mol.tinta.profundo, 0.5)}"/>`;
    },
    // §58 HOODIE: dropped shoulder, manga GROSSA/longa, capuz com volume
    // traseiro, torso LARGO (menos ajustado), cuff, hem. Silhueta mais BOJUDA.
    renderCorpoV2: (p, u) => {
      const m = material2d('wool', p.roupa.base);
      const forro = sec(p);
      const sleeve = (s: 1 | -1) => `M${120 + s * 52} 132 C ${120 + s * 72} 148 ${120 + s * 74} 210 ${120 + s * 62} 250 L ${120 + s * 40} 248 C ${120 + s * 46} 210 ${120 + s * 44} 168 ${120 + s * 42} 138 Z`;
      const torso = 'M74 136 C 64 172 66 210 76 240 L 164 240 C 174 210 176 172 166 136 C 150 122 90 122 74 136 Z';
      return `<defs>${m.defs(u)}</defs>
      <!-- capuz (volume traseiro) atrás dos ombros -->
      <path d="M86 116 C 98 96 142 96 154 116 C 150 132 138 140 120 140 C 102 140 90 132 86 116 Z" fill="${m.tinta.escuro}"/>
      <path d="${sleeve(-1)}${sleeve(1)}" fill="${m.fill(u)}"/>
      <path d="${torso}" fill="${m.fill(u)}"/>
      ${m.realce(u, torso)}
      <!-- cuffs + hem band -->
      <path d="M${120 - 62} 246 l 22 3 -2 10 -22 -3 z M${120 + 62} 246 l -22 3 2 10 22 -3 z" fill="${m.tinta.profundo}"/>
      <path d="M76 232 h88 v10 H76 z" fill="${alfa(m.tinta.profundo, 0.55)}"/>
      <!-- bolso central + cordões -->
      <path d="M96 196 h48 v22 h-48 z" fill="${alfa(m.tinta.profundo, 0.4)}"/>
      <path d="M112 150 q -1 16 1 26 M128 150 q 1 16 -1 26" stroke="${p.destaque.base}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
      <path d="M96 140 q 24 16 48 0 q -2 -8 -24 -8 q -22 0 -24 8 z" fill="${forro.base}"/>`;
    },
  },
  {
    id: 'rou_px_blazer', materialToken: 'wool', categoria: 'roupa', nome: 'Blazer Premium',
    descricao: 'Estrutura de ombro e forro de cetim — poder silencioso.', raridade: 'raro',
    tema: 'executivo', usaCores: ['roupa', 'destaque', 'secundario'], acabamento: 'premium',
    render: (p, u) => {
      const la = material2d('wool', p.roupa.base);
      const forro = sec(p);
      return `<defs>${la.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${la.fill(u)}"/>
      <path d="M104 188 l 16 14 l 16 -14 v 52 h -32 z" fill="${forro.escuro}"/>
      <path d="M107 191 l 13 11 l 13 -11" stroke="${alfa(forro.brilho, 0.5)}" stroke-width="1.4" fill="none"/>
      <path d="M96 186 c 6 8 14 14 24 16 l -14 26 c -9 -12 -12 -27 -10 -42 z" fill="${la.tinta.profundo}"/>
      <path d="M144 186 c -6 8 -14 14 -24 16 l 14 26 c 9 -12 12 -27 10 -42 z" fill="${la.tinta.profundo}"/>
      <path d="M98 189 q 8 10 20 13 M142 189 q -8 10 -20 13" stroke="${alfa(la.tinta.brilho, 0.45)}" stroke-width="1.5" fill="none"/>
      <circle cx="118" cy="228" r="1.8" fill="${p.destaque.base}"/>
      ${SOMBRA_PESCOCO}`;
    },
    // §60 BLAZER: ombro PADDED quadrado, lapela, chest taper, manga, cintura
    // marcada, abertura frontal. Silhueta ESTRUTURADA (ombros retos).
    renderCorpoV2: (p, u) => {
      const la = material2d('wool', p.roupa.base);
      const forro = sec(p);
      const sleeve = (s: 1 | -1) => `M${120 + s * 54} 124 C ${120 + s * 66} 150 ${120 + s * 60} 210 ${120 + s * 52} 244 L ${120 + s * 34} 240 C ${120 + s * 40} 200 ${120 + s * 42} 156 ${120 + s * 44} 130 Z`;
      const torso = 'M74 122 L 168 122 C 170 150 166 158 160 176 C 156 196 152 214 150 234 L 90 234 C 88 214 84 196 80 176 C 74 158 70 150 74 122 Z';
      return `<defs>${la.defs(u)}</defs>
      <path d="${sleeve(-1)}${sleeve(1)}" fill="${la.fill(u)}"/>
      <path d="M66 118 h30 l -4 14 h-30 z M174 118 h-30 l 4 14 h30 z" fill="${la.fill(u)}"/>
      <path d="${torso}" fill="${la.fill(u)}"/>
      ${la.realce(u, torso)}
      <!-- abertura + lapela -->
      <path d="M106 124 l 14 20 l 14 -20 l 6 106 h -40 z" fill="${forro.escuro}"/>
      <path d="M106 124 l -12 16 l 18 24 l 10 -16 z M134 124 l 12 16 l -18 24 l -10 -16 z" fill="${la.tinta.profundo}"/>
      <path d="M96 138 l 15 22 M144 138 l -15 22" stroke="${alfa(la.tinta.brilho, 0.4)}" stroke-width="1.5" fill="none"/>
      <circle cx="118" cy="196" r="2.2" fill="${p.destaque.base}"/><circle cx="118" cy="214" r="2.2" fill="${p.destaque.base}"/>`;
    },
  },
  {
    id: 'rou_px_polo', materialToken: 'cotton', categoria: 'roupa', nome: 'Polo Premium',
    descricao: 'Piquê com colarinho firme e botões de verdade.', raridade: 'comum',
    tema: 'casual', usaCores: ['roupa', 'destaque'], acabamento: 'premium',
    render: (p, u) => {
      const alg = material2d('cotton', p.roupa.base);
      return `<defs>${alg.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${alg.fill(u)}"/>
      <path d="M102 186 l 12 8 l -3 10 l -12 -8 z M138 186 l -12 8 l 3 10 l 12 -8 z" fill="${alg.tinta.escuro}"/>
      <path d="M117 196 h 6 v 18 h -6 z" fill="${alg.tinta.meio}"/>
      <circle cx="120" cy="201" r="1.4" fill="${p.destaque.base}"/><circle cx="120" cy="208" r="1.4" fill="${p.destaque.base}"/>
      <path d="M98 214 q 22 6 44 0" stroke="${alfa(alg.tinta.brilho, 0.3)}" stroke-width="1.4" fill="none"/>
      <circle cx="142" cy="222" r="3" fill="${p.destaque.base}"/>
      ${SOMBRA_PESCOCO}`;
    },
  },
  {
    id: 'rou_px_colete', materialToken: 'technical', categoria: 'roupa', nome: 'Colete Premium',
    descricao: 'Acolchoado técnico sobre camada interna viva.', raridade: 'incomum',
    tema: 'urbano', usaCores: ['roupa', 'destaque', 'secundario'], acabamento: 'premium',
    render: (p, u) => {
      const tec = material2d('technical', p.roupa.base);
      const interna = sec(p);
      return `<defs>${tec.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${interna.base}"/>
      <path d="M104 190 q -14 6 -16 26 l 2 24 h 22 l 2 -50 q -6 -2 -10 0 z M136 190 q 14 6 16 26 l -2 24 h -22 l -2 -50 q 6 -2 10 0 z" fill="${tec.fill(u)}"/>
      <path d="M94 206 h 20 M94 218 h 20 M126 206 h 20 M126 218 h 20" stroke="${alfa(tec.tinta.profundo, 0.5)}" stroke-width="1.4"/>
      <path d="M104 190 q 8 22 8 50 M136 190 q -8 22 -8 50" stroke="${alfa(tec.tinta.brilho, 0.4)}" stroke-width="1.4" fill="none"/>
      <path d="M117 196 q 3 22 3 44" stroke="${interna.claro}" stroke-width="1.2" fill="none"/>
      <circle cx="99" cy="228" r="2" fill="${p.destaque.base}"/>
      ${SOMBRA_PESCOCO}`;
    },
  },
  {
    id: 'rou_px_sobretudo', materialToken: 'wool', categoria: 'roupa', nome: 'Sobretudo Premium',
    descricao: 'Lã longa com forro profundo e lapela alta.', raridade: 'raro',
    tema: 'clássico', usaCores: ['roupa', 'destaque', 'secundario'], acabamento: 'premium',
    render: (p, u) => {
      const la = material2d('wool', p.roupa.base);
      const forro = sec(p);
      return `<defs>${la.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${la.fill(u)}"/>
      <path d="M102 186 l 18 18 l 18 -18 v 54 h -36 z" fill="${forro.escuro}"/>
      <path d="M102 186 c 4 10 10 16 18 18 l -16 30 c -7 -14 -9 -30 -2 -48 z" fill="${la.tinta.profundo}"/>
      <path d="M138 186 c -4 10 -10 16 -18 18 l 16 30 c 7 -14 9 -30 2 -48 z" fill="${la.tinta.profundo}"/>
      <path d="M104 189 q 8 12 16 15 M136 189 q -8 12 -16 15" stroke="${alfa(la.tinta.brilho, 0.4)}" stroke-width="1.5" fill="none"/>
      <path d="M112 226 h 4 M124 226 h 4" stroke="${p.destaque.base}" stroke-width="2.4" stroke-linecap="round"/>
      ${SOMBRA_PESCOCO}`;
    },
    // §61 SOBRETUDO: LONGO de verdade (desce além do quadril ~y318), volume
    // próprio, lapela alta, abertura inferior/overlap, mangas longas.
    renderCorpoV2: (p, u) => {
      const la = material2d('wool', p.roupa.base);
      const forro = sec(p);
      const sleeve = (s: 1 | -1) => `M${120 + s * 54} 124 C ${120 + s * 66} 152 ${120 + s * 60} 220 ${120 + s * 54} 258 L ${120 + s * 36} 254 C ${120 + s * 42} 210 ${120 + s * 44} 156 ${120 + s * 44} 130 Z`;
      const torso = 'M72 122 C 66 150 70 160 68 190 C 66 230 66 280 74 318 L 120 322 L 166 318 C 174 280 174 230 172 190 C 170 160 174 150 168 122 C 150 116 90 116 72 122 Z';
      return `<defs>${la.defs(u)}</defs>
      <path d="${sleeve(-1)}${sleeve(1)}" fill="${la.fill(u)}"/>
      <path d="${torso}" fill="${la.fill(u)}"/>
      ${la.realce(u, torso)}
      <!-- overlap frontal + lapela alta -->
      <path d="M120 128 L 120 320 L 150 316 C 156 250 156 180 150 130 Z" fill="${alfa(la.tinta.profundo, 0.45)}"/>
      <path d="M106 122 l 14 22 l 14 -22 l 8 60 l -22 16 l -22 -16 z" fill="${forro.escuro}"/>
      <path d="M106 122 l -12 18 l 20 26 l 10 -18 z M134 122 l 12 18 l -20 26 l -10 -18 z" fill="${la.tinta.profundo}"/>
      <path d="M120 150 v 168" stroke="${alfa(la.tinta.profundo, 0.5)}" stroke-width="1.6"/>
      <circle cx="132" cy="196" r="2.4" fill="${p.destaque.base}"/><circle cx="132" cy="230" r="2.4" fill="${p.destaque.base}"/>`;
    },
  },
  {
    id: 'rou_px_gala', materialToken: 'satin', categoria: 'roupa', nome: 'Gala Premium',
    descricao: 'Cetim de noite com lapela de cerimônia.', raridade: 'epico',
    tema: 'clássico', usaCores: ['roupa', 'destaque', 'secundario'], acabamento: 'premium',
    render: (p, u) => {
      const cet = material2d('satin', p.roupa.base);
      const lapela = sec(p);
      return `<defs>${cet.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${cet.fill(u)}"/>
      <path d="M106 188 l 14 12 l 14 -12 v 50 h -28 z" fill="#f6f7fb"/>
      <path d="M120 202 l -5 8 l 5 22 l 5 -22 z" fill="${cet.tinta.profundo}"/>
      <path d="M113 205 l 7 -7 l 7 7 l -7 5 z" fill="${p.destaque.base}"/>
      <path d="M98 186 c 5 8 12 14 22 16 l -13 26 c -9 -12 -12 -27 -9 -42 z" fill="${lapela.escuro}"/>
      <path d="M142 186 c -5 8 -12 14 -22 16 l 13 26 c 9 -12 12 -27 9 -42 z" fill="${lapela.escuro}"/>
      <path d="M100 189 q 9 11 20 13 M140 189 q -9 11 -20 13" stroke="${alfa(lapela.brilho, 0.55)}" stroke-width="1.4" fill="none"/>
      ${SOMBRA_PESCOCO}`;
    },
  },
];

// ── 2 SOBREPEÇAS PREMIUM (roupa_sobre) ──────────────────────────────────

export const SOBREPECAS_PREMIUM: ParteDef[] = [
  {
    id: 'sob_px_cardiga', materialToken: 'wool', categoria: 'roupa_sobre', nome: 'Cardigã Premium',
    descricao: 'Tricô aberto por cima de qualquer look.', raridade: 'incomum',
    tema: 'casual', usaCores: ['roupa', 'secundario'], acabamento: 'premium',
    render: (p, u) => {
      const tri = material2d('wool', p.roupa.base);
      return `<defs>${tri.defs(u)}</defs>
      <path d="M96 186 c 2 18 2 36 0 52 l 14 2 c 4 -18 5 -36 4 -52 c -7 -2 -13 -2 -18 -2 z" fill="${tri.fill(u)}"/>
      <path d="M144 186 c -2 18 -2 36 0 52 l -14 2 c -4 -18 -5 -36 -4 -52 c 7 -2 13 -2 18 -2 z" fill="${tri.fill(u)}"/>
      <path d="M100 192 q 2 24 0 42 M140 192 q -2 24 0 42" stroke="${alfa(tri.tinta.profundo, 0.45)}" stroke-width="1.4" fill="none"/>
      <path d="M107 194 q 2 22 1 42 M133 194 q -2 22 -1 42" stroke="${alfa(tri.tinta.brilho, 0.35)}" stroke-width="1.2" fill="none"/>`;
    },
  },
  {
    id: 'sob_px_capa', materialToken: 'satin', categoria: 'roupa_sobre', nome: 'Capa Premium',
    descricao: 'Cai dos ombros com massa de verdade atrás.', raridade: 'raro',
    tema: 'fantasia', usaCores: ['roupa', 'secundario'], acabamento: 'premium',
    render: (p) => {
      const forro = sec(p);
      return `
      <path d="M92 186 l -6 10 q 10 6 20 6 l 2 -12 q -8 -3 -16 -4 z M148 186 l 6 10 q -10 6 -20 6 l -2 -12 q 8 -3 16 -4 z" fill="${forro.base}"/>
      <path d="M104 196 h 32 l -2 6 h -28 z" fill="${forro.escuro}"/>
      <circle cx="112" cy="199" r="1.8" fill="${forro.brilho}"/><circle cx="128" cy="199" r="1.8" fill="${forro.brilho}"/>`;
    },
    renderAtras: (p, u) => {
      const capa = material2d('satin', p.roupa.base);
      return `<defs>${capa.defs(u)}</defs>
      <path d="M78 190 q -14 60 6 108 q 36 12 72 0 q 20 -48 6 -108 q -42 -14 -84 0 z" fill="${capa.fill(u)}"/>
      <path d="M92 200 q -6 50 4 90 M148 200 q 6 50 -4 90" stroke="${alfa(capa.tinta.profundo, 0.4)}" stroke-width="2" fill="none"/>`;
    },
  },
];

// ── 3 ROUPAS INFERIORES (rin_*) — só corpo inteiro ──────────────────────

/** Região das pernas do scaffold: quadril y206–222, pernas até y330. */
function pernas(fillRef: string, extra: string): string {
  return `
    <path d="M90 206 h60 v16 h-60 z" fill="${fillRef}"/>
    <path d="M91 216 h26 l-3 114 c0 8 -20 8 -20 0 z" fill="${fillRef}"/>
    <path d="M123 216 h26 l-3 114 c0 8 -20 8 -20 0 z" fill="${fillRef}"/>${extra}`;
}

const comumRin = {
  categoria: 'roupa_inferior' as const, raridade: 'comum' as const,
  acabamento: 'premium' as const, usaCores: ['roupa' as const, 'destaque' as const],
  render: () => '', // busto intocado (byte-stability trivial — como slots corporais #154)
};

export const ROUPAS_INFERIORES: ParteDef[] = [
  {
    ...comumRin, id: 'rin_jeans', materialToken: 'denim', nome: 'Jeans Premium', tema: 'casual',
    descricao: 'Denim com costura viva e barra dobrada.',
    renderCorpo: (p, u) => {
      const dn = material2d('denim', p.roupa.base);
      return `<defs>${dn.defs(u)}</defs>${pernas(dn.fill(u), `
      <path d="M96 212 h 12 q 1 8 -2 12 M144 212 h -12 q -1 8 2 12" stroke="${alfa(dn.tinta.brilho, 0.5)}" stroke-width="1.4" fill="none"/>
      <path d="M104 222 q 2 52 0 100 M136 222 q -2 52 0 100" stroke="${p.destaque.base}" stroke-width="1.2" stroke-dasharray="3 3" fill="none"/>
      <path d="M93 318 h 22 M125 318 h 22" stroke="${alfa(dn.tinta.claro, 0.6)}" stroke-width="4"/>`)}`;
    },
  },
  {
    ...comumRin, id: 'rin_social', materialToken: 'wool', nome: 'Calça Social Premium', tema: 'executivo',
    descricao: 'Vinco frontal e caimento de alfaiataria.',
    renderCorpo: (p, u) => {
      const la = material2d('wool', p.roupa.base);
      return `<defs>${la.defs(u)}</defs>${pernas(la.fill(u), `
      <path d="M104 222 l -2 106 M136 222 l 2 106" stroke="${alfa(la.tinta.brilho, 0.45)}" stroke-width="1.6" fill="none"/>
      <path d="M92 210 h 56" stroke="${alfa(la.tinta.profundo, 0.6)}" stroke-width="2"/>
      <rect x="116" y="208" width="8" height="5" rx="1.4" fill="${p.destaque.base}"/>`)}`;
    },
  },
  {
    ...comumRin, id: 'rin_jogger', materialToken: 'technical', nome: 'Jogger Premium', tema: 'urbano',
    descricao: 'Técnica com punho na barra e faixa lateral.',
    renderCorpo: (p, u) => {
      const tec = material2d('technical', p.roupa.base);
      return `<defs>${tec.defs(u)}</defs>${pernas(tec.fill(u), `
      <path d="M94 218 q 4 56 8 106 M146 218 q -4 56 -8 106" stroke="${p.destaque.base}" stroke-width="2.6" fill="none"/>
      <path d="M96 320 h 18 q 2 6 -1 10 h -16 z M144 320 h -18 q -2 6 1 10 h 16 z" fill="${tec.tinta.profundo}"/>
      <path d="M110 214 q -2 4 -6 5" stroke="${alfa(tec.tinta.brilho, 0.6)}" stroke-width="1.6" fill="none"/>`)}`;
    },
  },
];

// ── 3 CALÇADOS PREMIUM (slot pes) — só corpo inteiro ────────────────────

const comumPes = {
  categoria: 'acessorio' as const, slot: 'pes' as const,
  raridade: 'incomum' as const, acabamento: 'premium' as const,
  usaCores: ['roupa' as const, 'destaque' as const],
  render: () => '', // busto intocado (contrato dos slots corporais #154)
};

export const CALCADOS_PREMIUM: ParteDef[] = [
  {
    ...comumPes, id: 'ace_px_tenis', materialToken: 'technical', nome: 'Tênis Premium', tema: 'urbano',
    descricao: 'Entressola dupla e cadarço com presença.',
    renderCorpo: (p, u) => {
      const tec = material2d('technical', p.roupa.base);
      return `<defs>${tec.defs(u)}</defs>
      <path d="M88 330 h 30 v 26 c 0 6 -4 10 -10 10 h -22 c -8 0 -10 -9 -2 -13 l 4 -3 z" fill="${tec.fill(u)}"/>
      <path d="M122 330 h 30 l 0 20 l 4 3 c 8 4 6 13 -2 13 h -22 c -6 0 -10 -4 -10 -10 z" fill="${tec.fill(u)}"/>
      <path d="M84 362 h 36 q 2 5 -1 8 h -34 q -4 -4 -1 -8 z M120 362 h 36 q 3 4 -1 8 h -34 q -3 -3 -1 -8 z" fill="#e8eaf2"/>
      <path d="M96 336 l 16 4 M100 342 l 12 3 M128 336 l 16 4 M132 342 l 12 3" stroke="${p.destaque.base}" stroke-width="2" stroke-linecap="round"/>
      <path d="M90 356 h 26 M124 356 h 26" stroke="${alfa(tec.tinta.brilho, 0.5)}" stroke-width="1.6"/>`;
    },
  },
  {
    ...comumPes, id: 'ace_px_social', materialToken: 'leather', nome: 'Sapato Social Premium', tema: 'executivo',
    descricao: 'Couro polido com brilho de cera.',
    renderCorpo: (p, u) => {
      const couro = material2d('leather', p.roupa.base);
      return `<defs>${couro.defs(u)}</defs>
      <path d="M88 332 h 30 v 24 c 0 6 -4 10 -10 10 h -22 c -8 0 -10 -9 -2 -13 l 4 -3 z" fill="${couro.fill(u)}"/>
      <path d="M122 332 h 30 l 0 18 l 4 3 c 8 4 6 13 -2 13 h -22 c -6 0 -10 -4 -10 -10 z" fill="${couro.fill(u)}"/>
      <path d="M92 338 q 10 -3 22 0 M126 338 q 10 -3 22 0" stroke="${alfa('#ffffff', 0.35)}" stroke-width="2" fill="none"/>
      <path d="M86 364 h 32 M120 364 h 32" stroke="#12141c" stroke-width="4"/>
      <path d="M104 346 h 10 M138 346 h 10" stroke="${p.destaque.base}" stroke-width="1.6"/>`;
    },
  },
  {
    ...comumPes, id: 'ace_px_bota', materialToken: 'leather', nome: 'Bota Premium', tema: 'fantasia',
    descricao: 'Cano alto com fivela e sola de trilha.',
    renderCorpo: (p, u) => {
      const couro = material2d('leather', p.roupa.base);
      return `<defs>${couro.defs(u)}</defs>
      <path d="M90 312 h 26 v 44 c 0 6 -4 10 -10 10 h -18 c -8 0 -10 -9 -2 -13 l 4 -3 z" fill="${couro.fill(u)}"/>
      <path d="M124 312 h 26 l 0 38 l 4 3 c 8 4 6 13 -2 13 h -18 c -6 0 -10 -4 -10 -10 z" fill="${couro.fill(u)}"/>
      <path d="M92 322 h 22 M126 322 h 22" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <rect x="100" y="318" width="6" height="8" rx="1" fill="${p.destaque.claro}"/><rect x="134" y="318" width="6" height="8" rx="1" fill="${p.destaque.claro}"/>
      <path d="M84 364 h 36 q 2 6 -2 8 h -32 q -4 -3 -2 -8 z M120 364 h 36 q 2 6 -2 8 h -32 q -4 -3 -2 -8 z" fill="#12141c"/>
      <path d="M86 368 h 32 M122 368 h 32" stroke="${alfa(couro.tinta.brilho, 0.3)}" stroke-width="1.2" stroke-dasharray="4 3"/>`;
    },
  },
];
