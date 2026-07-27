// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P18)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Runtime Integration - Lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION as INTEGRATION_VERSION, MODULE_ID from ../constants.js
//   createLogger from /assets/js/core/logger-global/index.js
//   OVERLAY_EVENTS, KERNEL_RUNTIME_EVENTS from /core/runtime/events/index.js
//   getAggregatedHealth from ../diagnostics/health.js
//   * as PermissionGate from ../../overlay-permission-gate.js
//   * as OverlayManifest from ../../overlay-manifest.js
//
// PROVIDES:
//   VERSION — module constant
//   init() — exported function
//   shutdown() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_UPDATED
//   KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_READY
//   kernel:mode-change
//   runtime:ready
//   runtime:degraded
//   auth:state-change
//   auth:login-success
//   auth:logout
// WINDOW ACCESS:
//   window.Core
//   window.RuntimeContext
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION as INTEGRATION_VERSION, MODULE_ID } from '../constants.js';
import { createLogger } from '/assets/js/core/logger-global/index.js';
import { OVERLAY_EVENTS } from '/core/runtime/events/catalog/overlay.events.js';
import { KERNEL_RUNTIME_EVENTS } from '/core/runtime/events/catalog/kernel.events.js';
import {
  isInitialized,
  setInitialized,
  setRuntimeContext,
  setApplicationKernel,
  setEventBus,
  setPermissionsGuard,
  setHealthAggregator,
  setCurrentMode,
  setLastModeChange,
  getEventBus,
  getApplicationKernel,
  getSubscriptions,
  addSubscription,
  clearSubscriptions,
  getCurrentMode,
  getHealthAggregator,
  resetState
} from '../state.js';
import {
  handleRuntimeReady,
  handleRuntimeDegraded,
  handleAuthChange,
  handleKernelModeChange,
  handleRuntimeContextUpdated,
  handleRuntimeContextReady
} from '../handlers/event-handlers.js';
import { getAggregatedHealth } from '../diagnostics/health.js';
import * as PermissionGate from '../../overlay-permission-gate.js';
import * as OverlayManifest from '../../overlay-manifest.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '2.3.0-P18';
const _logger = createLogger(MODULE_ID);

// ═══════════════════════════════════════════════════════════════
// RUNTIME CONTEXT RESOLVER (v2.2.0-STEP8)
// Canal oficial: windowAdapter.get → window fallback
// ═══════════════════════════════════════════════════════════════

function _resolveRuntimeContext() {
  if (typeof window === 'undefined') return null;
  // 1. windowAdapter (canal oficial)
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const rc = window.Core.windowAdapter.get('RuntimeContext');
    if (rc) return rc;
  }
  // 2. window fallback
  return window.RuntimeContext || null;
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function _emit(eventName: string, data: DynObj) {
  const eventBus = getEventBus();
  if (eventBus && eventBus.emit) {
    eventBus.emit(eventName, Object.assign({
      source: MODULE_ID,
      timestamp: Date.now()
    }, data || {}));
  }
}

function _log(level: DynObj, message: string, data?: DynObj) {
  const context = data ? { data } : {};
  if (level === 'error') _logger.error(message, context);
  else if (level === 'warn') _logger.warn(message, context);
  else _logger.debug(message, context);
}

function _unsubscribeAll() {
  const subscriptions = getSubscriptions();
  for (let i = 0; i < subscriptions.length; i++) {
    const unsub = subscriptions[i];
    if (typeof unsub === 'function') {
      try { unsub(); } catch (e) { }
    }
  }
  clearSubscriptions();
}

// ============================================================================
// EVENT LISTENERS SETUP
// ============================================================================

function _setupEventListeners() {
  const eb = getEventBus();
  if (!eb || !eb.on) return;

  // ─────────────────────────────────────────────────────────────
  // P4: RuntimeContext listeners (fonte única de verdade)
  // ─────────────────────────────────────────────────────────────
  const unsubRCUpdated = eb.on(KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_UPDATED, handleRuntimeContextUpdated);
  if (unsubRCUpdated) addSubscription(unsubRCUpdated);

  const unsubRCReady = eb.on(KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_READY, handleRuntimeContextReady);
  if (unsubRCReady) addSubscription(unsubRCReady);

  // ─────────────────────────────────────────────────────────────
  // Listeners legados (mantidos para compatibilidade)
  // ─────────────────────────────────────────────────────────────

  const unsubMode = eb.on('kernel:mode-change', handleKernelModeChange);
  if (unsubMode) addSubscription(unsubMode);

  const unsubReady = eb.on('runtime:ready', handleRuntimeReady);
  if (unsubReady) addSubscription(unsubReady);

  const unsubDegraded = eb.on('runtime:degraded', handleRuntimeDegraded);
  if (unsubDegraded) addSubscription(unsubDegraded);

  const unsubAuth = eb.on('auth:state-change', handleAuthChange);
  if (unsubAuth) addSubscription(unsubAuth);

  const unsubLogin = eb.on('auth:login-success', handleAuthChange);
  if (unsubLogin) addSubscription(unsubLogin);

  const unsubLogout = eb.on('auth:logout', handleAuthChange);
  if (unsubLogout) addSubscription(unsubLogout);

  _log('info', `[P4] Event listeners configured (${getSubscriptions().length} total)`);
}

