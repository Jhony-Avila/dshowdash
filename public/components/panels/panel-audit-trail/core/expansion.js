import * as Renderer from "../ui/renderer.js";
import * as Store from "../state/store.js";
import { localState as _localState } from "./state.js";
const localState = _localState;
function handleToggleExpand(logId) {
  const isExpanded = localState.expandedIds.has(String(logId));
  if (isExpanded) localState.expandedIds.delete(String(logId));
  else localState.expandedIds.add(String(logId));
  Renderer.toggleRowExpanded(logId, !isExpanded);
}
function handleGroupBy(groupKey, onStateChange) {
  localState.groupBy = groupKey || "";
  localState.collapsedGroups.clear();
  Store.dispatch({ type: "SET_GROUP_BY", payload: localState.groupBy });
  onStateChange?.(Store.getState());
  if (localState.groupBy) Renderer.toast(`Agrupado por: ${groupKey}`, "info");
}
function handleToggleGroup(groupId) {
  if (localState.collapsedGroups.has(groupId)) {
    localState.collapsedGroups.delete(groupId);
  } else {
    localState.collapsedGroups.add(groupId);
  }
  Renderer.toggleGroupCollapsed(groupId, localState.collapsedGroups.has(groupId));
}
var expansion_default = { handleToggleExpand, handleGroupBy, handleToggleGroup };
const MODULE_ID = "panels-panel-audit-trail-core-expansion";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { expansionReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  expansion_default as default,
  handleGroupBy,
  handleToggleExpand,
  handleToggleGroup,
  healthCheck,
  info
};
