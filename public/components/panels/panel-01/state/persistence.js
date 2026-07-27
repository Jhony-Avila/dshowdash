import { CONFIG } from "../core/config.js";
import { store } from "./store.js";
import * as Storage from "../utils/storage.js";
import * as UrlState from "../utils/url-state.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:state:persistence";
function saveState() {
  const state = store.getState();
  Storage.setFilters(state.filters);
  Storage.setSort(state.sort);
  if (CONFIG.features.urlState) {
    UrlState.setState({
      ...state.filters,
      page: state.pagination.page,
      sort: state.sort.field,
      order: state.sort.order
    });
  }
}
function restoreState() {
  if (CONFIG.features.urlState) {
    const urlState = UrlState.getState();
    if (Object.keys(urlState).length > 0) {
      if (urlState.page) store.setPage(urlState.page);
      if (urlState.sortField) store.setSort(urlState.sortField, urlState.sortOrder || "DESC");
      ["situacao", "centro", "q", "dataInicio", "dataFim"].forEach((key) => {
        if (urlState[key]) store.setFilter(key, urlState[key]);
      });
      return;
    }
  }
  if (CONFIG.features.localStorage) {
    const savedFilters = Storage.getFilters();
    const savedSort = Storage.getSort();
    Object.entries(savedFilters).forEach(([k, v]) => store.setFilter(k, v));
    if (savedSort.field) store.setSort(savedSort.field, savedSort.order);
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var persistence_default = { saveState, restoreState, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  persistence_default as default,
  info,
  restoreState,
  saveState
};
