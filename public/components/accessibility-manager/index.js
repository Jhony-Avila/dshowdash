import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "2.10.0-P2-ENTERPRISE";
const MODULE_ID = "components.accessibility-manager";
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_BASE_DELAY = 300;
import Store from "./state/store.js";
import * as Helpers from "./utils/helpers.js";
import * as Applier from "./core/applier.js";
import * as Engine from "./core/engine.js";
import * as Lifecycle from "./core/lifecycle.js";
import * as Tracker from "./telemetry/tracker.js";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => _getPort("config")?.app?.debug;
const _log = (level, msg, extra) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}] ${msg}`, extra);
    return;
  }
  if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}] ${msg}`, extra);
    return;
  }
  if (_debug()) {
    logger.debug?.(`[${MODULE_ID}] ${msg}`, extra);
  }
};
const _retryState = {
  contextProviderAttempts: 0,
  contextProviderConnected: false,
  lastSyncAt: null,
  syncCount: 0,
  syncErrors: 0
};
const _integrationsStatus = {
  contextProviderConnected: false,
  eventBusAvailable: false,
  globalStateAvailable: false
};
const _getContextProvider = () => {
  if (typeof window === "undefined") return null;
  const strictMode = isStrict();
  if (window.Core?.windowAdapter?.get) {
    const cp = window.Core.windowAdapter.get("ContextProvider");
    if (cp) return cp;
  }
  return null;
};
const _updateIntegrationsStatus = () => {
  if (typeof window === "undefined") return;
  _integrationsStatus.contextProviderConnected = _retryState.contextProviderConnected;
  _integrationsStatus.eventBusAvailable = !!_getPort("eventBus");
  _integrationsStatus.globalStateAvailable = !!_getPort("globalState");
};
const syncWithContextProvider = () => {
  const cp = _getContextProvider();
  if (!cp?.set) return false;
  try {
    const state = Store.getState();
    cp.set("accessibility", state);
    _retryState.lastSyncAt = Date.now();
    _retryState.syncCount++;
    Tracker.trackEvent("context:synced", void 0);
    return true;
  } catch (e) {
    _retryState.syncErrors++;
    Tracker.trackError("context:sync:failed", e);
    return false;
  }
};
const setupContextProviderIntegration = (attempt = 1) => {
  _retryState.contextProviderAttempts = attempt;
  const cp = _getContextProvider();
  if (!cp?.set) {
    if (attempt < MAX_RETRY_ATTEMPTS) {
      const delay = RETRY_BASE_DELAY * attempt;
      _log("warn", `ContextProvider not available, retry ${attempt}/${MAX_RETRY_ATTEMPTS} in ${delay}ms`);
      return new Promise((r) => setTimeout(r, delay)).then(() => setupContextProviderIntegration(attempt + 1));
    }
    _log("error", "ContextProvider not available after max retries");
    Tracker.trackEvent("context-provider:retry-exhausted", { attempts: attempt, strictMode: isStrict() });
    _updateIntegrationsStatus();
    return Promise.resolve(false);
  }
  try {
    syncWithContextProvider();
    _retryState.contextProviderConnected = true;
    Tracker.trackEvent("context-provider:connected", { attempts: attempt });
    _log("info", `ContextProvider connected (attempt ${attempt})`);
    _updateIntegrationsStatus();
    return Promise.resolve(true);
  } catch (error) {
    _log("error", "ContextProvider integration error:", error.message);
    _updateIntegrationsStatus();
    return Promise.resolve(false);
  }
};
const retryContextProviderIntegration = () => {
  _retryState.contextProviderConnected = false;
  _updateIntegrationsStatus();
  return setupContextProviderIntegration(1);
};
const init = (options = {}) => {
  _initPorts();
  return Lifecycle.init(options).then(
    (result) => setupContextProviderIntegration().then(() => {
      if (_retryState.contextProviderConnected) {
        Store.subscribe(() => syncWithContextProvider());
      }
      _updateIntegrationsStatus();
      return result;
    })
  );
};
const isInitialized = () => Lifecycle.isInitialized();
const shutdown = () => {
  _retryState.contextProviderConnected = false;
  _updateIntegrationsStatus();
  return Lifecycle.shutdown();
};
const reset = () => Lifecycle.reset();
const enable = (flag) => Engine.enable(flag);
const disable = (flag) => Engine.disable(flag);
const toggle = (flag) => Engine.toggle(flag);
const setFontScale = (scale) => Engine.setFontScale(scale);
const setColorBlindMode = (mode) => Engine.setColorBlindMode(mode);
const getState = () => Store.getState();
const get = (flag) => Engine.get(flag);
const subscribe = (listener) => Store.subscribe(listener);
const status = () => {
  const state = Store.getState();
  const lifecycle = Lifecycle.getLifecycleInfo();
  const activeFlags = [];
  for (const [k, v] of Object.entries(state)) {
    if (typeof v === "boolean" && v) {
      activeFlags.push(k);
    } else if (k === "increasedFontSize" && v > 1) {
      activeFlags.push(k);
    } else if (k === "colorBlindMode" && v !== "none") {
      activeFlags.push(k);
    }
  }
  return {
    initialized: lifecycle.initialized,
    activeFlags,
    appliedClasses: Applier.getAppliedClasses(),
    lastUpdated: Store.getMetadata().lastUpdated,
    integrations: { ..._integrationsStatus }
  };
};
function info() {
  const state = Store.getState();
  const lifecycle = Lifecycle.getLifecycleInfo();
  const trackerStats = Tracker.getStats();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    status: lifecycle.initialized ? "READY" : "NOT_INITIALIZED",
    initialized: lifecycle.initialized,
    portsInitialized: Ports.isInitialized(),
    state,
    lifecycle,
    retryState: { ..._retryState },
    integrations: { ..._integrationsStatus },
    applier: Applier.getApplierState(),
    telemetry: trackerStats,
    components: {
      store: Store.VERSION,
      helpers: Helpers.VERSION,
      applier: Applier.VERSION,
      engine: Engine.VERSION,
      lifecycle: Lifecycle.VERSION,
      tracker: Tracker.VERSION
    },
    timestamp: Date.now()
  };
}
function healthCheck() {
  const lifecycle = Lifecycle.getLifecycleInfo();
  const trackerStats = Tracker.getStats();
  _updateIntegrationsStatus();
  const checks = {
    initialized: lifecycle.initialized,
    noInitError: !lifecycle.lastError,
    storeAvailable: !!Store,
    applierAvailable: !!Applier,
    engineAvailable: !!Engine,
    lifecycleAvailable: !!Lifecycle,
    trackerAvailable: !!Tracker,
    contextProviderConnected: _integrationsStatus.contextProviderConnected,
    lowSyncErrorRate: _retryState.syncCount === 0 || _retryState.syncErrors / _retryState.syncCount < 0.2,
    hasLogger: !!_getPort("logger"),
    portsInitialized: Ports.isInitialized()
  };
  const issues = [];
  let passed = 0;
  for (const [, v] of Object.entries(checks)) {
    if (v) passed++;
  }
  const total = Object.keys(checks).length;
  const st = passed === total ? "HEALTHY" : passed >= total * 0.5 ? "DEGRADED" : "UNHEALTHY";
  if (!checks.initialized) issues.push("not-initialized");
  if (!checks.noInitError) issues.push(`init-error: ${lifecycle.lastError}`);
  if (!checks.contextProviderConnected) issues.push("contextprovider-not-connected");
  return {
    status: st,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    portsInitialized: Ports.isInitialized(),
    integrations: { ..._integrationsStatus },
    retryState: { ..._retryState },
    issues: issues.length > 0 ? issues : null,
    version: VERSION,
    moduleId: MODULE_ID,
    telemetry: {
      totalEvents: trackerStats.events,
      errorEvents: trackerStats.errors
    },
    timestamp: Date.now()
  };
}
const getVersion = () => VERSION;
const debug = {
  getStore: () => Store.toJSON(),
  getApplierState: () => Applier.getApplierState(),
  getAppliedClasses: () => Applier.getAppliedClasses(),
  getLifecycleInfo: () => Lifecycle.getLifecycleInfo(),
  getEventLog: () => Tracker.getEvents(),
  getTrackerStats: () => Tracker.getStats(),
  getRetryState: () => ({ ..._retryState }),
  getIntegrationsStatus: () => ({ ..._integrationsStatus }),
  VALID_FLAGS: Helpers.VALID_FLAGS,
  VALID_COLOR_BLIND_MODES: Helpers.VALID_COLOR_BLIND_MODES,
  detectSystemPreferences: Helpers.detectSystemPreferences,
  versions: {
    main: VERSION,
    store: Store.VERSION,
    helpers: Helpers.VERSION,
    applier: Applier.VERSION,
    engine: Engine.VERSION,
    lifecycle: Lifecycle.VERSION,
    tracker: Tracker.VERSION
  }
};
const Accessibility = {
  init,
  isInitialized,
  shutdown,
  reset,
  enable,
  disable,
  toggle,
  setFontScale,
  setColorBlindMode,
  getState,
  get,
  subscribe,
  status,
  info,
  healthCheck,
  getVersion,
  retryContextProvider: retryContextProviderIntegration,
  syncWithContextProvider,
  injectPorts,
  getPorts,
  debug
};
if (typeof window !== "undefined") {
  if (!isStrict()) {
    window.Accessibility = Accessibility;
    window.AccessibilityVersion = VERSION;
  }
  window.__dev = window.__dev || {};
  window.__dev.accessibility = {
    getVersion: () => VERSION,
    healthCheck: () => Accessibility.healthCheck(),
    info: () => Accessibility.info(),
    status: () => Accessibility.status(),
    retryContextProvider: () => Accessibility.retryContextProvider(),
    getRetryState: () => ({ ..._retryState }),
    getIntegrationsStatus: () => ({ ..._integrationsStatus }),
    syncContext: () => syncWithContextProvider(),
    debug
  };
}
var accessibility_manager_default = Accessibility;
export {
  Accessibility,
  MODULE_ID,
  VERSION,
  accessibility_manager_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
