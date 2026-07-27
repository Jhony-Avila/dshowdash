import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { HEADER_INTERNAL_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
import { HEALTH_STATUS } from "./constants.js";
const VERSION = "1.3.0-ES6";
const MODULE_ID = "header/core/graceful-degradation";
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
const _features = /* @__PURE__ */ new Map();
const _degradedFeatures = /* @__PURE__ */ new Map();
const _listeners = [];
let _metrics = { featuresRegistered: 0, degradations: 0, reactivations: 0, checksPerformed: 0, currentlyDegraded: 0 };
function registerFeature(featureId, config) {
  _initPorts();
  if (!featureId) {
    _log("error", "featureId \xE9 obrigat\xF3rio");
    return false;
  }
  config = config || {};
  const feature = { id: featureId, name: config.name || featureId, dependencies: config.dependencies || [], healthCheck: config.healthCheck || null, onDegrade: config.onDegrade || null, onReactivate: config.onReactivate || null, fallbackUI: config.fallbackUI || null, critical: config.critical || false, checkInterval: config.checkInterval || 3e4, autoReactivate: config.autoReactivate !== false, reactivateDelay: config.reactivateDelay || 1e4, registeredAt: Date.now() };
  _features.set(featureId, feature);
  _metrics.featuresRegistered++;
  _log("debug", "Feature registrada:", featureId);
  return true;
}
function unregisterFeature(featureId) {
  if (_features.has(featureId)) {
    _features.delete(featureId);
    _degradedFeatures.delete(featureId);
    _log("debug", "Feature removida:", featureId);
    return true;
  }
  return false;
}
function getFeature(featureId) {
  return _features.get(featureId) || null;
}
function getAllFeatures() {
  const result = {};
  _features.forEach((feature, id) => {
    result[id] = { id: feature.id, name: feature.name, critical: feature.critical, isDegraded: _degradedFeatures.has(id), dependencies: feature.dependencies };
  });
  return result;
}
function degradeFeature(featureId, reason) {
  const feature = _features.get(featureId);
  if (!feature) {
    _log("warn", "Feature n\xE3o encontrada:", featureId);
    return false;
  }
  if (_degradedFeatures.has(featureId)) {
    _log("debug", "Feature j\xE1 est\xE1 degradada:", featureId);
    return true;
  }
  const degradation = { featureId, reason: reason || "UNKNOWN", degradedAt: Date.now(), reactivateTimer: null };
  _degradedFeatures.set(featureId, degradation);
  _metrics.degradations++;
  _metrics.currentlyDegraded = _degradedFeatures.size;
  _log("warn", "Feature degradada:", featureId, "- Raz\xE3o:", reason);
  if (typeof feature.onDegrade === "function") {
    try {
      feature.onDegrade({ featureId, reason });
    } catch (e) {
      _log("error", "Erro em onDegrade callback:", e.message);
    }
  }
  _degradeDependents(featureId, reason);
  if (feature.autoReactivate) {
    degradation.reactivateTimer = setTimeout(() => {
      _checkReactivation(featureId);
    }, feature.reactivateDelay);
  }
  _emitEvent("degraded", { featureId, reason });
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(HEADER_INTERNAL_EVENT_NAMES.FEATURE_DEGRADED, { featureId, reason, timestamp: Date.now() });
  }
  return true;
}
function _degradeDependents(featureId, reason) {
  _features.forEach((feature) => {
    if (feature.dependencies.indexOf(featureId) !== -1) {
      if (!_degradedFeatures.has(feature.id)) {
        degradeFeature(feature.id, `DEPENDENCY_DEGRADED:${featureId}`);
      }
    }
  });
}
function reactivateFeature(featureId) {
  const feature = _features.get(featureId);
  if (!feature) {
    _log("warn", "Feature n\xE3o encontrada:", featureId);
    return false;
  }
  const degradation = _degradedFeatures.get(featureId);
  if (!degradation) {
    _log("debug", "Feature n\xE3o est\xE1 degradada:", featureId);
    return true;
  }
  const unhealthyDeps = _checkDependencies(featureId);
  if (unhealthyDeps.length > 0) {
    _log("warn", "N\xE3o \xE9 poss\xEDvel reativar", featureId, "- Depend\xEAncias degradadas:", unhealthyDeps.join(", "));
    return false;
  }
  if (degradation.reactivateTimer) {
    clearTimeout(degradation.reactivateTimer);
  }
  _degradedFeatures.delete(featureId);
  _metrics.reactivations++;
  _metrics.currentlyDegraded = _degradedFeatures.size;
  _log("info", "Feature reativada:", featureId);
  if (typeof feature.onReactivate === "function") {
    try {
      feature.onReactivate({ featureId });
    } catch (e) {
      _log("error", "Erro em onReactivate callback:", e.message);
    }
  }
  _emitEvent("reactivated", { featureId });
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(HEADER_INTERNAL_EVENT_NAMES.FEATURE_REACTIVATED, { featureId, timestamp: Date.now() });
  }
  _tryReactivateDependents(featureId);
  return true;
}
function _checkDependencies(featureId) {
  const feature = _features.get(featureId);
  if (!feature) return [];
  const unhealthy = [];
  feature.dependencies.forEach((depId) => {
    if (_degradedFeatures.has(depId)) {
      unhealthy.push(depId);
    }
  });
  return unhealthy;
}
function _tryReactivateDependents(featureId) {
  _features.forEach((feature) => {
    if (feature.dependencies.indexOf(featureId) !== -1) {
      if (_degradedFeatures.has(feature.id)) {
        const unhealthyDeps = _checkDependencies(feature.id);
        if (unhealthyDeps.length === 0) {
          _checkReactivation(feature.id);
        }
      }
    }
  });
}
function _checkReactivation(featureId) {
  const feature = _features.get(featureId);
  if (!feature) return;
  _metrics.checksPerformed++;
  if (!_degradedFeatures.has(featureId)) return;
  const unhealthyDeps = _checkDependencies(featureId);
  if (unhealthyDeps.length > 0) {
    if (feature.autoReactivate) {
      const degradation = _degradedFeatures.get(featureId);
      if (degradation) {
        degradation.reactivateTimer = setTimeout(() => {
          _checkReactivation(featureId);
        }, feature.reactivateDelay);
      }
    }
    return;
  }
  if (typeof feature.healthCheck === "function") {
    try {
      const result = feature.healthCheck();
      const isHealthy = result === true || result && result.status === HEALTH_STATUS.HEALTHY || result && result.status === "HEALTHY";
      if (isHealthy) {
        reactivateFeature(featureId);
      } else {
        if (feature.autoReactivate) {
          const deg = _degradedFeatures.get(featureId);
          if (deg) {
            deg.reactivateTimer = setTimeout(() => {
              _checkReactivation(featureId);
            }, feature.reactivateDelay);
          }
        }
      }
    } catch (e) {
      _log("error", "Erro no healthCheck da feature:", featureId, e.message);
    }
  } else {
    reactivateFeature(featureId);
  }
}
function isFeatureDegraded(featureId) {
  return _degradedFeatures.has(featureId);
}
function isFeatureAvailable(featureId) {
  return _features.has(featureId) && !_degradedFeatures.has(featureId);
}
function getDegradedFeatures() {
  const result = [];
  _degradedFeatures.forEach((degradation, featureId) => {
    result.push({ featureId, reason: degradation.reason, degradedAt: degradation.degradedAt, duration: Date.now() - degradation.degradedAt });
  });
  return result;
}
function getCriticalDegraded() {
  const critical = [];
  _degradedFeatures.forEach((degradation, featureId) => {
    const feature = _features.get(featureId);
    if (feature && feature.critical) {
      critical.push(featureId);
    }
  });
  return critical;
}
function withFeature(featureId, fn, fallback) {
  if (isFeatureAvailable(featureId)) {
    if (typeof fn === "function") {
      try {
        return fn();
      } catch (e) {
        _log("error", "Erro ao executar feature:", featureId, e.message);
        degradeFeature(featureId, `EXECUTION_ERROR:${e.message}`);
        if (typeof fallback === "function") {
          return fallback(e);
        }
      }
    }
  } else {
    if (typeof fallback === "function") {
      return fallback(new Error(`Feature degraded: ${featureId}`));
    }
  }
  return void 0;
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
  _metrics = { featuresRegistered: _features.size, degradations: 0, reactivations: 0, checksPerformed: 0, currentlyDegraded: _degradedFeatures.size };
}
function healthCheck() {
  _initPorts();
  const criticalDegraded = getCriticalDegraded();
  const checks = {
    hasFeatures: _features.size > 0 || _metrics.featuresRegistered === 0,
    noCriticalDegraded: criticalDegraded.length === 0,
    lowDegradationRate: _features.size === 0 || _degradedFeatures.size / _features.size < 0.3,
    portsInitialized: _portsInitialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, criticalDegraded, degradedCount: _degradedFeatures.size, totalFeatures: _features.size, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, totalFeatures: _features.size, degradedCount: _degradedFeatures.size, features: getAllFeatures(), degraded: getDegradedFeatures(), metrics: getMetrics(), portsInitialized: _portsInitialized, healthCheck: healthCheck() };
}
var graceful_degradation_default = { VERSION, MODULE_ID, registerFeature, unregisterFeature, degradeFeature, reactivateFeature, isFeatureDegraded, isFeatureAvailable, getDegradedFeatures, withFeature, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  graceful_degradation_default as default,
  degradeFeature,
  getAllFeatures,
  getCriticalDegraded,
  getDegradedFeatures,
  getFeature,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isFeatureAvailable,
  isFeatureDegraded,
  onEvent,
  reactivateFeature,
  registerFeature,
  resetMetrics,
  unregisterFeature,
  withFeature
};
