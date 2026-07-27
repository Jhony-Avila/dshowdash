import { SCROLL_MODES, ROW_HEIGHTS, VIRTUAL_BUFFER, INFINITE_THRESHOLD, ICONS } from "./constants.js";
import { TABLE_EVENTS, TABLE_INTENTS } from "/core/runtime/events/catalog/table.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:table:scroll";
const ScrollMixin = {
  _initScroll() {
    this._rafId = null;
  },
  _setScrollMode(mode) {
    if (!SCROLL_MODES.includes(mode)) return;
    this._state.setScrollMode(mode);
    this._state.shellRendered = false;
    this.render();
    this.emit(TABLE_EVENTS.SCROLL_MODE_CHANGE, { mode });
  },
  _onScroll(e) {
    const container = e.target.closest(".p05-table-container");
    if (!container) return;
    container.classList.toggle("p05-scrolled", container.scrollTop > 0);
    if (this._state.scrollMode === "virtual") {
      this._state.scrollTop = container.scrollTop;
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => this._updateVirtualRows());
    }
    if (this._state.scrollMode === "infinite") {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < INFINITE_THRESHOLD) {
        this._loadMoreInfinite();
      }
    }
  },
  _setPage(page) {
    this._state.setPage(page);
    this._updateTableBody();
    this._updateFooter();
    this.emit(TABLE_EVENTS.PAGE_CHANGE, { page });
  },
  // @ts-expect-error strict migration — TS7023
  _getRowHeight() {
    return ROW_HEIGHTS[this._state.density] || ROW_HEIGHTS.comfortable;
  },
  _calculateVisibleRange() {
    const rowHeight = this._getRowHeight();
    const container = this._container.querySelector(".p05-table-container");
    if (!container) return { start: 0, end: 50 };
    this._state.viewportHeight = container.clientHeight;
    const data = this._state.getDisplayData();
    const visibleCount = Math.ceil(this._state.viewportHeight / rowHeight);
    const start = Math.max(0, Math.floor(this._state.scrollTop / rowHeight) - VIRTUAL_BUFFER);
    const end = Math.min(data.length, start + visibleCount + VIRTUAL_BUFFER * 2);
    return { start, end };
  },
  _updateVirtualRows() {
    const { start, end } = this._calculateVisibleRange();
    if (start === this._state.virtualStart && end === this._state.virtualEnd) return;
    this._state.virtualStart = start;
    this._state.virtualEnd = end;
    const tbody = this._state.refs.tbody || this._container.querySelector(".p05-table tbody");
    if (!tbody) return;
    const orderedCols = this._getOrderedColumns();
    const rowHeight = this._getRowHeight();
    const data = this._state.getDisplayData();
    const topSpacer = start * rowHeight;
    const bottomSpacer = Math.max(0, (data.length - end) * rowHeight);
    const visibleData = data.slice(start, end);
    let topRow = tbody.querySelector(".p05-virtual-spacer-top");
    let bottomRow = tbody.querySelector(".p05-virtual-spacer-bottom");
    if (!topRow) {
      topRow = document.createElement("tr");
      topRow.className = "p05-virtual-spacer-top";
      topRow.innerHTML = `<td colspan="${orderedCols.length}"></td>`;
      tbody.insertBefore(topRow, tbody.firstChild);
    }
    topRow.style.height = `${topSpacer}px`;
    if (!bottomRow) {
      bottomRow = document.createElement("tr");
      bottomRow.className = "p05-virtual-spacer-bottom";
      bottomRow.innerHTML = `<td colspan="${orderedCols.length}"></td>`;
      tbody.appendChild(bottomRow);
    }
    bottomRow.style.height = `${bottomSpacer}px`;
    this._diffUpdateRows(tbody, visibleData, start, orderedCols, topRow, bottomRow);
    this._updateRowSelection();
    this._updateCheckboxes();
  },
  _loadMoreInfinite() {
    if (this._state.infiniteLoading || !this._state.infiniteHasMore) return;
    this._state.infiniteLoading = true;
    this._showInfiniteLoader(true);
    this.emit(TABLE_INTENTS.LOAD_MORE, {
      // @ts-expect-error strict migration — TS2339
      offset: this._state.infiniteLoadedCount,
      // @ts-expect-error strict migration — TS2339
      limit: this._state.infiniteChunkSize,
      callback: (newData, hasMore) => this._onInfiniteDataLoaded(newData, hasMore)
    });
  },
  _onInfiniteDataLoaded(newData, hasMore = true) {
    this._state.infiniteLoading = false;
    this._state.infiniteHasMore = hasMore;
    this._showInfiniteLoader(false);
    if (!newData?.length) return;
    this._state.data = [...this._state.data, ...newData];
    this._state.filteredData = [...this._state.filteredData, ...newData];
    this._state.infiniteLoadedCount = this._state.data.length;
    this._appendInfiniteRows(newData);
    this.emit(TABLE_EVENTS.INFINITE_LOADED, {
      // @ts-expect-error strict migration — TS2339
      total: this._state.data.length,
      hasMore
    });
  },
  _appendInfiniteRows(newData) {
    const tbody = this._state.refs.tbody || this._container.querySelector(".p05-table tbody");
    if (!tbody) return;
    const orderedCols = this._getOrderedColumns();
    const startIdx = this._state.getDisplayData().length - newData.length;
    const fragment = document.createDocumentFragment();
    newData.forEach((item, i) => {
      fragment.appendChild(this._createRowElement(item, startIdx + i, orderedCols));
    });
    tbody.appendChild(fragment);
    this._updateInfiniteInfo();
  },
  _showInfiniteLoader(show) {
    let loader = this._container.querySelector(".p05-infinite-loader");
    if (show && !loader) {
      loader = document.createElement("div");
      loader.className = "p05-infinite-loader";
      loader.innerHTML = `<span class="p05-infinite-spinner">${ICONS.loader}</span><span>Carregando mais...</span>`;
      this._container.querySelector(".p05-table-container")?.appendChild(loader);
    } else if (!show && loader) {
      loader.remove();
    }
  },
  _updateInfiniteInfo() {
    const info2 = this._container.querySelector(".p05-infinite-info");
    if (info2) {
      const data = this._state.getDisplayData();
      info2.textContent = `${data.length} registros carregados${this._state.infiniteHasMore ? "" : " (todos)"}`;
    }
  },
  appendData(newData, hasMore = true) {
    this._onInfiniteDataLoaded(newData, hasMore);
  },
  setHasMore(hasMore) {
    this._state.infiniteHasMore = hasMore;
    this._updateInfiniteInfo();
  },
  setScrollMode(mode) {
    this._setScrollMode(mode);
  },
  getScrollMode() {
    return this._state.scrollMode;
  },
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
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { scrollReady: true } };
}
export {
  MODULE_ID,
  ScrollMixin,
  VERSION,
  scroll_default as default,
  healthCheck,
  info
};
