import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:feature-loader";
const hasWindow = typeof window !== "undefined";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _features = /* @__PURE__ */ new Map();
const _failedFeatures = [];
const loadFeature = async (name, importFn) => {
  if (_features.has(name)) return _features.get(name);
  try {
    const module = await importFn();
    _features.set(name, module);
    return module;
  } catch (e) {
    const logger = _getPort("logger");
    if (logger?.warn) logger.warn(`[${MODULE_ID}] Failed to load feature: ${name}`, { error: e.message });
    _failedFeatures.push(name);
    return null;
  }
};
const safeExecute = (name, fn, options = {}) => {
  try {
    return fn();
  } catch (e) {
    const logger = _getPort("logger");
    if (logger?.error) logger.error(`[${MODULE_ID}] Error in ${name}`, { error: e.message });
    return options.fallback !== void 0 ? options.fallback : null;
  }
};
const initFeature = (name, initFn, options = {}) => safeExecute(name, initFn, options);
const initFeatureAsync = async (name, initFn, options = {}) => {
  try {
    return await initFn();
  } catch (e) {
    const logger = _getPort("logger");
    if (logger?.error) logger.error(`[${MODULE_ID}] Async error in ${name}`, { error: e.message });
    return options.fallback !== void 0 ? options.fallback : null;
  }
};
const getLoadedFeatures = () => Array.from(_features.keys());
const isFeatureLoaded = (name) => _features.has(name);
const getFeatureStatus = () => ({ loaded: Array.from(_features.keys()), failed: [..._failedFeatures] });
const clearFeatures = () => {
  _features.clear();
  _failedFeatures.length = 0;
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, loadedFeatures: getLoadedFeatures() });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, featuresCount: _features.size });
var feature_loader_default = { loadFeature, safeExecute, initFeature, initFeatureAsync, getLoadedFeatures, isFeatureLoaded, getFeatureStatus, clearFeatures, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  clearFeatures,
  feature_loader_default as default,
  getFeatureStatus,
  getLoadedFeatures,
  getPorts,
  healthCheck,
  info,
  initFeature,
  initFeatureAsync,
  injectPorts,
  isFeatureLoaded,
  loadFeature,
  safeExecute
};
