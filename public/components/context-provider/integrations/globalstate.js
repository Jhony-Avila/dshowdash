import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { MODULE_ID, RETRY_MAX, RETRY_DELAY, MAX_GLOBALSTATE_SIZE } from "../constants.js";
import { ContextProviderCore } from "../core/provider.js";
import { trackContextEvent } from "../telemetry/tracker.js";
import { integrationState, metrics, cancelGlobalStateRetryTimeout } from "./state.js";
import { getMapper } from "./mapper.js";
const VERSION = "5.7.0-P1-TIMEOUT";
const MODULE_ID_INT = "context-provider-globalstate";
const Ports = createUiPorts({ moduleId: `${MODULE_ID}:globalstate` });
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
const _debug = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...args) {
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
  if (_debug() && logger.debug) {
    logger.debug(...[prefix].concat(args));
  }
};
function applyMappedContexts(mappedState) {
  if (!mappedState || typeof mappedState !== "object") return;
  for (const contextName in mappedState) {
    if (mappedState.hasOwnProperty(contextName)) {
      try {
        ContextProviderCore.set(contextName, mappedState[contextName], false, {
          owner: "GlobalState",
          silent: true
        });
      } catch (e) {
        _log("warn", `Failed to set context ${contextName}:`, e.message);
      }
    }
  }
}
function setupGlobalStateIntegration() {
  if (integrationState.globalStateCleanups.length > 0) {
    return true;
  }
  const gs = _getPort("globalState");
  if (!gs) {
    if (integrationState.globalStateRetryCount < RETRY_MAX) {
      integrationState.globalStateRetryCount++;
      const delay = RETRY_DELAY * integrationState.globalStateRetryCount;
      _log("info", "GlobalState not available, retrying", {
        attempt: integrationState.globalStateRetryCount,
        delay
      });
      integrationState.globalStateRetryTimeoutId = setTimeout(setupGlobalStateIntegration, delay);
    } else {
      _log("warn", "GlobalState not available after max retries");
    }
    return false;
  }
  if (integrationState.globalStateRetryTimeoutId !== null) {
    clearTimeout(integrationState.globalStateRetryTimeoutId);
    integrationState.globalStateRetryTimeoutId = null;
  }
  try {
    const mapper = getMapper();
    integrationState.lastGlobalStateOwner = "GlobalState";
    const unsubscribeAll = gs.subscribe((state) => {
      try {
        const mappedState = mapper(state);
        const stateStr = JSON.stringify(mappedState);
        if (stateStr && stateStr.length > MAX_GLOBALSTATE_SIZE) {
          _log("warn", "GlobalState payload too large");
          metrics.payloadTooLarge++;
          if (integrationState.lastValidGlobalState) {
            applyMappedContexts(integrationState.lastValidGlobalState);
            try {
              trackContextEvent("context:global-state:fallback-applied", { reason: "payload-too-large" });
            } catch (e) {
            }
          }
          return;
        }
        integrationState.lastValidGlobalState = mappedState;
        applyMappedContexts(mappedState);
        metrics.globalStateSyncs++;
      } catch (syncError) {
        metrics.globalStateErrors++;
        _log("error", "GlobalState sync error:", syncError.message);
        if (integrationState.lastValidGlobalState) {
          metrics.globalStateFallbacks++;
          applyMappedContexts(integrationState.lastValidGlobalState);
          try {
            trackContextEvent("context:global-state:fallback-applied", { reason: "sync-error" });
          } catch (e) {
          }
        }
      }
    });
    integrationState.globalStateCleanups.push(unsubscribeAll);
    try {
      const initialState = gs.getState ? gs.getState() : gs.get ? gs.get() : null;
      if (initialState) {
        const mappedInitial = mapper(initialState);
        integrationState.lastValidGlobalState = mappedInitial;
        applyMappedContexts(mappedInitial);
      }
    } catch (e) {
      _log("warn", "Failed to get initial GlobalState:", e.message);
    }
    _log("info", "GlobalState integration setup complete");
    try {
      trackContextEvent("context:integration:globalstate:connected");
    } catch (e) {
    }
    return true;
  } catch (error) {
    _log("error", "Failed to setup GlobalState integration:", error.message);
    return false;
  }
}
function cleanupGlobalStateIntegration() {
  cancelGlobalStateRetryTimeout();
  for (let i = 0; i < integrationState.globalStateCleanups.length; i++) {
    try {
      if (typeof integrationState.globalStateCleanups[i] === "function") {
        integrationState.globalStateCleanups[i]();
      }
    } catch (e) {
    }
  }
  integrationState.globalStateCleanups = [];
  _log("info", "GlobalState integration cleaned up");
}
function retryGlobalStateIntegration() {
  cleanupGlobalStateIntegration();
  integrationState.globalStateRetryCount = 0;
  return setupGlobalStateIntegration();
}
function info() {
  return {
    moduleId: MODULE_ID_INT,
    version: VERSION,
    hasRetryPending: integrationState.globalStateRetryTimeoutId !== null,
    retryCount: integrationState.globalStateRetryCount,
    timestamp: Date.now()
  };
}
function healthCheck() {
  const checks = {
    connected: integrationState.globalStateCleanups.length > 0,
    noRetryPending: integrationState.globalStateRetryTimeoutId === null,
    withinRetryLimit: integrationState.globalStateRetryCount <= RETRY_MAX
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    moduleId: MODULE_ID_INT,
    version: VERSION,
    timestamp: Date.now()
  };
}
const setDebug = (enabled) => {
};
var globalstate_default = {
  setupGlobalStateIntegration,
  cleanupGlobalStateIntegration,
  retryGlobalStateIntegration,
  setDebug,
  injectPorts,
  getPorts,
  info,
  healthCheck,
  VERSION,
  MODULE_ID: MODULE_ID_INT
};
export {
  MODULE_ID_INT,
  VERSION,
  cleanupGlobalStateIntegration,
  globalstate_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  retryGlobalStateIntegration,
  setDebug,
  setupGlobalStateIntegration
};
