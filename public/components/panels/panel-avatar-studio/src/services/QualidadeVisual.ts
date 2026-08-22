// services/QualidadeVisual.ts — QUALIDADE VISUAL COMO DADO DE CATÁLOGO
// (onda 1406, MEGA_BRIEFING_01 §13, §62, §68–§69, §161, §1419–§1421,
// §2292, §3022–§3023; decisão #157).
import { flag } from '../nucleo/flags';

// @version 1.0.0  @created 2026-08-19
//
// A escada Q0–Q4 do Art Bible (docs/AVATAR-STUDIO-5/ART-BIBLE.md §2) vira
// DADO: prototype → legacy → production → premium → hero, mais o estado de
// Visual QA e a versão visual. É um WRAPPER puro em dados por cima do
// catálogo (mesmo padrão de MetadadosAssets/VariantesAssets): nada aqui
// entra no AvatarConfig nem na serialização — byte-stability por
// construção, zero PHP. Derivação determinística + curadoria pontual por
// id/prefixo; o padrão para tudo que está publicado é `production`
// (gate técnico aprovado, identidade coerente); `legacy` só quando existe
// sucessor premium (SUCESSOR_PREMIUM, ondas 1411+); `prototype` para
// placeholders procedurais (ITENS_SOCKET da PoC, props do palco).
// Hard Fail/nível baixo bloqueiam DESTAQUE (Vitrine/onboarding/hero),
// nunca o render de legado (§3022).
import type { ItemCatalogo } from '../domain/types';

export type NivelQualidadeVisual = 'prototype' | 'legacy' | 'production' | 'premium' | 'hero';
export type StatusQaVisual = 'pending' | 'approved' | 'approved_with_notes' | 'rework' | 'rejected';

export const NIVEIS_QUALIDADE_VISUAL: readonly NivelQualidadeVisual[] =
  ['prototype', 'legacy', 'production', 'premium', 'hero'] as const;
export const STATUS_QA_VISUAL: readonly StatusQaVisual[] =
  ['pending', 'approved', 'approved_with_notes', 'rework', 'rejected'] as const;

/** Escada numérica (Q0–Q4) — comparações "≥ production" ficam legíveis. */
export const ESCADA_QUALIDADE: Record<NivelQualidadeVisual, 0 | 1 | 2 | 3 | 4> = {
  prototype: 0, legacy: 1, production: 2, premium: 3, hero: 4,
};

export const ROTULO_QUALIDADE_VISUAL: Record<NivelQualidadeVisual, string> = {
  prototype: 'Protótipo', legacy: 'Legado', production: 'Produção', premium: 'Premium', hero: 'Hero',
};
export const ROTULO_STATUS_QA: Record<StatusQaVisual, string> = {
  pending: 'QA pendente', approved: 'QA aprovado', approved_with_notes: 'QA aprovado c/ notas',
  rework: 'Retrabalho', rejected: 'Reprovado',
};

export interface FichaQualidadeVisual {
  qualidadeVisual: NivelQualidadeVisual;
  statusQaVisual: StatusQaVisual;
  /** versão da REPRESENTAÇÃO visual (independente da identidade lógica §70–§71) */
  versaoVisual: string;
}

/** Curadoria por ID exato (vence o prefixo). Itens premium/hero entram aqui
 *  quando o Golden correspondente for APROVADO pelo Jhony (GOLDEN-TESTS.md). */
const POR_ID: Record<string, Partial<FichaQualidadeVisual>> = {};

/** Curadoria por PREFIXO de id (3D PoC/palco e futuras famílias `_px_`). */
const POR_PREFIXO: Array<[RegExp, Partial<FichaQualidadeVisual>]> = [
  // placeholders procedurais da PoC (poc3d/catalogo3d.ts ITENS_SOCKET) e
  // props aproximados do palco do shell (Renderizador3d.construirProp)
  [/^soc_/, { qualidadeVisual: 'prototype' }],
  [/^prop_/, { qualidadeVisual: 'prototype' }],
  // arte premium 2D (decisão #166): <prefixo>_px_<nome> nasce premium com
  // QA pendente até o gate do Golden Set respectivo
  [/^[a-z]{3}_px_/, { qualidadeVisual: 'premium' }],
];

/** Sucessores premium por id legado (§163–§167): preenchido nas ondas
 *  1411+; quando um id está aqui, o legado vira `legacy` (fora do destaque)
 *  mas continua renderizando para sempre. */
export const SUCESSOR_PREMIUM: Record<string, string> = {
  // onda 1411 (#159/#166): primeiras partes do trilho Classic Premium.
  // O legado segue renderizando PARA SEMPRE; só sai do destaque (§163).
  rou_terno: 'rou_px_terno',
  rou_jaqueta: 'rou_px_jaqueta',
  // onda 1412 (#162): faces premium. Os itens DEFAULT do config
  // (bas_classica/olh_padrao/boc_sorriso) NÃO entram enquanto a flag está
  // OFF — rebaixá-los a legacy tiraria o kit padrão do destaque com o
  // sucessor ainda invisível; entram no gate da 1418 junto com a flag.
  bas_angular: 'bas_px_angular',
  bas_redonda: 'bas_px_redonda',
  olh_focado: 'olh_px_focado',
  olh_serio: 'olh_px_determinado',
  boc_neutra: 'boc_px_neutra',
};

