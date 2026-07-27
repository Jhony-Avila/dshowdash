import { _getState, notify, getUserPermissions, setUserPermissions } from "./core.js";
import { saveCurrentToHistory } from "./history.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-bulk";
function getBulkSelection() {
  const sel = _getState().bulkSelection;
  const result = /* @__PURE__ */ new Set();
  sel.forEach((v) => result.add(v));
  return result;
}
function getBulkCount() {
  return _getState().bulkSelection.size;
}
function isBulkMode() {
  return _getState().bulkMode;
}
function setBulkMode(enabled) {
  const state = _getState();
  state.bulkMode = !!enabled;
  if (!enabled) state.bulkSelection.clear();
  notify("bulk");
}
function toggleBulkMode() {
  setBulkMode(!isBulkMode());
}
function addToBulk(triggerId) {
  _getState().bulkSelection.add(triggerId);
  notify("bulk");
}
function removeFromBulk(triggerId) {
  _getState().bulkSelection.delete(triggerId);
  notify("bulk");
}
function toggleBulkItem(triggerId) {
  const selection = _getState().bulkSelection;
  if (selection.has(triggerId)) selection.delete(triggerId);
  else selection.add(triggerId);
  notify("bulk");
}
function selectAllBulk(triggerIds) {
  const selection = _getState().bulkSelection;
  triggerIds.forEach((id) => selection.add(id));
  notify("bulk");
}
function clearBulk() {
  _getState().bulkSelection.clear();
  notify("bulk");
}
function bulkGrant(userId) {
  const state = _getState();
  if (!userId || state.bulkSelection.size === 0) return 0;
  saveCurrentToHistory("bulk-grant", userId);
  const perms = getUserPermissions(userId);
  let count = 0;
  state.bulkSelection.forEach((triggerId) => {
    if (perms.triggers.indexOf(triggerId) === -1) {
      perms.triggers.push(triggerId);
      count++;
    }
  });
  setUserPermissions(userId, perms);
  clearBulk();
  return count;
}
function bulkRevoke(userId) {
  const state = _getState();
  if (!userId || state.bulkSelection.size === 0) return 0;
  saveCurrentToHistory("bulk-revoke", userId);
  const perms = getUserPermissions(userId);
  const bulkSet = state.bulkSelection;
  const before = perms.triggers.length;
  perms.triggers = perms.triggers.filter((t) => !bulkSet.has(t));
  setUserPermissions(userId, perms);
  clearBulk();
  return before - perms.triggers.length;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { bulkSelectionReady: !!_getState().bulkSelection } };
}
export {
  MODULE_ID,
  VERSION,
  addToBulk,
  bulkGrant,
  bulkRevoke,
  clearBulk,
  getBulkCount,
  getBulkSelection,
  healthCheck,
  info,
  isBulkMode,
  removeFromBulk,
  selectAllBulk,
  setBulkMode,
  toggleBulkItem,
  toggleBulkMode
};
