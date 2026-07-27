import { createCorePorts } from "/core/runtime/ports-profiles.js";
import * as Constants from "./constants.js";
import * as FeatureFlags from "./feature-flags.js";
import * as CircuitBreakerAPI from "./circuit-breaker-api.js";
import * as RetryWithJitter from "./retry-with-jitter.js";
import * as SelfHealing from "./self-healing.js";
import * as GracefulDegradation from "./graceful-degradation.js";
import * as ConfigValidator from "./config-validator.js";
import * as HeaderGateway from "./header-gateway.js";
import * as PluginSystem from "./plugin-system.js";
import * as LazyLoader from "./lazy-loader.js";
import * as CacheManager from "./cache-manager.js";
import * as OrchestratorAdapter from "./orchestrator-adapter.js";
import * as ServiceWorkerBridge from "./service-worker-bridge.js";
import * as VersionManager from "./version-manager.js";
import * as ComponentsSelfHealing from "./components-self-healing.js";
import * as HealthScheduler from "./health-scheduler.js";
const VERSION = "1.3.0-ES6";
const MODULE_ID = "header/core/header-integrations";
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
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...rest) {
  const args = rest;
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
let _initialized = false;
let _started = false;
let _headerInstance = null;
let _componentsLoader = null;
let _config = null;
const _modules = {
  constants: Constants,
  featureFlags: FeatureFlags,
  circuitBreaker: CircuitBreakerAPI,
  retry: RetryWithJitter,
  selfHealing: SelfHealing,
  gracefulDegradation: GracefulDegradation,
  configValidator: ConfigValidator,
  gateway: HeaderGateway,
  plugins: PluginSystem,
  lazyLoader: LazyLoader,
  cache: CacheManager,
  orchestrator: OrchestratorAdapter,
  serviceWorker: ServiceWorkerBridge,
  versionManager: VersionManager,
  componentsSelfHealing: ComponentsSelfHealing,
  healthScheduler: HealthScheduler
};
const _featureFlagMapping = {
  selfHealing: "selfHealingEnabled",
  componentsSelfHealing: "selfHealingEnabled",
  plugins: "pluginSystemEnabled",
  serviceWorker: "serviceWorkerEnabled",
  gracefulDegradation: "gracefulDegradationEnabled",
  lazyLoader: "lazyLoadingEnabled"
};
function _isModuleEnabled(moduleName) {
  const flagName = _featureFlagMapping[moduleName];
  if (!flagName) return true;
  return FeatureFlags.isEnabled(flagName);
}
function init(headerInstance, config) {
  if (_initialized) {
    return Promise.resolve();
  }
  _initPorts();
  _headerInstance = headerInstance;
  _componentsLoader = headerInstance ? headerInstance.componentsLoader : null;
  _config = config || {};
  _log("info", "Inicializando integracoes...");
  if (FeatureFlags.isEnabled("configValidation") && ConfigValidator.validateAndApply) {
    try {
      const validatedConfig = ConfigValidator.validateAndApply(_config);
      if (validatedConfig && typeof validatedConfig === "object") {
        _config = validatedConfig;
      }
    } catch (e) {
      _log("warn", "Config validation falhou:", e.message);
    }
  }
  FeatureFlags.init(_config.features);
  if (CacheManager.init) {
    CacheManager.init(_config.cache);
  }
  if (HeaderGateway.init) {
    HeaderGateway.init(_config.api);
  }
  if (FeatureFlags.isEnabled("pluginSystemEnabled") && PluginSystem.init) {
    PluginSystem.init(_headerInstance);
  }
  if (_componentsLoader && LazyLoader.init) {
    LazyLoader.init(_componentsLoader, _config.lazyLoading);
  }
  if (FeatureFlags.isEnabled("selfHealingEnabled") && _componentsLoader) {
    if (SelfHealing.init) {
      SelfHealing.init(_componentsLoader, _config.selfHealing);
    }
    if (ComponentsSelfHealing.init) {
      ComponentsSelfHealing.init(_componentsLoader, _config.selfHealing);
    }
  }
  if (FeatureFlags.isEnabled("gracefulDegradationEnabled")) {
    _setupGracefulDegradation();
  }
  if (OrchestratorAdapter.init) {
    OrchestratorAdapter.init(void 0);
  }
  if (FeatureFlags.isEnabled("serviceWorkerEnabled") && ServiceWorkerBridge.init) {
    ServiceWorkerBridge.init();
  }
  if (HealthScheduler.init) {
    HealthScheduler.init(_headerInstance, {
      // @ts-expect-error TS migration - TS2339
      interval: _config.healthScheduler && _config.healthScheduler.interval || 6e4,
      alertThreshold: 60,
      criticalThreshold: 30
    });
  }
  _registerModuleVersions();
  _initialized = true;
  _log("info", "Integracoes inicializadas com sucesso");
  setTimeout(() => {
    start();
  }, 100);
  return Promise.resolve();
}
function _setupGracefulDegradation() {
  if (!GracefulDegradation.registerFeature) return;
  GracefulDegradation.registerFeature("network", {
    name: "Network Connectivity",
    dependencies: [],
    critical: true,
    healthCheck() {
      return navigator.onLine;
    },
    onDegrade() {
      _log("warn", "Network degraded");
      if (_headerInstance && _headerInstance.showFallback) {
        _headerInstance.showFallback("network", "Sem conexao");
      }
    },
    onReactivate() {
      _log("info", "Network restored");
      if (_headerInstance && _headerInstance.hideFallback) {
        _headerInstance.hideFallback();
      }
    }
  });
  GracefulDegradation.registerFeature("api", {
    name: "API Access",
    dependencies: ["network"],
    critical: true,
    healthCheck() {
      if (!HeaderGateway.healthCheck) return true;
      const gw = HeaderGateway.healthCheck();
      return gw && gw.status === "HEALTHY";
    },
    onDegrade() {
      _log("warn", "API degraded");
    }
  });
  GracefulDegradation.registerFeature("components", {
    name: "Header Components",
    dependencies: ["api"],
    critical: false,
    healthCheck() {
      if (!_componentsLoader || !_componentsLoader.healthCheck) return true;
      const hc = _componentsLoader.healthCheck();
      return hc && hc.status !== "UNHEALTHY";
    }
  });
}
function _registerModuleVersions() {
  if (VersionManager.init) {
    VersionManager.init();
  }
  Object.keys(_modules).forEach((key) => {
    const mod = _modules[key];
    if (mod && mod.VERSION && mod.MODULE_ID && VersionManager.registerModule) {
      VersionManager.registerModule(mod.MODULE_ID, mod.VERSION, { changelog: [] });
    }
  });
  if (_headerInstance && _headerInstance.version && VersionManager.registerModule) {
    VersionManager.registerModule("header/index", _headerInstance.version, {});
  }
}
function start() {
  if (!_initialized) {
    _log("warn", "Integrations nao inicializadas");
    return;
  }
  if (_started) {
    _log("debug", "Servicos ja iniciados");
    return;
  }
  if (FeatureFlags.isEnabled("selfHealingEnabled")) {
    if (ComponentsSelfHealing.start) ComponentsSelfHealing.start();
  }
  if (FeatureFlags.isEnabled("lazyLoadingEnabled") && LazyLoader.observeRegions) {
    LazyLoader.observeRegions();
  }
  if (HealthScheduler.start) {
    HealthScheduler.start();
  }
  if (OrchestratorAdapter.notifyReady) {
    OrchestratorAdapter.notifyReady({ version: VERSION, modules: Object.keys(_modules).length });
  }
  _started = true;
  _log("info", "Servicos de runtime iniciados");
}
function stop() {
  if (SelfHealing.stop) SelfHealing.stop();
  if (ComponentsSelfHealing.stop) ComponentsSelfHealing.stop();
  if (HealthScheduler.stop) HealthScheduler.stop();
  if (LazyLoader.unobserveRegions) LazyLoader.unobserveRegions();
  _started = false;
  _log("info", "Servicos de runtime parados");
}
function cleanup() {
  stop();
  if (ComponentsSelfHealing.cleanup) ComponentsSelfHealing.cleanup();
  if (OrchestratorAdapter.cleanup) OrchestratorAdapter.cleanup();
  if (CacheManager.clear) CacheManager.clear();
  _initialized = false;
  _started = false;
  _headerInstance = null;
  _componentsLoader = null;
  _log("info", "Cleanup concluido");
}
function getModule(name) {
  return _modules[name] || null;
}
function getAllModules() {
  return Object.keys(_modules);
}
function withFeature(featureName, fn, fallback) {
  if (FeatureFlags.isEnabled(featureName)) {
    return fn();
  }
  return fallback ? fallback() : null;
}
function healthCheck() {
  const moduleHealths = {};
  let totalScore = 0;
  let maxScore = 0;
  let disabledCount = 0;
  Object.keys(_modules).forEach((key) => {
    const mod = _modules[key];
    if (!_isModuleEnabled(key)) {
      moduleHealths[key] = {
        status: "DISABLED",
        score: 0,
        maxScore: 0,
        scoreDisplay: "N/A",
        reason: "Feature flag desabilitado",
        // @ts-expect-error TS migration - TS2339
        version: mod && mod.VERSION ? mod.VERSION : "unknown",
        // @ts-expect-error TS migration - TS2339
        moduleId: mod && mod.MODULE_ID ? mod.MODULE_ID : key
      };
      disabledCount++;
      return;
    }
    if (mod && mod.healthCheck) {
      try {
        const hc = mod.healthCheck();
        moduleHealths[key] = hc;
        totalScore += hc.score || 0;
        maxScore += hc.maxScore || 0;
      } catch (e) {
        moduleHealths[key] = { status: "ERROR", error: e.message, score: 0, maxScore: 4 };
        maxScore += 4;
      }
    }
  });
  const overallScore = maxScore > 0 ? totalScore / maxScore : 1;
  const checks = {
    initialized: _initialized,
    hasHeader: !!_headerInstance,
    hasComponentsLoader: !!_componentsLoader,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: overallScore >= 0.8 ? "HEALTHY" : overallScore >= 0.5 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    overallModuleHealth: `${(overallScore * 100).toFixed(0)}%`,
    moduleHealths,
    modulesCount: Object.keys(_modules).length,
    enabledModules: Object.keys(_modules).length - disabledCount,
    disabledModules: disabledCount,
    servicesStarted: _started,
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
    started: _started,
    hasHeader: !!_headerInstance,
    hasComponentsLoader: !!_componentsLoader,
    modules: getAllModules(),
    featureFlags: FeatureFlags.getAll ? FeatureFlags.getAll() : {},
    config: _config,
    versionRegistry: VersionManager.getAllModules ? VersionManager.getAllModules() : [],
    portsInitialized: Ports.isInitialized(),
    healthCheck: healthCheck()
  };
}
var header_integrations_default = {
  VERSION,
  MODULE_ID,
  init,
  start,
  stop,
  cleanup,
  getModule,
  getAllModules,
  withFeature,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  cleanup,
  header_integrations_default as default,
  getAllModules,
  getModule,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  _modules as modules,
  start,
  stop,
  withFeature
};
