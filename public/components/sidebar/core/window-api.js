import { VERSION, MODULE_ID, CAPABILITIES } from "./constants.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { checkSync, forceSync as forcePersistenceSync } from "./state-persistence.js";
import SidebarRegistry from "../registry/registry.js";
import * as Kernel from "../kernel/index.js";
import * as MetricsHub from "../telemetry/metrics-hub.js";
import { FEATURE_CONTRACTS } from "./feature-contracts/index.js";
import { getFeatureProxy, preloadFeatures, getUsageMetrics as getProxyMetrics, healthCheck as proxyHealthCheck } from "./feature-proxy.js";
import { applyLegacyBridge, getDeprecationReport as configureLegacy } from "./legacy-bridge.js";
import { SIDEBAR_FEATURES } from "../features/_barrel.js";
const API_VERSION = "5.3.0-P2-ENTERPRISE";
const API_MODULE_ID = "sidebar-window-api";
const TOTAL_FEATURES = 30;
const _ports = createUiPorts({ moduleId: API_MODULE_ID });
function _initPorts() {
  _ports.init();
}
function _getPort(name) {
  return _ports.get(name);
}
function injectPorts(p) {
  return _ports.inject(p);
}
function getPorts() {
  return _ports.snapshot();
}
function _getLogger() {
  const portLogger = _getPort("logger");
  if (portLogger) return portLogger;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get("Logger");
    if (waLogger) return waLogger;
  }
  return null;
}
const _log = (level, ...args) => {
  const prefix = `[WindowAPI]`;
  const logger = _getLogger();
  if (logger?.[level]) {
    logger[level](prefix, ...args);
  } else if (!isStrict() && (level === "error" || level === "warn" || level === "info")) {
    console.debug(prefix, ...args);
  }
};
function _getEventBus() {
  const portEventBus = _getPort("eventBus") || _getPort("eventBusGlobal");
  if (portEventBus) return portEventBus;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waEventBus = window.Core.windowAdapter.get("EventBus");
    if (waEventBus) return waEventBus;
  }
  return null;
}
const _state = {
  initialized: false,
  setupAt: null,
  getInstance: null,
  getSidebarEl: null,
  featureCache: /* @__PURE__ */ new Map(),
  legacyBridgeApplied: false,
  featuresPreloaded: false,
  readyListenerCleanup: null
};
const _metrics = {
  apiCalls: 0,
  setupCalls: 0,
  featureLoads: 0,
  errors: 0,
  lastCallAt: null,
  mostUsedMethods: {},
  preloadStartedAt: null,
  preloadCompletedAt: null
};
function _trackCall(methodName) {
  _metrics.apiCalls++;
  _metrics.lastCallAt = Date.now();
  _metrics.mostUsedMethods[methodName] = (_metrics.mostUsedMethods[methodName] || 0) + 1;
}
async function _featureResolver(featureName, contract) {
  if (!contract || !contract.module) return null;
  try {
    const moduleName = contract.module.endsWith(".js") ? contract.module.slice(0, -3) : contract.module;
    const module = SIDEBAR_FEATURES[moduleName];
    if (!module) {
      _metrics.errors++;
      _log("warn", `Feature not found in barrel: ${moduleName}`);
      return null;
    }
    _metrics.featureLoads++;
    return module;
  } catch (error) {
    _metrics.errors++;
    _log("warn", `Failed to load feature: ${featureName}`, error.message);
    return null;
  }
}
function _getFeature(featureName) {
  return getFeatureProxy(featureName, FEATURE_CONTRACTS, _featureResolver);
}
function _invokeFeature(featureId, methodName, ...args) {
  const feature = _state.featureCache.get(featureId);
  if (!feature || typeof feature[methodName] !== "function") return void 0;
  try {
    return feature[methodName](...args);
  } catch (error) {
    _metrics.errors++;
    _log("warn", `Error invoking ${featureId}.${methodName}:`, error.message);
    return void 0;
  }
}
async function _getFeatureLegacy(featureId) {
  if (_state.featureCache.has(featureId)) return _state.featureCache.get(featureId);
  try {
    const module = SIDEBAR_FEATURES[featureId];
    if (!module) {
      _metrics.errors++;
      _log("warn", `Feature not found in barrel: ${featureId}`);
      return null;
    }
    _state.featureCache.set(featureId, module);
    _metrics.featureLoads++;
    return module;
  } catch (error) {
    _metrics.errors++;
    _log("warn", `Failed to load feature: ${featureId}`, error.message);
    return null;
  }
}
async function _preloadFeatures() {
  if (_state.featuresPreloaded) return;
  _metrics.preloadStartedAt = Date.now();
  const criticalFeatures = ["favorites", "theme", "search", "commands", "context", "submenu", "resize"];
  try {
    await preloadFeatures(criticalFeatures, FEATURE_CONTRACTS, _featureResolver);
    const legacyFeatures = ["theme-handler", "resize-handler", "favorites-handler", "command-palette", "fuzzy-search", "context-menu", "submenu-handler"];
    await Promise.all(legacyFeatures.map((id) => _getFeatureLegacy(id)));
    _state.featuresPreloaded = true;
    _metrics.preloadCompletedAt = Date.now();
    _log("info", "Features preloaded post-READY", { duration: _metrics.preloadCompletedAt - _metrics.preloadStartedAt, featuresCount: criticalFeatures.length + legacyFeatures.length });
  } catch (error) {
    _metrics.errors++;
    _log("warn", "Preload failed:", error.message);
  }
}
function _setupReadyListener() {
  const bus = _getEventBus();
  if (!bus || !bus.on) {
    _log("warn", "No EventBus, preloading immediately");
    _preloadFeatures();
    return;
  }
  const handleReady = () => {
    _preloadFeatures();
    if (_state.readyListenerCleanup) {
      _state.readyListenerCleanup();
      _state.readyListenerCleanup = null;
    }
  };
  const cleanup = bus.on(SIDEBAR_EVENTS.READY, handleReady);
  if (typeof cleanup === "function") {
    _state.readyListenerCleanup = cleanup;
  } else {
    _state.readyListenerCleanup = () => {
      if (bus.off) bus.off(SIDEBAR_EVENTS.READY, handleReady);
    };
  }
  setTimeout(() => {
    if (!_state.featuresPreloaded) {
      _log("warn", "READY timeout, preloading now");
      _preloadFeatures();
    }
  }, 5e3);
}
function setupWindowAPI(getInstance, getSidebarEl, createSidebar, destroySidebar) {
  if (typeof window === "undefined") return;
  _metrics.setupCalls++;
  _state.initialized = true;
  _state.setupAt = Date.now();
  _state.getInstance = getInstance;
  _state.getSidebarEl = getSidebarEl;
  _initPorts();
  _setupReadyListener();
  if (isStrict()) {
    _log("info", "Strict mode: window.Sidebar not exposed");
    return;
  }
  window.Sidebar = {
    createSidebar: () => {
      _trackCall("createSidebar");
      return createSidebar();
    },
    getSidebar: () => {
      _trackCall("getSidebar");
      return getInstance();
    },
    destroySidebar: () => {
      _trackCall("destroySidebar");
      return destroySidebar();
    },
    toggle: () => {
      _trackCall("toggle");
      return getInstance()?.toggle?.();
    },
    collapse: () => {
      _trackCall("collapse");
      return getInstance()?.collapse?.();
    },
    expand: () => {
      _trackCall("expand");
      return getInstance()?.expand?.();
    },
    getState: () => {
      _trackCall("getState");
      return getInstance()?.getState?.();
    },
    getMetrics: () => {
      _trackCall("getMetrics");
      return MetricsHub.aggregate().data;
    },
    healthCheck: () => {
      _trackCall("healthCheck");
      return getInstance()?.healthCheck?.();
    },
    info: () => {
      _trackCall("info");
      return getInstance()?.info?.();
    },
    refresh: () => {
      _trackCall("refresh");
      return getInstance()?.refresh?.();
    },
    navigate: (id) => {
      _trackCall("navigate");
      return getInstance()?.navigate?.(id);
    },
    setActiveItem: (id) => {
      _trackCall("setActiveItem");
      return getInstance()?.setActiveItem?.(id);
    },
    toggleSection: (id) => {
      _trackCall("toggleSection");
      return getInstance()?.toggleSection?.(id);
    },
    expandSection: (id) => {
      _trackCall("expandSection");
      return getInstance()?.expandSection?.(id);
    },
    collapseSection: (id) => {
      _trackCall("collapseSection");
      return getInstance()?.collapseSection?.(id);
    },
    expandAllSections: () => {
      _trackCall("expandAllSections");
      return getInstance()?.expandAllSections?.();
    },
    collapseAllSections: () => {
      _trackCall("collapseAllSections");
      return getInstance()?.collapseAllSections?.();
    },
    getExpandedSections: () => {
      _trackCall("getExpandedSections");
      return getInstance()?.getExpandedSections?.();
    },
    openMobile: () => {
      _trackCall("openMobile");
      return getInstance()?.openMobile?.();
    },
    closeMobile: () => {
      _trackCall("closeMobile");
      return getInstance()?.closeMobile?.();
    },
    toggleMobile: () => {
      _trackCall("toggleMobile");
      return getInstance()?.toggleMobile?.();
    },
    forceSync: () => {
      _trackCall("forceSync");
      return getInstance()?.forceSync?.();
    },
    checkPersistenceSync: () => {
      _trackCall("checkPersistenceSync");
      return checkSync();
    },
    forcePersistenceSync: () => {
      _trackCall("forcePersistenceSync");
      return forcePersistenceSync();
    },
    feature: (featureName) => {
      _trackCall(`feature:${featureName}`);
      return _getFeature(featureName);
    },
    kernel: {
      listFeatures: () => Kernel.listFeatures(),
      getFeatureStatus: (id) => Kernel.getFeatureStatus(id),
      enableFeature: (id, opts) => Kernel.enableFeature(id, opts),
      disableFeature: (id, reason) => Kernel.disableFeature(id, reason),
      metrics: () => Kernel.metrics(),
      healthCheck: () => Kernel.healthCheck()
    },
    metrics: {
      aggregate: () => MetricsHub.aggregate(),
      getSourceMetrics: (id) => MetricsHub.getSourceMetrics(id),
      listSources: () => MetricsHub.listSources(),
      takeSnapshot: (label) => MetricsHub.takeSnapshot(label),
      getSnapshots: (limit) => MetricsHub.getSnapshots(limit)
    },
    registry: {
      setBadge: (itemId, badge) => SidebarRegistry.setBadge(itemId, badge),
      getBadge: (itemId) => SidebarRegistry.getBadge(itemId),
      removeBadge: (itemId) => SidebarRegistry.removeBadge(itemId),
      getItem: (id) => SidebarRegistry.getItem?.(id),
      getItems: () => SidebarRegistry.getItems?.()
    },
    showSkeleton: (count) => {
      _trackCall("showSkeleton");
      return getInstance()?._renderer?.showSkeleton?.(count);
    },
    hideSkeleton: () => {
      _trackCall("hideSkeleton");
      return getInstance()?._renderer?.hideSkeleton?.();
    },
    setLoading: (loading) => {
      _trackCall("setLoading");
      return getInstance()?._renderer?.setLoading?.(loading);
    },
    animateIn: () => {
      _trackCall("animateIn");
      return getSidebarEl()?.classList.add(C.MOD_ANIMATE_IN);
    },
    enableMiniMode: () => {
      _trackCall("enableMiniMode");
      return getSidebarEl()?.classList.add(C.MOD_MINI);
    },
    disableMiniMode: () => {
      _trackCall("disableMiniMode");
      return getSidebarEl()?.classList.remove(C.MOD_MINI);
    },
    toggleMiniMode: () => {
      _trackCall("toggleMiniMode");
      return getSidebarEl()?.classList.toggle(C.MOD_MINI);
    },
    enableCompactMode: () => {
      _trackCall("enableCompactMode");
      return getSidebarEl()?.classList.add(C.MOD_COMPACT);
    },
    disableCompactMode: () => {
      _trackCall("disableCompactMode");
      return getSidebarEl()?.classList.remove(C.MOD_COMPACT);
    },
    toggleCompactMode: () => {
      _trackCall("toggleCompactMode");
      return getSidebarEl()?.classList.toggle(C.MOD_COMPACT);
    },
    search: (query) => {
      _trackCall("search");
      return getInstance()?._renderer?.filterItems?.(query);
    },
    clearSearch: () => {
      _trackCall("clearSearch");
      return getInstance()?._renderer?.clearSearch?.();
    },
    config: {
      legacyWarnings: true,
      setLegacyWarnings: (enabled) => {
        window.Sidebar.config.legacyWarnings = enabled;
        configureLegacy({ showWarnings: enabled });
      },
      getDeprecationReport: () => configureLegacy(),
      getFeatureContracts: () => ({ ...FEATURE_CONTRACTS }),
      listFeatures: () => Object.keys(FEATURE_CONTRACTS)
    },
    VERSION,
    MODULE_ID,
    CAPABILITIES,
    TOTAL_FEATURES,
    API_VERSION,
    getAPIMetrics: () => getAPIMetrics(),
    getAPIInfo: () => info(),
    getAPIHealthCheck: () => healthCheck(),
    getProxyMetrics: () => getProxyMetrics()
  };
  applyLegacyBridge(window.Sidebar, _getFeature);
  _state.legacyBridgeApplied = true;
  configureLegacy({ showWarnings: window.Sidebar.config.legacyWarnings });
}
function healthCheck() {
  const hasInstance = _state.getInstance && typeof _state.getInstance === "function";
  const instanceExists = hasInstance && _state.getInstance() !== null;
  const windowAPIExists = typeof window !== "undefined" && window.Sidebar !== void 0;
  const portsInitialized = _ports.isInitialized();
  const kernelHealth = Kernel.healthCheck();
  const proxyHealth = proxyHealthCheck();
  const checks = {
    initialized: _state.initialized,
    instanceExists,
    windowAPIExists,
    portsInitialized,
    kernelReady: kernelHealth.status === "HEALTHY",
    legacyBridgeApplied: _state.legacyBridgeApplied,
    proxyHealthy: proxyHealth.status === "HEALTHY",
    featuresPreloaded: _state.featuresPreloaded,
    noErrors: _metrics.errors === 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (passed < total && passed >= Math.floor(total * 0.6)) status = "DEGRADED";
  if (passed < Math.floor(total * 0.6)) status = "UNHEALTHY";
  return {
    status,
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    checks,
    issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => ({ code: k, severity: "warn", message: `Check failed: ${k}` })),
    moduleId: API_MODULE_ID,
    version: API_VERSION,
    architecture: "Facade + FeatureProxy + Legacy Bridge",
    ports: { initialized: portsInitialized, missing: [] },
    strictMode: isStrict(),
    timestamp: Date.now()
  };
}
function info() {
  const topMethods = Object.entries(_metrics.mostUsedMethods).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([method, count]) => ({ method, count }));
  return {
    moduleId: API_MODULE_ID,
    version: API_VERSION,
    architecture: "Facade + FeatureProxy + Legacy Bridge",
    initialized: _state.initialized,
    setupAt: _state.setupAt,
    totalFeatures: TOTAL_FEATURES,
    featuresCached: _state.featureCache.size,
    featuresPreloaded: _state.featuresPreloaded,
    legacyBridgeApplied: _state.legacyBridgeApplied,
    availableFeatures: Object.keys(FEATURE_CONTRACTS).length,
    portsInitialized: _ports.isInitialized(),
    strictMode: isStrict(),
    metrics: { ..._metrics },
    proxyMetrics: getProxyMetrics(),
    topMethods,
    timestamp: Date.now()
  };
}
function getAPIMetrics() {
  return { ..._metrics, featuresCached: _state.featureCache.size, featuresPreloaded: _state.featuresPreloaded, proxyMetrics: getProxyMetrics(), topMethods: Object.entries(_metrics.mostUsedMethods).sort((a, b) => b[1] - a[1]).slice(0, 20) };
}
var window_api_default = { setupWindowAPI, healthCheck, info, getAPIMetrics, API_VERSION, API_MODULE_ID, injectPorts, getPorts };
export {
  API_MODULE_ID,
  API_VERSION,
  window_api_default as default,
  getAPIMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  setupWindowAPI
};
