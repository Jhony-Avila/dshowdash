const MODULE_ID = "sidebar-kernel-config-loader";
const VERSION = "1.1.0-ES6";
const DEFAULT_CONFIG = {
  logLevel: "info",
  kernel: {
    enableConsoleCommands: true,
    enableHealthMonitor: true,
    enableCircuitBreaker: true
  },
  features: {}
};
let _config = null;
let _loaded = false;
function _deepMerge(target, source) {
  const result = Object.assign({}, target);
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        result[key] = _deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}
async function loadConfig(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      _config = Object.assign({}, DEFAULT_CONFIG);
      return { ok: true, config: _config, source: "default" };
    }
    const json = await response.json();
    _config = _deepMerge(DEFAULT_CONFIG, json);
    _loaded = true;
    return { ok: true, config: _config, source: "file" };
  } catch (e) {
    _config = Object.assign({}, DEFAULT_CONFIG);
    return { ok: true, config: _config, source: "default", error: e.message };
  }
}
function getConfig() {
  return _config ? Object.assign({}, _config) : Object.assign({}, DEFAULT_CONFIG);
}
function getKernelConfig() {
  const c = getConfig();
  return c.kernel || {};
}
function getFeatureConfig(featureId) {
  const c = getConfig();
  return c.features && c.features[featureId] || {};
}
function isFeatureEnabled(featureId) {
  const fc = getFeatureConfig(featureId);
  return fc.enabled !== false;
}
function updateConfig(newConfig) {
  _config = _deepMerge(_config || DEFAULT_CONFIG, newConfig);
  return { ok: true, config: Object.assign({}, _config) };
}
function resetConfig() {
  _config = Object.assign({}, DEFAULT_CONFIG);
  _loaded = false;
  return { ok: true };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, loaded: _loaded, config: getConfig() };
}
var config_loader_default = {
  MODULE_ID,
  VERSION,
  loadConfig,
  getConfig,
  getKernelConfig,
  getFeatureConfig,
  isFeatureEnabled,
  updateConfig,
  resetConfig,
  info
};
export {
  MODULE_ID,
  VERSION,
  config_loader_default as default,
  getConfig,
  getFeatureConfig,
  getKernelConfig,
  info,
  isFeatureEnabled,
  loadConfig,
  resetConfig,
  updateConfig
};
