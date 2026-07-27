import * as Renderer from "../ui/renderer.js";
import * as Store from "../state/store.js";
import { localState } from "./state.js";
function handleColumnToggle(colKey, visible) {
  const state = Store.getState();
  const tab = state.activeTab;
  if (visible) {
    if (!localState.visibleColumns[tab].includes(colKey)) {
      localState.visibleColumns[tab].push(colKey);
    }
  } else {
    localState.visibleColumns[tab] = localState.visibleColumns[tab].filter((k) => k !== colKey);
  }
  Renderer.setColumnVisibility(colKey, visible);
}
function handleToggleInlineFilters() {
  localState.inlineFiltersActive = !localState.inlineFiltersActive;
  Renderer.setInlineFiltersActive(localState.inlineFiltersActive);
  Renderer.toast(localState.inlineFiltersActive ? "Filtros inline ativos" : "Filtros inline desativados", "info");
}
async function handleInlineFilter(col, value, loadData) {
  localState.inlineFilterValues[col] = value;
  Renderer.setInlineFilterValue(col, value);
  Store.dispatch({ type: "SET_FILTERS", payload: { [`inline_${col}`]: value } });
  await loadData?.();
}
var columns_default = { handleColumnToggle, handleToggleInlineFilters, handleInlineFilter };
const MODULE_ID = "panels-panel-audit-trail-core-columns";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { columnsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  columns_default as default,
  handleColumnToggle,
  handleInlineFilter,
  handleToggleInlineFilters,
  healthCheck,
  info
};