// onda 1418 (#180/#202): sucessores dos DEFAULTS do config — entram SÓ
// quando a flag liga (gate §2560): com o catálogo premium invisível,
// rebaixar o kit padrão tiraria o destaque sem alternativa visível.
export const SUCESSOR_PREMIUM_GATE: Record<string, string> = {
  bas_classica: 'bas_px_oval',
  olh_padrao: 'olh_px_confiante',
  boc_sorriso: 'boc_px_sorriso',
  cab_curto: 'cab_px_curto',
  rou_social: 'rou_px_camisa',
};

/** Sucessor efetivo (#202): a tabela do gate só vale com a flag ON. */
export function sucessorDe(id: string): string | undefined {
  return SUCESSOR_PREMIUM[id]
    ?? (flag('as6.classico_premium') ? SUCESSOR_PREMIUM_GATE[id] : undefined);
}

export function qualidadeVisualDe(id: string): NivelQualidadeVisual {
  const porId = POR_ID[id]?.qualidadeVisual;
  if (porId) return porId;
  for (const [re, ficha] of POR_PREFIXO) if (re.test(id) && ficha.qualidadeVisual) return ficha.qualidadeVisual;
  if (sucessorDe(id)) return 'legacy';
  return 'production';
}

export function statusQaVisualDe(id: string): StatusQaVisual {
  return POR_ID[id]?.statusQaVisual ?? 'pending';
}

export function versaoVisualDe(id: string): string {
  return POR_ID[id]?.versaoVisual ?? '1.0';
}

export function fichaQualidadeDe(id: string): FichaQualidadeVisual {
  return { qualidadeVisual: qualidadeVisualDe(id), statusQaVisual: statusQaVisualDe(id), versaoVisual: versaoVisualDe(id) };
}

/** §60/§156/§161/§1419: pode aparecer em DESTAQUE (Vitrine, hero de
 *  coleção, onboarding, "novidades")? Nunca prototype; legado só se não
 *  tiver sucessor (tem ⇒ o sucessor é o destaque). */
export function ehDestacavel(id: string): boolean {
  const n = qualidadeVisualDe(id);
  if (n === 'prototype') return false;
  if (n === 'legacy' && sucessorDe(id)) return false;
  return true;
}

/** onda 1411 (#159): em que RENDERERS o item existe — dado derivável
 *  (2D = catálogo do Creator; 3D = sockets/partes 3D publicadas). Usado
 *  pelo QaStudio/ficha p/ saber ONDE homologar; nunca muda render. */
export function rendererSupport(id: string): Array<'2d' | '3d'> {
  if (/^(cab3d_|brb3d_|rou3d_|ace3d_|cen3d_|base_|humano_|animal_|androide)/.test(id)) return ['3d'];
  // partes 2D com espelho 3D publicado (cabelos cab_* têm par cab_* em partes/)
  if (/^cab_(longo|coque|repartido|raspado|raspado_f|barba)$/.test(id)) return ['2d', '3d'];
  return ['2d'];
}

/** Comparação legível: nível do item ≥ mínimo? */
export function atingeNivel(id: string, minimo: NivelQualidadeVisual): boolean {
  return ESCADA_QUALIDADE[qualidadeVisualDe(id)] >= ESCADA_QUALIDADE[minimo];
}

/** Cobertura por nível para um catálogo (KPI §157/§3037: Premium Coverage %). */
export function coberturaQualidade(itens: Array<Pick<ItemCatalogo, 'id'>>): Record<NivelQualidadeVisual, number> & { total: number; premiumCoveragePct: number } {
  const c: Record<NivelQualidadeVisual, number> = { prototype: 0, legacy: 0, production: 0, premium: 0, hero: 0 };
  for (const it of itens) c[qualidadeVisualDe(it.id)] += 1;
  const total = itens.length;
  const premiumCoveragePct = total ? Math.round(((c.premium + c.hero) / total) * 1000) / 10 : 0;
  return { ...c, total, premiumCoveragePct };
}

// ── onda 1423 (BRIEFING_CORRETIVO_01 §5–§6, decisão #214): UPGRADE
//    LEGACY → PREMIUM com PREVIEW — nunca migração silenciosa ──────────

export interface CandidatoPremium {
  /** config candidata (acabamento premium + IDs sucessores) — NÃO salva */
  candidato: import('../domain/types').AvatarConfig;
  /** trocas de id aplicadas (transparência p/ a comparação) */
  trocas: Array<{ de: string; para: string }>;
}

/** Monta a versão PREMIUM candidata de um config legado SEM salvar
 *  (§6): acabamento 'premium' + IDs trocados pelos sucessores do
 *  registry. Devolve null quando o avatar já é premium OU quando não há
 *  nenhum ganho (sem sucessores e sem trilho premium a ligar). O caller
 *  mostra Before × After e SÓ aplica com aprovação explícita (§5). */
export function montarCandidatoPremium(config: import('../domain/types').AvatarConfig): CandidatoPremium | null {
  if (config.acabamento === 'premium') return null;
  const candidato = JSON.parse(JSON.stringify(config)) as import('../domain/types').AvatarConfig;
  candidato.acabamento = 'premium';
  const trocas: CandidatoPremium['trocas'] = [];
  const trocar = (id: string): string => {
    const s = sucessorDe(id);
    if (s && s !== id) { trocas.push({ de: id, para: s }); return s; }
    return id;
  };
  candidato.base = trocar(candidato.base);
  for (const [camada, id] of Object.entries(candidato.camadas ?? {})) {
    if (typeof id === 'string' && id !== 'nenhum') {
      (candidato.camadas as Record<string, string>)[camada] = trocar(id);
    }
  }
  return { candidato, trocas };
}
