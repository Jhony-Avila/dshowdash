import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
import * as Store from "../state/store.js";
import tracker from "../telemetry/tracker.js";
import { localState } from "./state.js";
function selectRow(token, onStateChange) {
  localState.selectedIds.add(token);
  onStateChange?.(Store.getState());
}
function deselectRow(token, onStateChange) {
  localState.selectedIds.delete(token);
  onStateChange?.(Store.getState());
}
function toggleRowSelection(token, onStateChange) {
  if (localState.selectedIds.has(token)) {
    localState.selectedIds.delete(token);
  } else {
    localState.selectedIds.add(token);
  }
  onStateChange?.(Store.getState());
  tracker.selectionChanged(localState.selectedIds.size);
}
function selectAll(onStateChange) {
  Store.getFilteredSessions().forEach((s) => {
    if (!s.is_current) localState.selectedIds.add(String(s.session_token || s.id));
  });
  onStateChange?.(Store.getState());
  tracker.selectionChanged(localState.selectedIds.size);
}
function deselectAll(onStateChange) {
  localState.selectedIds.clear();
  onStateChange?.(Store.getState());
  tracker.selectionChanged(0);
}
function getSelectedCount() {
  return localState.selectedIds.size;
}
function toggleRowExpansion(token, onStateChange) {
  if (localState.expandedIds.has(token)) {
    localState.expandedIds.delete(token);
  } else {
    localState.expandedIds.add(token);
  }
  onStateChange?.(Store.getState());
  tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: "row:expand", token: token?.slice(0, 8), expanded: localState.expandedIds.has(token) });
}
var selection_default = { selectRow, deselectRow, toggleRowSelection, selectAll, deselectAll, getSelectedCount, toggleRowExpansion };
const MODULE_ID = "panels-panel-session-admin-core-selection";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { selectionReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  selection_default as default,
  deselectAll,
  deselectRow,
  getSelectedCount,
  healthCheck,
  info,
  selectAll,
  selectRow,
  toggleRowExpansion,
  toggleRowSelection
};
