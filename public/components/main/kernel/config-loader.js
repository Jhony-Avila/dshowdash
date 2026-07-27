import { createLogger } from "/assets/js/core/logger-global/index.js";
const MODULE_ID = "main-kernel-config-loader";
const _logger = createLogger(MODULE_ID);
const VERSION = "1.2.0-ENTERPRISE";
let _config = null;
let _loaded = false;
let _logLevel = 1;
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };
const DEFAULT_CONFIG = {
  version: "1.0.0",
  kernel: {
    logLevel: "info",
    enableConsoleCommands: true,
    enableHealthMonitor: true,
    healthMonitorIntervalMs: 3e4,
    healthMonitorAutoRecover: true,
    featureEnableTimeoutMs: 5e3
  },
  features: {}
};
function _log(level, msg, data) {
  const levelNum = LOG_LEVELS[level] || 1;
  const threshold = typeof _logLevel !== "undefined" ? _logLevel : typeof _config !== "undefined" && _config && _config.kernel?.logLevel ? Number(_config.kernel.logLevel) : 1;
  if (levelNum < threshold) return;
  const context = data !== void 0 ? { data } : {};
  if (level === "error") _logger.error(msg, context);
  else if (level === "warn") _logger.warn(msg, context);
  else if (level === "debug") _logger.debug(msg, context);
  else _logger.info(msg, context);
}
function setLogLevel(level) {
  if (typeof level === "string") {
    _logLevel = LOG_LEVELS[level] !== void 0 ? LOG_LEVELS[level] : 1;
  } else if (typeof level === "number") {
    _logLevel = level;
  }
  return _logLevel;
}
async function loadConfig(path) {
  if (_loaded && _config) {
    return { ok: true, config: _config, cached: true };
  }
  try {
    const configPath = path || "/components/main/kernel/config.json";
    const response = await fetch(configPath);
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.status}`);
    }
    const json = await response.json();
    _config = mergeConfig(DEFAULT_CONFIG, json);
    _loaded = true;
    _log("debug", `Configuration loaded: ${_config.version}`);
    return { ok: true, config: _config };
  } catch (e) {
    _log("warn", `Using default config: ${e.message}`);
    _config = DEFAULT_CONFIG;
    _loaded = true;
    return { ok: true, config: _config, fallback: true };
  }
}
function mergeConfig(defaults, overrides) {
  const result = Object.assign({}, defaults);
  for (const key in overrides) {
    if (overrides.hasOwnProperty(key)) {
      if (typeof overrides[key] === "object" && overrides[key] !== null && !Array.isArray(overrides[key])) {
        result[key] = mergeConfig(defaults[key] || {}, overrides[key]);
      } else {
        result[key] = overrides[key];
      }
    }
  }
  return result;
}
function getConfig() {
  return _config || DEFAULT_CONFIG;
}
function getKernelConfig() {
  const cfg = getConfig();
  return cfg.kernel || DEFAULT_CONFIG.kernel;
}
function getFeatureConfig(featureId) {
  const cfg = getConfig();
  return cfg.features && cfg.features[featureId] || {};
}
function isFeatureEnabled(featureId) {
  const featureCfg = getFeatureConfig(featureId);
  return featureCfg["enabled"] !== false;
}
function updateConfig(updates) {
  _config = mergeConfig(_config || DEFAULT_CONFIG, updates);
  return { ok: true, config: _config };
}
function resetConfig() {
  _config = Object.assign({}, DEFAULT_CONFIG);
  _loaded = false;
  return { ok: true };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    loaded: _loaded,
    configVersion: _config ? _config.version : null
  };
}
function healthCheck() {
  return {
    status: _loaded ? "HEALTHY" : "NOT_LOADED",
    moduleId: MODULE_ID,
    version: VERSION,
    loaded: _loaded,
    configVersion: _config ? _config.version : null,
    timestamp: Date.now()
  };
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
  setLogLevel,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  config_loader_default as default,
  getConfig,
  getFeatureConfig,
  getKernelConfig,
  healthCheck,
  info,
  isFeatureEnabled,
  loadConfig,
  resetConfig,
  setLogLevel,
  updateConfig
};
