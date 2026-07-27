const VERSION = "5.5.0-ENTERPRISE-FULL";
const MODULE_ID = "sidebar-config-loader";
let _config = null;
let _metrics = { loads: 0, merges: 0, errors: 0 };
const DEFAULT_CONFIG = {
  collapsed: false,
  mobileBreakpoint: 1024,
  animationDuration: 200,
  persistState: true,
  containerSelector: "#sidebar-container",
  settings: { defaultCollapsed: false },
  accordion: { allowMultipleOpen: true, persistState: true },
  header: { title: "DshowDash" }
};
function loadConfig(options = {}) {
  try {
    _config = { ...DEFAULT_CONFIG, ...options };
    _metrics.loads++;
    return _config;
  } catch (error) {
    _metrics.errors++;
    _config = { ...DEFAULT_CONFIG };
    return _config;
  }
}
function getConfig() {
  if (!_config) loadConfig();
  return { ..._config };
}
function mergeConfig(options = {}) {
  _metrics.merges++;
  if (!_config) loadConfig();
  return { ..._config, ...options };
}
function updateConfig(updates = {}) {
  _config = { ..._config, ...updates };
  return _config;
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasConfig: !!_config, metrics: getMetrics() };
}
function healthCheck() {
  let status = "HEALTHY";
  if (!_config) status = "NOT_INITIALIZED";
  if (_metrics.errors > 0) status = "DEGRADED";
  return { status, version: VERSION, moduleId: MODULE_ID, checks: { hasConfig: !!_config, noErrors: _metrics.errors === 0 }, metrics: getMetrics() };
}
var config_loader_default = { loadConfig, getConfig, mergeConfig, updateConfig, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  config_loader_default as default,
  getConfig,
  getMetrics,
  healthCheck,
  info,
  loadConfig,
  mergeConfig,
  updateConfig
};
