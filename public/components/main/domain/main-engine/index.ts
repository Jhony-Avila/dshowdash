// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.2.0-MUTABLE-PORTS)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createStateMachine from ../state-machine.js
//   VERSION, MODULE_ID, DEFAULT_PANEL from ./constants.js
//   emitEvent from ./helpers.js
//   performInit from ./initialization.js
//   performMount, performNavigate from ./navigation.js
//   performOpenSecondary, performCloseSecondary,
//     performToggleContainerFocus from ./secondary.js
//   cleanupOldContainers, schedulePreload,
//     preloadCriticalPanels, warmCache,
//     get/restore/clearContainerSnapshot from ./container-ops.js
//   setupAllListeners from ./listeners.js
//   getEngineState/Metrics/Lifecycle/Info/HealthCheck
//     from ./diagnostics.js
//   getters from ./getters.js
//   performUnmount, performDestroy from ./destroy.js
//
// PROVIDES:
//   MainEngine class, createMainEngine(),
//   resetMainEngine(), getMainEngineInstance(),
//   init(), mount(), navigate(), unmount(), destroy(),
//   openSecondary(), closeSecondary(),
//   toggleContainerFocus(), preloadPanels(), warmCache(),
//   getState(), getMetrics(), lifecycle(),
//   info(), healthCheck(),
//   VERSION, MODULE_ID, STATES
//
// RECEIVES (via constructor context):
//   context.ports, context.adapters, context.router,
//   context.defaultPanel
// ═══════════════════════════════════════════════════════════════
// MainEngine v5.2.0 - MUTABLE-PORTS
// @version 5.2.0-MUTABLE-PORTS
// @changelog v5.2.0-MUTABLE-PORTS - CRITICAL: Spread context.ports to create mutable copy (context-builder freezes ports, blocking ui port assignment during boot)
// @changelog v5.1.0-ON-DEMAND - CRITICAL: Removed automatic preload call from init() to enforce on-demand loading
// @changelog v5.0.0-MODULAR - Refatorado de 701 linhas em 1 arquivo para 11 arquivos modulares
'use strict';

import { createStateMachine } from '../state-machine.js';
import { VERSION, MODULE_ID, DEFAULT_PANEL } from './constants.js';
import { emitEvent } from './helpers.js';
import { performInit } from './initialization.js';
import { performMount, performNavigate } from './navigation.js';
import { performOpenSecondary, performCloseSecondary, performToggleContainerFocus } from './secondary.js';
import { cleanupOldContainers, schedulePreload, preloadCriticalPanels, warmCache, getContainerSnapshot, restoreContainerSnapshot, clearContainerSnapshot } from './container-ops.js';
import { setupAllListeners } from './listeners.js';
import { getEngineState, getEngineMetrics, getEngineLifecycle, getEngineInfo, getEngineHealthCheck } from './diagnostics.js';
import * as getters from './getters.js';
import { performUnmount, performDestroy, cleanupSubscriptions } from './destroy.js';

export { VERSION, MODULE_ID };
export { STATES } from '../state-machine.js';

let _globalInstance: Record<string, unknown> | null = null;
const _globalRef = { instance: null as string | null };

export class MainEngine {
  [key: string]: any;
  constructor(context: Record<string, any> = {}) {
    if (_globalInstance && _globalInstance._initialized && !_globalInstance._destroyed) {
// @ts-expect-error TS migration - TS2740
      return _globalInstance;
    }

    this._context = context;
    // v5.2.0-MUTABLE-PORTS: Spread to create mutable copy
    // context-builder.js freezes ports via Object.freeze({ ...ports })
    // but initialization.js needs to add the ui port after container-main boot
    this._ports = { ...(context.ports || {}) };
    this._adapters = context.adapters || {};
    this._events = context.ports?.events || null;
    this._router = context.router || null;

    // @ts-expect-error TS migration - TS2554
    this._stateMachine = createStateMachine();

    // Subsystems (inicializados em init)
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

    // State
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
    _globalRef.instance = this as unknown as string;
  }

  // Helper interno
  _emit(event: string, data: Record<string, unknown> = {}) {
    emitEvent(this._events, event, data);
  }

  // Cleanup containers
  _cleanupOldContainers(currentContainerId: string) {
    cleanupOldContainers(this, currentContainerId);
  }

  // Preload - disponível para chamada MANUAL se necessário
  // NÃO é chamado automaticamente no init()
  _schedulePreload() {
    schedulePreload(this);
  }

  // Preload controlado - requer opções explícitas
  async preloadPanels(options: Record<string, unknown> = {}) {
    return preloadCriticalPanels(this, options);
  }

  // Warm cache - requer autenticação
  async warmCache(panelIds: unknown, options: Record<string, unknown> = {}) {
    return warmCache(this, panelIds, options);
  }

  // Lifecycle
  async init() {
    const result = await performInit(this);
    setupAllListeners(this);
    // ON-DEMAND POLICY: Preload automático REMOVIDO
    // Painéis são carregados APENAS quando o usuário navega explicitamente
    // this._schedulePreload(); // DESABILITADO - viola on-demand policy
    this._ports.telemetry?.track?.('main:init-complete', {
      onDemandPolicy: true,
      preloadDisabled: true,
      timestamp: Date.now()
    });
    return result;
  }

  async mount() {
    return performMount(this);
  }

  async navigate(route: string, options: Record<string, unknown> = {}) {
    return performNavigate(this, route, options);
  }

  async unmount() {
    return performUnmount(this);
  }

  // Secondary containers
  async openSecondary(panelId: string, options: Record<string, unknown> = {}) {
    return performOpenSecondary(this, panelId, options);
  }

  async closeSecondary(containerId: string) {
    return performCloseSecondary(this, containerId);
  }

  toggleContainerFocus(containerId: string) {
    return performToggleContainerFocus(this, containerId);
  }

  // Snapshot operations
  getContainerSnapshot() {
    return getContainerSnapshot(this);
  }

  async restoreContainerSnapshot(snapshotData: Record<string, unknown>) {
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

  setActionHub(actionHub: unknown) {
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

export function createMainEngine(context: Record<string, unknown>) {
  if (_globalInstance && _globalInstance._initialized && !_globalInstance._destroyed) {
    return _globalInstance;
  }
  return new MainEngine(context);
}

export function resetMainEngine() {
  if (_globalInstance) {
    (_globalInstance as Record<string, (...args: unknown[]) => unknown>).destroy();
  }
  _globalInstance = null;
  _globalRef.instance = null;
}

export function getMainEngineInstance() {
  return _globalInstance;
}

export default {
  MainEngine,
  createMainEngine,
  resetMainEngine,
  getMainEngineInstance,
  VERSION,
  MODULE_ID
};
