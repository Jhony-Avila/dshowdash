import { TABLE_EVENTS } from "/core/runtime/events/catalog/table.events.js";
const VERSION = "1.1.0-P18EC";
const MODULE_ID = "table-engine:search";
const SEARCH_DEBOUNCE = 300;
const SearchMixin = {
  // @ts-expect-error strict migration — TS2339
  _initSearch() {
    this._searchDebounceTimer = null;
  },
  _handleSearchInput(value) {
    if (this._searchDebounceTimer) clearTimeout(this._searchDebounceTimer);
    this._searchDebounceTimer = setTimeout(() => {
      this._state.setSearch(value.trim().toLowerCase());
      this._applySearch();
    }, SEARCH_DEBOUNCE);
  },
  _applySearch() {
    const query = this._state.get("search");
    const data = this._state.getData();
    const columns = this._state.get("columns") || [];
    const searchableCols = columns.filter((c) => c.searchable !== false).map((c) => c.id);
    if (!query) {
      this._state.set("filteredData", [...data]);
    } else {
      const filtered = data.filter((item) => searchableCols.some((colId) => {
        const val = item[colId];
        if (!val) return false;
        return String(val).toLowerCase().includes(query);
      }));
      this._state.set("filteredData", filtered);
    }
    this._state.setPage(1);
    this._renderBody?.();
    this._updateSearchInfo();
    this._renderFooter?.();
    this.emit(TABLE_EVENTS.FILTERED, { query, results: this._state.getFilteredData().length });
  },
  _clearSearch() {
    this._state.setSearch("");
    const p = this._cssPrefix;
    const input = this._container.querySelector(`.${p}search-input`);
    if (input) input.value = "";
    this._applySearch();
  },
  _updateSearchInfo() {
    const p = this._cssPrefix;
    const info2 = this._container.querySelector(`.${p}search-info`);
    if (info2) {
      const query = this._state.get("search");
      if (query) {
        info2.textContent = `${this._state.getFilteredData().length} de ${this._state.getData().length}`;
        info2.classList.add(`${p}active`);
      } else {
        info2.textContent = "";
        info2.classList.remove(`${p}active`);
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
    this._state.setSearch(String(query || "").trim().toLowerCase());
    const p = this._cssPrefix;
    const input = this._container.querySelector(`.${p}search-input`);
    if (input) input.value = query || "";
    this._applySearch();
  }
};
var search_default = SearchMixin;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
export {
  MODULE_ID,
  SearchMixin,
  VERSION,
  search_default as default,
  healthCheck,
  info
};
