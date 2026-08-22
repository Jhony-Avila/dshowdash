// services/ApresentacaoAsset.ts — onda 1425 (BRIEFING_COMPLEMENTAR_02
// "Asset Clarity"; decisão #217): ASSET PRESENTATION REGISTRY — FONTE
// ÚNICA da regra "card = peça · palco = peça aplicada" (§41–§43).
//
// Regra de produto (§1/§120): o thumbnail do CARD representa o ASSET
// isolado; o PALCO mostra o avatar com o asset aplicado. Antes, o Modo
// Item (§3) era restrito a `categoria === 'acessorio'` — aqui a política
// vira DADO por categoria, sem `if` espalhado por 10 componentes (§42).
// Puro (zero DOM/React) — consumido por GradeItens, DetalheAsset,
// Relacionados, Colecoes, Vitrine, Busca, Favoritos, Recentes (§94).
import type { CategoriaId } from '../domain/types';

/** Como o CARD apresenta o asset (§41). */
export type TipoThumb =
  | 'isolated'      // só a camada do asset, fundo neutro (§4/§46)
  | 'ghost-context' // asset + contexto anatômico discreto (§11/§16 — brinco/relógio/barba)
  | 'environment'   // a própria arte preenche 100% (fundos §25/§48)
  | 'avatar-context'; // exceção: precisa da figura (não usado em item hoje)

/** Câmera/enquadramento do PREVIEW no palco ao passar o mouse (§43). */
export type CameraPreview = 'face' | 'bust' | 'full' | 'current' | 'back' | 'wider';

export interface PoliticaApresentacao {
  thumbnail: TipoThumb;
  previewCamera: CameraPreview;
}

/** Registry por categoria (§43). Default = isolated/bust — qualquer
 *  categoria nova cai num thumbnail isolado até ganhar política própria. */
export const APRESENTACAO_POR_CATEGORIA: Record<CategoriaId, PoliticaApresentacao> = {
  base: { thumbnail: 'isolated', previewCamera: 'face' },      // §17 cabeça neutra
  olhos: { thumbnail: 'isolated', previewCamera: 'face' },     // §12
  boca: { thumbnail: 'isolated', previewCamera: 'face' },      // §13
  nariz: { thumbnail: 'isolated', previewCamera: 'face' },     // §14
  sobrancelha: { thumbnail: 'isolated', previewCamera: 'face' }, // §15
  barba: { thumbnail: 'ghost-context', previewCamera: 'face' }, // §16 jaw ghost
  cabelo: { thumbnail: 'isolated', previewCamera: 'bust' },    // §4/§6 back+front
  roupa: { thumbnail: 'isolated', previewCamera: 'full' },     // §7
  roupa_sobre: { thumbnail: 'isolated', previewCamera: 'full' }, // §7
  roupa_inferior: { thumbnail: 'isolated', previewCamera: 'full' }, // §9 cintura→pés
  acessorio: { thumbnail: 'isolated', previewCamera: 'bust' }, // §10/§18/§19 (calçado/óculos/chapéu — o slot refina)
  fundo: { thumbnail: 'environment', previewCamera: 'current' }, // §25/§48
  moldura: { thumbnail: 'environment', previewCamera: 'current' }, // §26 moldura + campo vazio
  aura: { thumbnail: 'ghost-context', previewCamera: 'bust' },  // §27 silhueta ghost p/ escala
  efeito: { thumbnail: 'ghost-context', previewCamera: 'bust' }, // §28
  banner: { thumbnail: 'isolated', previewCamera: 'bust' },
  emblema: { thumbnail: 'isolated', previewCamera: 'bust' },
};

const PADRAO: PoliticaApresentacao = { thumbnail: 'isolated', previewCamera: 'bust' };

export function apresentacaoDe(categoria: CategoriaId | string): PoliticaApresentacao {
  return APRESENTACAO_POR_CATEGORIA[categoria as CategoriaId] ?? PADRAO;
}

/** O CARD desta categoria mostra o asset ISOLADO (não o avatar)? Todas
 *  as categorias de ITEM mostram — só 'avatar-context' (inexistente hoje)
 *  usaria a figura. Fundos/molduras usam a própria arte (environment). */
export function usaThumbIsolado(categoria: CategoriaId | string): boolean {
  return apresentacaoDe(categoria).thumbnail !== 'avatar-context';
}

/** Categorias de ACESSÓRIO por SLOT que precisam de contexto anatômico
 *  ghost (§11/§16/§18): brinco no lóbulo, relógio no pulso, óculos na
 *  ponte — o contexto é DISCRETO (opacity baixa, cor neutra, §11). O
 *  slot do item refina a política 'isolated' base de acessório. */
export const SLOTS_GHOST_CONTEXT = new Set<string>([
  'orelha_e', 'orelha_d',     // brincos
  'pulso_e', 'pulso_d',       // relógios/pulseiras
]);

/** Contexto ghost pela categoria E slot (acessórios refinam por slot). */
export function precisaGhostContext(categoria: CategoriaId | string, slot?: string | null): boolean {
  if (apresentacaoDe(categoria).thumbnail === 'ghost-context') return true;
  return categoria === 'acessorio' && !!slot && SLOTS_GHOST_CONTEXT.has(slot);
}
