import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { LAYOUT_EVENTS } from "/core/runtime/events/catalog/layout.events.js";
import { ORCHESTRATOR_EVENTS } from "/core/runtime/events/catalog/orchestrator.events.js";
import { layoutStore } from "../state/store.js";
import { LayoutLifecycle } from "../core/lifecycle.js";
import { trackLayoutEvent } from "../telemetry/tracker.js";
import { handleLegacyRequest } from "../core/state-machine.js";
const VERSION = "1.5.0-P18EC";
const MODULE_ID = "layout-manager-orchestrator";
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_BASE_DELAY = 300;
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
let _debug = false;
let orchestratorCleanups = [];
let _retryState = { attempts: 0, connected: false };
let _metrics = { presets: 0 };
const _log = function(level, ...rest) {
  const logger = _getPort("logger");
  if (!logger) return;
  const args = rest.length ? rest : Array.prototype.slice.call(arguments, 1);
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(...[prefix].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...[prefix].concat(args));
    return;
  }
  if (_debug && logger.debug) logger.debug(...[prefix].concat(args));
};
function setDebug(debug) {
  _debug = debug;
}
function getRetryState() {
  return Object.assign({}, _retryState);
}
function isConnected() {
  return _retryState.connected;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics = { presets: 0 };
  _retryState = { attempts: 0, connected: false };
}
function setup(syncCallback, attempt) {
  if (attempt === void 0) attempt: any = 1;
  _retryState.attempts = attempt;
  _initPorts();
  const eventBus = _getPort("eventBus");
  if (!eventBus) {
    if (attempt < MAX_RETRY_ATTEMPTS) {
      const delay = RETRY_BASE_DELAY * attempt;
      _log("warn", `EventBus not available, retry ${attempt}/${MAX_RETRY_ATTEMPTS} in ${delay}ms`);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(setup(syncCallback, attempt + 1));
        }, delay);
      });
    }
    _log("error", "EventBus not available after max retries");
    trackLayoutEvent("layout.orchestrator.retry-exhausted", { attempts: attempt });
    return Promise.resolve(false);
  }
  try {
    const presetHandler = (data) => {
      if (data && data.layout) {
        if (data.layout.mode) {
          const result = handleLegacyRequest(data.layout.mode, { source: "Orchestrator" });
          _log("info", "Orchestrator preset via SM:", result);
        }
        if (data.layout.sidebarCollapsed !== void 0) layoutStore.setSidebarCollapsed(data.layout.sidebarCollapsed);
        if (LayoutLifecycle._applyBodyClasses) LayoutLifecycle._applyBodyClasses();
        _metrics.presets++;
        trackLayoutEvent("layout.orchestrator.preset-applied", { layout: data.layout });
        if (syncCallback) syncCallback();
      }
    };
    eventBus.on(ORCHESTRATOR_EVENTS.PRESET_APPLIED, presetHandler);
    orchestratorCleanups.push(() => {
      const eb = _getPort("eventBus");
      if (eb && eb.off) eb.off(ORCHESTRATOR_EVENTS.PRESET_APPLIED, presetHandler);
    });
    const unsubscribe = layoutStore.subscribe((ref) => {
      const action = ref.action;
      if (action === "breakpoint-change") {
        const eb = _getPort("eventBus");
        if (eb && eb.emit) {
          eb.emit(LAYOUT_EVENTS.BREAKPOINT_CHANGED, { breakpoint: layoutStore.getBreakpoint(), dimensions: layoutStore.getDimensions() });
        }
        if (syncCallback) syncCallback();
      }
    });
    orchestratorCleanups.push(unsubscribe);
    _retryState.connected = true;
    trackLayoutEvent("layout.orchestrator.connected", { attempts: attempt });
    _log("info", `\u2705 Orchestrator/EventBus connected (attempt ${attempt})`);
    return Promise.resolve(true);
  } catch (error) {
    _log("error", "Orchestrator integration error:", error.message);
    return Promise.resolve(false);
  }
}
function cleanup() {
  orchestratorCleanups.forEach((fn) => {
    try {
      if (typeof fn === "function") fn();
    } catch (e) {
    }
  });
  orchestratorCleanups = [];
  _retryState.connected = false;
}
function retry(syncCallback) {
  cleanup();
  _retryState.attempts = 0;
  return setup(syncCallback, 1);
}
export {
  MODULE_ID,
  VERSION,
  cleanup,
  getMetrics,
  getPorts,
  getRetryState,
  injectPorts,
  isConnected,
  resetMetrics,
  retry,
  setDebug,
  setup
};
