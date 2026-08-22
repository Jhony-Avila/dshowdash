// services/Corpo3d.ts — onda 1422 (MEGA_BRIEFING_01 Parte 2 P2-B/P2-C/
// P2-E §309–§420; decisões #210–#211): BODY API — FONTE ÚNICA do corpo.
//
// Antes desta onda a tabela §102 vivia TRIPLICADA (engine/render.ts
// TIPOS_CORPO, Renderizador3d.CORPOS_3D e o clamp §102.2 espelhado no
// PHP). Aqui ela vira DADO único: presets, envelope, morfos por
// segmento, posturas 3D, sockets corporais e aliases de bones — tudo
// puro (zero THREE/DOM), consumido pelo engine 2D, pelo Renderizador3d
// (as6.corpo_v2) e pelo Assembler. NÚMEROS PRESERVADOS byte a byte
// (teste trava contra snapshot literal + golden-avatars 16/16).
//
// Persistência: `corpoV2?: { preset?, morfos? }` OPCIONAL no
// AvatarConfig (schema body.v2 §333) — neutro NUNCA persiste (morfo 0
// omitido, objeto vazio omitido; espelho PHP em studio.php). Migração
// tipo→preset é IDENTIDADE formal (§337: os 4 tipos §102 são os 4
// presets fundadores; ids persistidos p/ sempre).
// @version 1.0.0  @created 2026-08-22
import type { PosturaAvatar, TipoCorporal } from '../domain/types';
import { PRESETS_CORPO } from '../domain/corpo102';

/** Tabela §102 re-exportada (fonte física: domain/corpo102 — camada de
 *  domínio p/ o engine 2D importar sem cruzar p/ services). */
export { PRESETS_CORPO };

/** ENVELOPE do corpo (§316 — limites duros de deformação; ESPELHADOS
 *  no PHP como os clamps §102.2 — teste de espelho trava). */
export const ENVELOPE_CORPO = {
  /** ajuste fino §102.2 (validarConfig/PHP) */
  fino: { largura: { min: 0.92, max: 1.08 }, altura: { min: 0.96, max: 1.04 } },
  /** escala FINAL aplicada ao personagem (Renderizador3d desde §412) */
  escala: { largura: { min: 0.88, max: 1.15 }, altura: { min: 0.9, max: 1.07 } },
  /** morfo normalizado do body.v2 (0 = neutro, omitido) */
  morfo: { min: -1, max: 1 },
  /** escala de um SEGMENTO (bone scaling §318 — as6.corpo_v2) */
  segmento: { min: 0.92, max: 1.1 },
} as const;

export type MorfoCorpoId = 'ombros' | 'torax' | 'cintura' | 'bracos' | 'pernas';

export interface MorfoCorpo {
  id: MorfoCorpoId;
  nome: string;
  /** bones do rig ubc-v1 que o morfo escala (bone scaling §318) */
  bones: string[];
  /** eixos escalados ('xyz' volume · 'xz' circunferência) */
  eixo: 'xyz' | 'xz';
  /** quanto o morfo ±1 muda a escala do segmento (clamp no envelope) */
  alcance: number;
}

/** MORPH REGISTRY §315 (#210): morfos SEMÂNTICOS por segmento. Quando o
 *  asset tiver morph targets reais (⛔ assets), o renderer usa
 *  `morphTargetDictionary['corpo_<id>']`; sem eles, bone scaling. */
export const MORPHS_CORPO: Record<MorfoCorpoId, MorfoCorpo> = {
  ombros: { id: 'ombros', nome: 'Ombros', bones: ['clavicle_l', 'clavicle_r'], eixo: 'xyz', alcance: 0.1 },
  torax: { id: 'torax', nome: 'Tórax', bones: ['spine_02', 'spine_03'], eixo: 'xz', alcance: 0.09 },
  cintura: { id: 'cintura', nome: 'Cintura', bones: ['spine_01', 'pelvis'], eixo: 'xz', alcance: 0.1 },
  bracos: { id: 'bracos', nome: 'Braços', bones: ['upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r'], eixo: 'xyz', alcance: 0.08 },
  pernas: { id: 'pernas', nome: 'Pernas', bones: ['thigh_l', 'thigh_r', 'calf_l', 'calf_r'], eixo: 'xyz', alcance: 0.08 },
};

