/* ═══════════════════════════════════════════════════════════════
 * DEPENDENCY CONTRACT — navigation-controller/index.js
 * @version 8.1.0-ABORT-FIX-ES6
 * @batch Batch Z (Contract #213 of 217)
 *
 * IMPORTS (EXTERNAL):
 *   /core/runtime/ports-profiles.js → { createCorePorts }
 *   ./state/store.js                → { createState, cleanup as cleanupState }
 *   ./events/listeners.js           → { setupBrokerListeners, cleanupListeners }
 *   ./core/navigator.js             → { validateNavigation, emitNavigationBlocked, executeNavigation, cancel, LOCAL_NAV_EVENTS }
 *   ./queue/manager.js              → { queueNavigation, clearQueue, getQueueSize }
 *   ./telemetry/index.js            → { getMetrics, getNavigationDiagnostics, info, healthCheck }
 *
 * EXPORTS (PUBLIC API):
 *   VERSION, MODULE_ID, LOCAL_NAV_EVENTS
 *   NavigationController constructor (navigate, cancel, clearQueue, setTimeout, setManifestController)
 *   Getters: isNavigating, getQueueSize, getCurrentNavigation, getLastValidNavigation
 *   Telemetry: getMetrics, getNavigationDiagnostics, info, healthCheck
 *   destroy()
 *   createNavigationController() factory
 *   injectPorts(), getPorts()
 *   default: { NavigationController, createNavigationController, injectPorts, getPorts, LOCAL_NAV_EVENTS, VERSION, MODULE_ID }
 *
 * BROWSER APIs:
 *   clearTimeout, Promise
 *
 * PATTERNS:
 *   Modular Orchestrator with prototype-based class
 *   NavigationBroker integration (P15), PortsFactory (P17WI)
 *   Navigation queue, validation pipeline, timeout with abort
 *   Factory function (createNavigationController)
 * ═══════════════════════════════════════════════════════════════ */
// NavigationController - Controlador de Navegação Enterprise
// @version 8.1.0-ABORT-FIX-ES6
// @architecture Modular - Orchestrator Pattern
// @changelog v8.1.0-ABORT-FIX - Fixed: timeout now calls abort(), signal passed to load/mount, proper cleanup
// P17WI: PortsFactory/PortsProfiles
// P15: Integração com NavigationBroker
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

// Modular imports
import { createState, cleanup as cleanupState } from './state/store.js';
import { setupBrokerListeners, cleanupListeners } from './events/listeners.js';
import { validateNavigation, emitNavigationBlocked, executeNavigation, cancel as cancelNav, LOCAL_NAV_EVENTS } from './core/navigator.js';
import { queueNavigation, clearQueue as clearQueueFn, getQueueSize } from './queue/manager.js';
import { getMetrics, getNavigationDiagnostics, info as getInfo, healthCheck as getHealthCheck } from './telemetry/index.js';

export const VERSION = '8.1.0-ABORT-FIX';
export const MODULE_ID = 'main-navigation-controller';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// NAVIGATION CONTROLLER CLASS
// ═══════════════════════════════════════════════════════════════

export function NavigationController(this: any, panelLifecycle: Record<string, unknown>, stateMachine: Record<string, unknown>, telemetry: Record<string, unknown>, manifestController: Record<string, unknown>) {
  this._panelLifecycle = panelLifecycle;
  this._stateMachine = stateMachine;
  this._telemetry = telemetry;
  this._manifestController = manifestController || null;
  this._state = createState();
  
  _initPorts();
  setupBrokerListeners(this._state, _getPort);
}

// ─────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────

NavigationController.prototype.navigate = function(route: string, options: Record<string, unknown>) {
  const self = this;
  options = options || {};
  
  if (this._state.navigating) {
    if (options.cancelPrevious) {
      this.cancel();
    } else if (options.queue !== false) {
      return queueNavigation(this._state, this._telemetry, route, options);
    } else {
      return Promise.resolve(false);
    }
  }
  
  if (!options._bypassBroker) {
    const broker = _getPort('navigationBroker');
    if (broker && broker.navigate) {
      const result = broker.navigate(route, {
        meta: { source: 'navigation-controller', region: 'main' },
        replace: options.replace,
        state: options.state
      });
      return Promise.resolve(result && result.status === 'success');
    }
  }
  
  if (!options.skipValidation) {
    // @ts-expect-error strict migration — TS2345
    return validateNavigation(this._manifestController, route, options).then((validation: Record<string, unknown>) => {
      if (!validation.valid) {
// @ts-expect-error TS migration - TS2345
        emitNavigationBlocked(self._state, self._telemetry, _getPort, route, validation.reason, validation, MODULE_ID);
        return false;
      }
      return executeNavigation(self._state, self._panelLifecycle, self._stateMachine, self._telemetry, _getPort, route, options);
    });
  }
  
  return executeNavigation(this._state, this._panelLifecycle, this._stateMachine, this._telemetry, _getPort, route, options);
};

// ─────────────────────────────────────────────────────────────
// CONTROL
// ─────────────────────────────────────────────────────────────

NavigationController.prototype.cancel = function() {
  return cancelNav(this._state);
};

NavigationController.prototype.clearQueue = function() {
  return clearQueueFn(this._state);
};

NavigationController.prototype.setTimeout = function(ms: number) {
  this._state.timeoutMs = ms;
};

NavigationController.prototype.setManifestController = function(mc: unknown) {
  this._manifestController = mc;
};

// ─────────────────────────────────────────────────────────────
// GETTERS
// ─────────────────────────────────────────────────────────────

NavigationController.prototype.isNavigating = function() {
  return this._state.navigating;
};

NavigationController.prototype.getQueueSize = function() {
  return getQueueSize(this._state);
};

NavigationController.prototype.getCurrentNavigation = function() {
  return this._state.currentNavigation;
};

NavigationController.prototype.getLastValidNavigation = function() {
  return this._state.lastValidNavigation;
};

// ─────────────────────────────────────────────────────────────
// TELEMETRY
// ─────────────────────────────────────────────────────────────

NavigationController.prototype.getMetrics = function() {
  return getMetrics(this._state);
};

NavigationController.prototype.getNavigationDiagnostics = function() {
  return getNavigationDiagnostics(this._state, _getPort);
};

NavigationController.prototype.info = function() {
  return getInfo(this._state, this._panelLifecycle, this._manifestController, _getPort, Ports.isInitialized());
};

NavigationController.prototype.healthCheck = function() {
  return getHealthCheck(this._state, this._panelLifecycle, this._stateMachine, this._telemetry, this._manifestController, _getPort, Ports.isInitialized());
};

// ─────────────────────────────────────────────────────────────
// DESTROY
// ─────────────────────────────────────────────────────────────

NavigationController.prototype.destroy = function() {
  this.cancel();
  this.clearQueue();
  
  if (this._state.timeoutId) {
    clearTimeout(this._state.timeoutId);
    this._state.timeoutId = null;
  }
  
  cleanupListeners(this._state);
};

// ═══════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════

export function createNavigationController(panelLifecycle: Record<string, unknown>, stateMachine: Record<string, unknown>, telemetry: Record<string, unknown>, manifestController: Record<string, unknown>) {
  return new (NavigationController as unknown as new (...args: unknown[]) => Record<string, unknown>)(panelLifecycle, stateMachine, telemetry, manifestController);
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { LOCAL_NAV_EVENTS };

export default {
  NavigationController,
  createNavigationController,
  injectPorts,
  getPorts,
  LOCAL_NAV_EVENTS,
  VERSION,
  MODULE_ID
};
