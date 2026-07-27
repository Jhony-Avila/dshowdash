import { TABLE_EVENTS } from "/core/runtime/events/catalog/table.events.js";
const VERSION = "1.1.0-P18EC";
const MODULE_ID = "table-engine:scroll";
const SCROLL_MODES = ["pagination", "virtual", "infinite"];
const ROW_HEIGHTS = { compact: 36, normal: 48, comfortable: 56 };
const VIRTUAL_BUFFER = 10;
const INFINITE_THRESHOLD = 200;
const ScrollMixin = {
  // @ts-expect-error strict migration — TS2339, TS2551
  _initScroll() {
    this._rafId = null;
    this._scrollMode = "pagination";
    this._virtualStart = 0;
    this._virtualEnd = 50;
    this._scrollTop = 0;
    this._infiniteLoading = false;
    this._infiniteHasMore = true;
  },
  _setScrollMode(mode) {
    if (!SCROLL_MODES.includes(mode)) return;
    this._scrollMode = mode;
    this.render?.();
    this.emit(TABLE_EVENTS.SCROLL_MODE_CHANGE, { mode });
  },
  _onScroll(e) {
    const p = this._cssPrefix;
    const container = e.target.closest(`.${p}table-container`);
    if (!container) return;
    container.classList.toggle(`${p}scrolled`, container.scrollTop > 0);
    if (this._scrollMode === "virtual") {
      this._scrollTop = container.scrollTop;
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => this._updateVirtualRows());
    }
    if (this._scrollMode === "infinite") {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < INFINITE_THRESHOLD) this._loadMoreInfinite();
    }
  },
  _setPage(page) {
    this._state.setPage(page);
    this._renderBody?.();
    this._renderFooter?.();
    this.emit(TABLE_EVENTS.PAGE, { page });
  },
  _getRowHeight() {
    const density = this._state.get("density") || "normal";
    return ROW_HEIGHTS[density] || ROW_HEIGHTS.normal;
  },
  _calculateVisibleRange() {
    const p = this._cssPrefix;
    const rowHeight = this._getRowHeight();
    const container = this._container.querySelector(`.${p}table-container`);
    if (!container) return { start: 0, end: 50 };
    const viewportHeight = container.clientHeight;
    const data = this._state.getFilteredData();
    const visibleCount = Math.ceil(viewportHeight / rowHeight);
    const start = Math.max(0, Math.floor(this._scrollTop / rowHeight) - VIRTUAL_BUFFER);
    const end = Math.min(data.length, start + visibleCount + VIRTUAL_BUFFER * 2);
    return { start, end };
  },
  _updateVirtualRows() {
    const { start, end } = this._calculateVisibleRange();
    if (start === this._virtualStart && end === this._virtualEnd) return;
    this._virtualStart = start;
    this._virtualEnd = end;
    const p = this._cssPrefix;
    const tbody = this._container.querySelector(`.${p}table tbody`);
    if (!tbody) return;
    const columns = this._getOrderedColumns?.() || [];
    const rowHeight = this._getRowHeight();
    const data = this._state.getFilteredData();
    const topSpacer = start * rowHeight;
    const bottomSpacer = Math.max(0, (data.length - end) * rowHeight);
    let topRow = tbody.querySelector(`.${p}virtual-spacer-top`);
    let bottomRow = tbody.querySelector(`.${p}virtual-spacer-bottom`);
    if (!topRow) {
      topRow = document.createElement("tr");
      topRow.className = `${p}virtual-spacer-top`;
      topRow.innerHTML = `<td colspan="${columns.length}"></td>`;
      tbody.insertBefore(topRow, tbody.firstChild);
    }
    topRow.style.height = `${topSpacer}px`;
    if (!bottomRow) {
      bottomRow = document.createElement("tr");
      bottomRow.className = `${p}virtual-spacer-bottom`;
      bottomRow.innerHTML = `<td colspan="${columns.length}"></td>`;
      tbody.appendChild(bottomRow);
    }
    bottomRow.style.height = `${bottomSpacer}px`;
    this._updateRowSelection?.();
    this._updateCheckboxes?.();
  },
  _loadMoreInfinite() {
    if (this._infiniteLoading || !this._infiniteHasMore) return;
    this._infiniteLoading = true;
    this._showInfiniteLoader(true);
    this.emit(TABLE_EVENTS.LOAD_MORE, { offset: this._state.getData().length, callback: (newData, hasMore) => this._onInfiniteDataLoaded(newData, hasMore) });
  },
  _onInfiniteDataLoaded(newData, hasMore = true) {
    this._infiniteLoading = false;
    this._infiniteHasMore = hasMore;
    this._showInfiniteLoader(false);
    if (!newData?.length) return;
    const currentData = this._state.getData();
    this._state.setData([...currentData, ...newData]);
    this.emit(TABLE_EVENTS.INFINITE_LOADED, { total: this._state.getData().length, hasMore });
  },
  _showInfiniteLoader(show) {
    const p = this._cssPrefix;
    let loader = this._container.querySelector(`.${p}infinite-loader`);
    if (show && !loader) {
      loader = document.createElement("div");
      loader.className = `${p}infinite-loader`;
      loader.innerHTML = `<span class="${p}infinite-spinner">\u27F3</span><span>Carregando mais...</span>`;
      this._container.querySelector(`.${p}table-container`)?.appendChild(loader);
    } else if (!show && loader) {
      loader.remove();
    }
  },
  appendData(newData, hasMore = true) {
    this._onInfiniteDataLoaded(newData, hasMore);
  },
  // @ts-expect-error strict migration — TS2339
  setHasMore(hasMore) {
    this._infiniteHasMore = hasMore;
  },
  setScrollMode(mode) {
    this._setScrollMode(mode);
  },
  // @ts-expect-error strict migration — TS2551
  getScrollMode() {
    return this._scrollMode;
  },
  // @ts-expect-error strict migration — TS2339
  _destroyScroll() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
};
var scroll_default = ScrollMixin;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
export {
  MODULE_ID,
  ScrollMixin,
  VERSION,
  scroll_default as default,
  healthCheck,
  info
};
