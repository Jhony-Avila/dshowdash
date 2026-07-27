// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.api.getters
// PURPOSE: Getters API - Access to controllers and state
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract GET_STATE - getState() returns engine state
// @contract LIFECYCLE - lifecycle() returns lifecycle controller
// @contract GET_MANIFEST_CONTROLLER - getManifestController() returns manifest
// @contract GET_LAYOUT_CONTROLLER - getLayoutController() returns layout
// @contract GET_CANVAS_CONTROLLER - getCanvasController() returns canvas
// @contract GET_CONTAINER_ADAPTER - getContainerAdapter() returns container adapter
// @contract DISPATCH_ACTION - dispatchAction() dispatches action
// @contract GET_METRICS - getMetrics() returns getter metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   lifecycle() — exported function
//   getManifestController() — exported function
//   getLayoutController() — exported function
//   getCanvasController() — exported function
//   getTimelineController() — exported function
//   getOrchestratorController() — exported function
//   getGlobalStateV2() — exported function
//   getContainerAdapter() — exported function
//   getMultiContainerOrchestrator() — exported function
//   getActionHub() — exported function
//   getPrimaryContainer() — exported function
//   clearPrimaryPlaceholder() — exported function
//   dispatchAction() — exported function
//   getActionHistory() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.0.0-ENTERPRISE: Previous enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

import type { MainState, ActionPayload, ContainerAdapter, ActionHub, ContainerInstance, MultiContainerOrchestrator } from '../types.js';

export const VERSION = '2.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'main-getters-api';

let _metrics = {
  stateGets: 0,
  lifecycleCalls: 0,
  controllerGets: 0,
  actionDispatches: 0,
  errors: 0
};

export function getState(state: MainState) {
  _metrics.stateGets++;
  return state.engine?.getState?.() || { initialized: false };
}

export function lifecycle(state: MainState) {
  _metrics.lifecycleCalls++;
  return state.engine?.lifecycle?.() || null;
}

export function getManifestController(state: MainState) {
  _metrics.controllerGets++;
  return state.engine?.getManifestController?.() || null;
}

export function getLayoutController(state: MainState) {
  _metrics.controllerGets++;
  return state.engine?.getLayoutController?.() || null;
}

export function getCanvasController(state: MainState) {
  _metrics.controllerGets++;
  return state.engine?.getCanvasController?.() || null;
}

export function getTimelineController(state: MainState) {
  _metrics.controllerGets++;
  return state.engine?.getTimelineController?.() || null;
}

export function getOrchestratorController(state: MainState) {
  _metrics.controllerGets++;
  return state.engine?.getOrchestratorController?.() || null;
}

export function getGlobalStateV2(state: MainState) {
  _metrics.controllerGets++;
  return state.engine?.getGlobalStateV2?.() || null;
}

export function getContainerAdapter(state: MainState) {
  _metrics.controllerGets++;
  return state.containerAdapter;
}

export function getMultiContainerOrchestrator(state: MainState) {
  _metrics.controllerGets++;
  return state.engine?.getMultiContainerOrchestrator?.() || null;
}

export function getActionHub(state: MainState) {
  _metrics.controllerGets++;
  return state.actionHub;
}

export function getPrimaryContainer(state: MainState) {
  _metrics.controllerGets++;
  return state.primaryContainer;
}

export function clearPrimaryPlaceholder(state: MainState) {
  const contentEl = state.primaryContainer?.contentEl;
  if (contentEl) {
    const placeholder = contentEl.querySelector('[data-placeholder="true"]');
    if (placeholder) placeholder.remove();
  }
}

export function dispatchAction(state: MainState, action: ActionPayload) {
  if (!state.actionHub) {
    _metrics.errors++;
    throw new Error('ActionHub not initialized');
  }
  _metrics.actionDispatches++;
  state.globalMetrics.lastActivity = Date.now();
  return state.actionHub.dispatch(action);
}

export function getActionHistory(state: MainState) {
  return state.actionHub?.getHistory?.() || [];
}

export function getMetrics() {
  return { ..._metrics };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    metrics: getMetrics()
  };
}

export function healthCheck() {
  return {
    status: _metrics.errors === 0 ? 'HEALTHY' : 'DEGRADED',
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

export default {
  getState, lifecycle,
  getManifestController, getLayoutController, getCanvasController,
  getTimelineController, getOrchestratorController, getGlobalStateV2,
  getContainerAdapter, getMultiContainerOrchestrator, getActionHub,
  getPrimaryContainer, clearPrimaryPlaceholder,
  dispatchAction, getActionHistory,
  getMetrics, info, healthCheck,
  VERSION, MODULE_ID
};
