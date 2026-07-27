// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:search
// PURPOSE: Table Engine - Search Mixin
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABLE_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SearchMixin — exported value
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TABLE_EVENTS } from '/core/runtime/events/catalog/table.events.js';

export const VERSION = '1.1.0-P18EC';
export const MODULE_ID = 'table-engine:search';

const SEARCH_DEBOUNCE = 300;

export const SearchMixin = {
  // @ts-expect-error strict migration — TS2339
  _initSearch() { this._searchDebounceTimer = null; },

  _handleSearchInput(value: string) {
    // @ts-expect-error strict migration — TS2339
    if (this._searchDebounceTimer) clearTimeout(this._searchDebounceTimer);
    // @ts-expect-error strict migration — TS2339
    this._searchDebounceTimer = setTimeout(() => {
      // @ts-expect-error strict migration — TS2339
      this._state.setSearch(value.trim().toLowerCase());
      this._applySearch();
    }, SEARCH_DEBOUNCE);
  },

  _applySearch() {
    // @ts-expect-error strict migration — TS2339
    const query = this._state.get('search');
    // @ts-expect-error strict migration — TS2339
    const data = this._state.getData();
    // @ts-expect-error strict migration — TS2339
    const columns = this._state.get('columns') || [];
    const searchableCols = columns.filter((c: Record<string, unknown>) => c.searchable !== false).map((c: Record<string, unknown>) => c.id);

    if (!query) {
      // @ts-expect-error strict migration — TS2339
      this._state.set('filteredData', [...data]);
    } else {
      const filtered = data.filter((item: Record<string, unknown>) => searchableCols.some((colId: string) => {
        const val = item[colId];
        if (!val) return false;
        return String(val).toLowerCase().includes(query);
      }));
      // @ts-expect-error strict migration — TS2339
      this._state.set('filteredData', filtered);
    }

    // @ts-expect-error strict migration — TS2339
    this._state.setPage(1);
    // @ts-expect-error strict migration — TS2339
    this._renderBody?.();
    this._updateSearchInfo();
    // @ts-expect-error strict migration — TS2339
    this._renderFooter?.();
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.FILTERED, { query, results: this._state.getFilteredData().length });
  },

  _clearSearch() {
    // @ts-expect-error strict migration — TS2339
    this._state.setSearch('');
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    const input = this._container.querySelector(`.${p}search-input`);
    if (input) input.value = '';
    this._applySearch();
  },

  _updateSearchInfo() {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    const info = this._container.querySelector(`.${p}search-info`);
    if (info) {
      // @ts-expect-error strict migration — TS2339
      const query = this._state.get('search');
      if (query) {
        // @ts-expect-error strict migration — TS2339
        info.textContent = `${this._state.getFilteredData().length} de ${this._state.getData().length}`;
        info.classList.add(`${p}active`);
      } else {
        info.textContent = '';
        info.classList.remove(`${p}active`);
      }
    }
  },

  _destroySearch() {
    // @ts-expect-error strict migration — TS2339
    if (this._searchDebounceTimer) { clearTimeout(this._searchDebounceTimer); this._searchDebounceTimer = null; }
  },

  search(query: string) {
    // @ts-expect-error strict migration — TS2339
    this._state.setSearch(String(query || '').trim().toLowerCase());
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    const input = this._container.querySelector(`.${p}search-input`);
    if (input) input.value = query || '';
    this._applySearch();
  }
};

export default SearchMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
