// services/MetadadosAssets.ts — METADADOS DE ASSET (AS6 §150–§153/§227).
// @version 1.0.0  @created 2026-08-09  (lote 891–900, flag as6.meta_assets)
//
// Lacuna transversal #6 do plano AS6: autor/origem/versão (§151), licença
// registrada internamente (§152) e TAGS pesquisáveis/filtráveis (§227)
// para 100% do catálogo — sem tocar em NENHUM arquivo de arte (partes/*
// é intocável; isto é um WRAPPER de dados por cima do ItemCatalogo).
//
// Estratégia: derivação DETERMINÍSTICA total (todo item ganha metadados
// completos por construção) + mapas de curadoria pontuais por id. Puro e
// sem estado — mesmo item, mesmos metadados, sempre. Nada aqui entra na
// serialização do avatar (byte-stability intacta por definição).
import type { ItemCatalogo } from '../domain/types';
import { COLECOES } from './AvatarCatalog';
import { categoriaFuncional, ROTULO_FUNCIONAL } from './EfeitosFuncionais';
import { familiaDoPoder, ROTULO_FAMILIA } from './PoderesFamilia';
import { flag } from '../nucleo/flags';
import { fichaQualidadeDe, type NivelQualidadeVisual, type StatusQaVisual } from './QualidadeVisual';

export interface MetadadosAsset {
  /** §151: quem criou (biblioteca 'dshow' = estúdio interno) */
  autor: string;
  /** §151: de onde veio (catálogo interno · biblioteca externa curada) */
  origem: string;
  /** §152: licença registrada INTERNAMENTE (nunca exposta a export) */
  licenca: string;
  /** §151: versão do asset (curadoria por id; 1.0 = lançamento) */
  versao: string;
  /** §227: tags normalizadas (minúsculas, sem acento) p/ busca e filtro */
  tags: string[];
  /** onda 1406 (MEGA_BRIEFING_01 §68–§69, decisão #157): escada Q0–Q4 */
  qualidadeVisual: NivelQualidadeVisual;
  /** estado do Visual QA (VISUAL-QA.md §5) */
  statusQaVisual: StatusQaVisual;
  /** versão da representação visual (≠ identidade lógica §70–§71) */
  versaoVisual: string;
}

/** Curadoria: versões de assets que já evoluíram depois do lançamento
 *  (referências: §72 roupas em camadas, §157 efeitos funcionais). */
const VERSOES: Record<string, string> = {
  // roupas que ganharam camadas/conjuntos nos megas 551–556 (§72)
  rou_armadura: '1.1',
  rou_capa_chuva: '1.1',
};

/** Curadoria: tags EXTRAS por id (além das derivadas). */
const TAGS_EXTRA: Record<string, string[]> = {
  bas_androide: ['sintetico'],
  bas_holo: ['holografico'],
};

const normalizar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** §151/§152: ficha de proveniência por biblioteca de arte (decisão #90 —
 *  'dshow' é o estúdio interno; qualquer outra biblioteca entra como
 *  curadoria externa CC0, regra das personagens do Palco 3D). */
function proveniencia(biblioteca: string | undefined): Pick<MetadadosAsset, 'autor' | 'origem' | 'licenca'> {
  if (!biblioteca || biblioteca === 'dshow') {
    return { autor: 'Estúdio Dshow', origem: 'catálogo interno', licenca: 'Proprietária Dshow (uso interno)' };
  }
  return { autor: `Curadoria ${biblioteca}`, origem: `biblioteca ${biblioteca}`, licenca: 'CC0 (curadoria externa)' };
}

/**
 * Metadados COMPLETOS de um item — total por construção (§150: nenhum
 * asset sem ficha). Tags derivadas: tema + categoria + raridade + slot +
 * categoria funcional (efeitos §157) + família (poderes §153) + coleção
 * + 'novo' + extras de curadoria.
 */
export function metadadosDe(item: ItemCatalogo): MetadadosAsset {
  const tags = new Set<string>();
  tags.add(normalizar(item.tema));
  tags.add(normalizar(item.categoria));
  tags.add(normalizar(item.raridade));
  if (item.slot) tags.add(normalizar(item.slot));
  if (item.novo) tags.add('novo');
  if (item.categoria === 'efeito') tags.add(normalizar(ROTULO_FUNCIONAL[categoriaFuncional(item.id)]));
  if (item.categoria === 'efeito' || item.categoria === 'aura') {
    tags.add(normalizar(ROTULO_FAMILIA[familiaDoPoder(item.id)]));
  }
  const colecao = COLECOES.find((c) => c.itens.includes(item.id));
  if (colecao) tags.add(normalizar(colecao.nome));
  for (const extra of TAGS_EXTRA[item.id] ?? []) tags.add(normalizar(extra));
  // onda 1406 (#157): a qualidade visual vira tag pesquisável também
  // (`tag:premium`, `tag:prototype`) — derivada, nunca persistida; a TAG
  // (visível no drawer) só com a flag da frente AAA; os CAMPOS da ficha
  // são dados e existem sempre
  const ficha = fichaQualidadeDe(item.id);
  if (flag('as6.avatar_visual_v2')) tags.add(ficha.qualidadeVisual);
  return {
    ...proveniencia(item.biblioteca),
    versao: VERSOES[item.id] ?? '1.0',
    tags: [...tags].sort(),
    ...ficha,
  };
}

/** §227 (pesquisar): o item casa com o termo de tag? (exato, normalizado) */
export function temTag(item: ItemCatalogo, tag: string): boolean {
  return metadadosDe(item).tags.includes(normalizar(tag));
}
