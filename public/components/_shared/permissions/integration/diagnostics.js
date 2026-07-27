import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P2-ENTERPRISE";
const MODULE_ID = "components._shared.permissions.integration.diagnostics";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function healthCheck(version, moduleId, state, Permissions, Inventory) {
  const ps = Ports.snapshot();
  const engineHealth = Permissions.healthCheck();
  const inventoryStats = Inventory.getInventoryStats();
  const checks = {
    initialized: state.initialized,
    engineHealthy: engineHealth.status === "HEALTHY",
    apiConnected: state.apiConnected,
    hasUser: !!state.currentUserId && state.currentUserId !== "anonymous",
    portsInitialized: ps._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    version,
    moduleId,
    phase: state.apiConnected ? "api-connected" : "allow-all",
    checks,
    currentUser: state.currentUserId,
    engine: engineHealth,
    inventory: inventoryStats,
    integrationStats: Object.assign({}, state.stats),
    cachedPermissions: {
      triggers: Object.keys(state.userPermissions.triggers).length,
      regions: Object.keys(state.userPermissions.regions).length
    },
    eventBusConnected: !!_getPort("eventBus"),
    globallyExposed: typeof window !== "undefined" && !!window.Permissions,
    readyFlagsUsed: state.readyFlagsUsed,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}
function info(version, moduleId, state, Permissions, Inventory) {
  return {
    version,
    moduleId,
    phase: state.apiConnected ? "api-connected (Fase 6)" : "allow-all (Fase 2)",
    initialized: state.initialized,
    registeredAt: state.registeredAt,
    currentUser: state.currentUserId,
    apiConnected: state.apiConnected,
    mode: Permissions.getMode(),
    readyFlagsUsed: state.readyFlagsUsed,
    stats: Object.assign({}, state.stats, Permissions.getStats()),
    cachedPermissions: {
      triggers: Object.keys(state.userPermissions.triggers).length,
      regions: Object.keys(state.userPermissions.regions).length
    },
    regions: Permissions.getAllRegions().length,
    triggers: Permissions.getAllTriggers().length,
    criticalTriggers: Inventory.getCriticalTriggers().length,
    timestamp: Date.now()
  };
}
var diagnostics_default = { VERSION, MODULE_ID, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  diagnostics_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