function _registerWithHealthAggregator() {
  const aggregator = getHealthAggregator();
  if (!aggregator || typeof aggregator.register !== 'function') return;

  aggregator.register({
    id: 'overlay-kernel',
    name: 'Overlay Kernel',
    version: INTEGRATION_VERSION,
    healthCheck: getAggregatedHealth,
    weight: OverlayManifest.getTotalHealthWeight()
  });

  _log('info', 'Registered with health aggregator');
}

// ============================================================================
// LIFECYCLE API
// ============================================================================

/**
 * Inicializa a integração com o runtime
 * @param {Object} runtimeContext
 * @returns {Object}
 */
export function init(runtimeContext: DynObj) {
  runtimeContext = runtimeContext || {};

  if (isInitialized()) {
    return {
      ok: true,
      alreadyInitialized: true,
      version: INTEGRATION_VERSION
    };
  }

  _log('info', 'Initializing runtime integration (P4)');

  setRuntimeContext(runtimeContext);
  setApplicationKernel(runtimeContext.applicationKernel || null);
  setEventBus(runtimeContext.eventBus || null);
  setPermissionsGuard(runtimeContext.permissionsGuard || null);
  setHealthAggregator(runtimeContext.healthAggregator || null);

  let initialMode = 'INITIALIZING';
  const rc = _resolveRuntimeContext();
  if (rc && rc.getMode) {
    initialMode = rc.getMode();
    _log('info', `[P4] Initial mode from RuntimeContext: ${initialMode}`);
  } else {
    const appKernel = getApplicationKernel();
    if (appKernel && typeof appKernel.getMode === 'function') {
      initialMode = appKernel.getMode();
    } else if (runtimeContext.mode) {
      initialMode = runtimeContext.mode;
    }
  }
  setCurrentMode(initialMode);

  PermissionGate.init({
    permissionsGuard: runtimeContext.permissionsGuard || null,
    runtimeKernel: runtimeContext.applicationKernel || null,
    eventBus: runtimeContext.eventBus || null
  });

  _setupEventListeners();

  _registerWithHealthAggregator();

  setInitialized(true);
  setLastModeChange(Date.now());

  _emit('overlay-kernel.integration-ready', {
    version: INTEGRATION_VERSION,
    mode: getCurrentMode(),
    hasApplicationKernel: !!getApplicationKernel(),
    hasPermissionsGuard: !!runtimeContext.permissionsGuard,
    hasHealthAggregator: !!getHealthAggregator(),
    p4RuntimeContext: true
  });

  return {
    ok: true,
    initialized: true,
    version: INTEGRATION_VERSION,
    mode: getCurrentMode(),
    p4RuntimeContext: true,
    integrations: {
      applicationKernel: !!getApplicationKernel(),
      permissionsGuard: !!runtimeContext.permissionsGuard,
      healthAggregator: !!getHealthAggregator(),
      eventBus: !!getEventBus(),
      runtimeContext: !!_resolveRuntimeContext()
    }
  };
}

/**
 * Encerra a integração com o runtime
 * @param {string} reason
 * @returns {Object}
 */
export function shutdown(reason: DynObj) {
  if (!isInitialized()) {
    return { ok: true, alreadyShutdown: true };
  }

  _log('info', 'Shutting down runtime integration', { reason });

  const lastModeChange = require('../state.js').getLastModeChange();

  _unsubscribeAll();
  PermissionGate.reset();

  _emit(OVERLAY_EVENTS.KERNEL_SHUTDOWN, {
    reason: reason || 'manual',
    uptime: lastModeChange ? Date.now() - lastModeChange : 0
  });

  resetState();

  return {
    ok: true,
    shutdown: true,
    reason
  };
}

export default {
  init,
  shutdown
};
