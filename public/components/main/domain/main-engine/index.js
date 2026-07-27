import { createStateMachine } from "../state-machine.js";
import { VERSION, MODULE_ID, DEFAULT_PANEL } from "./constants.js";
import { emitEvent } from "./helpers.js";
import { performInit } from "./initialization.js";
import { performMount, performNavigate } from "./navigation.js";
import { performOpenSecondary, performCloseSecondary, performToggleContainerFocus } from "./secondary.js";
import { cleanupOldContainers, schedulePreload, preloadCriticalPanels, warmCache, getContainerSnapshot, restoreContainerSnapshot, clearContainerSnapshot } from "./container-ops.js";
import { setupAllListeners } from "./listeners.js";
import { getEngineState, getEngineMetrics, getEngineLifecycle, getEngineInfo, getEngineHealthCheck } from "./diagnostics.js";
import * as getters from "./getters.js";
import { performUnmount, performDestroy, cleanupSubscriptions } from "./destroy.js";
import { STATES } from "../state-machine.js";
let _globalInstance = null;
const _globalRef = { instance: null };
class MainEngine {
  constructor(context = {}) {
    if (_globalInstance && _globalInstance._initialized && !_globalInstance._destroyed) {
      return _globalInstance;
    }
    this._context = context;
    this._ports = { ...context.ports || {} };
    this._adapters = context.adapters || {};
    this._events = context.ports?.events || null;
    this._router = context.router || null;
    this._stateMachine = createStateMachine();
    this._errorSupervisor = null;
    this._panelLifecycle = null;
    this._navigationController = null;
    this._manifestController = null;
    this._layoutController = null;
    this._canvasController = null;
    this._timelineController = null;
    this._orchestrator = null;
    this._globalStateV2 = null;
    this._multiContainerOrchestrator = null;
    this._auditModule = null;
    this._persistenceAdapter = null;
    this._observabilityModule = null;
    this._initialized = false;
    this._destroyed = false;
    this._defaultPanel = context.defaultPanel || DEFAULT_PANEL;
    this._isNavigating = false;
    this._lastNavigatedPanel = null;
    this._lastContainerId = null;
    this._unsubs = [];
    this._initTimestamp = null;
    this._metrics = {
      navigations: 0,
      navigationErrors: 0,
      secondaryOpens: 0,
      containerCleanups: 0,
      preloadsTriggered: 0
    };
    _globalInstance = this;
    _globalRef.instance = this;
  }
  // Helper interno
  _emit(event, data = {}) {
    emitEvent(this._events, event, data);
  }
  // Cleanup containers
  _cleanupOldContainers(currentContainerId) {
    cleanupOldContainers(this, currentContainerId);
  }
  // Preload - disponível para chamada MANUAL se necessário
  // NÃO é chamado automaticamente no init()
  _schedulePreload() {
    schedulePreload(this);
  }
  // Preload controlado - requer opções explícitas
  async preloadPanels(options = {}) {
    return preloadCriticalPanels(this, options);
  }
  // Warm cache - requer autenticação
  async warmCache(panelIds, options = {}) {
    return warmCache(this, panelIds, options);
  }
  // Lifecycle
  async init() {
    const result = await performInit(this);
    setupAllListeners(this);
    this._ports.telemetry?.track?.("main:init-complete", {
      onDemandPolicy: true,
      preloadDisabled: true,
      timestamp: Date.now()
    });
    return result;
  }
  async mount() {
    return performMount(this);
  }
  async navigate(route, options = {}) {
    return performNavigate(this, route, options);
  }
  async unmount() {
    return performUnmount(this);
  }
  // Secondary containers
  async openSecondary(panelId, options = {}) {
    return performOpenSecondary(this, panelId, options);
  }
  async closeSecondary(containerId) {
    return performCloseSecondary(this, containerId);
  }
  toggleContainerFocus(containerId) {
    return performToggleContainerFocus(this, containerId);
  }
  // Snapshot operations
  getContainerSnapshot() {
    return getContainerSnapshot(this);
  }
  async restoreContainerSnapshot(snapshotData) {
    return restoreContainerSnapshot(this, snapshotData);
  }
  clearContainerSnapshot() {
    return clearContainerSnapshot(this);
  }
  // Diagnostics
  getState() {
    return getEngineState(this);
  }
  getMetrics() {
    return getEngineMetrics(this);
  }
  lifecycle() {
    return getEngineLifecycle(this);
  }
  info() {
    return getEngineInfo(this);
  }
  healthCheck() {
    return getEngineHealthCheck(this);
  }
  // Getters
  getManifestController() {
    return getters.getManifestController(this);
  }
  getLayoutController() {
    return getters.getLayoutController(this);
  }
  getCanvasController() {
    return getters.getCanvasController(this);
  }
  getTimelineController() {
    return getters.getTimelineController(this);
  }
  getOrchestratorController() {
    return getters.getOrchestratorController(this);
  }
  getGlobalStateV2() {
    return getters.getGlobalStateV2(this);
  }
  getMultiContainerOrchestrator() {
    return getters.getMultiContainerOrchestrator(this);
  }
  getAuditModule() {
    return getters.getAuditModule(this);
  }
  getPersistenceAdapter() {
    return getters.getPersistenceAdapter(this);
  }
  getObservabilityModule() {
    return getters.getObservabilityModule(this);
  }
  setActionHub(actionHub) {
    getters.setActionHub(this, actionHub);
  }
  // Destroy
  cleanupSubscriptions() {
    cleanupSubscriptions(this);
  }
  destroy() {
    performDestroy(this, _globalRef);
    _globalInstance = null;
  }
}
function createMainEngine(context) {
  if (_globalInstance && _globalInstance._initialized && !_globalInstance._destroyed) {
    return _globalInstance;
  }
  return new MainEngine(context);
}
function resetMainEngine() {
  if (_globalInstance) {
    _globalInstance.destroy();
  }
  _globalInstance = null;
  _globalRef.instance = null;
}
function getMainEngineInstance() {
  return _globalInstance;
}
var main_engine_default = {
  MainEngine,
  createMainEngine,
  resetMainEngine,
  getMainEngineInstance,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  MainEngine,
  STATES,
  VERSION,
  createMainEngine,
  main_engine_default as default,
  getMainEngineInstance,
  resetMainEngine
};
