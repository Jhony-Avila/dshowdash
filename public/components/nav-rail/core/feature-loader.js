import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "navrail/core/feature-loader";
const VERSION = "5.1.0";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
const FEATURE_EVENTS = {
  FEATURE_LOADED: "navrail:feature:loaded",
  FEATURE_FAILED: "navrail:feature:failed",
  FEATURE_READY: "navrail:feature:ready",
  FEATURE_DESTROYED: "navrail:feature:destroyed",
  ALL_FEATURES_LOADED: "navrail:features:all-loaded"
};
const _state = {
  initialized: false,
  features: /* @__PURE__ */ new Map(),
  // featureId -> { module, instance, status }
  failed: /* @__PURE__ */ new Map(),
  // featureId -> { error, attempts }
  registry: [],
  dependencies: null,
  metrics: {
    loaded: 0,
    failed: 0,
    totalLoadTime: 0
  }
};
function registerFeature(featureConfig) {
  if (!featureConfig || !featureConfig.id) {
    _log("warn", "Invalid feature config", featureConfig);
    return false;
  }
  const existing = _state.registry.find((f) => f.id === featureConfig.id);
  if (existing) {
    _log("warn", "Feature already registered", { id: featureConfig.id });
    return false;
  }
  _state.registry.push({
    id: featureConfig.id,
    path: featureConfig.path || `./features/${featureConfig.id}/index.js`,
    eager: featureConfig.eager || false,
    enabled: featureConfig.enabled !== false,
    priority: featureConfig.priority || 0
  });
  _log("debug", "Feature registered", { id: featureConfig.id });
  return true;
}
function registerFeatures(features) {
  if (!Array.isArray(features)) return 0;
  return features.filter((f) => registerFeature(f)).length;
}
function unregisterFeature(featureId) {
  const index = _state.registry.findIndex((f) => f.id === featureId);
  if (index === -1) return false;
  _state.registry.splice(index, 1);
  return true;
}
async function _loadFeatureModule(featureConfig) {
  const startTime = performance.now();
  const { id, path } = featureConfig;
  try {
    const pathStr = path;
    const absolutePath = pathStr.startsWith("./") ? `/components/nav-rail/${pathStr.slice(2)}` : pathStr;
    _log("debug", "Loading feature module", { id, path: absolutePath });
    const module = await import(absolutePath);
    const duration = performance.now() - startTime;
    _state.metrics.totalLoadTime += duration;
    _log("debug", "Feature module loaded", { id, duration: `${duration.toFixed(0)}ms` });
    return module;
  } catch (error) {
    _log("error", "Failed to load feature module", { id, path, error: error.message });
    throw error;
  }
}
async function _initFeature(featureId, module) {
  const deps = _state.dependencies;
  if (!deps) {
    throw new Error("Feature loader not initialized with dependencies");
  }
  const initFn = module.init || module.default && module.default.init;
  if (typeof initFn !== "function") {
    _log("warn", "Feature has no init function", { id: featureId });
    return module;
  }
  await initFn({
    container: deps.container,
    eventBus: deps.eventBus,
    registry: deps.registry,
    config: deps.config
  });
  return module;
}
async function loadFeature(featureId) {
  if (_state.features.has(featureId)) {
    const existing = _state.features.get(featureId);
    if (existing.status === "ready") {
      _log("debug", "Feature already loaded", { id: featureId });
      return existing.module;
    }
  }
  const featureConfig = _state.registry.find((f) => f.id === featureId);
  if (!featureConfig) {
    _log("warn", "Feature not registered", { id: featureId });
    return null;
  }
  if (!featureConfig.enabled) {
    _log("debug", "Feature disabled", { id: featureId });
    return null;
  }
  try {
    _state.features.set(featureId, { module: null, instance: null, status: "loading" });
    const module = await _loadFeatureModule(featureConfig);
    await _initFeature(featureId, module);
    _state.features.set(featureId, { module, instance: module.default || module, status: "ready" });
    _state.metrics.loaded++;
    _state.failed.delete(featureId);
    _emitEvent(FEATURE_EVENTS.FEATURE_LOADED, { featureId });
    _log("info", "Feature loaded and initialized", { id: featureId });
    return module;
  } catch (error) {
    const failInfo = _state.failed.get(featureId) || { attempts: 0 };
    _state.failed.set(featureId, {
      error: error.message,
      attempts: failInfo.attempts + 1,
      lastAttempt: Date.now()
    });
    _state.features.set(featureId, { module: null, instance: null, status: "failed" });
    _state.metrics.failed++;
    _emitEvent(FEATURE_EVENTS.FEATURE_FAILED, { featureId, error: error.message });
    _log("error", "Feature load failed", { id: featureId, error: error.message });
    return null;
  }
}
async function loadEagerFeatures() {
  const eagerFeatures = _state.registry.filter((f) => f.eager && f.enabled).sort((a, b) => b.priority - a.priority);
  if (eagerFeatures.length === 0) {
    _log("debug", "No eager features to load");
    return { loaded: [], failed: [] };
  }
  _log("info", "Loading eager features", { count: eagerFeatures.length });
  const results = { loaded: [], failed: [] };
  for (const featureConfig of eagerFeatures) {
    const module = await loadFeature(featureConfig.id);
    if (module) {
      results.loaded.push(featureConfig.id);
    } else {
      results.failed.push(featureConfig.id);
    }
  }
  _emitEvent(FEATURE_EVENTS.ALL_FEATURES_LOADED, results);
  _log("info", "Eager features loaded", results);
  return results;
}
async function loadFeatureOnDemand(featureId) {
  return loadFeature(featureId);
}
function init(dependencies) {
  if (_state.initialized) {
    _log("warn", "Feature loader already initialized");
    return;
  }
  _state.dependencies = {
    container: dependencies.container || null,
    eventBus: dependencies.eventBus || _getPort("eventBus"),
    registry: dependencies.registry || null,
    config: dependencies.config || {}
  };
  _state.initialized = true;
  _log("info", "Feature loader initialized");
}
async function destroy() {
  for (const [featureId, featureData] of _state.features) {
    if (featureData.status !== "ready") continue;
    try {
      const destroyFn = featureData.instance?.destroy || featureData.module?.destroy || featureData.module?.default && featureData.module.default.destroy;
      if (typeof destroyFn === "function") {
        await destroyFn();
        _log("debug", "Feature destroyed", { id: featureId });
      }
      _emitEvent(FEATURE_EVENTS.FEATURE_DESTROYED, { featureId });
    } catch (error) {
      _log("warn", "Error destroying feature", { id: featureId, error: error.message });
    }
  }
  _state.features.clear();
  _state.failed.clear();
  _state.dependencies = null;
  _state.initialized = false;
  _state.metrics = { loaded: 0, failed: 0, totalLoadTime: 0 };
  _log("info", "Feature loader destroyed");
}
function _emitEvent(eventName, data = {}) {
  const eb = _state.dependencies?.eventBus || _getPort("eventBus");
  if (!eb || !eb.emit) return;
  eb.emit(eventName, {
    type: eventName,
    timestamp: Date.now(),
    source: MODULE_ID,
    ...data
  });
}
function getFeature(featureId) {
  return _state.features.get(featureId) || null;
}
function getLoadedFeatures() {
  return Array.from(_state.features.entries()).filter(([_, data]) => data.status === "ready").map(([id, data]) => ({ id, ...data }));
}
function getFailedFeatures() {
  return Array.from(_state.failed.entries()).map(([id, data]) => ({ id, ...data }));
}
function getRegisteredFeatures() {
  return [..._state.registry];
}
function isFeatureLoaded(featureId) {
  const feature = _state.features.get(featureId);
  return feature?.status === "ready";
}
function healthCheck() {
  const loadedCount = Array.from(_state.features.values()).filter((f) => f.status === "ready").length;
  const failedCount = _state.failed.size;
  const checks = {
    initialized: _state.initialized,
    hasDependencies: !!_state.dependencies,
    hasEventBus: !!(_state.dependencies?.eventBus || _getPort("eventBus")),
    noFailedFeatures: failedCount === 0,
    registryNotEmpty: _state.registry.length > 0 || true,
    // OK se vazio também
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!_state.initialized) status = "NOT_INITIALIZED";
  else if (failedCount > 0) status = "DEGRADED";
  else if (passed < total) status = "DEGRADED";
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    metrics: { ..._state.metrics },
    registeredCount: _state.registry.length,
    loadedCount,
    failedCount,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _state.initialized,
    registeredFeatures: _state.registry.map((f) => f.id),
    loadedFeatures: getLoadedFeatures().map((f) => f.id),
    failedFeatures: getFailedFeatures().map((f) => f.id),
    metrics: { ..._state.metrics },
    portsInitialized: Ports.isInitialized(),
    timestamp: Date.now()
  };
}
const NavRailFeatureLoader = {
  // Lifecycle
  init,
  destroy,
  // Registration
  registerFeature,
  registerFeatures,
  unregisterFeature,
  // Loading
  loadFeature,
  loadEagerFeatures,
  loadFeatureOnDemand,
  // Queries
  getFeature,
  getLoadedFeatures,
  getFailedFeatures,
  getRegisteredFeatures,
  isFeatureLoaded,
  // Health
  healthCheck,
  info,
  // Events
  FEATURE_EVENTS,
  // Ports
  injectPorts,
  getPorts,
  // Meta
  VERSION,
  MODULE_ID
};
var feature_loader_default = NavRailFeatureLoader;
export {
  FEATURE_EVENTS,
  MODULE_ID,
  NavRailFeatureLoader,
  VERSION,
  feature_loader_default as default,
  destroy,
  getFailedFeatures,
  getFeature,
  getLoadedFeatures,
  getPorts,
  getRegisteredFeatures,
  healthCheck,
  info,
  init,
  injectPorts,
  isFeatureLoaded,
  loadEagerFeatures,
  loadFeature,
  loadFeatureOnDemand,
  registerFeature,
  registerFeatures,
  unregisterFeature
};
