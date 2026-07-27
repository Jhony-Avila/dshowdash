import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { COMPONENT_STATUS, HEALTH_STATUS } from "./constants.js";
const VERSION = "1.2.0-ES6";
const MODULE_ID = "header/core/self-healing";
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, args.join(" "));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(prefix, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
const DEFAULT_CONFIG = { checkInterval: 3e4, retryInterval: 15e3, maxRetries: 3, cooldownPeriod: 6e4, autoStart: false };
let _config = Object.assign({}, DEFAULT_CONFIG);
let _isRunning = false;
let _checkTimer = null;
let _componentsLoader = null;
const _recoveryAttempts = /* @__PURE__ */ new Map();
const _permanentlyFailed = /* @__PURE__ */ new Set();
const _listeners = [];
let _metrics = { checksPerformed: 0, issuesDetected: 0, recoveryAttempts: 0, successfulRecoveries: 0, failedRecoveries: 0, permanentFailures: 0, lastCheckAt: null, lastRecoveryAt: null };
function init(componentsLoader, config) {
  _initPorts();
  _componentsLoader = componentsLoader;
  if (config) {
    _config = Object.assign({}, DEFAULT_CONFIG, config);
  }
  _log("info", "SelfHealing inicializado");
  if (_config.autoStart) {
    start();
  }
}
function start() {
  if (_isRunning) {
    _log("warn", "SelfHealing j\xE1 est\xE1 rodando");
    return;
  }
  _isRunning = true;
  _scheduleCheck();
  _log("info", "SelfHealing iniciado, intervalo:", `${_config.checkInterval}ms`);
  _emitEvent("started", { timestamp: Date.now() });
}
function stop() {
  if (!_isRunning) return;
  _isRunning = false;
  if (_checkTimer) {
    clearTimeout(_checkTimer);
    _checkTimer = null;
  }
  _log("info", "SelfHealing parado");
  _emitEvent("stopped", { timestamp: Date.now() });
}
function _scheduleCheck() {
  if (!_isRunning) return;
  _checkTimer = setTimeout(() => {
    performCheck();
    _scheduleCheck();
  }, _config.checkInterval);
}
function performCheck() {
  if (!_componentsLoader) {
    _log("warn", "ComponentsLoader n\xE3o dispon\xEDvel");
    return Promise.resolve({ issues: [] });
  }
  _metrics.checksPerformed++;
  _metrics.lastCheckAt = Date.now();
  const issues = [];
  const componentsHealth = _componentsLoader.getSubcomponentsHealth ? _componentsLoader.getSubcomponentsHealth() : {};
  Object.keys(componentsHealth).forEach((name) => {
    const health = componentsHealth[name];
    if (_permanentlyFailed.has(name)) return;
    if (_isUnhealthy(health)) {
      issues.push({ componentName: name, status: health.status, reason: _determineReason(health), detectedAt: Date.now() });
    }
  });
  if (issues.length > 0) {
    _metrics.issuesDetected += issues.length;
    _log("warn", "Detectados", issues.length, "componentes com problemas");
    issues.forEach((issue) => {
      _attemptRecovery(issue);
    });
  }
  return Promise.resolve({ issues, timestamp: Date.now() });
}
function _isUnhealthy(health) {
  if (!health) return true;
  if (health.status === HEALTH_STATUS.UNHEALTHY) return true;
  if (health.status === COMPONENT_STATUS.FAILED) return true;
  if (health.status === COMPONENT_STATUS.TIMEOUT) return true;
  if (health.status === "ERROR") return true;
  return false;
}
function _determineReason(health) {
  if (!health) return "NO_HEALTH_DATA";
  if (health.status === COMPONENT_STATUS.TIMEOUT) return "TIMEOUT";
  if (health.status === COMPONENT_STATUS.FAILED) return "MOUNT_FAILED";
  if (health.error) return health.error;
  return "UNHEALTHY";
}
function _attemptRecovery(issue) {
  const name = issue.componentName;
  const attempts = _recoveryAttempts.get(name) || { count: 0, lastAttempt: 0 };
  const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
  if (timeSinceLastAttempt < _config.cooldownPeriod && attempts.count > 0) {
    _log("debug", "Componente", name, "em cooldown, pulando");
    return;
  }
  if (attempts.count >= _config.maxRetries) {
    _markPermanentlyFailed(name, issue.reason);
    return;
  }
  attempts.count++;
  attempts.lastAttempt = Date.now();
  _recoveryAttempts.set(name, attempts);
  _metrics.recoveryAttempts++;
  _metrics.lastRecoveryAt = Date.now();
  _log("info", "Tentando recuperar componente:", name, "(tentativa", `${attempts.count}/${_config.maxRetries})`);
  _emitEvent("recovery:start", { componentName: name, attempt: attempts.count, reason: issue.reason });
  _performRecovery(name).then((success) => {
    if (success) {
      _metrics.successfulRecoveries++;
      _recoveryAttempts.delete(name);
      _log("info", "Componente recuperado:", name);
      _emitEvent("recovery:success", { componentName: name, attempts: attempts.count });
    } else {
      _metrics.failedRecoveries++;
      _log("warn", "Falha ao recuperar componente:", name);
      _emitEvent("recovery:failed", { componentName: name, attempt: attempts.count });
    }
  }).catch((error) => {
    _metrics.failedRecoveries++;
    _log("error", "Erro ao recuperar componente:", name, error.message);
    _emitEvent("recovery:error", { componentName: name, error: error.message });
  });
}
function _performRecovery(componentName) {
  if (!_componentsLoader || !_componentsLoader.retryComponent) {
    return Promise.resolve(false);
  }
  return _componentsLoader.retryComponent(componentName).then((instance) => {
    if (instance) {
      if (typeof instance.healthCheck === "function") {
        const health = instance.healthCheck();
        return health.status === HEALTH_STATUS.HEALTHY || health.status === "HEALTHY";
      }
      return true;
    }
    return false;
  }).catch(() => false);
}
function _markPermanentlyFailed(name, reason) {
  _permanentlyFailed.add(name);
  _metrics.permanentFailures++;
  _log("error", "Componente marcado como permanentemente falho:", name, "- Raz\xE3o:", reason);
  _emitEvent("permanent:failure", { componentName: name, reason, attempts: _config.maxRetries });
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit("header:component:permanent-failure", { componentName: name, reason, timestamp: Date.now() });
  }
}
function forceRecovery(componentName) {
  _recoveryAttempts.delete(componentName);
  _permanentlyFailed.delete(componentName);
  return _performRecovery(componentName);
}
function clearFailures(componentName) {
  if (componentName) {
    _recoveryAttempts.delete(componentName);
    _permanentlyFailed.delete(componentName);
    _log("info", "Falhas limpas para:", componentName);
  } else {
    _recoveryAttempts.clear();
    _permanentlyFailed.clear();
    _log("info", "Todas as falhas limpas");
  }
}
function getPermanentlyFailed() {
  return Array.from(_permanentlyFailed);
}
function getRecoveryAttempts() {
  const result = {};
  _recoveryAttempts.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}
