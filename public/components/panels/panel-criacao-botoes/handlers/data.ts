/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/handlers/data.ts
 * @version 1.0.0
 * Carga de dados (leitura). O adapter compartilhado é importado de
 * forma LAZY (import dinâmico) — top-level fica livre de deps de
 * browser, mantendo este módulo e o index.js importáveis em node.
 * ═══════════════════════════════════════════════════════════════ */

import { store } from '../state/store.js';
import { buildGroups, deriveIcons } from '../core/transform.js';
import { fetchRealPanels } from '../core/panels-source.js';
import type { NavItem, RawSection } from '../core/types.js';

const ADAPTER_URL = '../core/nav-data-adapter.js';

interface LoadOpts {
  signal?: AbortSignal;
}

/** Carrega os painéis reais (panel_registry) para o dropdown do form. */
export async function loadRealPanels(opts: LoadOpts = {}): Promise<void> {
  const panels = await fetchRealPanels(opts);
  store.setRealPanels(panels);
}

/**
 * Carrega itens + seções da sidebar e popula o store agrupado.
 * Leitura apenas (Etapa 2). Não escreve nada.
 */
export async function loadData(opts: LoadOpts = {}): Promise<void> {
  store.setLoading(true);
  try {
    const adapter = await import(ADAPTER_URL);

    const [itemsRes, sections] = await Promise.all([
      adapter.fetchItems(true, opts),
      adapter.fetchSections(opts),
    ]);

    const items: NavItem[] = itemsRes && itemsRes.success && Array.isArray(itemsRes.data) ? itemsRes.data : [];
    const sectionList: RawSection[] = Array.isArray(sections) ? sections : [];

    if (!itemsRes || itemsRes.success === false) {
      store.setError(itemsRes?.error || 'Falha ao carregar itens da sidebar.');
      return;
    }

    store.setGroups(buildGroups(items, sectionList));
    store.setIcons(deriveIcons(items));
  } catch (err) {
    store.setError(err instanceof Error ? err.message : String(err));
  }
}
