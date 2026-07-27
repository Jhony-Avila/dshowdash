const MODULE_ID = "components._shared.permissions.integration.global-expose";
const VERSION = "1.0.0-P2-ENTERPRISE";
function exposeGlobally(VERSION2, MODULE_ID2, state, Permissions, Inventory, api, diagnostics, init, syncPermissions, log) {
  window.Permissions = {
    can: api.can,
    canTrigger: api.canTrigger,
    canAccessRegion: api.canAccessRegion,
    checkMultiple: api.checkMultiple,
    setCurrentUser: api.setCurrentUser,
    getCurrentUser: api.getCurrentUser,
    syncPermissions,
    isApiConnected() {
      return state.apiConnected;
    },
    getUserPermissions() {
      return Object.assign({}, state.userPermissions);
    },
    getRegion: Permissions.getRegion,
    getTrigger: Permissions.getTrigger,
    getAllRegions: Permissions.getAllRegions,
    getAllTriggers: Permissions.getAllTriggers,
    getMode: Permissions.getMode,
    setMode: Permissions.setMode,
    setDebug: Permissions.setDebug,
    healthCheck: diagnostics.healthCheck,
    info: diagnostics.info,
    getStats() {
      return Object.assign({}, state.stats, Permissions.getStats());
    },
    inventory: {
      getRegionById: Inventory.getRegionById,
      getTriggerById: Inventory.getTriggerById,
      getRegionsByType: Inventory.getRegionsByType,
      getTriggersByCategory: Inventory.getTriggersByCategory,
      getCriticalTriggers: Inventory.getCriticalTriggers,
      getInventoryStats: Inventory.getInventoryStats
    },
    ENTITY_TYPE: Permissions.ENTITY_TYPE,
    REGION_TYPE: Permissions.REGION_TYPE,
    TRIGGER_CATEGORY: Permissions.TRIGGER_CATEGORY,
    CRITICALITY: Permissions.CRITICALITY,
    PERMISSION_STATE: Permissions.PERMISSION_STATE,
    VERSION: VERSION2,
    MODULE_ID: MODULE_ID2
  };
  window.__dev = window.__dev || {};
  window.__dev.permissions = {
    engine: Permissions,
    inventory: Inventory,
    integration: {
      state() {
        return Object.assign({}, state);
      },
      init,
      healthCheck: diagnostics.healthCheck,
      info: diagnostics.info,
      syncPermissions
    }
  };
  if (log) log("global-exposed");
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function healthCheck() {
  return {
    status: typeof window !== "undefined" && !!window.Permissions ? "HEALTHY" : "NOT_EXPOSED",
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}
var global_expose_default = { MODULE_ID, VERSION, exposeGlobally, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  global_expose_default as default,
  exposeGlobally,
  healthCheck,
  info
};
