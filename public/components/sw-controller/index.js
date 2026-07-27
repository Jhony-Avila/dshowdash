import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { SW_EVENTS } from "/core/runtime/events/catalog/sw.events.js";
import { ORCHESTRATOR_EVENTS } from "/core/runtime/events/catalog/orchestrator.events.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { swStore as _swStore } from "./state/store.js";
import { SWRegistration as _SWRegistration } from "./core/registration.js";
import { SWMessaging as _SWMessaging } from "./core/messaging.js";
import { SWLifecycle as _SWLifecycle } from "./core/lifecycle.js";
const swStore = _swStore;
const SWRegistration = _SWRegistration;
const SWMessaging = _SWMessaging;
const SWLifecycle = _SWLifecycle;
import { trackSWEvent, getEventLog, getRecentEvents, clearEventLog } from "./telemetry/tracker.js";
import { getCacheNames, clearAllCaches, getCacheSize, formatBytes, getStorageEstimate } from "./utils/helpers.js";
const VERSION = "2.8.0-P2-ENTERPRISE";
const MODULE_ID = "sw-controller";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const log = {
  info: (msg, ctx) => {
    const logger = _getPort("logger");
    logger?.info?.(msg, { component: MODULE_ID, ...ctx });
  },
  warn: (msg, ctx) => {
    const logger = _getPort("logger");
    logger?.warn?.(msg, { component: MODULE_ID, ...ctx });
  },
  error: (msg, ctx) => {
    const logger = _getPort("logger");
    logger?.error?.(msg, { component: MODULE_ID, ...ctx });
  },
  debug: (msg, ctx) => {
    const logger = _getPort("logger");
    logger?.debug?.(msg, { component: MODULE_ID, ...ctx });
  }
};
let orchestratorCleanups = [];
let globalStateCleanups = [];
let destroyed = false;
let initTimestamp = null;
let _metrics = { registrations: 0, updates: 0, cacheClears: 0, errors: 0, lastUpdateAt: null };
const _integrationsStatus = { orchestratorConnected: false, globalStateConnected: false, eventBusAvailable: false, telemetryAvailable: false };
const _updateIntegrationsStatus = () => {
  if (typeof window === "undefined") return;
  _integrationsStatus.orchestratorConnected = orchestratorCleanups.length > 0;
  _integrationsStatus.globalStateConnected = globalStateCleanups.length > 0;
  _integrationsStatus.eventBusAvailable = !!_getPort("eventBus");
  _integrationsStatus.telemetryAvailable = !!_getPort("telemetry");
};
const setupGlobalStateIntegration = () => {
  const globalState = _getPort("globalState");
  if (!globalState) return;
  try {
    const unsubscribeOnline = globalState.subscribe((isOnline) => {
      trackSWEvent("sw:global-state:online-changed", { isOnline, moduleId: MODULE_ID });
    }, "app.isOnline");
    globalStateCleanups.push(unsubscribeOnline);
    trackSWEvent("sw:global-state:connected", { moduleId: MODULE_ID });
    _updateIntegrationsStatus();
  } catch (err) {
    _metrics.errors++;
    trackSWEvent("sw:global-state:connect-error", { error: err.message, moduleId: MODULE_ID });
  }
};
const cleanupGlobalStateIntegration = () => {
  globalStateCleanups.forEach((cleanup) => {
    try {
      if (typeof cleanup === "function") cleanup();
    } catch (err) {
    }
  });
  globalStateCleanups = [];
  _updateIntegrationsStatus();
};
const setupOrchestratorIntegration = () => {
  const eventBus = _getPort("eventBus");
  if (!eventBus) return;
  try {
    const presetHandler = (data) => {
      trackSWEvent("sw:orchestrator:preset-applied", { preset: data?.preset, moduleId: MODULE_ID });
    };
    eventBus.on(ORCHESTRATOR_EVENTS.PRESET_APPLIED, presetHandler);
    orchestratorCleanups.push(() => {
      const eb = _getPort("eventBus");
      eb?.off?.(ORCHESTRATOR_EVENTS.PRESET_APPLIED, presetHandler);
    });
    const unsubscribe = swStore.subscribe(({ action }) => {
      const eb = _getPort("eventBus");
      if (action === "update-available") {
        eb?.emit?.(SW_EVENTS.UPDATE_AVAILABLE, { timestamp: Date.now(), moduleId: MODULE_ID });
      }
    });
    orchestratorCleanups.push(unsubscribe);
    trackSWEvent("sw:orchestrator:connected", { moduleId: MODULE_ID });
    _updateIntegrationsStatus();
  } catch (err) {
    _metrics.errors++;
    trackSWEvent("sw:orchestrator:connect-error", { error: err.message, moduleId: MODULE_ID });
  }
};
const cleanupOrchestratorIntegration = () => {
  orchestratorCleanups.forEach((cleanup) => {
    try {
      if (typeof cleanup === "function") cleanup();
    } catch (err) {
    }
  });
  orchestratorCleanups = [];
  _updateIntegrationsStatus();
};
const getVersion = () => VERSION;
const isInitialized = () => SWLifecycle.isInitialized() && !destroyed;
const healthCheck = () => {
  const storeData = swStore.get();
  _updateIntegrationsStatus();
  const globalState = _getPort("globalState");
  const logger = _getPort("logger");
  const telemetry = _getPort("telemetry");
  const checks = {
    initialized: isInitialized(),
    notDestroyed: !destroyed,
    supported: storeData.supported,
    registered: storeData.registered,
    noRecentError: !storeData.lastError,
    eventBusAvailable: _integrationsStatus.eventBusAvailable,
    globalStateAvailable: !!globalState,
    orchestratorConnected: _integrationsStatus.orchestratorConnected,
    globalStateConnected: _integrationsStatus.globalStateConnected,
    portsInitialized: Ports.isInitialized(),
    loggerAvailable: !!logger,
    telemetryAvailable: !!telemetry
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (passed < total * 0.5) status = "UNHEALTHY";
  else if (passed < total) status = "DEGRADED";
  const issues = [];
  if (!storeData.supported) issues.push("Service Worker not supported");
  if (destroyed) issues.push("Controller is destroyed");
  if (storeData.supported && !storeData.registered) issues.push("Service Worker not registered");
  if (!_integrationsStatus.eventBusAvailable) issues.push("EventBus not available");
  if (storeData.lastError) issues.push(`Last error: ${storeData.lastError}`);
  return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, integrations: { ..._integrationsStatus }, metrics: { ..._metrics }, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
const info = () => {
  const storeData = swStore.get();
  const registration = swStore.getRegistration();
  _updateIntegrationsStatus();
  const cfg = _getPort("config");
  const environment = cfg?.app?.environment || "unknown";
  const logger = _getPort("logger");
  const debugEnabled = logger?.isDebugEnabled?.() || false;
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    versionSW: storeData.versionSW || null,
    status: SWLifecycle.getStatus(),
    healthCheck: healthCheck(),
    metrics: { ..._metrics },
    config: { debug: debugEnabled, environment },
    store: { supported: storeData.supported, registered: storeData.registered, active: storeData.active, waiting: storeData.waiting, installing: storeData.installing, updateAvailable: storeData.updateAvailable, lastCheck: storeData.lastCheck, lastError: storeData.lastError },
    registration: registration ? { scope: registration.scope, updateViaCache: registration.updateViaCache } : null,
    integrations: { ..._integrationsStatus },
    uptime: initTimestamp ? Date.now() - initTimestamp : 0,
    portsInitialized: Ports.isInitialized(),
    timestamp: Date.now()
  };
};
const reset = () => {
  log.info("reset()");
  swStore.reset();
  destroyed = false;
  _metrics = { registrations: 0, updates: 0, cacheClears: 0, errors: 0, lastUpdateAt: null };
  trackSWEvent("sw:api:reset:complete", { moduleId: MODULE_ID });
  return true;
};
const SWController = {
  version: VERSION,
  name: MODULE_ID,
  moduleId: MODULE_ID,
  getVersion,
  healthCheck,
  info,
  isInitialized,
  reset,
  injectPorts,
  getPorts,
  init: (options = {}) => {
    if (destroyed) destroyed = false;
    trackSWEvent("sw:api:init:called", { moduleId: MODULE_ID });
    _initPorts();
    return SWLifecycle.init(options).then((result) => {
      if (result.ok) {
        initTimestamp = Date.now();
        setupGlobalStateIntegration();
        setupOrchestratorIntegration();
      }
      _updateIntegrationsStatus();
      log.info(`Initialized (${VERSION})`);
      return result;
    });
  },
  shutdown: () => {
    trackSWEvent("sw:api:shutdown:called", { moduleId: MODULE_ID });
    cleanupGlobalStateIntegration();
    cleanupOrchestratorIntegration();
    const result = SWLifecycle.shutdown();
    destroyed = true;
    initTimestamp = null;
    log.info("Shutdown complete");
    return result;
  },
  destroy: () => SWController.shutdown(),
  register: (swPath, options = {}) => {
    _metrics.registrations++;
    return SWRegistration.register(swPath, options);
  },
  unregister: () => SWRegistration.unregister(),
  checkForUpdate: () => {
    _metrics.updates++;
    _metrics.lastUpdateAt = Date.now();
    return SWRegistration.update();
  },
  isSupported: () => swStore.isSupported(),
  isRegistered: () => swStore.isRegistered(),
  isActive: () => swStore.isActive(),
  hasUpdate: () => swStore.hasUpdate(),
  applyUpdate: () => {
    if (!swStore.hasUpdate()) return Promise.resolve({ ok: false, error: "No update available" });
    const registration = swStore.getRegistration();
    if (!registration?.waiting) return Promise.resolve({ ok: false, error: "No waiting worker" });
    trackSWEvent("sw:update:apply:start", { moduleId: MODULE_ID });
    SWMessaging.skipWaiting();
    return Promise.resolve({ ok: true });
  },
  sendMessage: (type, data) => SWMessaging.send(type, data),
  onMessage: (type, handler) => SWMessaging.onMessage(type, handler),
  getCacheNames: () => getCacheNames(),
  clearCaches: () => {
    _metrics.cacheClears++;
    trackSWEvent("sw:caches:clear:start", { moduleId: MODULE_ID });
    return clearAllCaches().then((result) => {
      trackSWEvent("sw:caches:clear:complete", { success: result, moduleId: MODULE_ID });
      return result;
    });
  },
  getCacheSize: (cacheName) => getCacheSize(cacheName).then((size) => formatBytes(size)),
  getStorageInfo: () => getStorageEstimate().then((estimate) => {
    if (!estimate) return null;
    return { usage: formatBytes(estimate.usage || 0), quota: formatBytes(estimate.quota || 0), usagePercent: estimate.quota ? `${(estimate.usage / estimate.quota * 100).toFixed(2)}%` : "N/A", usageBytes: estimate.usage || 0, quotaBytes: estimate.quota || 0 };
  }),
  subscribe: (listener) => swStore.subscribe(listener),
  status: () => SWLifecycle.getStatus(),
  getMetrics: () => ({ ..._metrics }),
  getIntegrationsStatus: () => ({ ..._integrationsStatus }),
  debug: {
    getEventLog,
    getRecentEvents,
    clearEventLog,
    getStore: () => swStore.toJSON(),
    getMetrics: () => ({ ..._metrics }),
    getIntegrationsStatus: () => ({ ..._integrationsStatus }),
    forceReset: () => {
      cleanupGlobalStateIntegration();
      cleanupOrchestratorIntegration();
      swStore.reset();
      destroyed = false;
      initTimestamp = null;
      _metrics = { registrations: 0, updates: 0, cacheClears: 0, errors: 0, lastUpdateAt: null };
      return true;
    }
  }
};
if (typeof window !== "undefined") {
  if (!isStrict()) {
    window.SWController = SWController;
    trackSWEvent("sw:global:exposed", { version: VERSION, moduleId: MODULE_ID });
  } else {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "window.SWController" });
  }
  window.__dev = window.__dev || {};
  window.__dev.swController = {
    getVersion,
    getStatus: () => SWLifecycle.getStatus(),
    healthCheck,
    info,
    isInitialized,
    reset,
    getMetrics: () => ({ ..._metrics }),
    getIntegrationsStatus: () => ({ ..._integrationsStatus }),
    getStore: () => swStore.toJSON(),
    getEventLog,
    getRecentEvents,
    clearEventLog,
    forceShutdown: () => SWController.shutdown(),
    forceReset: () => SWController.debug.forceReset()
  };
}
var sw_controller_default = SWController;
export {
  MODULE_ID,
  SWController,
  SWLifecycle,
  SWMessaging,
  SWRegistration,
  VERSION,
  sw_controller_default as default,
  getPorts,
  injectPorts,
  swStore
};
