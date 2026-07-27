// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file App Shell — Lifecycle Management
 * @version 5.6.2-EXPORT-FIX
 * @module app-shell/core/lifecycle
 *
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires /core/runtime/ports-profiles.js (createCorePorts)
 * @requires /core/runtime/events/index.js (SHELL_EVENTS)
 * @requires ../state/store.js (setPhase, setMounted, setReady, setError, getState)
 *
 * @provides initialize, markMounted, markReady, markFailed, markUnmounting
 * @provides markDegraded, reset, getMetrics, healthCheck, info, getLifecycleInfo
 * @provides injectPorts, getPortsSnapshot
 *
 * @description
 * Manages shell lifecycle phases: idle → initializing → mounted → ready.
 * Emits SHELL_EVENTS.READY via EventBus when shell becomes ready.
 * P22 compliant - removed dual-emit telemetry.
 * v5.6.2: Added getLifecycleInfo alias for index.js compatibility.
 *
 * @example
 * import { initialize, markMounted, markReady } from './lifecycle.js';
 * initialize();
 * markMounted();
 * await markReady(); // Emits shell:ready
 * ============================================================================
 */
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { SHELL_EVENTS } from '/core/runtime/events/catalog/shell.events.js';
import { setPhase, setMounted, setReady, setError, getState } from '../state/store.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.6.2-EXPORT-FIX';
export const MODULE_ID = 'app-shell-lifecycle';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPortsSnapshot() { return Ports.snapshot(); }

const _metrics = { inits: 0, readyMarks: 0, failMarks: 0, resets: 0 };

export function initialize() {
  _initPorts();
  _metrics.inits++;
  setPhase('initializing');
  return true;
}

export function markMounted() {
  _initPorts();
  setMounted(true);
  setPhase('mounted');
  return true;
}

export function markReady() {
  _initPorts();
  _metrics.readyMarks++;
  setReady(true);
  setPhase('ready');

  const eventBus = _getPort('eventBus');
  if (eventBus && eventBus.emit) {
    eventBus.emit(SHELL_EVENTS.READY, { timestamp: Date.now() });
  }

  return true;
}

export function markFailed(error: DynObj) {
  _initPorts();
  _metrics.failMarks++;
  setError(error);
  setPhase('failed');
  return true;
}

export function markUnmounting() {
  _initPorts();
  setPhase('unmounting');
  return true;
}

export function markDegraded(reason: DynObj) {
  _initPorts();
  setPhase('degraded');
  setError({ type: 'degraded', reason });
  return true;
}

export function reset() {
  _initPorts();
  _metrics.resets++;
  setPhase('idle');
  setMounted(false);
  setReady(false);
  setError(null);
  return true;
}

export function getMetrics() {
  return Object.assign({}, _metrics);
}

export function healthCheck() {
  const state = getState();
  const portsSnapshot = Ports.snapshot();

  const checks = {
    validPhase: ['idle', 'initializing', 'mounted', 'ready', 'degraded', 'failed', 'unmounting'].indexOf(state.phase) >= 0,
    noErrors: !state.error || (state.phase as string) === 'degraded',
    portsInitialized: portsSnapshot._initialized
  };

  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }

  return {
    status: passed === keys.length ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${keys.length}`,
    checks,
    phase: state.phase,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  const state = getState();
  const portsSnapshot = Ports.snapshot();

  return {
    moduleId: MODULE_ID,
    version: VERSION,
    phase: state.phase,
    mounted: state.mounted,
    ready: state.ready,
    error: state.error,
    metrics: getMetrics(),
    portsStatus: { initialized: portsSnapshot._initialized },
    timestamp: Date.now()
  };
}

// Alias: getLifecycleInfo delegates to info() for index.js compatibility
export function getLifecycleInfo() {
  return info();
}

export default {
  VERSION,
  MODULE_ID,
  initialize,
  markMounted,
  markReady,
  markFailed,
  markUnmounting,
  markDegraded,
  reset,
  getMetrics,
  healthCheck,
  info,
  getLifecycleInfo,
  injectPorts,
  getPortsSnapshot
};
