/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/handlers/data.ts
 * @version 1.1.0
 * v1.1.0: Client-side sorting + screenshot history loading
 * ═══════════════════════════════════════════════════════════════ */

import { store } from '../state/store.js';
import { fetchPanels, fetchCategories, updatePanel, fetchScreenshotHistory } from '../services/api-client.js';
import type { PanelData, FilterState } from '../core/types.js';
import { getSavedSort } from '../ui/filters/filter-bar.js';
import type { SortConfig } from '../ui/filters/filter-bar.js';

function sortPanels(panels: PanelData[], config: SortConfig): PanelData[] {
  const sorted = [...panels];
  const dir = config.order === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    switch (config.field) {
      case 'title':
        return dir * (a.title || '').localeCompare(b.title || '', 'pt-BR', { sensitivity: 'base' });
      case 'category':
        return dir * (a.category || '').localeCompare(b.category || '', 'pt-BR', { sensitivity: 'base' });
      case 'last_screenshot_at': {
        const ta = a.last_screenshot_at ? new Date(a.last_screenshot_at).getTime() : 0;
        const tb = b.last_screenshot_at ? new Date(b.last_screenshot_at).getTime() : 0;
        return dir * (ta - tb);
      }
      case 'is_active': {
        const sa = a.is_active ? 1 : 0;
        const sb = b.is_active ? 1 : 0;
        return dir * (sa - sb);
      }
      default:
        return 0;
    }
  });

  return sorted;
}

export async function loadPanels(signal?: AbortSignal): Promise<void> {
  const { filters, pagination } = store.getState();
  store.setLoading(true);
  try {
    const result = await fetchPanels(filters, pagination, signal);
    if (result.ok) {
      const meta = result.meta as { total?: number; page?: number; per_page?: number; total_pages?: number } | undefined;
      const sortConfig = getSavedSort();
      const sortedPanels = sortPanels(result.data, sortConfig);
      store.setPanels(sortedPanels, meta ? {
        total: meta.total ?? 0,
        page: meta.page ?? 1,
        per_page: meta.per_page ?? 50,
        total_pages: meta.total_pages ?? 1,
      } : undefined);
    } else {
      store.setError((result as any).error || 'Erro ao carregar painéis');
    }
  } catch (err: unknown) {
    if ((err as any)?.name === 'AbortError') return;
    store.setError(err instanceof Error ? err.message : 'Erro de rede');
  }
}

export async function loadCategories(signal?: AbortSignal): Promise<void> {
  try {
    const result = await fetchCategories(signal);
    if (result.ok) {
      store.setCategories(result.data);
    }
  } catch (_) {
    // Categories are non-critical — swallow
  }
}

export async function loadScreenshotHistory(panelId: string, signal?: AbortSignal): Promise<Array<{ id: number; created_at: string; file_size: number; path: string }>> {
  try {
    const result = await fetchScreenshotHistory(panelId, signal);
    if (result.ok) {
      return result.data;
    }
  } catch (_) {
    // Non-critical
  }
  return [];
}

export async function togglePanelActive(panelId: string, signal?: AbortSignal): Promise<void> {
  const panel = store.getState().panels.find(p => p.panel_id === panelId);
  if (!panel) return;
  const newActive = !panel.is_active;
  try {
    const result = await updatePanel(panelId, { is_active: newActive } as Partial<PanelData>, signal);
    if (result.ok) {
      store.updatePanelInList(panelId, { is_active: newActive });
    }
  } catch (err: unknown) {
    console.error('[panel-gestao-paineis] Toggle failed:', err);
  }
}

export async function savePanelChanges(panelId: string, changes: Partial<PanelData>, signal?: AbortSignal): Promise<boolean> {
  try {
    const result = await updatePanel(panelId, changes, signal);
    if (result.ok) {
      store.updatePanelInList(panelId, changes);
      return true;
    }
    return false;
  } catch (err: unknown) {
    console.error('[panel-gestao-paineis] Save failed:', err);
    return false;
  }
}

export function applyFilter(partial: Partial<FilterState>): void {
  store.setFilters(partial);
}

export function changePage(page: number): void {
  store.setPage(page);
}

export function reSortPanels(): void {
  const { panels } = store.getState();
  const sortConfig = getSavedSort();
  const sorted = sortPanels(panels, sortConfig);
  store.setState({ panels: sorted });
}
