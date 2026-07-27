import * as Renderer from "../ui/renderer.js";
import { localState } from "./state.js";
import { getCurrentLogs } from "./helpers.js";
function handleSelectAll(checked, state) {
  const logs = getCurrentLogs(state);
  localState.selectedIds.clear();
  if (checked && logs) {
    logs.forEach((log) => localState.selectedIds.add(String(log.id)));
  }
  Renderer.setAllRowsSelected(checked);
  Renderer.setSelectedCount(localState.selectedIds.size);
}
function handleRowSelect(logId, checked) {
  if (checked) localState.selectedIds.add(String(logId));
  else localState.selectedIds.delete(String(logId));
  Renderer.setRowSelected(logId, checked);
  Renderer.setSelectedCount(localState.selectedIds.size);
}
function handleRowToggleSelect(logId) {
  handleRowSelect(logId, !localState.selectedIds.has(String(logId)));
}
function handleClearSelection() {
  localState.selectedIds.clear();
  Renderer.setAllRowsSelected(false);
  Renderer.setSelectedCount(0);
}
function updateSelectAllState(state) {
  const logs = getCurrentLogs(state);
  const allSelected = logs?.length > 0 && logs.every((l) => localState.selectedIds.has(String(l.id)));
  Renderer.updateSelectAllState(allSelected, localState.selectedIds.size > 0);
}
var selection_default = { handleSelectAll, handleRowSelect, handleRowToggleSelect, handleClearSelection, updateSelectAllState };
const MODULE_ID = "panels-panel-audit-trail-core-selection";
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
  handleClearSelection,
  handleRowSelect,
  handleRowToggleSelect,
  handleSelectAll,
  healthCheck,
  info,
  updateSelectAllState
};
