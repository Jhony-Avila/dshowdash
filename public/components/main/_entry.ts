// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.8.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main
// PURPOSE: Main component with navigation, containers and orchestration
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes main component
// @contract CREATE_MAIN - createMain(options) creates main instance
// @contract NAVIGATE - navigate(route, options) navigates to route
// @contract UNMOUNT - unmount() unmounts current content
// @contract GET_STATE - getState() returns current state
// @contract LIFECYCLE - lifecycle() returns lifecycle info
// @contract DESTROY - destroy() destroys main component
// @contract INFO - info() returns module information
// @contract HEALTH - healthCheck() returns health status
// @contract GET_METRICS - getMetrics() returns metrics
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// ───────────────────────────────────────────────────────────────
// IMPORTS: MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   createCircuitBreaker from ./core/circuit-breaker.js
//   initializeMain from ./core/initializer.js
//   buildInfo, buildHealthCheck, buildMetrics from ./core/diagnostics.js
//   destroyMain from ./core/lifecycle.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   init() — exported function
//   createMain() — exported function
//   navigate() — exported function
//   unmount() — exported function
//   getState() — exported function
//   lifecycle() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   getManifestController() — exported function
//   getLayoutController() — exported function
//   getCanvasController() — exported function
//   getTimelineController() — exported function
//   getOrchestratorController() — exported function
//   getGlobalStateV2() — exported function
//   getContainerAdapter() — exported function
//   getMultiContainerOrchestrator() — exported function
//   ... and 21 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// @changelog v5.8.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v5.7.0-ENTERPRISE: Previous enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { createCircuitBreaker } from './core/circuit-breaker.js';
import { initializeMain } from './core/initializer.js';
import { buildInfo, buildHealthCheck, buildMetrics } from './core/diagnostics.js';
import { destroyMain } from './core/lifecycle.js';
import * as navigationApi from './api/navigation.js';
import * as gettersApi from './api/getters.js';
import * as ContainerMainRCHandler from '/core/runtime/constants/container-main-handler.js';
import type { MainState, MainEngine, CircuitBreaker, ActionPayload, PortsContainer, RouteTarget } from './types.js';

const VERSION = '5.8.0-P2-ENTERPRISE';
const MODULE_ID = 'main.index';

const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
const getPorts = () => Ports.snapshot();

const _state: MainState = { version: VERSION, engine: null, actionHub: null, initialized: false, context: null, eventBusAdapter: null, containerAdapter: null, containerPort: null, primaryContainer: null, initTimestamp: null, adapters: {}, ports: {}, globalMetrics: { initCount: 0, destroyCount: 0, navigationCount: 0, navigationErrors: 0, circuitBreakerTrips: 0, lastActivity: null }, runtimeContextSetup: false };

const _circuitBreaker = createCircuitBreaker({ threshold: 3, resetTimeout: 30000 }) as CircuitBreaker;

const init = (options: Record<string, unknown> = {}) => {
  if (_state.initialized && _state.engine) return Promise.resolve(_state.engine);
  _initPorts();
  _state.initTimestamp = Date.now();
  _state.globalMetrics.initCount++;
  return initializeMain(_state, options).then(() => {
    _state.initialized = true;
    _state.globalMetrics.lastActivity = Date.now();
    // @ts-expect-error strict migration — TS18047
    _state.eventBusAdapter?.emit?.(MAIN_EVENTS.INITIALIZED, { version: VERSION, actionHubReady: true, primaryContainerReady: !!_state.primaryContainer, initDuration: Date.now() - _state.initTimestamp });

    // P5: Setup RuntimeContext handler apos Main estar pronto
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

const createMain = (options: Record<string, unknown> = {}) => init(options);
const navigate = (route: string | RouteTarget, options: Record<string, unknown> = {}) => navigationApi.navigate(_state, _circuitBreaker, route, options);
const unmount = () => navigationApi.unmount(_state);
const openSecondary = (panelId: string, options: Record<string, unknown> = {}) => navigationApi.openSecondary(_state, panelId, options);
const closeSecondary = (containerId?: string | null) => navigationApi.closeSecondary(_state, containerId);
const toggleContainerFocus = (containerId: string) => navigationApi.toggleContainerFocus(_state, containerId);
const getContainerSnapshot = () => navigationApi.getContainerSnapshot(_state);
const restoreContainerSnapshot = (snapshotData: Record<string, unknown>) => navigationApi.restoreContainerSnapshot(_state, snapshotData);
const clearContainerSnapshot = () => navigationApi.clearContainerSnapshot(_state);
const getCurrentLayout = () => navigationApi.getCurrentLayout(_state);
const getActiveContainerIds = () => navigationApi.getActiveContainerIds(_state);
const getPrimaryContainerId = () => navigationApi.getPrimaryContainerId(_state);
const setContainerPolicy = (policy: string) => navigationApi.setContainerPolicy(_state, policy);
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
const dispatchAction = (action: ActionPayload) => gettersApi.dispatchAction(_state, action);
const getActionHistory = () => gettersApi.getActionHistory(_state);
const info = () => buildInfo(_state, _circuitBreaker);
const healthCheck = () => buildHealthCheck(_state, _circuitBreaker);
const getMetrics = () => buildMetrics(_state, _circuitBreaker);
const getCircuitBreakerStatus = () => _circuitBreaker.getStatus();
const resetCircuitBreaker = (panelId?: string) => { if (panelId) _circuitBreaker.reset(panelId); else _circuitBreaker.resetAll(); _state.eventBusAdapter?.emit?.(MAIN_EVENTS.CIRCUIT_BREAKER_RESET, { panelId }); return true; };
const destroy = () => {
  // P5: Cleanup RuntimeContext handler
  try { ContainerMainRCHandler.cleanup(); } catch (e) {}
  _state.runtimeContextSetup = false;
  return destroyMain(_state, _circuitBreaker);
};

export { VERSION, MODULE_ID, init, createMain, navigate, unmount, getState, lifecycle, info, healthCheck, destroy, getMetrics, getManifestController, getLayoutController, getCanvasController, getTimelineController, getOrchestratorController, getGlobalStateV2, getContainerAdapter, getMultiContainerOrchestrator, getActionHub, setContainerPolicy, getContainerPolicy, listContainers, openSecondary, closeSecondary, toggleContainerFocus, getContainerSnapshot, restoreContainerSnapshot, clearContainerSnapshot, getCurrentLayout, getActiveContainerIds, getPrimaryContainerId, dispatchAction, getActionHistory, getPrimaryContainer, clearPrimaryPlaceholder, getCircuitBreakerStatus, resetCircuitBreaker, injectPorts, getPorts };

export default { init, createMain, navigate, unmount, getState, lifecycle, info, healthCheck, destroy, getMetrics, getManifestController, getLayoutController, getCanvasController, getTimelineController, getOrchestratorController, getGlobalStateV2, getContainerAdapter, getMultiContainerOrchestrator, getActionHub, setContainerPolicy, getContainerPolicy, listContainers, openSecondary, closeSecondary, toggleContainerFocus, getContainerSnapshot, restoreContainerSnapshot, clearContainerSnapshot, getCurrentLayout, getActiveContainerIds, getPrimaryContainerId, dispatchAction, getActionHistory, getPrimaryContainer, clearPrimaryPlaceholder, getCircuitBreakerStatus, resetCircuitBreaker, injectPorts, getPorts, VERSION, MODULE_ID };
