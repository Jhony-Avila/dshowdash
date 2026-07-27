import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { createState } from "./state/store.js";
import { setupBrokerListeners, cleanupListeners } from "./events/listeners.js";
import { validateNavigation, emitNavigationBlocked, executeNavigation, cancel as cancelNav, LOCAL_NAV_EVENTS } from "./core/navigator.js";
import { queueNavigation, clearQueue as clearQueueFn, getQueueSize } from "./queue/manager.js";
import { getMetrics, getNavigationDiagnostics, info as getInfo, healthCheck as getHealthCheck } from "./telemetry/index.js";
const VERSION = "8.1.0-ABORT-FIX";
const MODULE_ID = "main-navigation-controller";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function NavigationController(panelLifecycle, stateMachine, telemetry, manifestController) {
  this._panelLifecycle = panelLifecycle;
  this._stateMachine = stateMachine;
  this._telemetry = telemetry;
  this._manifestController = manifestController || null;
  this._state = createState();
  _initPorts();
  setupBrokerListeners(this._state, _getPort);
}
NavigationController.prototype.navigate = function(route, options) {
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
    const broker = _getPort("navigationBroker");
    if (broker && broker.navigate) {
      const result = broker.navigate(route, {
        meta: { source: "navigation-controller", region: "main" },
        replace: options.replace,
        state: options.state
      });
      return Promise.resolve(result && result.status === "success");
    }
  }
  if (!options.skipValidation) {
    return validateNavigation(this._manifestController, route, options).then((validation) => {
      if (!validation.valid) {
        emitNavigationBlocked(self._state, self._telemetry, _getPort, route, validation.reason, validation, MODULE_ID);
        return false;
      }
      return executeNavigation(self._state, self._panelLifecycle, self._stateMachine, self._telemetry, _getPort, route, options);
    });
  }
  return executeNavigation(this._state, this._panelLifecycle, this._stateMachine, this._telemetry, _getPort, route, options);
};
NavigationController.prototype.cancel = function() {
  return cancelNav(this._state);
};
NavigationController.prototype.clearQueue = function() {
  return clearQueueFn(this._state);
};
NavigationController.prototype.setTimeout = function(ms) {
  this._state.timeoutMs = ms;
};
NavigationController.prototype.setManifestController = function(mc) {
  this._manifestController = mc;
};
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
NavigationController.prototype.destroy = function() {
  this.cancel();
  this.clearQueue();
  if (this._state.timeoutId) {
    clearTimeout(this._state.timeoutId);
    this._state.timeoutId = null;
  }
  cleanupListeners(this._state);
};
function createNavigationController(panelLifecycle, stateMachine, telemetry, manifestController) {
  return new NavigationController(panelLifecycle, stateMachine, telemetry, manifestController);
}
var navigation_controller_default = {
  NavigationController,
  createNavigationController,
  injectPorts,
  getPorts,
  LOCAL_NAV_EVENTS,
  VERSION,
  MODULE_ID
};
export {
  LOCAL_NAV_EVENTS,
  MODULE_ID,
  NavigationController,
  VERSION,
  createNavigationController,
  navigation_controller_default as default,
  getPorts,
  injectPorts
};