/** Schema body.v2 (§333) — TUDO opcional; neutro omitido. */
export interface CorpoV2 {
  preset?: TipoCorporal;
  /** morfos normalizados −1…1 (0 = neutro = ausente) */
  morfos?: Partial<Record<MorfoCorpoId, number>>;
}

/** Migração formal tipo (§102) → preset (body.v2): IDENTIDADE — os 4
 *  tipos legados SÃO os presets fundadores (ids persistidos p/ sempre). */
export function migrarTipoParaPreset(tipo: string | null | undefined): TipoCorporal | null {
  return tipo && tipo in PRESETS_CORPO ? (tipo as TipoCorporal) : null;
}

const cl = (v: number, o: { min: number; max: number }): number => Math.min(o.max, Math.max(o.min, v));

/** Sanitiza um corpoV2 CRU (validarConfig usa; espelho no PHP): preset
 *  no enum, morfos conhecidos clampados ao envelope e arredondados a 2
 *  casas, 0 omitido; sem conteúdo ⇒ null (campo não persiste). */
export function sanitizarCorpoV2(bruto: unknown): CorpoV2 | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const b = bruto as { preset?: unknown; morfos?: unknown };
  const saida: CorpoV2 = {};
  const preset = migrarTipoParaPreset(typeof b.preset === 'string' ? b.preset : null);
  if (preset) saida.preset = preset;
  if (b.morfos && typeof b.morfos === 'object') {
    const morfos: CorpoV2['morfos'] = {};
    for (const id of Object.keys(MORPHS_CORPO) as MorfoCorpoId[]) {
      const v = Number((b.morfos as Record<string, unknown>)[id]);
      if (!Number.isFinite(v)) continue;
      const c = Math.round(cl(v, ENVELOPE_CORPO.morfo) * 100) / 100;
      if (c !== 0) morfos[id] = c;
    }
    if (Object.keys(morfos).length) saida.morfos = morfos;
  }
  return Object.keys(saida).length ? saida : null;
}

export interface CorpoResolvido {
  /** escala do OBJETO raiz [largura(XZ), altura(Y)] — caminho legado §412 */
  escala: [number, number];
  /** bone → escala do segmento (as6.corpo_v2; vazio = nada a fazer) */
  segmentos: Record<string, { escala: number; eixo: 'xyz' | 'xz' }>;
  origem: 'neutro' | 'legado' | 'v2';
}

/** Resolve o corpo EFETIVO (§P2-B — fonte única da matemática): preset
 *  (v2 vence o legado §337) × ajuste fino, clampado ao envelope — números
 *  IDÊNTICOS ao caminho anterior quando não há v2 (teste trava); morfos
 *  v2 viram escalas de segmento (clamp §318). Pura e determinística. */
export function resolverCorpo(
  corpo?: string | null,
  corpoFino?: { largura?: number; altura?: number } | null,
  corpoV2?: CorpoV2 | null,
): CorpoResolvido {
  const preset = PRESETS_CORPO[(corpoV2?.preset ?? migrarTipoParaPreset(corpo)) as TipoCorporal] ?? [1, 1];
  const larg = cl(preset[0] * (corpoFino?.largura ?? 1), ENVELOPE_CORPO.escala.largura);
  const alt = cl(preset[1] * (corpoFino?.altura ?? 1), ENVELOPE_CORPO.escala.altura);
  const segmentos: CorpoResolvido['segmentos'] = {};
  for (const [id, v] of Object.entries(corpoV2?.morfos ?? {})) {
    const m = MORPHS_CORPO[id as MorfoCorpoId];
    if (!m || !v) continue;
    const escala = cl(1 + v * m.alcance, ENVELOPE_CORPO.segmento);
    for (const bone of m.bones) segmentos[bone] = { escala, eixo: m.eixo };
  }
  const origem = corpoV2 && (corpoV2.preset || corpoV2.morfos) ? 'v2'
    : (PRESETS_CORPO[corpo as TipoCorporal] || corpoFino?.largura || corpoFino?.altura) ? 'legado' : 'neutro';
  return { escala: [larg, alt], segmentos, origem };
}

