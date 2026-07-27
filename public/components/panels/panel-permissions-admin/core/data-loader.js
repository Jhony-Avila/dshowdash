import { Api } from "../api/client.js";
import { Telemetry } from "../telemetry/tracker.js";
import { emit, showToast } from "./ports.js";
import { UARPS_EVENTS } from "/core/runtime/events/catalog/uarps.events.js";
import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-controller:data-loader";
function loadInitialData(store) {
  store.setLoading(true);
  store.setError(null);
  return Promise.resolve().then(() => {
    Telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { phase: "start", moduleId: MODULE_ID });
    if (store.isCacheValid()) {
      Telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { phase: "from-cache", moduleId: MODULE_ID });
      const cached = store.loadFromCache();
      if (cached) {
        store.setUsers(cached.users || []);
        store.setTriggers(cached.triggers || []);
        store.setRegions(cached.regions || []);
        if (cached.permissions) {
          cached.permissions.forEach((item) => {
            store.setUserPermissions(item[0], item[1]);
          });
        }
        if (cached.users && cached.users.length > 0) {
          return selectUser(store, cached.users[0].id).then(() => {
            store.setLoading(false);
          });
        }
        store.setLoading(false);
        return;
      }
    }
    return Promise.all([Api.getUsers(), Api.getInventory()]).then((results) => {
      const usersRes = results[0];
      const inventoryRes = results[1];
      if (usersRes.success && usersRes.data) {
        store.setUsers(usersRes.data);
        if (usersRes.data.length > 0) {
          return selectUser(store, usersRes.data[0].id).then(() => inventoryRes);
        }
      }
      return inventoryRes;
    }).then((inventoryRes) => {
      if (inventoryRes && inventoryRes.success && inventoryRes.data) {
        store.setTriggers(inventoryRes.data.triggers || []);
        store.setRegions(inventoryRes.data.regions || []);
      }
      store.setLastSync(Date.now());
      store.saveToCache();
      Telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { moduleId: MODULE_ID, users: store.getUsers().length, triggers: store.getTriggers().length, regions: store.getRegions().length });
    });
  }).catch((error) => {
    store.setError(error.message);
    Telemetry.track(LIFECYCLE_EVENTS.DATA_ERROR, { moduleId: MODULE_ID, error: error.message });
    showToast("error", "Erro ao carregar dados", error.message);
  }).then(() => {
    store.setLoading(false);
  });
}
function selectUser(store, userId) {
  if (!userId) return Promise.resolve();
  const prevUserId = store.getSelectedUserId();
  if (String(prevUserId) === String(userId)) return Promise.resolve();
  store.setSelectedUser(userId);
  store.clearBulk();
  Telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { phase: "user:select", userId });
  return loadUserPermissions(store, userId).then(() => {
    emit(UARPS_EVENTS.USER_SELECTED, { userId }, MODULE_ID);
  });
}
function loadUserPermissions(store, userId) {
  return Api.getUserPermissions(userId).then((res) => {
    if (res.success && res.data) {
      store.setUserPermissions(userId, { triggers: res.data.triggers || [], regions: res.data.regions || [] });
    }
  }).catch((error) => {
    Telemetry.track(LIFECYCLE_EVENTS.DATA_ERROR, { phase: "permissions:load", userId, error: error.message });
  });
}
function refresh(store) {
  store.clearCache();
  return loadInitialData(store).then(() => {
    const userId = store.getSelectedUserId();
    if (userId) return loadUserPermissions(store, userId);
  });
}
function syncInventoryFromDOM(store) {
  Telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { phase: "inventory:sync:start", moduleId: MODULE_ID });
  return Api.syncInventory().then((res) => {
    if (res.success) {
      return Api.getInventory().then((inventoryRes) => {
        if (inventoryRes.success && inventoryRes.data) {
          store.setTriggers(inventoryRes.data.triggers || []);
          store.setRegions(inventoryRes.data.regions || []);
        }
        showToast("success", "Invent\xE1rio sincronizado", `${res.data && res.data.added ? res.data.added : 0} novos itens`);
        Telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { phase: "inventory:sync:success", moduleId: MODULE_ID, data: res.data });
      });
    }
  }).catch((error) => {
    showToast("error", "Erro na sincroniza\xE7\xE3o", error.message);
    Telemetry.track(LIFECYCLE_EVENTS.DATA_ERROR, { phase: "inventory:sync", moduleId: MODULE_ID, error: error.message });
  });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { loadInitialDataReady: typeof loadInitialData === "function" } };
}
var data_loader_default = { loadInitialData, selectUser, loadUserPermissions, refresh, syncInventoryFromDOM, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  data_loader_default as default,
  healthCheck,
  info,
  loadInitialData,
  loadUserPermissions,
  refresh,
  selectUser,
  syncInventoryFromDOM
};
