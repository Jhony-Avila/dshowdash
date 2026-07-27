import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { CONTEXT_EVENTS } from "/core/runtime/events/catalog/state.events.js";
import { MODULE_ID, RETRY_MAX, RETRY_DELAY } from "../constants.js";
import { ContextProviderCore } from "../core/provider.js";
import { trackContextEvent } from "../telemetry/tracker.js";
import { integrationState, metrics, cancelOrchestratorRetryTimeout } from "./state.js";
const VERSION = "5.7.0-P1-TIMEOUT";
const MODULE_ID_INT = "context-provider-orchestrator";
const Ports = createCorePorts({ moduleId: `${MODULE_ID}:orchestrator` });
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
let _contextUpdateHandler = null;
let _contextRequestHandler = null;
let _contextResetHandler = null;
function setupOrchestratorIntegration() {
  if (integrationState.orchestratorCleanups.length > 0) {
    return true;
  }
  const eb = _getPort("eventBus");
  if (!eb) {
    if (integrationState.orchestratorRetryCount < RETRY_MAX) {
      integrationState.orchestratorRetryCount++;
      const delay = RETRY_DELAY * integrationState.orchestratorRetryCount;
      _log("info", "EventBus not available, retrying", {
        attempt: integrationState.orchestratorRetryCount,
        delay
      });
      integrationState.orchestratorRetryTimeoutId = setTimeout(setupOrchestratorIntegration, delay);
    } else {
      _log("warn", "EventBus not available after max retries");
    }
    return false;
  }
  if (integrationState.orchestratorRetryTimeoutId !== null) {
    clearTimeout(integrationState.orchestratorRetryTimeoutId);
    integrationState.orchestratorRetryTimeoutId = null;
  }
  try {
    integrationState.lastOrchestratorOwner = "Orchestrator";
    _contextUpdateHandler = (data) => {
      if (!data || !data.context) return;
      try {
        ContextProviderCore.set(data.context, data.value, false, {
          owner: data.owner || "Orchestrator",
          silent: data.silent
        });
        metrics.orchestratorEvents++;
      } catch (e) {
        metrics.orchestratorErrors++;
        _log("warn", "Orchestrator context update failed:", e.message);
      }
    };
    _contextRequestHandler = (data) => {
      if (!data || !data.context) return;
      try {
        const value = ContextProviderCore.get(data.context);
        if (data.callback && typeof data.callback === "function") {
          data.callback(value);
        }
        const ebEmit = _getPort("eventBus");
        if (data.responseEvent && ebEmit && ebEmit.emit) {
          ebEmit.emit(data.responseEvent, { context: data.context, value });
        }
      } catch (e) {
        _log("warn", "Orchestrator context request failed:", e.message);
      }
    };
    _contextResetHandler = (data) => {
      try {
        if (data && data.context) {
          ContextProviderCore.reset(data.context, {
            owner: data.owner || "Orchestrator"
          });
        }
      } catch (e) {
        _log("warn", "Orchestrator context reset failed:", e.message);
      }
    };
    eb.on(CONTEXT_EVENTS.UPDATE, _contextUpdateHandler);
    eb.on(CONTEXT_EVENTS.REQUEST, _contextRequestHandler);
    eb.on(CONTEXT_EVENTS.RESET, _contextResetHandler);
    integrationState.orchestratorCleanups.push(() => {
      const e = _getPort("eventBus");
      if (e && e.off && _contextUpdateHandler) {
        e.off(CONTEXT_EVENTS.UPDATE, _contextUpdateHandler);
      }
    });
    integrationState.orchestratorCleanups.push(() => {
      const e = _getPort("eventBus");
      if (e && e.off && _contextRequestHandler) {
        e.off(CONTEXT_EVENTS.REQUEST, _contextRequestHandler);
      }
    });
    integrationState.orchestratorCleanups.push(() => {
      const e = _getPort("eventBus");
      if (e && e.off && _contextResetHandler) {
        e.off(CONTEXT_EVENTS.RESET, _contextResetHandler);
      }
    });
    _log("info", "Orchestrator integration setup complete");
    try {
      trackContextEvent("context.integration.orchestrator.connected");
    } catch (e) {
    }
    return true;
  } catch (error) {
    _log("error", "Failed to setup Orchestrator integration:", error.message);
    return false;
  }
}
function cleanupOrchestratorIntegration() {
  cancelOrchestratorRetryTimeout();
  for (let i = 0; i < integrationState.orchestratorCleanups.length; i++) {
    try {
      if (typeof integrationState.orchestratorCleanups[i] === "function") {
        integrationState.orchestratorCleanups[i]();
      }
    } catch (e) {
    }
  }
  integrationState.orchestratorCleanups = [];
  _contextUpdateHandler = null;
  _contextRequestHandler = null;
  _contextResetHandler = null;
  _log("info", "Orchestrator integration cleaned up");
}
function retryOrchestratorIntegration() {
  cleanupOrchestratorIntegration();
  integrationState.orchestratorRetryCount = 0;
  return setupOrchestratorIntegration();
}
function info() {
  return {
    moduleId: MODULE_ID_INT,
    version: VERSION,
    hasRetryPending: integrationState.orchestratorRetryTimeoutId !== null,
    retryCount: integrationState.orchestratorRetryCount,
    handlersRegistered: {
      update: _contextUpdateHandler !== null,
      request: _contextRequestHandler !== null,
      reset: _contextResetHandler !== null
    },
    timestamp: Date.now()
  };
}
function healthCheck() {
  const checks = {
    connected: integrationState.orchestratorCleanups.length > 0,
    noRetryPending: integrationState.orchestratorRetryTimeoutId === null,
    withinRetryLimit: integrationState.orchestratorRetryCount <= RETRY_MAX,
    handlersIntact: _contextUpdateHandler !== null || integrationState.orchestratorCleanups.length === 0
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
var orchestrator_default = {
  setupOrchestratorIntegration,
  cleanupOrchestratorIntegration,
  retryOrchestratorIntegration,
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
  cleanupOrchestratorIntegration,
  orchestrator_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  retryOrchestratorIntegration,
  setDebug,
  setupOrchestratorIntegration
};
