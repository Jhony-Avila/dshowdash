import { PERMISSIONS_EVENTS } from "/core/runtime/events/catalog/permissions.events.js";
import { Api } from "../api/client.js";
import { Telemetry } from "../telemetry/tracker.js";
import { emit, showToast } from "./ports.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-controller:bulk-operations";
const SVGS = { warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' };
function toggleBulkMode(store) {
  store.toggleBulkMode();
  Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "bulk:mode:toggle", enabled: store.isBulkMode() });
}
function toggleBulkItem(store, triggerId) {
  store.toggleBulkItem(triggerId);
}
function selectAllInArea(store, area) {
  const triggers = store.getTriggers().filter((t) => t.area === area);
  store.selectAllBulk(triggers.map((t) => t.id));
  Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "bulk:select-area", area, count: triggers.length });
}
function clearBulk(store) {
  store.clearBulk();
}
function bulkGrant(store, requestConfirmation) {
  const userId = store.getSelectedUserId();
  const count = store.getBulkCount();
  if (!userId || count === 0) return Promise.resolve();
  return requestConfirmation({ title: "Liberar Triggers em Massa", message: `Deseja liberar ${count} triggers para este usu\xE1rio?`, requireReason: false }).then((confirmed) => {
    if (!confirmed) return;
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "bulk:grant:start", userId, count });
    const selection = Array.from(store.getBulkSelection());
    return Api.bulkSetTriggers(userId, selection, true).then((res) => {
      if (res.success) {
        const granted = store.bulkGrant(userId);
        showToast("success", "Permiss\xF5es concedidas", `${granted} triggers liberados`);
        emit(PERMISSIONS_EVENTS.CHANGED, { userId, type: "bulk-grant", count: granted }, MODULE_ID);
        Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "bulk:grant:success", userId, count: granted });
      }
    });
  }).catch((error) => {
    showToast("error", "Erro", error.message);
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "bulk:grant:error", error: error.message });
  });
}
function bulkRevoke(store, requestConfirmation) {
  const userId = store.getSelectedUserId();
  const count = store.getBulkCount();
  if (!userId || count === 0) return Promise.resolve();
  return requestConfirmation({ title: "Revogar Triggers em Massa", message: `Deseja revogar ${count} triggers deste usu\xE1rio?`, requireReason: true }).then((confirmed) => {
    if (!confirmed) return;
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "bulk:revoke:start", userId, count, reason: confirmed.reason });
    const selection = Array.from(store.getBulkSelection());
    return Api.bulkSetTriggers(userId, selection, false).then((res) => {
      if (res.success) {
        const revoked = store.bulkRevoke(userId);
        showToast("success", "Permiss\xF5es revogadas", `${revoked} triggers removidos`);
        emit(PERMISSIONS_EVENTS.CHANGED, { userId, type: "bulk-revoke", count: revoked, reason: confirmed.reason }, MODULE_ID);
        Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "bulk:revoke:success", userId, count: revoked });
      }
    });
  }).catch((error) => {
    showToast("error", "Erro", error.message);
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "bulk:revoke:error", error: error.message });
  });
}
function grantAllTriggers(store, area, requestConfirmation) {
  const userId = store.getSelectedUserId();
  if (!userId) return Promise.resolve();
  const triggers = area ? store.getTriggers().filter((t) => t.area === area) : store.getTriggers();
  return requestConfirmation({ title: "Liberar Todos os Triggers", message: `Deseja liberar ${triggers.length} triggers${area ? ` da \xE1rea ${area}` : ""}?`, requireReason: false }).then((confirmed) => {
    if (!confirmed) return;
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "triggers:grant-all:start", userId, area, count: triggers.length });
    return Api.bulkSetTriggers(userId, triggers.map((t) => t.id), true).then((res) => {
      if (res.success) {
        const count = store.grantAllTriggers(userId);
        showToast("success", "Permiss\xF5es concedidas", `${count} triggers liberados`);
        emit(PERMISSIONS_EVENTS.CHANGED, { userId, type: "grant-all", count }, MODULE_ID);
      }
    });
  }).catch((error) => {
    showToast("error", "Erro", error.message);
  });
}
function revokeAllTriggers(store, area, requestConfirmation) {
  const userId = store.getSelectedUserId();
  if (!userId) return Promise.resolve();
  const triggers = area ? store.getTriggers().filter((t) => t.area === area) : store.getTriggers();
  return requestConfirmation({ title: `${SVGS.warning} Revogar Todos os Triggers`, message: `ATEN\xC7\xC3O: Esta a\xE7\xE3o ir\xE1 remover ${triggers.length} triggers${area ? ` da \xE1rea ${area}` : ""}. Esta \xE9 uma opera\xE7\xE3o cr\xEDtica.`, requireReason: true }).then((confirmed) => {
    if (!confirmed) return;
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "triggers:revoke-all:start", userId, area, reason: confirmed.reason });
    return Api.bulkSetTriggers(userId, triggers.map((t) => t.id), false).then((res) => {
      if (res.success) {
        const count = store.revokeAllTriggers(userId);
        showToast("success", "Permiss\xF5es revogadas", `${count} triggers removidos`);
        emit(PERMISSIONS_EVENTS.CHANGED, { userId, type: "revoke-all", count, reason: confirmed.reason }, MODULE_ID);
      }
    });
  }).catch((error) => {
    showToast("error", "Erro", error.message);
  });
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { apiAvailable: typeof Api !== "undefined", telemetryAvailable: typeof Telemetry !== "undefined" }, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true };
}
var bulk_operations_default = { toggleBulkMode, toggleBulkItem, selectAllInArea, clearBulk, bulkGrant, bulkRevoke, grantAllTriggers, revokeAllTriggers, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  bulkGrant,
  bulkRevoke,
  clearBulk,
  bulk_operations_default as default,
  grantAllTriggers,
  healthCheck,
  info,
  revokeAllTriggers,
  selectAllInArea,
  toggleBulkItem,
  toggleBulkMode
};
