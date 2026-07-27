import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { createLogger } from "/assets/js/core/logger-global/index.js";
import * as Integrations from "./header-integrations.js";
const VERSION = "1.2.0-ES6";
const MODULE_ID = "header/core/bootstrap";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _fallbackLogger = createLogger(MODULE_ID);
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
  if (!logger) {
    const msg = args.join(" ");
    if (level === "error") {
      _fallbackLogger.error(msg);
      return;
    }
    if (level === "warn") {
      _fallbackLogger.warn(msg);
      return;
    }
    if (level === "info") {
      _fallbackLogger.info(msg);
      return;
    }
    _fallbackLogger.debug(msg);
    return;
  }
  const prefix = `[${MODULE_ID}]`;
  if (level === "error" && logger.error) {
    logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn" && logger.warn) {
    logger.warn(prefix, args.join(" "));
    return;
  }
  if (level === "info" && logger.info) {
    logger.info(prefix, args.join(" "));
    return;
  }
  if (logger.debug) logger.debug(prefix, args.join(" "));
};
let _bootstrapped = false;
let _headerInstance = null;
let _startTime = null;
const DEFAULT_CONFIG = {
  features: {
    routerIntegration: true,
    globalStateIntegration: true,
    eventBusIntegration: true,
    appShellIntegration: true,
    telemetryEnabled: true,
    circuitBreakerEnabled: true,
    pollingEnabled: true,
    accessibilityEnabled: true,
    selfHealingEnabled: true,
    gracefulDegradationEnabled: true,
    pluginSystemEnabled: true,
    lazyLoadingEnabled: false,
    serviceWorkerEnabled: false
  },
  api: {
    timeout: 6e3,
    retries: 1
  },
  cache: {
    enabled: true,
    defaultTTL: 6e4
  },
  selfHealing: {
    checkInterval: 3e4,
    maxRetries: 3
  }
};
function bootstrap(headerInstance, userConfig) {
  if (_bootstrapped) {
    _log("warn", "Header ja inicializado via bootstrap");
    return Promise.resolve(_headerInstance);
  }
  _initPorts();
  _startTime = performance.now();
  _headerInstance = headerInstance;
  const config = _mergeConfig(DEFAULT_CONFIG, userConfig || {});
  _log("info", "Iniciando bootstrap do Header...");
  return Integrations.init(headerInstance, config).then(() => {
    Integrations.start();
    _bootstrapped = true;
    const bootTime = performance.now() - _startTime;
    _log("info", `Bootstrap concluido em ${bootTime.toFixed(0)}ms`);
    const eventBus = _getPort("eventBus");
    if (eventBus && eventBus.emit) {
      eventBus.emit("header:bootstrap:complete", {
        version: VERSION,
        bootTime,
        modules: Integrations.getAllModules().length,
        timestamp: Date.now()
      });
    }
    return headerInstance;
  }).catch((error) => {
    _log("error", "Bootstrap falhou:", error.message);
    throw error;
  });
}
function _mergeConfig(defaults, user) {
  const result = {};
  Object.keys(defaults).forEach((key) => {
    if (typeof defaults[key] === "object" && defaults[key] !== null && !Array.isArray(defaults[key])) {
      result[key] = _mergeConfig(defaults[key], user[key] || {});
    } else {
      result[key] = user[key] !== void 0 ? user[key] : defaults[key];
    }
  });
  Object.keys(user).forEach((key) => {
    if (result[key] === void 0) {
      result[key] = user[key];
    }
  });
  return result;
}
function quickBootstrap(headerInstance) {
  return bootstrap(headerInstance, {});
}
function shutdown() {
  if (!_bootstrapped) {
    _log("warn", "Header nao foi inicializado via bootstrap");
    return;
  }
  _log("info", "Desligando Header...");
  Integrations.cleanup();
  _bootstrapped = false;
  _headerInstance = null;
  _log("info", "Header desligado");
}
function isBootstrapped() {
  return _bootstrapped;
}
function getHeaderInstance() {
  return _headerInstance;
}
function getIntegrations() {
  return Integrations;
}
function healthCheck() {
  if (!_bootstrapped) {
    return { status: "NOT_BOOTSTRAPPED", score: 0, maxScore: 1, checks: { bootstrapped: false } };
  }
  const integrationsHealth = Integrations.healthCheck();
  const checks = {
    bootstrapped: _bootstrapped,
    hasHeader: !!_headerInstance,
    integrationsHealthy: integrationsHealth.status === "HEALTHY",
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    integrationsHealth,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    bootstrapped: _bootstrapped,
    hasHeader: !!_headerInstance,
    defaultConfig: DEFAULT_CONFIG,
    integrationsInfo: _bootstrapped ? Integrations.info() : null,
    portsInitialized: Ports.isInitialized(),
    healthCheck: healthCheck()
  };
}
var bootstrap_default = { VERSION, MODULE_ID, bootstrap, quickBootstrap, shutdown, isBootstrapped, getHeaderInstance, getIntegrations, healthCheck, info };
export {
  DEFAULT_CONFIG,
  MODULE_ID,
  VERSION,
  bootstrap,
  bootstrap_default as default,
  getHeaderInstance,
  getIntegrations,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isBootstrapped,
  quickBootstrap,
  shutdown
};
