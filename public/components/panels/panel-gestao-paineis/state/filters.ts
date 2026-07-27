/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/state/filters.ts
 * @version 1.0.0
 * Filter logic and URL sync
 * ═══════════════════════════════════════════════════════════════ */

import type { FilterState } from '../core/types.js';

export function parseFiltersFromURL(): Partial<FilterState> {
  const params = new URLSearchParams(window.location.search);
  const filters: Partial<FilterState> = {};
  const category = params.get('category');
  if (category) filters.category = category;
  const status = params.get('status');
  if (status === 'active' || status === 'inactive' || status === 'all') {
    filters.status = status;
  }
  const search = params.get('search');
  if (search) filters.search = search;
  return filters;
}

export function syncFiltersToURL(filters: FilterState): void {
  const params = new URLSearchParams(window.location.search);
  if (filters.category) {
    params.set('category', filters.category);
  } else {
    params.delete('category');
  }
  if (filters.status !== 'all') {
    params.set('status', filters.status);
  } else {
    params.delete('status');
  }
  if (filters.search) {
    params.set('search', filters.search);
  } else {
    params.delete('search');
  }
  const qs = params.toString();
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', newUrl);
}

export function hasActiveFilters(filters: FilterState): boolean {
  return !!(filters.category || filters.status !== 'all' || filters.search);
}
