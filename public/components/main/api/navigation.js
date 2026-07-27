const VERSION = "2.1.0-P2-ENTERPRISE";
const MODULE_ID = "main-navigation-api";
let _metrics = {
  navigations: 0,
  unmounts: 0,
  secondaryOpens: 0,
  secondaryCloses: 0,
  focusToggles: 0,
  snapshots: 0,
  restores: 0,
  errors: 0
};
async function navigate(state, circuitBreaker, route, options = {}) {
  if (!state.engine) throw new Error("Main not initialized");
  _metrics.navigations++;
  state.globalMetrics.lastActivity = Date.now();
  state.globalMetrics.navigationCount++;
  const panelId = typeof route === "string" ? route : route?.panelId;
  if (panelId && circuitBreaker.isOpen(panelId)) {
    _metrics.errors++;
    state.globalMetrics.circuitBreakerTrips++;
    state.eventBusAdapter?.emit?.("main:circuit-breaker-blocked", { panelId });
    throw new Error(`Circuit breaker open for panel: ${panelId}. Too many failures.`);
  }
  try {
    const result = await state.engine.navigate(route, options);
    if (panelId) circuitBreaker.reset(panelId);
    return result;
  } catch (error) {
    _metrics.errors++;
    state.globalMetrics.navigationErrors++;
    if (panelId) {
      const tripped = circuitBreaker.recordFailure(panelId);
      if (tripped) {
        state.globalMetrics.circuitBreakerTrips++;
        state.eventBusAdapter?.emit?.("main:circuit-breaker-tripped", { panelId, error: error.message });
      }
    }
    throw error;
  }
}
async function unmount(state) {
  if (!state.engine) return false;
  _metrics.unmounts++;
  state.globalMetrics.lastActivity = Date.now();
  return state.engine.unmount();
}
async function openSecondary(state, panelId, options = {}) {
  if (!state.engine) throw new Error("Main not initialized");
  _metrics.secondaryOpens++;
  state.globalMetrics.lastActivity = Date.now();
  return state.engine.openSecondary(panelId, options);
}
async function closeSecondary(state, containerId = null) {
  if (!state.engine) return false;
  _metrics.secondaryCloses++;
  state.globalMetrics.lastActivity = Date.now();
  return state.engine.closeSecondary(containerId);
}
function toggleContainerFocus(state, containerId) {
  if (!state.engine) return false;
  _metrics.focusToggles++;
  return state.engine.toggleContainerFocus(containerId);
}
function getContainerSnapshot(state) {
  _metrics.snapshots++;
  return state.engine?.getContainerSnapshot?.() || state.containerAdapter?.snapshot?.() || null;
}
async function restoreContainerSnapshot(state, snapshotData) {
  if (!state.engine) return false;
  _metrics.restores++;
  return state.engine.restoreContainerSnapshot(snapshotData);
}
function clearContainerSnapshot(state) {
  if (!state.engine) return false;
  return state.engine.clearContainerSnapshot();
}
function getCurrentLayout(state) {
  const orchestrator = state.engine?.getMultiContainerOrchestrator?.();
  return orchestrator?.getCurrentLayout?.() || "single";
}
function getActiveContainerIds(state) {
  const orchestrator = state.engine?.getMultiContainerOrchestrator?.();
  return orchestrator?.getActiveContainerIds?.() || [];
}
function getPrimaryContainerId(state) {
  const orchestrator = state.engine?.getMultiContainerOrchestrator?.();
  return orchestrator?.getPrimaryContainerId?.() || "primary";
}
function setContainerPolicy(state, policy) {
  return state.containerAdapter?.setPolicy?.(policy) || false;
}
function getContainerPolicy(state) {
  return state.containerAdapter?.getPolicy?.() || "ephemeral";
}
function listContainers(state) {
  return state.containerAdapter?.list?.() || [];
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    metrics: getMetrics()
  };
}
function healthCheck() {
  const errorRate = _metrics.navigations > 0 ? _metrics.errors / _metrics.navigations * 100 : 0;
  let status = "HEALTHY";
  if (errorRate > 30) status = "DEGRADED";
  if (errorRate > 50) status = "UNHEALTHY";
  return {
    status,
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      totalNavigations: _metrics.navigations,
      errorRate: `${Math.round(errorRate)}%`
    },
    metrics: getMetrics()
  };
}
var navigation_default = {
  navigate,
  unmount,
  openSecondary,
  closeSecondary,
  toggleContainerFocus,
  getContainerSnapshot,
  restoreContainerSnapshot,
  clearContainerSnapshot,
  getCurrentLayout,
  getActiveContainerIds,
  getPrimaryContainerId,
  setContainerPolicy,
  getContainerPolicy,
  listContainers,
  getMetrics,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  clearContainerSnapshot,
  closeSecondary,
  navigation_default as default,
  getActiveContainerIds,
  getContainerPolicy,
  getContainerSnapshot,
  getCurrentLayout,
  getMetrics,
  getPrimaryContainerId,
  healthCheck,
  info,
  listContainers,
  navigate,
  openSecondary,
  restoreContainerSnapshot,
  setContainerPolicy,
  toggleContainerFocus,
  unmount
};
