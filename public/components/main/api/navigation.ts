// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.api.navigation
// PURPOSE: Navigation API - Navigate and container operations
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract NAVIGATE - navigate() navigates to route
// @contract UNMOUNT - unmount() unmounts current panel
// @contract OPEN_SECONDARY - openSecondary() opens secondary container
// @contract CLOSE_SECONDARY - closeSecondary() closes secondary container
// @contract TOGGLE_CONTAINER_FOCUS - toggleContainerFocus() toggles focus
// @contract GET_CONTAINER_SNAPSHOT - getContainerSnapshot() returns snapshot
// @contract GET_METRICS - getMetrics() returns navigation metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   navigate() — exported function
//   unmount() — exported function
//   openSecondary() — exported function
//   closeSecondary() — exported function
//   toggleContainerFocus() — exported function
//   getContainerSnapshot() — exported function
//   clearContainerSnapshot() — exported function
//   restoreContainerSnapshot() — exported function
//   getCurrentLayout() — exported function
//   getActiveContainerIds() — exported function
//   getPrimaryContainerId() — exported function
//   setContainerPolicy() — exported function
//   getContainerPolicy() — exported function
//   listContainers() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): main:circuit-breaker-blocked, main:circuit-breaker-tripped
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.0.0-ENTERPRISE: Previous enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

import type { MainState, CircuitBreaker, RouteTarget } from '../types.js';

export const VERSION = '2.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'main-navigation-api';

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

export async function navigate(state: MainState, circuitBreaker: CircuitBreaker, route: string | RouteTarget, options: Record<string, unknown> = {}) {
  if (!state.engine) throw new Error('Main not initialized');

  _metrics.navigations++;
  state.globalMetrics.lastActivity = Date.now();
  state.globalMetrics.navigationCount++;

  const panelId = typeof route === 'string' ? route : route?.panelId;

  if (panelId && circuitBreaker.isOpen(panelId)) {
    _metrics.errors++;
    state.globalMetrics.circuitBreakerTrips++;
    state.eventBusAdapter?.emit?.('main:circuit-breaker-blocked', { panelId });
    throw new Error(`Circuit breaker open for panel: ${panelId}. Too many failures.`);
  }

  try {
    const result = await state.engine.navigate(route, options);
    if (panelId) circuitBreaker.reset(panelId);
    return result;
  } catch (error: any) {
    _metrics.errors++;
    state.globalMetrics.navigationErrors++;
    if (panelId) {
      const tripped = circuitBreaker.recordFailure(panelId);
      if (tripped) {
        state.globalMetrics.circuitBreakerTrips++;
        state.eventBusAdapter?.emit?.('main:circuit-breaker-tripped', { panelId, error: error.message });
      }
    }
    throw error;
  }
}

export async function unmount(state: MainState) {
  if (!state.engine) return false;
  _metrics.unmounts++;
  state.globalMetrics.lastActivity = Date.now();
  return state.engine.unmount();
}

export async function openSecondary(state: MainState, panelId: string, options: Record<string, unknown> = {}) {
  if (!state.engine) throw new Error('Main not initialized');
  _metrics.secondaryOpens++;
  state.globalMetrics.lastActivity = Date.now();
  return state.engine.openSecondary(panelId, options);
}

export async function closeSecondary(state: MainState, containerId: string | null = null) {
  if (!state.engine) return false;
  _metrics.secondaryCloses++;
  state.globalMetrics.lastActivity = Date.now();
  return state.engine.closeSecondary(containerId);
}

export function toggleContainerFocus(state: MainState, containerId: string) {
  if (!state.engine) return false;
  _metrics.focusToggles++;
  return state.engine.toggleContainerFocus(containerId);
}

export function getContainerSnapshot(state: MainState) {
  _metrics.snapshots++;
  return state.engine?.getContainerSnapshot?.() || state.containerAdapter?.snapshot?.() || null;
}

export async function restoreContainerSnapshot(state: MainState, snapshotData: Record<string, unknown>) {
  if (!state.engine) return false;
  _metrics.restores++;
  // @ts-expect-error strict migration — TS2722
  return state.engine.restoreContainerSnapshot(snapshotData);
}

export function clearContainerSnapshot(state: MainState) {
  if (!state.engine) return false;
  // @ts-expect-error strict migration — TS2722
  return state.engine.clearContainerSnapshot();
}

export function getCurrentLayout(state: MainState) {
  const orchestrator = state.engine?.getMultiContainerOrchestrator?.();
  return orchestrator?.getCurrentLayout?.() || 'single';
}

export function getActiveContainerIds(state: MainState) {
  const orchestrator = state.engine?.getMultiContainerOrchestrator?.();
  return orchestrator?.getActiveContainerIds?.() || [];
}

export function getPrimaryContainerId(state: MainState) {
  const orchestrator = state.engine?.getMultiContainerOrchestrator?.();
  return orchestrator?.getPrimaryContainerId?.() || 'primary';
}

export function setContainerPolicy(state: MainState, policy: string) {
  return state.containerAdapter?.setPolicy?.(policy) || false;
}

export function getContainerPolicy(state: MainState) {
  return state.containerAdapter?.getPolicy?.() || 'ephemeral';
}

export function listContainers(state: MainState) {
  return state.containerAdapter?.list?.() || [];
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
  const errorRate = _metrics.navigations > 0
    ? (_metrics.errors / _metrics.navigations) * 100
    : 0;

  let status = 'HEALTHY';
  if (errorRate > 30) status = 'DEGRADED';
  if (errorRate > 50) status = 'UNHEALTHY';

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

export default {
  navigate, unmount, openSecondary, closeSecondary, toggleContainerFocus,
  getContainerSnapshot, restoreContainerSnapshot, clearContainerSnapshot,
  getCurrentLayout, getActiveContainerIds, getPrimaryContainerId,
  setContainerPolicy, getContainerPolicy, listContainers,
  getMetrics, info, healthCheck,
  VERSION, MODULE_ID
};
