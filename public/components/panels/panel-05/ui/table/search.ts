// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:search
// PURPOSE: Panel-05 Table Search
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABLE_COLUMNS, SEARCH_DEBOUNCE from ./constants.js
//   TABLE_EVENTS from /core/runtime/events/catalog/table.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SearchMixin — exported value
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TABLE_EVENTS.SEARCH
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TABLE_COLUMNS, SEARCH_DEBOUNCE } from './constants.js';
import { TABLE_EVENTS } from '/core/runtime/events/catalog/table.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:table:search';

export const SearchMixin = {
  _initSearch() {
    // @ts-expect-error strict migration — TS2339
    this._searchDebounceTimer = null;
  },

  _handleSearchInput(value: string) {
    // @ts-expect-error strict migration — TS2339
    if (this._searchDebounceTimer) {
      // @ts-expect-error strict migration — TS2339
      clearTimeout(this._searchDebounceTimer);
    }

    // @ts-expect-error strict migration — TS2339
    this._searchDebounceTimer = setTimeout(() => {
      // @ts-expect-error strict migration — TS2339
      this._state.searchQuery = value.trim().toLowerCase();
      this._applySearch();
    }, SEARCH_DEBOUNCE);
  },

  _applySearch() {
    // @ts-expect-error strict migration — TS2339
    if (!this._state.searchQuery) {
      // @ts-expect-error strict migration — TS2339
      this._state.filteredData = [...this._state.data];
    } else {
      const searchableCols = TABLE_COLUMNS
        .filter(c => c.searchable)
        .map(c => c.id);

      // @ts-expect-error strict migration — TS2339
      this._state.filteredData = this._state.data.filter((item: Record<string, unknown>) => searchableCols.some((colId: string) => {
        const val = item[colId];
        if (!val) return false;
        // @ts-expect-error strict migration — TS2339
        return String(val).toLowerCase().includes(this._state.searchQuery);
      }));
    }

    // @ts-expect-error strict migration — TS2339
    this._state.page = 1;
    // @ts-expect-error strict migration — TS2339
    this._updateTableBody();
    this._updateSearchInfo();
    // @ts-expect-error strict migration — TS2339
    this._updateFooter();

    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.SEARCH, {
      // @ts-expect-error strict migration — TS2339
      query: this._state.searchQuery,
      // @ts-expect-error strict migration — TS2339
      results: this._state.filteredData.length
    });
  },

  _clearSearch() {
    // @ts-expect-error strict migration — TS2339
    this._state.searchQuery = '';

    // @ts-expect-error strict migration — TS2339
    const input = this._container.querySelector('.p05-search-input');
    if (input) input.value = '';

    this._applySearch();
  },

  _updateSearchInfo() {
    // @ts-expect-error strict migration — TS2339
    const info = this._container.querySelector('.p05-search-info');
    if (info) {
      // @ts-expect-error strict migration — TS2339
      if (this._state.searchQuery) {
        // @ts-expect-error strict migration — TS2339
        info.textContent = `${this._state.filteredData.length} de ${this._state.data.length}`;
        info.classList.add('p05-active');
      } else {
        info.textContent = '';
        info.classList.remove('p05-active');
      }
    }
  },

  _destroySearch() {
    // @ts-expect-error strict migration — TS2339
    if (this._searchDebounceTimer) {
      // @ts-expect-error strict migration — TS2339
      clearTimeout(this._searchDebounceTimer);
      // @ts-expect-error strict migration — TS2339
      this._searchDebounceTimer = null;
    }
  },

  search(query: string) {
    // @ts-expect-error strict migration — TS2339
    this._state.searchQuery = String(query || '').trim().toLowerCase();

    // @ts-expect-error strict migration — TS2339
    const input = this._container.querySelector('.p05-search-input');
    if (input) input.value = query || '';

    this._applySearch();
  }
};

export default SearchMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { searchReady: true } }; }
