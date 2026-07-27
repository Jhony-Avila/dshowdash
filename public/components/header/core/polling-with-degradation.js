import { createCorePorts } from "/core/runtime/ports-profiles.js";
import * as GracefulDegradation from "./graceful-degradation.js";
import * as FeatureFlags from "./feature-flags.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core/polling-with-degradation";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
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
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error" && logger.error) logger.error(prefix, args.join(" "));
  else if (level === "warn" && logger.warn) logger.warn(prefix, args.join(" "));
  else if (level === "info" && logger.info) logger.info(prefix, args.join(" "));
};
let _initialized = false;
let _pollingManager = null;
let _degradationEnabled = false;
const _metrics = {
  pollsExecuted: 0,
  pollsDegraded: 0,
  pollsSkipped: 0,
  degradationEvents: 0,
  reactivationEvents: 0,
  lastPollAt: null
};
const POLLING_FEATURES = {
  health: "polling:health",
  alerts: "polling:alerts",
  notifications: "polling:notifications",
  sync: "polling:sync"
};
function init(pollingManager, config) {
  if (_initialized) return;
  _initPorts();
  _pollingManager = pollingManager;
  _degradationEnabled = FeatureFlags.isEnabled("gracefulDegradationEnabled");
  if (!_degradationEnabled) {
    _log("info", "Graceful degradation desabilitado");
    _initialized = true;
    return;
  }
  _registerPollingFeatures(config);
  _initialized = true;
  _log("info", "Polling with degradation inicializado");
}
function _registerPollingFeatures(config) {
  config = config || {};
  GracefulDegradation.registerFeature(POLLING_FEATURES.health, {
    name: "Health Polling",
    dependencies: ["network", "api"],
    critical: true,
    checkInterval: config.healthCheckInterval || 6e4,
    healthCheck() {
      if (!_pollingManager) return true;
      const hc = _pollingManager.healthCheck ? _pollingManager.healthCheck() : { status: "HEALTHY" };
      return hc.status === "HEALTHY" || hc.status === "DEGRADED";
    },
    onDegrade(data) {
      _metrics.degradationEvents++;
      _log("warn", "Health polling degradado:", data.reason);
      _pausePolling("health");
    },
    onReactivate() {
      _metrics.reactivationEvents++;
      _log("info", "Health polling reativado");
      _resumePolling("health");
    }
  });
  GracefulDegradation.registerFeature(POLLING_FEATURES.alerts, {
    name: "Alerts Polling",
    dependencies: ["network", "api"],
    critical: false,
    checkInterval: config.alertsCheckInterval || 3e4,
    healthCheck() {
      return navigator.onLine;
    },
    onDegrade(data) {
      _metrics.degradationEvents++;
      _log("warn", "Alerts polling degradado:", data.reason);
      _pausePolling("alerts");
    },
    onReactivate() {
      _metrics.reactivationEvents++;
      _log("info", "Alerts polling reativado");
      _resumePolling("alerts");
    }
  });
}
function _pausePolling(type) {
  if (!_pollingManager) return;
  if (typeof _pollingManager.pause === "function") {
    _pollingManager.pause(type);
  } else if (typeof _pollingManager.stop === "function") {
    _pollingManager.stop();
  }
}
function _resumePolling(type) {
  if (!_pollingManager) return;
  if (typeof _pollingManager.resume === "function") {
    _pollingManager.resume(type);
  } else if (typeof _pollingManager.start === "function") {
    _pollingManager.start();
  }
}
function executePoll(pollType, pollFn) {
  _metrics.lastPollAt = Date.now();
  if (!_degradationEnabled) {
    _metrics.pollsExecuted++;
    return pollFn();
  }
  const featureId = POLLING_FEATURES[pollType] || pollType;
  if (GracefulDegradation.isFeatureDegraded(featureId)) {
    _metrics.pollsSkipped++;
    _log("debug", "Poll skipped (degraded):", pollType);
    return Promise.resolve({ skipped: true, reason: "FEATURE_DEGRADED" });
  }
  return GracefulDegradation.withFeature(featureId, () => {
    _metrics.pollsExecuted++;
    return pollFn();
  }, (error) => {
    _metrics.pollsDegraded++;
    _log("warn", "Poll executado em modo degradado:", pollType);
    return { degraded: true, error: error.message };
  });
}
function degradePolling(pollType, reason) {
  if (!_degradationEnabled) return false;
  const featureId = POLLING_FEATURES[pollType] || pollType;
  return GracefulDegradation.degradeFeature(featureId, reason);
}
function reactivatePolling(pollType) {
  if (!_degradationEnabled) return false;
  const featureId = POLLING_FEATURES[pollType] || pollType;
  return GracefulDegradation.reactivateFeature(featureId);
}
function isPollingDegraded(pollType) {
  if (!_degradationEnabled) return false;
  const featureId = POLLING_FEATURES[pollType] || pollType;
  return GracefulDegradation.isFeatureDegraded(featureId);
}
function getPollingStatus() {
  const status = {};
  Object.keys(POLLING_FEATURES).forEach((type) => {
    const featureId = POLLING_FEATURES[type];
    status[type] = {
      featureId,
      // @ts-expect-error TS migration - TS2345
      degraded: _degradationEnabled ? GracefulDegradation.isFeatureDegraded(featureId) : false,
      // @ts-expect-error TS migration - TS2345
      available: _degradationEnabled ? GracefulDegradation.isFeatureAvailable(featureId) : true
    };
  });
  return status;
}
function getMetrics() {
  return Object.assign({}, _metrics, {
    degradationEnabled: _degradationEnabled,
    pollingStatus: getPollingStatus()
  });
}
function resetMetrics() {
  _metrics.pollsExecuted = 0;
  _metrics.pollsDegraded = 0;
  _metrics.pollsSkipped = 0;
  _metrics.degradationEvents = 0;
  _metrics.reactivationEvents = 0;
  _metrics.lastPollAt = null;
}
function healthCheck() {
  const pollingStatus = getPollingStatus();
  const anyDegraded = Object.values(pollingStatus).some((s) => s.degraded);
  const checks = {
    initialized: _initialized,
    hasPollingManager: !!_pollingManager,
    noDegradedPolling: !anyDegraded,
    lowSkipRate: _metrics.pollsExecuted + _metrics.pollsSkipped === 0 || _metrics.pollsSkipped / (_metrics.pollsExecuted + _metrics.pollsSkipped) < 0.3,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    pollingStatus,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    degradationEnabled: _degradationEnabled,
    pollingFeatures: POLLING_FEATURES,
    pollingStatus: getPollingStatus(),
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}
var polling_with_degradation_default = {
  VERSION,
  MODULE_ID,
  POLLING_FEATURES,
  init,
  executePoll,
  degradePolling,
  reactivatePolling,
  isPollingDegraded,
  getPollingStatus,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  POLLING_FEATURES,
  VERSION,
  polling_with_degradation_default as default,
  degradePolling,
  executePoll,
  getMetrics,
  getPollingStatus,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isPollingDegraded,
  reactivatePolling,
  resetMetrics
};
