import { _getState, getUserPermissions, setUserPermissions } from "./core.js";
import { saveCurrentToHistory } from "./history.js";
import { saveToCache } from "./cache.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-permissions";
function addTriggerPermission(userId, triggerId) {
  saveCurrentToHistory("add-trigger", userId);
  const perms = getUserPermissions(userId);
  if (perms.triggers.indexOf(triggerId) === -1) {
    perms.triggers.push(triggerId);
    setUserPermissions(userId, perms);
    saveToCache();
  }
}
function removeTriggerPermission(userId, triggerId) {
  saveCurrentToHistory("remove-trigger", userId);
  const perms = getUserPermissions(userId);
  perms.triggers = perms.triggers.filter((t) => t !== triggerId);
  setUserPermissions(userId, perms);
  saveToCache();
}
function toggleTriggerPermission(userId, triggerId) {
  const perms = getUserPermissions(userId);
  if (perms.triggers.indexOf(triggerId) !== -1) {
    removeTriggerPermission(userId, triggerId);
    return false;
  } else {
    addTriggerPermission(userId, triggerId);
    return true;
  }
}
function addRegionPermission(userId, regionId) {
  saveCurrentToHistory("add-region", userId);
  const perms = getUserPermissions(userId);
  if (perms.regions.indexOf(regionId) === -1) {
    perms.regions.push(regionId);
    setUserPermissions(userId, perms);
    saveToCache();
  }
}
function removeRegionPermission(userId, regionId) {
  saveCurrentToHistory("remove-region", userId);
  const perms = getUserPermissions(userId);
  perms.regions = perms.regions.filter((r) => r !== regionId);
  setUserPermissions(userId, perms);
  saveToCache();
}
function toggleRegionPermission(userId, regionId) {
  const perms = getUserPermissions(userId);
  if (perms.regions.indexOf(regionId) !== -1) {
    removeRegionPermission(userId, regionId);
    return false;
  } else {
    addRegionPermission(userId, regionId);
    return true;
  }
}
function grantAllTriggers(userId) {
  if (!userId) return 0;
  saveCurrentToHistory("grant-all", userId);
  const state = _getState();
  const perms = getUserPermissions(userId);
  const allTriggerIds = state.triggers.map((t) => t.id);
  const before = perms.triggers.length;
  const merged = {};
  perms.triggers.forEach((t) => {
    merged[t] = true;
  });
  allTriggerIds.forEach((t) => {
    merged[t] = true;
  });
  perms.triggers = Object.keys(merged);
  setUserPermissions(userId, perms);
  saveToCache();
  return perms.triggers.length - before;
}
function revokeAllTriggers(userId) {
  if (!userId) return 0;
  saveCurrentToHistory("revoke-all", userId);
  const perms = getUserPermissions(userId);
  const count = perms.triggers.length;
  perms.triggers = [];
  setUserPermissions(userId, perms);
  saveToCache();
  return count;
}
function clonePermissions(fromUserId, toUserId) {
  if (!fromUserId || !toUserId || fromUserId === toUserId) return false;
  const perms = getUserPermissions(fromUserId);
  setUserPermissions(toUserId, { triggers: perms.triggers.slice(), regions: perms.regions.slice() });
  saveToCache();
  return true;
}
const SENSITIVE_TRIGGERS = ["admin-panel", "system-config", "user-delete", "role-admin", "database-access", "api-keys", "security-settings", "audit-logs"];
function isSensitiveTrigger(triggerId) {
  for (let i = 0; i < SENSITIVE_TRIGGERS.length; i++) {
    if (triggerId.toLowerCase().indexOf(SENSITIVE_TRIGGERS[i].toLowerCase()) !== -1) return true;
  }
  return false;
}
function getSensitiveTriggers() {
  return _getState().triggers.filter((t) => isSensitiveTrigger(t.id));
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { permissionsReady: typeof addTriggerPermission === "function" } };
}
export {
  MODULE_ID,
  VERSION,
  addRegionPermission,
  addTriggerPermission,
  clonePermissions,
  getSensitiveTriggers,
  grantAllTriggers,
  healthCheck,
  info,
  isSensitiveTrigger,
  removeRegionPermission,
  removeTriggerPermission,
  revokeAllTriggers,
  toggleRegionPermission,
  toggleTriggerPermission
};