const _registeredComponents = /* @__PURE__ */ new Map();
function register(name, opts) {
  if (!name || typeof opts !== "object") return;
  _registeredComponents.set(name, opts);
  _log("debug", "Componente registrado:", name);
}
function unregister(componentName) {
  _registeredComponents.delete(componentName);
  _recoveryAttempts.delete(componentName);
  _log("debug", "Componente desregistrado:", componentName);
}
function checkNow(componentName) {
  if (_registeredComponents.has(componentName)) {
    const reg = _registeredComponents.get(componentName);
    if (reg && !reg.healthCheck()) {
      _metrics.issuesDetected++;
      return reg.recover().then((ok) => {
        if (ok) {
          _metrics.successfulRecoveries++;
          _metrics.recoveryAttempts++;
        } else {
          _metrics.failedRecoveries++;
          _metrics.recoveryAttempts++;
        }
        return ok;
      });
    }
    return Promise.resolve(true);
  }
  return performCheck();
}
function checkAllNow() {
  return performCheck();
}
function cleanup() {
  stop();
  _registeredComponents.clear();
  _recoveryAttempts.clear();
  _permanentlyFailed.clear();
  _componentsLoader = null;
  _listeners.length = 0;
  _log("info", "SelfHealing limpo");
}
function onEvent(callback) {
  if (typeof callback !== "function") return () => {
  };
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx > -1) _listeners.splice(idx, 1);
  };
}
function _emitEvent(type, data) {
  const event = Object.assign({ type, timestamp: Date.now() }, data);
  _listeners.forEach((cb) => {
    try {
      cb(event);
    } catch (e) {
      _log("error", "Listener error:", e.message);
    }
  });
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics = { checksPerformed: 0, issuesDetected: 0, recoveryAttempts: 0, successfulRecoveries: 0, failedRecoveries: 0, permanentFailures: 0, lastCheckAt: null, lastRecoveryAt: null };
}
function healthCheck() {
  _initPorts();
  const recoveryRate = _metrics.recoveryAttempts > 0 ? _metrics.successfulRecoveries / _metrics.recoveryAttempts : 1;
  const checks = { isRunning: _isRunning, hasComponentsLoader: !!_componentsLoader, goodRecoveryRate: recoveryRate >= 0.5 || _metrics.recoveryAttempts < 3, fewPermanentFailures: _permanentlyFailed.size < 3, portsInitialized: _portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, recoveryRate: `${(recoveryRate * 100).toFixed(1)}%`, permanentlyFailed: getPermanentlyFailed(), version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, isRunning: _isRunning, config: Object.assign({}, _config), metrics: getMetrics(), permanentlyFailed: getPermanentlyFailed(), recoveryAttempts: getRecoveryAttempts(), portsInitialized: _portsInitialized, healthCheck: healthCheck() };
}
var self_healing_default = { VERSION, MODULE_ID, init, start, stop, performCheck, forceRecovery, clearFailures, getPermanentlyFailed, getRecoveryAttempts, onEvent, getMetrics, resetMetrics, healthCheck, info, register, unregister, checkNow, checkAllNow, cleanup };
export {
  DEFAULT_CONFIG,
  MODULE_ID,
  VERSION,
  checkAllNow,
  checkNow,
  cleanup,
  clearFailures,
  self_healing_default as default,
  forceRecovery,
  getMetrics,
  getPermanentlyFailed,
  getPorts,
  getRecoveryAttempts,
  healthCheck,
  info,
  init,
  injectPorts,
  onEvent,
  performCheck,
  register,
  resetMetrics,
  start,
  stop,
  unregister
};
