const VERSION = "2.1.0-P2-ENTERPRISE";
const MODULE_ID = "main-getters-api";
let _metrics = {
  stateGets: 0,
  lifecycleCalls: 0,
  controllerGets: 0,
  actionDispatches: 0,
  errors: 0
};
function getState(state) {
  _metrics.stateGets++;
  return state.engine?.getState?.() || { initialized: false };
}
function lifecycle(state) {
  _metrics.lifecycleCalls++;
  return state.engine?.lifecycle?.() || null;
}
function getManifestController(state) {
  _metrics.controllerGets++;
  return state.engine?.getManifestController?.() || null;
}
function getLayoutController(state) {
  _metrics.controllerGets++;
  return state.engine?.getLayoutController?.() || null;
}
function getCanvasController(state) {
  _metrics.controllerGets++;
  return state.engine?.getCanvasController?.() || null;
}
function getTimelineController(state) {
  _metrics.controllerGets++;
  return state.engine?.getTimelineController?.() || null;
}
function getOrchestratorController(state) {
  _metrics.controllerGets++;
  return state.engine?.getOrchestratorController?.() || null;
}
function getGlobalStateV2(state) {
  _metrics.controllerGets++;
  return state.engine?.getGlobalStateV2?.() || null;
}
function getContainerAdapter(state) {
  _metrics.controllerGets++;
  return state.containerAdapter;
}
function getMultiContainerOrchestrator(state) {
  _metrics.controllerGets++;
  return state.engine?.getMultiContainerOrchestrator?.() || null;
}
function getActionHub(state) {
  _metrics.controllerGets++;
  return state.actionHub;
}
function getPrimaryContainer(state) {
  _metrics.controllerGets++;
  return state.primaryContainer;
}
function clearPrimaryPlaceholder(state) {
  const contentEl = state.primaryContainer?.contentEl;
  if (contentEl) {
    const placeholder = contentEl.querySelector('[data-placeholder="true"]');
    if (placeholder) placeholder.remove();
  }
}
function dispatchAction(state, action) {
  if (!state.actionHub) {
    _metrics.errors++;
    throw new Error("ActionHub not initialized");
  }
  _metrics.actionDispatches++;
  state.globalMetrics.lastActivity = Date.now();
  return state.actionHub.dispatch(action);
}
function getActionHistory(state) {
  return state.actionHub?.getHistory?.() || [];
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
  return {
    status: _metrics.errors === 0 ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      totalGets: _metrics.stateGets + _metrics.controllerGets,
      actionDispatches: _metrics.actionDispatches,
      errors: _metrics.errors
    },
    metrics: getMetrics()
  };
}
var getters_default = {
  getState,
  lifecycle,
  getManifestController,
  getLayoutController,
  getCanvasController,
  getTimelineController,
  getOrchestratorController,
  getGlobalStateV2,
  getContainerAdapter,
  getMultiContainerOrchestrator,
  getActionHub,
  getPrimaryContainer,
  clearPrimaryPlaceholder,
  dispatchAction,
  getActionHistory,
  getMetrics,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  clearPrimaryPlaceholder,
  getters_default as default,
  dispatchAction,
  getActionHistory,
  getActionHub,
  getCanvasController,
  getContainerAdapter,
  getGlobalStateV2,
  getLayoutController,
  getManifestController,
  getMetrics,
  getMultiContainerOrchestrator,
  getOrchestratorController,
  getPrimaryContainer,
  getState,
  getTimelineController,
  healthCheck,
  info,
  lifecycle
};
