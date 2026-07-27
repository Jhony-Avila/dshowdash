// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:scroll
// PURPOSE: Table Engine - Scroll Mixin
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABLE_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ScrollMixin — exported value
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
export const MODULE_ID = 'table-engine:scroll';

const SCROLL_MODES = ['pagination', 'virtual', 'infinite'];
const ROW_HEIGHTS = { compact: 36, normal: 48, comfortable: 56 };
const VIRTUAL_BUFFER = 10;
const INFINITE_THRESHOLD = 200;

export const ScrollMixin = {
  // @ts-expect-error strict migration — TS2339, TS2551
  _initScroll() { this._rafId = null; this._scrollMode = 'pagination'; this._virtualStart = 0; this._virtualEnd = 50; this._scrollTop = 0; this._infiniteLoading = false; this._infiniteHasMore = true; },

  _setScrollMode(mode: string) {
    if (!SCROLL_MODES.includes(mode)) return;
    // @ts-expect-error strict migration — TS2551
    this._scrollMode = mode;
    // @ts-expect-error strict migration — TS2339
    this.render?.();
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.SCROLL_MODE_CHANGE, { mode });
  },

  _onScroll(e: Event) {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    const container = (e.target as HTMLElement).closest(`.${p}table-container`) as HTMLElement | null;
    if (!container) return;
    container.classList.toggle(`${p}scrolled`, container.scrollTop > 0);

    // @ts-expect-error strict migration — TS2551
    if (this._scrollMode === 'virtual') {
      // @ts-expect-error strict migration — TS2339
      this._scrollTop = container.scrollTop;
      // @ts-expect-error strict migration — TS2339
      if (this._rafId) cancelAnimationFrame(this._rafId);
      // @ts-expect-error strict migration — TS2339
      this._rafId = requestAnimationFrame(() => this._updateVirtualRows());
    }

    // @ts-expect-error strict migration — TS2551
    if (this._scrollMode === 'infinite') {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < INFINITE_THRESHOLD) this._loadMoreInfinite();
    }
  },

  _setPage(page: number) {
    // @ts-expect-error strict migration — TS2339
    this._state.setPage(page);
    // @ts-expect-error strict migration — TS2339
    this._renderBody?.();
    // @ts-expect-error strict migration — TS2339
    this._renderFooter?.();
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.PAGE, { page });
  },

  _getRowHeight() {
    // @ts-expect-error strict migration — TS2339
    const density = this._state.get('density') || 'normal';
    return (ROW_HEIGHTS as Record<string, number>)[density] || ROW_HEIGHTS.normal;
  },

  _calculateVisibleRange() {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    const rowHeight = this._getRowHeight();
    // @ts-expect-error strict migration — TS2339
    const container = this._container.querySelector(`.${p}table-container`);
    if (!container) return { start: 0, end: 50 };
    const viewportHeight = container.clientHeight;
    // @ts-expect-error strict migration — TS2339
    const data = this._state.getFilteredData();
    const visibleCount = Math.ceil(viewportHeight / rowHeight);
    // @ts-expect-error strict migration — TS2339
    const start = Math.max(0, Math.floor(this._scrollTop / rowHeight) - VIRTUAL_BUFFER);
    const end = Math.min(data.length, start + visibleCount + (VIRTUAL_BUFFER * 2));
    return { start, end };
  },

  _updateVirtualRows() {
    const { start, end } = this._calculateVisibleRange();
    // @ts-expect-error strict migration — TS2339
    if (start === this._virtualStart && end === this._virtualEnd) return;
    // @ts-expect-error strict migration — TS2339
    this._virtualStart = start;
    // @ts-expect-error strict migration — TS2339
    this._virtualEnd = end;
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    const tbody = this._container.querySelector(`.${p}table tbody`);
    if (!tbody) return;
    // @ts-expect-error strict migration — TS2339
    const columns = this._getOrderedColumns?.() || [];
    const rowHeight = this._getRowHeight();
    // @ts-expect-error strict migration — TS2339
    const data = this._state.getFilteredData();
    const topSpacer = start * rowHeight;
    const bottomSpacer = Math.max(0, (data.length - end) * rowHeight);

    let topRow = tbody.querySelector(`.${p}virtual-spacer-top`);
    let bottomRow = tbody.querySelector(`.${p}virtual-spacer-bottom`);

    if (!topRow) {
      topRow = document.createElement('tr');
      topRow.className = `${p}virtual-spacer-top`;
      topRow.innerHTML = `<td colspan="${columns.length}"></td>`;
      tbody.insertBefore(topRow, tbody.firstChild);
    }
    topRow.style.height = `${topSpacer}px`;

    if (!bottomRow) {
      bottomRow = document.createElement('tr');
      bottomRow.className = `${p}virtual-spacer-bottom`;
      bottomRow.innerHTML = `<td colspan="${columns.length}"></td>`;
      tbody.appendChild(bottomRow);
    }
    bottomRow.style.height = `${bottomSpacer}px`;

    // @ts-expect-error strict migration — TS2339
    this._updateRowSelection?.();
    // @ts-expect-error strict migration — TS2339
    this._updateCheckboxes?.();
  },

  _loadMoreInfinite() {
    // @ts-expect-error strict migration — TS2339
    if (this._infiniteLoading || !this._infiniteHasMore) return;
    // @ts-expect-error strict migration — TS2339
    this._infiniteLoading = true;
    this._showInfiniteLoader(true);
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.LOAD_MORE, { offset: this._state.getData().length, callback: (newData: Record<string, unknown>[], hasMore: boolean) => this._onInfiniteDataLoaded(newData, hasMore) });
  },

  _onInfiniteDataLoaded(newData: Record<string, unknown>[] | null, hasMore: boolean = true) {
    // @ts-expect-error strict migration — TS2339
    this._infiniteLoading = false;
    // @ts-expect-error strict migration — TS2339
    this._infiniteHasMore = hasMore;
    this._showInfiniteLoader(false);
    if (!newData?.length) return;
    // @ts-expect-error strict migration — TS2339
    const currentData = this._state.getData();
    // @ts-expect-error strict migration — TS2339
    this._state.setData([...currentData, ...newData]);
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.INFINITE_LOADED, { total: this._state.getData().length, hasMore });
  },

  _showInfiniteLoader(show: boolean) {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    let loader = this._container.querySelector(`.${p}infinite-loader`);
    if (show && !loader) {
      loader = document.createElement('div');
      loader.className = `${p}infinite-loader`;
      loader.innerHTML = `<span class="${p}infinite-spinner">⟳</span><span>Carregando mais...</span>`;
      // @ts-expect-error strict migration — TS2339
      this._container.querySelector(`.${p}table-container`)?.appendChild(loader);
    } else if (!show && loader) { loader.remove(); }
  },

  appendData(newData: Record<string, unknown>[] | null, hasMore: boolean = true) { this._onInfiniteDataLoaded(newData, hasMore); },
  // @ts-expect-error strict migration — TS2339
  setHasMore(hasMore: boolean) { this._infiniteHasMore = hasMore; },
  setScrollMode(mode: string) { this._setScrollMode(mode); },
  // @ts-expect-error strict migration — TS2551
  getScrollMode() { return this._scrollMode; },
  // @ts-expect-error strict migration — TS2339
  _destroyScroll() { if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; } }
};

export default ScrollMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
