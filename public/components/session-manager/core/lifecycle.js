import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { RuntimePort } from "../ports/runtime-port.js";
import { sessionStore } from "../state/store.js";
import { TokenManager } from "./token.js";
import { SessionPersistence } from "./persistence.js";
import { SessionAPIClient } from "../api/client.js";
import { initPorts as initPortsBase, getPort as getPortBase, injectPorts as injectPortsBase, isInitialized, getTracker } from "./ports.js";
import { LIFECYCLE_STATES, lifecycleState, stateMetrics, transitionTo, markDegraded, markFailed, markReady, getState, getLifecycleInfo, resetState } from "./state-machine.js";
import { setupAuthEventListeners, setupActivityTracking, cleanupEventListeners, getCleanupCount, getActivityListenerCount } from "./event-listeners.js";
import { syncToGlobalState, setupExpirationMonitor, stopRecovery, stopExpirationMonitor, hasExpirationMonitor, hasRecoveryMonitor, getMetrics as getSyncMetrics } from "./globalstate-sync.js";
const VERSION = "6.2.2-SYNTAX-FIX";
const MODULE_ID = "session-lifecycle";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
  initPortsBase();
}
function _getPort(name) {
  const p = Ports.get(name);
  if (p) return p;
  return getPortBase(name);
}
function injectPorts(p) {
  Ports.inject(p);
  injectPortsBase(p);
  return Ports.snapshot();
}
function getPorts() {
  return Ports.snapshot();
}
function _log(level, msg, ctx) {
  const logger = _getPort("logger");
  if (!logger || typeof logger[level] !== "function") return;
  logger[level](msg, Object.assign({ component: MODULE_ID }, ctx || {}));
}
const _metrics = { inits: 0, shutdowns: 0, resets: 0, errors: 0 };
function init(options) {
  if (options === void 0) options = {};
  if (lifecycleState.state === LIFECYCLE_STATES.READY && !options.force) {
    return Promise.resolve({ ok: true, alreadyInitialized: true, initCount: lifecycleState.initCount });
  }
  if (lifecycleState.state === LIFECYCLE_STATES.INITIALIZING) {
    return Promise.resolve({ ok: false, error: "Already initializing" });
  }
  _metrics.inits++;
  transitionTo(LIFECYCLE_STATES.INITIALIZING);
  lifecycleState.config = options;
  _initPorts();
  const tracker = getTracker();
  if (tracker && tracker.track) {
    tracker.track("session:lifecycle:init:start", { mode: "orchestrator" });
  }
  return Promise.resolve().then(() => {
    if (options.endpoints) SessionAPIClient.configure({ endpoints: options.endpoints });
    if (options.timeout) SessionAPIClient.configure({ timeout: options.timeout });
    const persisted = SessionPersistence.restore();
    if (persisted && persisted.sessionId) {
      sessionStore.update({ sessionId: persisted.sessionId, lastActivity: persisted.lastActivity });
    }
    setupAuthEventListeners();
    if (options.trackActivity !== false) setupActivityTracking();
    if (options.autoRefresh !== false) setupExpirationMonitor(options.refreshThreshold || 3e5);
    if (options.checkOnInit === true) {
      const AuthManager = require("./auth.js").AuthManager;
      return AuthManager.checkSession();
    }
    return Promise.resolve();
  }).then(() => {
    lifecycleState.initCount++;
    lifecycleState.lastInitAt = Date.now();
    lifecycleState.lastError = null;
    if (lifecycleState.degradedReasons.length > 0) {
      transitionTo(LIFECYCLE_STATES.DEGRADED);
    } else {
      transitionTo(LIFECYCLE_STATES.READY);
    }
    const tracker2 = getTracker();
    if (tracker2 && tracker2.track) {
      tracker2.track("session:lifecycle:init:complete", {
        initCount: lifecycleState.initCount,
        state: lifecycleState.state,
        authEventsIntegrated: true
      });
    }
    return { ok: true, alreadyInitialized: false, initCount: lifecycleState.initCount, state: lifecycleState.state };
  }).catch((error) => {
    _metrics.errors++;
    lifecycleState.lastError = error.message;
    transitionTo(LIFECYCLE_STATES.FAILED, error.message);
    const tracker2 = getTracker();
    if (tracker2 && tracker2.track) {
      tracker2.track("session:lifecycle:init:error", { error: error.message });
    }
    return { ok: false, error: error.message, state: lifecycleState.state };
  });
}
function shutdown() {
  _metrics.shutdowns++;
  const tracker = getTracker();
  if (tracker && tracker.track) {
    tracker.track("session:lifecycle:shutdown:start");
  }
  cleanupEventListeners();
  stopExpirationMonitor();
  stopRecovery();
  transitionTo(LIFECYCLE_STATES.SHUTDOWN);
  if (tracker && tracker.track) {
    tracker.track("session:lifecycle:shutdown:complete");
  }
  return { ok: true, state: lifecycleState.state };
}
function destroy() {
  return shutdown();
}
function reset() {
  _metrics.resets++;
  const tracker = getTracker();
  if (tracker && tracker.track) {
    tracker.track("session:lifecycle:reset:start");
  }
  sessionStore.reset();
  TokenManager.clearAll();
  SessionPersistence.clear();
  resetState();
  if (tracker && tracker.track) {
    tracker.track("session:lifecycle:reset:complete");
  }
  return { ok: true, state: lifecycleState.state };
}
function getVersion() {
  return VERSION;
}
function info() {
  const ps = Ports.snapshot();
  const syncMetrics = getSyncMetrics();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    state: lifecycleState.state,
    previousState: lifecycleState.previousState,
    lifecycleInfo: getLifecycleInfo(),
    runtimeAdapter: RuntimePort.getAdapterType(),
    portsInitialized: ps._initialized,
    metrics: Object.assign({}, _metrics, syncMetrics, stateMetrics),
    cleanupCount: getCleanupCount(),
    activityListeners: getActivityListenerCount(),
    hasExpirationMonitor: hasExpirationMonitor(),
    hasRecoveryMonitor: hasRecoveryMonitor(),
    timestamp: Date.now()
  };
}
function healthCheck() {
  const ps = Ports.snapshot();
  const runtimeHealth = RuntimePort.healthCheck();
  const isReady = lifecycleState.state === LIFECYCLE_STATES.READY;
  const isDegraded = lifecycleState.state === LIFECYCLE_STATES.DEGRADED;
  const isFailed = lifecycleState.state === LIFECYCLE_STATES.FAILED;
  _initPorts();
  const eventBus = _getPort("eventBus");
  const checks = {
    stateValid: Object.values(LIFECYCLE_STATES).indexOf(lifecycleState.state) !== -1,
    initialized: isInitialized(),
    notFailed: !isFailed,
    noRecentErrors: !lifecycleState.lastError,
    runtimePortHealthy: runtimeHealth.status === "HEALTHY" || runtimeHealth.status === "DEGRADED",
    eventBusAvailable: !!eventBus,
    cleanupsDefined: getCleanupCount() > 0 || !isInitialized(),
    lowErrorRate: _metrics.inits === 0 || _metrics.errors / _metrics.inits < 0.2,
    portsInitialized: ps._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (isFailed) status = "UNHEALTHY";
  else if (isDegraded || passed < total) status = "DEGRADED";
  return {
    status,
    score: `${passed}/${total}`,
    healthy: passed >= 7,
    checks,
    state: lifecycleState.state,
    degradedReasons: lifecycleState.degradedReasons,
    failedReason: lifecycleState.failedReason,
    runtimeAdapter: RuntimePort.getAdapterType(),
    lastError: lifecycleState.lastError,
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}
const SessionLifecycle = {
  init,
  shutdown,
  destroy,
  reset,
  getState,
  isInitialized,
  getLifecycleInfo,
  LIFECYCLE_STATES,
  markDegraded,
  markFailed,
  markReady,
  syncToGlobalState,
  getVersion,
  info,
  healthCheck
};
var lifecycle_default = SessionLifecycle;
export {
  LIFECYCLE_STATES,
  MODULE_ID,
  SessionLifecycle,
  VERSION,
  lifecycle_default as default,
  getPorts,
  injectPorts
};