// ── POSTURAS 3D (§P2-E — perfis de postura como DADO; as6.corpo_v2) ──
export interface Postura3d {
  /** inclinação do tronco (rad; − = frente/confiante) */
  inclinacao: number;
  /** multiplicador da amplitude do idle procedural */
  amplitudeIdle: number;
}

export const POSTURAS_3D: Record<PosturaAvatar, Postura3d> = {
  confiante: { inclinacao: -0.035, amplitudeIdle: 1 },
  relaxada: { inclinacao: 0.04, amplitudeIdle: 1.15 },
  executiva: { inclinacao: 0, amplitudeIdle: 0.7 },
  heroica: { inclinacao: -0.05, amplitudeIdle: 0.85 },
  misteriosa: { inclinacao: 0.02, amplitudeIdle: 0.6 },
};

// ── SOCKETS CORPORAIS REAIS (§P2-E/§426 — socket → bone do rig ubc-v1
//    + grip padrão; o renderer anexa em anexarNoSocket) ────────────────
export type SocketCorpoId = 'mao_e' | 'mao_d' | 'pulso_e' | 'pulso_d' | 'cintura' | 'ombro_e' | 'ombro_d' | 'costas' | 'cabeca' | 'pescoco';

export interface SocketCorpo {
  bone: string;
  /** offset do GRIP no espaço do bone (props "na mão" §426) */
  grip: { pos: [number, number, number]; rot: [number, number, number] };
}

export const SOCKETS_CORPO: Record<SocketCorpoId, SocketCorpo> = {
  mao_e: { bone: 'hand_l', grip: { pos: [0, 0.03, 0.02], rot: [0, 0, 0] } },
  mao_d: { bone: 'hand_r', grip: { pos: [0, 0.03, 0.02], rot: [0, 0, 0] } },
  pulso_e: { bone: 'lowerarm_l', grip: { pos: [0, 0.22, 0], rot: [0, 0, 0] } },
  pulso_d: { bone: 'lowerarm_r', grip: { pos: [0, 0.22, 0], rot: [0, 0, 0] } },
  cintura: { bone: 'pelvis', grip: { pos: [0, 0, 0.12], rot: [0, 0, 0] } },
  ombro_e: { bone: 'clavicle_l', grip: { pos: [0, 0.06, 0], rot: [0, 0, 0] } },
  ombro_d: { bone: 'clavicle_r', grip: { pos: [0, 0.06, 0], rot: [0, 0, 0] } },
  costas: { bone: 'spine_03', grip: { pos: [0, 0, -0.14], rot: [0, 0, 0] } },
  cabeca: { bone: 'head', grip: { pos: [0, 0.1, 0], rot: [0, 0, 0] } },
  pescoco: { bone: 'neck_01', grip: { pos: [0, 0.02, 0.03], rot: [0, 0, 0] } },
};

// ── ALIASES DE BONES (§P2-C — REGIOES_UBC refinadas: rigs não-UBC como
//    mixamo/Quaternius resolvem p/ o nome canônico; aditivo — nome já
//    canônico passa intocado) ──────────────────────────────────────────
export const ALIASES_BONES: Record<string, string> = {
  lefthand: 'hand_l', righthand: 'hand_r',
  leftforearm: 'lowerarm_l', rightforearm: 'lowerarm_r',
  leftarm: 'upperarm_l', rightarm: 'upperarm_r',
  leftshoulder: 'clavicle_l', rightshoulder: 'clavicle_r',
  hips: 'pelvis', spine: 'spine_01', spine1: 'spine_02', spine2: 'spine_03',
  neck: 'neck_01', leftupleg: 'thigh_l', rightupleg: 'thigh_r',
  leftleg: 'calf_l', rightleg: 'calf_r', leftfoot: 'foot_l', rightfoot: 'foot_r',
  lefttoebase: 'ball_l', righttoebase: 'ball_r',
};

/** Normaliza um nome de bone p/ o vocabulário ubc-v1: tira o prefixo
 *  mixamo, aplica o alias; nome canônico volta como veio. */
export function normalizarBone(nome: string): string {
  const limpo = nome.replace(/^mixamorig:?/i, '');
  return ALIASES_BONES[limpo.toLowerCase()] ?? limpo;
}
