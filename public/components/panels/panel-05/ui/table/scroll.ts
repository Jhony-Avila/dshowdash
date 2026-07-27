// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:scroll
// PURPOSE: Panel-05 Table Scroll
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SCROLL_MODES, ROW_HEIGHTS, VIRTUAL_BUFFER, INFINITE_THRESHOLD, ICONS from ./c...
//   TABLE_EVENTS, TABLE_INTENTS from /core/runtime/events/catalog/table.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ScrollMixin — exported value
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TABLE_EVENTS.INFINITE_LOADED
//   TABLE_EVENTS.PAGE_CHANGE
//   TABLE_EVENTS.SCROLL_MODE_CHANGE
//   TABLE_INTENTS.LOAD_MORE
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SCROLL_MODES, ROW_HEIGHTS, VIRTUAL_BUFFER, INFINITE_THRESHOLD, ICONS } from './constants.js';
import { TABLE_EVENTS, TABLE_INTENTS } from '/core/runtime/events/catalog/table.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:table:scroll';

export const ScrollMixin = {
  _initScroll() {
    // @ts-expect-error strict migration — TS2339
    this._rafId = null;
  },

  _setScrollMode(mode: string) {
    if (!SCROLL_MODES.includes(mode)) return;

    // @ts-expect-error strict migration — TS2339
    this._state.setScrollMode(mode);
    // @ts-expect-error strict migration — TS2339
    this._state.shellRendered = false;
    // @ts-expect-error strict migration — TS2339
    this.render();

    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.SCROLL_MODE_CHANGE, { mode });
  },

  _onScroll(e: Event) {
    const container = (e.target as Element).closest('.p05-table-container') as HTMLElement | null;
    if (!container) return;

    container.classList.toggle('p05-scrolled', container.scrollTop > 0);

    // @ts-expect-error strict migration — TS2339
    if (this._state.scrollMode === 'virtual') {
      // @ts-expect-error strict migration — TS2339
      this._state.scrollTop = container.scrollTop;
      // @ts-expect-error strict migration — TS2339
      if (this._rafId) cancelAnimationFrame(this._rafId);
      // @ts-expect-error strict migration — TS2339
      this._rafId = requestAnimationFrame(() => this._updateVirtualRows());
    }

    // @ts-expect-error strict migration — TS2339
    if (this._state.scrollMode === 'infinite') {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < INFINITE_THRESHOLD) {
        this._loadMoreInfinite();
      }
    }
  },

  _setPage(page: number) {
    // @ts-expect-error strict migration — TS2339
    this._state.setPage(page);
    // @ts-expect-error strict migration — TS2339
    this._updateTableBody();
    // @ts-expect-error strict migration — TS2339
    this._updateFooter();
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.PAGE_CHANGE, { page });
  },

  // @ts-expect-error strict migration — TS7023
  _getRowHeight() {
    // @ts-expect-error strict migration — TS2339
    return (ROW_HEIGHTS as Record<string, number>)[this._state.density as string] || ROW_HEIGHTS.comfortable;
  },

  _calculateVisibleRange() {
    const rowHeight = this._getRowHeight();
    // @ts-expect-error strict migration — TS2339
    const container = this._container.querySelector('.p05-table-container');

    if (!container) return { start: 0, end: 50 };

    // @ts-expect-error strict migration — TS2339
    this._state.viewportHeight = container.clientHeight;
    // @ts-expect-error strict migration — TS2339
    const data = this._state.getDisplayData();
    // @ts-expect-error strict migration — TS2339
    const visibleCount = Math.ceil(this._state.viewportHeight / rowHeight);

    // @ts-expect-error strict migration — TS2339
    const start = Math.max(0, Math.floor(this._state.scrollTop / rowHeight) - VIRTUAL_BUFFER);
    const end = Math.min(data.length, start + visibleCount + (VIRTUAL_BUFFER * 2));

    return { start, end };
  },

  _updateVirtualRows() {
    const { start, end } = this._calculateVisibleRange();

    // @ts-expect-error strict migration — TS2339
    if (start === this._state.virtualStart && end === this._state.virtualEnd) return;

    // @ts-expect-error strict migration — TS2339
    this._state.virtualStart = start;
    // @ts-expect-error strict migration — TS2339
    this._state.virtualEnd = end;

    // @ts-expect-error strict migration — TS2339
    const tbody = this._state.refs.tbody || this._container.querySelector('.p05-table tbody');
    if (!tbody) return;

    // @ts-expect-error strict migration — TS2339
    const orderedCols = this._getOrderedColumns();
    const rowHeight = this._getRowHeight();
    // @ts-expect-error strict migration — TS2339
    const data = this._state.getDisplayData();

    const topSpacer = start * rowHeight;
    const bottomSpacer = Math.max(0, (data.length - end) * rowHeight);
    const visibleData = data.slice(start, end);

    let topRow = tbody.querySelector('.p05-virtual-spacer-top');
    let bottomRow = tbody.querySelector('.p05-virtual-spacer-bottom');

    if (!topRow) {
      topRow = document.createElement('tr');
      topRow.className = 'p05-virtual-spacer-top';
      topRow.innerHTML = `<td colspan="${orderedCols.length}"></td>`;
      tbody.insertBefore(topRow, tbody.firstChild);
    }
    topRow.style.height = `${topSpacer}px`;

    if (!bottomRow) {
      bottomRow = document.createElement('tr');
      bottomRow.className = 'p05-virtual-spacer-bottom';
      bottomRow.innerHTML = `<td colspan="${orderedCols.length}"></td>`;
      tbody.appendChild(bottomRow);
    }
    bottomRow.style.height = `${bottomSpacer}px`;

    // @ts-expect-error strict migration — TS2339
    this._diffUpdateRows(tbody, visibleData, start, orderedCols, topRow, bottomRow);

    // @ts-expect-error strict migration — TS2339
    this._updateRowSelection();
    // @ts-expect-error strict migration — TS2339
    this._updateCheckboxes();
  },

  _loadMoreInfinite() {
    // @ts-expect-error strict migration — TS2339
    if (this._state.infiniteLoading || !this._state.infiniteHasMore) return;

    // @ts-expect-error strict migration — TS2339
    this._state.infiniteLoading = true;
    this._showInfiniteLoader(true);

    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_INTENTS.LOAD_MORE, {
      // @ts-expect-error strict migration — TS2339
      offset: this._state.infiniteLoadedCount,
      // @ts-expect-error strict migration — TS2339
      limit: this._state.infiniteChunkSize,
      callback: (newData: Array<Record<string, unknown>>, hasMore: boolean) => this._onInfiniteDataLoaded(newData, hasMore)
    });
  },

  _onInfiniteDataLoaded(newData: Array<Record<string, unknown>>, hasMore = true) {
    // @ts-expect-error strict migration — TS2339
    this._state.infiniteLoading = false;
    // @ts-expect-error strict migration — TS2339
    this._state.infiniteHasMore = hasMore;
    this._showInfiniteLoader(false);

    if (!newData?.length) return;

    // @ts-expect-error strict migration — TS2339
    this._state.data = [...this._state.data, ...newData];
    // @ts-expect-error strict migration — TS2339
    this._state.filteredData = [...this._state.filteredData, ...newData];
    // @ts-expect-error strict migration — TS2339
    this._state.infiniteLoadedCount = this._state.data.length;

    this._appendInfiniteRows(newData);

    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.INFINITE_LOADED, {
      // @ts-expect-error strict migration — TS2339
      total: this._state.data.length,
      hasMore
    });
  },

  _appendInfiniteRows(newData: Array<Record<string, unknown>>) {
    // @ts-expect-error strict migration — TS2339
    const tbody = this._state.refs.tbody || this._container.querySelector('.p05-table tbody');
    if (!tbody) return;

    // @ts-expect-error strict migration — TS2339
    const orderedCols = this._getOrderedColumns();
    // @ts-expect-error strict migration — TS2339
    const startIdx = this._state.getDisplayData().length - newData.length;

    const fragment = document.createDocumentFragment();
    newData.forEach((item: Record<string, unknown>, i: number) => {
      // @ts-expect-error strict migration — TS2339
      fragment.appendChild(this._createRowElement(item, startIdx + i, orderedCols));
    });

    tbody.appendChild(fragment);
    this._updateInfiniteInfo();
  },

  _showInfiniteLoader(show: boolean) {
    // @ts-expect-error strict migration — TS2339
    let loader = this._container.querySelector('.p05-infinite-loader');

    if (show && !loader) {
      loader = document.createElement('div');
      loader.className = 'p05-infinite-loader';
      loader.innerHTML = `<span class="p05-infinite-spinner">${ICONS.loader}</span><span>Carregando mais...</span>`;
      // @ts-expect-error strict migration — TS2339
      this._container.querySelector('.p05-table-container')?.appendChild(loader);
    } else if (!show && loader) {
      loader.remove();
    }
  },

  _updateInfiniteInfo() {
    // @ts-expect-error strict migration — TS2339
    const info = this._container.querySelector('.p05-infinite-info');
    if (info) {
      // @ts-expect-error strict migration — TS2339
      const data = this._state.getDisplayData();
      // @ts-expect-error strict migration — TS2339
      info.textContent = `${data.length} registros carregados${this._state.infiniteHasMore ? '' : ' (todos)'}`;
    }
  },

  appendData(newData: Array<Record<string, unknown>>, hasMore = true) {
    this._onInfiniteDataLoaded(newData, hasMore);
  },

  setHasMore(hasMore: boolean) {
    // @ts-expect-error strict migration — TS2339
    this._state.infiniteHasMore = hasMore;
    this._updateInfiniteInfo();
  },

  setScrollMode(mode: string) {
    this._setScrollMode(mode);
  },

  getScrollMode() {
    // @ts-expect-error strict migration — TS2339
    return this._state.scrollMode;
  },

  _destroyScroll() {
    // @ts-expect-error strict migration — TS2339
    if (this._rafId) {
      // @ts-expect-error strict migration — TS2339
      cancelAnimationFrame(this._rafId);
      // @ts-expect-error strict migration — TS2339
      this._rafId = null;
    }
  }
};

export default ScrollMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { scrollReady: true } }; }
