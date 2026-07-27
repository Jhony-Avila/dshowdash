import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
import * as Store from "../state/store.js";
import tracker from "../telemetry/tracker.js";
import { localState, DEFAULT_HIDDEN_COLS } from "./state.js";
function toggleColumn(col, visible, onStateChange) {
  if (visible) {
    localState.hiddenCols.delete(col);
  } else {
    localState.hiddenCols.add(col);
  }
  onStateChange?.(Store.getState());
  tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: "column:toggle", col, visible });
}
function showAllColumns(onStateChange) {
  localState.hiddenCols.clear();
  onStateChange?.(Store.getState());
  tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: "columns:show-all" });
}
function resetColumns(onStateChange) {
  localState.hiddenCols = new Set(DEFAULT_HIDDEN_COLS);
  onStateChange?.(Store.getState());
  tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: "columns:reset" });
}
var columns_default = { toggleColumn, showAllColumns, resetColumns };
const MODULE_ID = "panels-panel-session-admin-core-columns";
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
  healthCheck,
  info,
  resetColumns,
  showAllColumns,
  toggleColumn
};
