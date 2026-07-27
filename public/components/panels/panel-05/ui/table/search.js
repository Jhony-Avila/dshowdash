import { TABLE_COLUMNS, SEARCH_DEBOUNCE } from "./constants.js";
import { TABLE_EVENTS } from "/core/runtime/events/catalog/table.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:table:search";
const SearchMixin = {
  _initSearch() {
    this._searchDebounceTimer = null;
  },
  _handleSearchInput(value) {
    if (this._searchDebounceTimer) {
      clearTimeout(this._searchDebounceTimer);
    }
    this._searchDebounceTimer = setTimeout(() => {
      this._state.searchQuery = value.trim().toLowerCase();
      this._applySearch();
    }, SEARCH_DEBOUNCE);
  },
  _applySearch() {
    if (!this._state.searchQuery) {
      this._state.filteredData = [...this._state.data];
    } else {
      const searchableCols = TABLE_COLUMNS.filter((c) => c.searchable).map((c) => c.id);
      this._state.filteredData = this._state.data.filter((item) => searchableCols.some((colId) => {
        const val = item[colId];
        if (!val) return false;
        return String(val).toLowerCase().includes(this._state.searchQuery);
      }));
    }
    this._state.page = 1;
    this._updateTableBody();
    this._updateSearchInfo();
    this._updateFooter();
    this.emit(TABLE_EVENTS.SEARCH, {
      // @ts-expect-error strict migration — TS2339
      query: this._state.searchQuery,
      // @ts-expect-error strict migration — TS2339
      results: this._state.filteredData.length
    });
  },
  _clearSearch() {
    this._state.searchQuery = "";
    const input = this._container.querySelector(".p05-search-input");
    if (input) input.value = "";
    this._applySearch();
  },
  _updateSearchInfo() {
    const info2 = this._container.querySelector(".p05-search-info");
    if (info2) {
      if (this._state.searchQuery) {
        info2.textContent = `${this._state.filteredData.length} de ${this._state.data.length}`;
        info2.classList.add("p05-active");
      } else {
        info2.textContent = "";
        info2.classList.remove("p05-active");
      }
    }
  },
  _destroySearch() {
    if (this._searchDebounceTimer) {
      clearTimeout(this._searchDebounceTimer);
      this._searchDebounceTimer = null;
    }
  },
  search(query) {
    this._state.searchQuery = String(query || "").trim().toLowerCase();
    const input = this._container.querySelector(".p05-search-input");
    if (input) input.value = query || "";
    this._applySearch();
  }
};
var search_default = SearchMixin;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { searchReady: true } };
}
export {
  MODULE_ID,
  SearchMixin,
  VERSION,
  search_default as default,
  healthCheck,
  info
};
