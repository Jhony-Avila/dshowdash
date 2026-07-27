import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { createCircuitBreaker } from "./core/circuit-breaker.js";
import { initializeMain } from "./core/initializer.js";
import { buildInfo, buildHealthCheck, buildMetrics } from "./core/diagnostics.js";
import { destroyMain } from "./core/lifecycle.js";
import * as navigationApi from "./api/navigation.js";
import * as gettersApi from "./api/getters.js";
import * as ContainerMainRCHandler from "/core/runtime/constants/container-main-handler.js";
const VERSION = "5.8.0-P2-ENTERPRISE";
const MODULE_ID = "main.index";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _state = { version: VERSION, engine: null, actionHub: null, initialized: false, context: null, eventBusAdapter: null, containerAdapter: null, containerPort: null, primaryContainer: null, initTimestamp: null, adapters: {}, ports: {}, globalMetrics: { initCount: 0, destroyCount: 0, navigationCount: 0, navigationErrors: 0, circuitBreakerTrips: 0, lastActivity: null }, runtimeContextSetup: false };
const _circuitBreaker = createCircuitBreaker({ threshold: 3, resetTimeout: 3e4 });
const init = (options = {}) => {
  if (_state.initialized && _state.engine) return Promise.resolve(_state.engine);
  _initPorts();
  _state.initTimestamp = Date.now();
  _state.globalMetrics.initCount++;
  return initializeMain(_state, options).then(() => {
    _state.initialized = true;
    _state.globalMetrics.lastActivity = Date.now();
    _state.eventBusAdapter?.emit?.(MAIN_EVENTS.INITIALIZED, { version: VERSION, actionHubReady: true, primaryContainerReady: !!_state.primaryContainer, initDuration: Date.now() - _state.initTimestamp });
    try {
      const rcResult = ContainerMainRCHandler.setup();
      _state.runtimeContextSetup = rcResult.ok;
    } catch (e) {
      _state.runtimeContextSetup = false;
    }
    return _state.engine;
  }).catch((error) => {
    _state.eventBusAdapter?.emit?.(MAIN_EVENTS.INIT_ERROR, { error: error.message });
    throw error;
  });
};
const createMain = (options = {}) => init(options);
const navigate = (route, options = {}) => navigationApi.navigate(_state, _circuitBreaker, route, options);
const unmount = () => navigationApi.unmount(_state);
const openSecondary = (panelId, options = {}) => navigationApi.openSecondary(_state, panelId, options);
const closeSecondary = (containerId) => navigationApi.closeSecondary(_state, containerId);
const toggleContainerFocus = (containerId) => navigationApi.toggleContainerFocus(_state, containerId);
const getContainerSnapshot = () => navigationApi.getContainerSnapshot(_state);
const restoreContainerSnapshot = (snapshotData) => navigationApi.restoreContainerSnapshot(_state, snapshotData);
const clearContainerSnapshot = () => navigationApi.clearContainerSnapshot(_state);
const getCurrentLayout = () => navigationApi.getCurrentLayout(_state);
const getActiveContainerIds = () => navigationApi.getActiveContainerIds(_state);
const getPrimaryContainerId = () => navigationApi.getPrimaryContainerId(_state);
const setContainerPolicy = (policy) => navigationApi.setContainerPolicy(_state, policy);
const getContainerPolicy = () => navigationApi.getContainerPolicy(_state);
const listContainers = () => navigationApi.listContainers(_state);
const getState = () => gettersApi.getState(_state);
const lifecycle = () => gettersApi.lifecycle(_state);
const getManifestController = () => gettersApi.getManifestController(_state);
const getLayoutController = () => gettersApi.getLayoutController(_state);
const getCanvasController = () => gettersApi.getCanvasController(_state);
const getTimelineController = () => gettersApi.getTimelineController(_state);
const getOrchestratorController = () => gettersApi.getOrchestratorController(_state);
const getGlobalStateV2 = () => gettersApi.getGlobalStateV2(_state);
const getContainerAdapter = () => gettersApi.getContainerAdapter(_state);
const getMultiContainerOrchestrator = () => gettersApi.getMultiContainerOrchestrator(_state);
const getActionHub = () => gettersApi.getActionHub(_state);
const getPrimaryContainer = () => gettersApi.getPrimaryContainer(_state);
const clearPrimaryPlaceholder = () => gettersApi.clearPrimaryPlaceholder(_state);
const dispatchAction = (action) => gettersApi.dispatchAction(_state, action);
const getActionHistory = () => gettersApi.getActionHistory(_state);
const info = () => buildInfo(_state, _circuitBreaker);
const healthCheck = () => buildHealthCheck(_state, _circuitBreaker);
const getMetrics = () => buildMetrics(_state, _circuitBreaker);
const getCircuitBreakerStatus = () => _circuitBreaker.getStatus();
const resetCircuitBreaker = (panelId) => {
  if (panelId) _circuitBreaker.reset(panelId);
  else _circuitBreaker.resetAll();
  _state.eventBusAdapter?.emit?.(MAIN_EVENTS.CIRCUIT_BREAKER_RESET, { panelId });
  return true;
};
const destroy = () => {
  try {
    ContainerMainRCHandler.cleanup();
  } catch (e) {
  }
  _state.runtimeContextSetup = false;
  return destroyMain(_state, _circuitBreaker);
};
var entry_default = { init, createMain, navigate, unmount, getState, lifecycle, info, healthCheck, destroy, getMetrics, getManifestController, getLayoutController, getCanvasController, getTimelineController, getOrchestratorController, getGlobalStateV2, getContainerAdapter, getMultiContainerOrchestrator, getActionHub, setContainerPolicy, getContainerPolicy, listContainers, openSecondary, closeSecondary, toggleContainerFocus, getContainerSnapshot, restoreContainerSnapshot, clearContainerSnapshot, getCurrentLayout, getActiveContainerIds, getPrimaryContainerId, dispatchAction, getActionHistory, getPrimaryContainer, clearPrimaryPlaceholder, getCircuitBreakerStatus, resetCircuitBreaker, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearContainerSnapshot,
  clearPrimaryPlaceholder,
  closeSecondary,
  createMain,
  entry_default as default,
  destroy,
  dispatchAction,
  getActionHistory,
  getActionHub,
  getActiveContainerIds,
  getCanvasController,
  getCircuitBreakerStatus,
  getContainerAdapter,
  getContainerPolicy,
  getContainerSnapshot,
  getCurrentLayout,
  getGlobalStateV2,
  getLayoutController,
  getManifestController,
  getMetrics,
  getMultiContainerOrchestrator,
  getOrchestratorController,
  getPorts,
  getPrimaryContainer,
  getPrimaryContainerId,
  getState,
  getTimelineController,
  healthCheck,
  info,
  init,
  injectPorts,
  lifecycle,
  listContainers,
  navigate,
  openSecondary,
  resetCircuitBreaker,
  restoreContainerSnapshot,
  setContainerPolicy,
  toggleContainerFocus,
  unmount
};
