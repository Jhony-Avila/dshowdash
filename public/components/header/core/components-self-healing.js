import * as SelfHealingModule from "./self-healing.js";
const SelfHealing = SelfHealingModule;
import * as FeatureFlags from "./feature-flags.js";
import { log as coreLog } from "./logger.js";
const VERSION = "1.4.1-IMPORT-FIX";
const MODULE_ID = "header/core/components-self-healing";
let _componentsLoader = null;
let _initialized = false;
const _registeredComponents = /* @__PURE__ */ new Map();
let _logLevel = 1;
const _metrics = { recoveryAttempts: 0, recoverySuccesses: 0, recoveryFailures: 0, lastRecoveryAt: null };
const _config = { enabled: true, checkInterval: 3e4, maxRetries: 3, cooldownMs: 6e4, criticalOnly: false };
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };
function _log(level, msg, data) {
  const levelNum = LOG_LEVELS[level] || 1;
  if (levelNum < _logLevel) return;
  const fullMsg = `[${MODULE_ID}] ${msg}`;
  if (data !== void 0) {
    coreLog(level, fullMsg, data);
  } else {
    coreLog(level, fullMsg);
  }
}
function setLogLevel(level) {
  if (typeof level === "string") _logLevel = LOG_LEVELS[level] !== void 0 ? LOG_LEVELS[level] : 1;
  else if (typeof level === "number") _logLevel = level;
  return _logLevel;
}
function _createHealthCheck(componentName) {
  return () => {
    if (!_componentsLoader) return false;
    const status = _componentsLoader.getComponentStatus ? _componentsLoader.getComponentStatus(componentName) : null;
    if (!status) return false;
    return status.status === "MOUNTED" || status.status === "mounted";
  };
}
function _createRecoveryFn(componentName) {
  return () => {
    _metrics.recoveryAttempts++;
    _log("info", `Tentando recuperar componente: ${componentName}`);
    return _componentsLoader.retryComponent(componentName).then((result) => {
      if (result) {
        _metrics.recoverySuccesses++;
        _metrics.lastRecoveryAt = Date.now();
        _log("info", `Componente recuperado com sucesso: ${componentName}`);
        return true;
      } else {
        _metrics.recoveryFailures++;
        _log("warn", `Falha ao recuperar componente: ${componentName}`);
        return false;
      }
    }).catch((error) => {
      _metrics.recoveryFailures++;
      _log("error", `Erro ao recuperar componente: ${componentName}`, error.message);
      return false;
    });
  };
}
function init(componentsLoader, config) {
  if (_initialized) return;
  if (!componentsLoader) {
    _log("error", "ComponentsLoader nao fornecido");
    return;
  }
  _componentsLoader = componentsLoader;
  if (config) {
    if (config.checkInterval) _config.checkInterval = config.checkInterval;
    if (config.maxRetries) _config.maxRetries = config.maxRetries;
    if (config.cooldownMs) _config.cooldownMs = config.cooldownMs;
    if (config.criticalOnly !== void 0) _config.criticalOnly = config.criticalOnly;
    if (config.logLevel !== void 0) setLogLevel(config.logLevel);
  }
  if (FeatureFlags.isEnabled && !FeatureFlags.isEnabled("selfHealingEnabled")) {
    _log("debug", "Self-healing desabilitado via feature flag");
    _config.enabled = false;
  }
  SelfHealing.init(componentsLoader, { checkInterval: _config.checkInterval, maxRetries: _config.maxRetries, cooldownPeriod: _config.cooldownMs });
  _initialized = true;
  _log("info", "Components self-healing inicializado");
}
function registerComponents() {
  if (!_initialized || !_componentsLoader) {
    _log("warn", "Nao inicializado");
    return 0;
  }
  if (!_config.enabled) {
    _log("debug", "Self-healing desabilitado");
    return 0;
  }
  const componentsList = _componentsLoader.componentsList || [];
  let registered = 0;
  componentsList.forEach((config) => {
    const name = config.name;
    const criticality = config.criticality;
    if (_config.criticalOnly && criticality !== "critical") return;
    if (_registeredComponents.has(name)) return;
    if (SelfHealing.register) {
      SelfHealing.register(name, { healthCheck: _createHealthCheck(name), recover: _createRecoveryFn(name), critical: criticality === "critical", maxRetries: _config.maxRetries });
    }
    _registeredComponents.set(name, { registeredAt: Date.now(), criticality });
    registered++;
  });
  _log("info", `Componentes registrados para self-healing: ${registered}`);
  return registered;
}
function start() {
  if (!_initialized) {
    _log("warn", "Nao inicializado");
    return;
  }
  if (!_config.enabled) {
    _log("debug", "Self-healing desabilitado");
    return;
  }
  registerComponents();
  SelfHealing.start();
  _log("info", "Self-healing iniciado");
}
function stop() {
  SelfHealing.stop();
  _log("info", "Self-healing parado");
}
function checkComponent(componentName) {
  return SelfHealing.checkNow ? SelfHealing.checkNow(componentName) : Promise.resolve();
}
function checkAll() {
  return SelfHealing.checkAllNow ? SelfHealing.checkAllNow() : Promise.resolve();
}
function unregister(componentName) {
  if (SelfHealing.unregister) SelfHealing.unregister(componentName);
  _registeredComponents.delete(componentName);
}
function cleanup() {
  if (SelfHealing.cleanup) SelfHealing.cleanup();
  _registeredComponents.clear();
  _componentsLoader = null;
  _initialized = false;
}
function setEnabled(enabled) {
  _config.enabled = !!enabled;
  if (!enabled) stop();
}
function isEnabled() {
  return _config.enabled && _initialized;
}
function getMetrics() {
  return Object.assign({}, _metrics, { registeredCount: _registeredComponents.size, selfHealingMetrics: SelfHealing.getMetrics ? SelfHealing.getMetrics() : null });
}
function resetMetrics() {
  _metrics.recoveryAttempts = 0;
  _metrics.recoverySuccesses = 0;
  _metrics.recoveryFailures = 0;
  _metrics.lastRecoveryAt = null;
}
function healthCheck() {
  const successRate = _metrics.recoveryAttempts > 0 ? _metrics.recoverySuccesses / _metrics.recoveryAttempts : 1;
  const checks = { initialized: _initialized, enabled: _config.enabled, hasComponentsLoader: !!_componentsLoader, hasRegisteredComponents: _registeredComponents.size > 0 || !_config.enabled, goodRecoveryRate: successRate >= 0.5 || _metrics.recoveryAttempts < 3 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, recoveryRate: successRate, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, enabled: _config.enabled, config: Object.assign({}, _config), registeredComponents: Array.from(_registeredComponents.keys()), metrics: getMetrics(), healthCheck: healthCheck() };
}
var components_self_healing_default = { VERSION, MODULE_ID, init, registerComponents, start, stop, checkComponent, checkAll, unregister, cleanup, setEnabled, isEnabled, getMetrics, resetMetrics, setLogLevel, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  checkAll,
  checkComponent,
  cleanup,
  components_self_healing_default as default,
  getMetrics,
  healthCheck,
  info,
  init,
  isEnabled,
  registerComponents,
  resetMetrics,
  setEnabled,
  setLogLevel,
  start,
  stop,
  unregister
};
