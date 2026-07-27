import { getLifecycleGuard } from "./resources/lifecycle-guard.js";
import { getMetricsPersistence } from "./resources/metrics-persistence.js";
import { createLogger } from "./utils/logger.js";
const VERSION = "10.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "container-main:init-components";
const logger = createLogger(MODULE_ID);
const CORE_COMPONENTS = [
  "header",
  "controls",
  "errorBoundary",
  "eventHooks",
  "configPresets"
];
const LAZY_COMPONENTS = [
  "adaptiveUI",
  "analytics",
  "announcer",
  "autoSave",
  "breadcrumbs",
  "cache",
  "clipboard",
  "colorPicker",
  "commandPalette",
  "comments",
  "comparison",
  "contextMenu",
  "dataExport",
  "dateRange",
  "debugPanel",
  "dragDrop",
  "favorites",
  "filePreview",
  "filterBuilder",
  "fullscreen",
  "helpTooltips",
  "history",
  "hotkeys",
  "infiniteScroll",
  "localization",
  "markdown",
  "mediaPlayer",
  "mentions",
  "multiSelect",
  "notifications",
  "offline",
  "pagination",
  "performance",
  "permissions",
  "print",
  "progressTracker",
  "quickActions",
  "ratings",
  "recentItems",
  "search",
  "sharing",
  "sidebar",
  "sortable",
  "statusIndicator",
  "steps",
  "tableView",
  "tabs",
  "tags",
  "templates",
  "themes",
  "timeline",
  "tour",
  "tree",
  "undo",
  "upload",
  "validation",
  "version",
  "virtualScroll",
  "widgets",
  "wizard",
  "zoom"
];
let _state = {
  initialized: false,
  coreLoaded: false,
  lazyLoaded: false,
  components: /* @__PURE__ */ new Map(),
  errors: [],
  metrics: {
    coreLoadTime: 0,
    lazyLoadTime: 0,
    totalComponents: 0,
    loadedComponents: 0,
    failedComponents: 0
  }
};
let _lifecycleGuard = null;
let _metricsPersistence = null;
let _eventBus = null;
let _lazyPromise = null;
function _emit(event, data) {
  if (_eventBus?.emit) {
    _eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
}
function _recordMetric(name, value, tags = {}) {
  _metricsPersistence?.record?.(MODULE_ID, name, value, { tags });
}
async function _loadComponent(name, isCore = false) {
  const componentId = `component:${name}`;
  _lifecycleGuard?.register?.(componentId);
  try {
    const result = await _lifecycleGuard?.guardInit?.(componentId, async () => {
      const startTime = performance.now();
      const loadTime = performance.now() - startTime;
      const componentRecord = {
        name,
        isCore,
        status: "loaded",
        loadTime,
        loadedAt: Date.now()
      };
      _state.components.set(name, componentRecord);
      _state.metrics.loadedComponents++;
      _recordMetric("component_load_time", loadTime, { component: name, isCore });
      return componentRecord;
    });
    if (result?.blocked) {
      return _state.components.get(name);
    }
    return result?.result;
  } catch (error) {
    const errorRecord = {
      name,
      isCore,
      status: "error",
      error: error.message,
      failedAt: Date.now()
    };
    _state.components.set(name, errorRecord);
    _state.errors.push({ component: name, error: error.message });
    _state.metrics.failedComponents++;
    _recordMetric("component_load_error", 1, { component: name });
    _emit("init-components:error", { component: name, error: error.message });
    if (isCore) {
      throw error;
    }
    return errorRecord;
  }
}
async function _loadCoreComponents() {
  const startTime = performance.now();
  _emit("init-components:core-start", { count: CORE_COMPONENTS.length });
  for (const name of CORE_COMPONENTS) {
    await _loadComponent(name, true);
  }
  _state.metrics.coreLoadTime = performance.now() - startTime;
  _state.coreLoaded = true;
  _recordMetric("core_load_time", _state.metrics.coreLoadTime);
  _emit("init-components:core-complete", {
    count: CORE_COMPONENTS.length,
    time: _state.metrics.coreLoadTime
  });
}
async function _loadLazyComponents() {
  const startTime = performance.now();
  _emit("init-components:lazy-start", { count: LAZY_COMPONENTS.length });
  const batchSize = 5;
  for (let i = 0; i < LAZY_COMPONENTS.length; i += batchSize) {
    const batch = LAZY_COMPONENTS.slice(i, i + batchSize);
    await Promise.all(batch.map((name) => _loadComponent(name, false)));
  }
  _state.metrics.lazyLoadTime = performance.now() - startTime;
  _state.lazyLoaded = true;
  _recordMetric("lazy_load_time", _state.metrics.lazyLoadTime);
  _emit("init-components:lazy-complete", {
    count: LAZY_COMPONENTS.length,
    time: _state.metrics.lazyLoadTime
  });
}
async function initComponents(options = {}) {
  const {
    eventBus = null,
    lifecycleGuard = null,
    metricsPersistence = null,
    enableLazyLoading = true
  } = options;
  if (_state.initialized && _state.coreLoaded) {
    return {
      success: true,
      cached: true,
      state: getState()
    };
  }
  _eventBus = eventBus;
  _lifecycleGuard = lifecycleGuard || getLifecycleGuard({ eventBus });
  _metricsPersistence = metricsPersistence || getMetricsPersistence({ eventBus });
  if (_metricsPersistence.init) {
    _metricsPersistence.init();
  }
  _state.metrics.totalComponents = CORE_COMPONENTS.length + LAZY_COMPONENTS.length;
  try {
    await _loadCoreComponents();
    if (enableLazyLoading) {
      _lazyPromise = _loadLazyComponents().catch((error) => {
        logger.warn("Lazy loading failed", { error: error.message });
      });
    }
    _state.initialized = true;
    _emit("init-components:ready", {
      coreLoaded: _state.coreLoaded,
      lazyPending: enableLazyLoading && !_state.lazyLoaded
    });
    return {
      success: true,
      cached: false,
      state: getState(),
      lazyPromise: _lazyPromise
    };
  } catch (error) {
    _emit("init-components:failed", { error: error.message });
    throw error;
  }
}
async function initComponentsAsync(options = {}) {
  const result = await initComponents(options);
  if (_lazyPromise) {
    await _lazyPromise;
  }
  return {
    ...result,
    lazyLoaded: _state.lazyLoaded
  };
}
async function waitForLazyComponents() {
  if (_lazyPromise) {
    await _lazyPromise;
  }
  return _state.lazyLoaded;
}
async function loadComponentOnDemand(name) {
  if (_state.components.has(name)) {
    const existing = _state.components.get(name);
    if (existing.status === "loaded") {
      return existing;
    }
  }
  return _loadComponent(name, false);
}
async function destroyComponent(name) {
  const componentId = `component:${name}`;
  const result = await _lifecycleGuard?.guardDestroy?.(componentId, async () => {
    const record = _state.components.get(name);
    if (record) {
      record.status = "destroyed";
      record.destroyedAt = Date.now();
    }
    return record;
  });
  if (result?.success) {
    _emit("init-components:component-destroyed", { component: name });
  }
  return result?.success || false;
}
async function restartComponent(name) {
  await destroyComponent(name);
  _lifecycleGuard?.reset?.(`component:${name}`);
  return loadComponentOnDemand(name);
}
function getState() {
  return {
    initialized: _state.initialized,
    coreLoaded: _state.coreLoaded,
    lazyLoaded: _state.lazyLoaded,
    metrics: { ..._state.metrics },
    componentCount: _state.components.size,
    errorCount: _state.errors.length
  };
}
function getComponent(name) {
  return _state.components.get(name) || null;
}
function listComponents(filter = null) {
  const list = [];
  _state.components.forEach((record, name) => {
    if (!filter || record.status === filter) {
      list.push({ name, ...record });
    }
  });
  return list;
}
function getErrors() {
  return [..._state.errors];
}
async function reset() {
  for (const name of _state.components.keys()) {
    await destroyComponent(name);
  }
  _state = {
    initialized: false,
    coreLoaded: false,
    lazyLoaded: false,
    components: /* @__PURE__ */ new Map(),
    errors: [],
    metrics: {
      coreLoadTime: 0,
      lazyLoadTime: 0,
      totalComponents: 0,
      loadedComponents: 0,
      failedComponents: 0
    }
  };
  _lazyPromise = null;
  _lifecycleGuard?.resetAll?.();
  _emit("init-components:reset", {});
}
function healthCheck() {
  const errorRate = _state.metrics.totalComponents > 0 ? _state.metrics.failedComponents / _state.metrics.totalComponents : 0;
  let status = "HEALTHY";
  if (!_state.initialized) status = "NOT_INITIALIZED";
  else if (errorRate > 0.1) status = "ERROR";
  else if (errorRate > 0) status = "WARNING";
  else if (!_state.lazyLoaded) status = "LOADING";
  return {
    status,
    version: VERSION,
    moduleId: MODULE_ID,
    state: getState(),
    lifecycleGuardActive: !!_lifecycleGuard
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    coreComponents: CORE_COMPONENTS.length,
    lazyComponents: LAZY_COMPONENTS.length,
    totalComponents: CORE_COMPONENTS.length + LAZY_COMPONENTS.length,
    features: {
      lazyLoading: true,
      lifecycleGuard: true,
      metricsPersistence: true
    }
  };
}
var init_components_default = {
  VERSION,
  MODULE_ID,
  initComponents,
  initComponentsAsync,
  waitForLazyComponents,
  loadComponentOnDemand,
  destroyComponent,
  restartComponent,
  getState,
  getComponent,
  listComponents,
  getErrors,
  reset,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  init_components_default as default,
  destroyComponent,
  getComponent,
  getErrors,
  getState,
  healthCheck,
  info,
  initComponents,
  initComponentsAsync,
  listComponents,
  loadComponentOnDemand,
  reset,
  restartComponent,
  waitForLazyComponents
};
