/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/core/nav-data-adapter.ts
 * @version 1.0.0
 *
 * ⚠ ACOPLAMENTO INTENCIONAL ⚠
 * Importa o adapter COMPARTILHADO de panel-nav-admin:
 *   /components/panels/panel-nav-admin/core/nav-adapter.js
 * Motivo: garantir ESCRITA ÚNICA em ui_nav_items. Este painel
 * (Criação de Botões) é uma VISÃO ESPECIALIZADA da sidebar — não
 * reimplementa criação/edição. Qualquer mudança feita aqui aparece
 * no panel-nav-admin e vice-versa, porque é o MESMO código batendo
 * na MESMA API (/api/admin/navigation) e na MESMA tabela.
 *
 * Se o nav-adapter do panel-nav-admin for refatorado, ESTE arquivo
 * (e o painel) precisam ser revisados junto. Ver o aviso recíproco
 * no cabeçalho de panel-nav-admin/core/nav-adapter.ts.
 *
 * NB: import absoluto resolvido em runtime (browser). O adapter puxa
 * /core/runtime/ports-profiles.js, por isso este módulo é carregado
 * de forma LAZY (import dinâmico em handlers/data.ts), mantendo o
 * shell do painel montável mesmo antes do adapter resolver.
 * ═══════════════════════════════════════════════════════════════ */
'use strict';

import * as shared from '/components/panels/panel-nav-admin/core/nav-adapter.js';

import type { NavItem, RawSection } from './types.js';

interface AdapterResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface FetchOpts {
  signal?: AbortSignal;
  context?: string;
}

/**
 * Itens da sidebar JÁ MAPEADOS (shape NavItem).
 *
 * ⚠ shared.fetchItems tem retorno INCONSISTENTE: no caminho de CACHE devolve
 * _cachedItems (mapeado por _mapApiItem → section/itemType/id...), mas no
 * caminho de REDE faz `return result` com result.data CRU (display_context/
 * item_type/item_key...). Como este painel sempre chama com forceRefresh=true,
 * sem este wrapper ele recebia linhas CRUAS e o transform (i.section/i.itemType)
 * filtrava TUDO → lista vazia ("Nenhum botão encontrado") mesmo com a API
 * devolvendo ~114 itens.
 *
 * Normalizamos aqui reusando o mapper compartilhado via getItems (que retorna
 * _cachedItems, já passado por _mapApiItem) — sem duplicar _mapApiItem e sem
 * alterar o adapter compartilhado (contrato do panel-nav-admin preservado).
 * O envelope de erro/!success é propagado como veio (loadData faz setError).
 */
export async function fetchItems(
  forceRefresh = true,
  opts: FetchOpts = {}
): Promise<AdapterResult<NavItem[]>> {
  const res = await (shared as any).fetchItems(forceRefresh, opts);
  if (res && res.success && Array.isArray(res.data)) {
    // getItems(false) → cache recém-populado por fetchItems acima (sem nova rede)
    const mapped = await (shared as any).getItems(false);
    return { success: true, data: mapped as NavItem[] };
  }
  return res;
}

/** Seções/grupos (linhas cruas — não passam por _mapApiItem). */
export function fetchSections(opts: FetchOpts = {}): Promise<RawSection[]> {
  return (shared as any).fetchSections({ context: 'sidebar', ...opts });
}

/** Painéis/rotas disponíveis (distinct em uso) — complemento ao panel_registry. */
export function fetchAvailableRoutes(
  forceRefresh = false,
  opts: FetchOpts = {}
): Promise<AdapterResult<unknown[]>> {
  return (shared as any).fetchAvailableRoutes(forceRefresh, opts);
}

/** Criação de item (escrita única — POST /items). */
export function createItem(item: Record<string, unknown>, opts: FetchOpts = {}): Promise<AdapterResult<unknown>> {
  return (shared as any).createItem(item, opts);
}

/** Atualização de item (escrita única — PATCH /items). */
export function updateItem(
  itemId: string | number,
  updates: Record<string, unknown>,
  opts: FetchOpts = {}
): Promise<AdapterResult<unknown>> {
  return (shared as any).updateItem(itemId, updates, opts);
}
