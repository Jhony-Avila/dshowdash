import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { layoutStore } from "../state/store.js";
import { trackLayoutEvent } from "../telemetry/tracker.js";
import { LAYOUT_ACTIONS } from "../core/state-machine.js";
import { LayoutLifecycle } from "../core/lifecycle.js";
const VERSION = "1.4.0-P18EC";
const MODULE_ID = "layout-manager-globalstate";
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_BASE_DELAY = 300;
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
let globalStateCleanups = [];
let _retryState = { attempts: 0, connected: false };
let _metrics = { syncs: 0 };
const _log = function(level, ...rest) {
  const args = rest.length ? rest : Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
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
  _metrics = { syncs: 0 };
  _retryState = { attempts: 0, connected: false };
}
function setup(attempt) {
  if (attempt === void 0) attempt: any = 1;
  _retryState.attempts = attempt;
  _initPorts();
  const globalState = _getPort("globalState");
  if (!globalState) {
    if (attempt < MAX_RETRY_ATTEMPTS) {
      const delay = RETRY_BASE_DELAY * attempt;
      _log("warn", `GlobalState not available, retry ${attempt}/${MAX_RETRY_ATTEMPTS} in ${delay}ms`);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(setup(attempt + 1));
        }, delay);
      });
    }
    _log("error", "GlobalState not available after max retries");
    trackLayoutEvent("layout:global-state:retry-exhausted", { attempts: attempt });
    return Promise.resolve(false);
  }
  try {
    const unsubscribeCompact = globalState.subscribe((compactMode) => {
      if (compactMode !== layoutStore.isCompact()) {
        const action = compactMode ? LAYOUT_ACTIONS.TO_COMPACT : LAYOUT_ACTIONS.TO_DEFAULT;
        smTransition(action, { source: "GlobalState" });
        _metrics.syncs++;
        trackLayoutEvent("layout:global-state:compact-synced", { compact: compactMode });
      }
    }, "preferences.compactMode");
    globalStateCleanups.push(unsubscribeCompact);
    const unsubscribeLoading = globalState.subscribe((isLoading) => {
      LayoutLifecycle.setGlobalLoading(isLoading);
      _metrics.syncs++;
      trackLayoutEvent("layout:global-state:loading-synced", { loading: isLoading });
    }, "app.isLoading");
    globalStateCleanups.push(unsubscribeLoading);
    _retryState.connected = true;
    trackLayoutEvent("layout:global-state:connected", { attempts: attempt });
    _log("info", `\u2705 GlobalState connected (attempt ${attempt})`);
    return Promise.resolve(true);
  } catch (error) {
    _log("error", "GlobalState integration error:", error.message);
    return Promise.resolve(false);
  }
}
function cleanup() {
  globalStateCleanups.forEach((fn) => {
    try {
      if (typeof fn === "function") fn();
    } catch (e) {
    }
  });
  globalStateCleanups = [];
  _retryState.connected = false;
}
function retry() {
  cleanup();
  _retryState.attempts = 0;
  return setup(1);
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
