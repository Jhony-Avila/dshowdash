import { createUiPorts } from "/core/runtime/ports-profiles.js";
import * as Kernel from "./index.js";
import * as CircuitBreaker from "./circuit-breaker.js";
import * as HealthMonitor from "./health-monitor.js";
import * as HotReload from "./hot-reload.js";
import * as ConfigLoader from "./config-loader.js";
import { registerCommands, unregisterCommands } from "./console-commands.js";
import * as RuntimeContextHandler from "./runtime-context-handler.js";
const MODULE_ID = "sidebar-kernel-integration";
const VERSION = "2.2.0-ES6";
const _Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return _Ports.get(name);
}
function injectPorts(p) {
  return _Ports.inject(p);
}
function getPorts() {
  return _Ports.snapshot();
}
let _initialized = false;
let _config = null;
let _metrics = {
  bootTime: null,
  lastHealthCheck: null,
  circuitBreakerTrips: 0,
  healthMonitorRecoveries: 0,
  hotReloads: 0,
  runtimeContextSetup: false
};
const DEFAULT_CONFIG = {
  enableConsoleCommands: true,
  enableCircuitBreaker: true,
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 3e4,
    halfOpenMaxAttempts: 3
  },
  enableHealthMonitor: true,
  healthMonitor: {
    intervalMs: 3e4,
    degradedThreshold: 0.8,
    unhealthyThreshold: 0.5,
    autoRecover: true,
    maxRecoveryAttempts: 3
  },
  enableHotReload: true,
  enableRuntimeContext: true,
  logLevel: "info"
};
function _log(level, msg, data) {
  const prefix = "[SidebarKernel-Integration]";
  const logger = _getPort("logger");
  if (logger && logger[level]) {
    logger[level](prefix, msg, data || "");
  } else if (level === "error" || level === "warn" || level === "info") {
    const fn = console.debug;
    if (data) fn(prefix, msg, data);
    else fn(prefix, msg);
  }
}
async function boot(options) {
  if (_initialized) {
    return { ok: true, alreadyInitialized: true };
  }
  const startTime = Date.now();
  options = options || {};
  try {
    if (options.configPath) {
      const configResult = await ConfigLoader.loadConfig(options.configPath);
      _config = configResult.config;
      _log("debug", `Config loaded from ${configResult.source}`);
    } else {
      _config = Object.assign({}, DEFAULT_CONFIG, options);
    }
    const kernelResult = Kernel.init(options.ctx || {});
    if (!kernelResult.ok) {
      return { ok: false, error: "Kernel init failed", details: kernelResult };
    }
    _log("info", `Kernel initialized v${Kernel.VERSION}`);
    if (_config.enableCircuitBreaker) {
      _log("debug", "CircuitBreaker enabled");
    }
    if (_config.enableHealthMonitor) {
      HealthMonitor.init(Kernel, {
        intervalMs: _config.healthMonitor.intervalMs,
        degradedThreshold: _config.healthMonitor.degradedThreshold,
        unhealthyThreshold: _config.healthMonitor.unhealthyThreshold,
        autoRecover: _config.healthMonitor.autoRecover,
        maxRecoveryAttempts: _config.healthMonitor.maxRecoveryAttempts,
        onDegraded(result) {
          _log("warn", `Health degraded: ${result.status} (${result.score}%)`);
        },
        onUnhealthy(result) {
          _log("error", `Health unhealthy: ${result.status} (${result.score}%)`);
        },
        onRecovered(featureId) {
          _log("info", `Feature recovered: ${featureId}`);
          _metrics.healthMonitorRecoveries++;
          if (_config.enableCircuitBreaker) {
            CircuitBreaker.reset(featureId);
          }
        }
      });
      HealthMonitor.start();
      _log("debug", "HealthMonitor started");
    }
    if (_config.enableHotReload) {
      HotReload.init(Kernel);
      _log("debug", "HotReload enabled");
    }
    if (_config.enableConsoleCommands) {
      registerCommands(Kernel);
      _log("debug", "Console commands registered (sk.*)");
    }
    if (_config.enableRuntimeContext !== false) {
      const rcResult = RuntimeContextHandler.setup();
      _metrics.runtimeContextSetup = rcResult.ok;
      if (rcResult.ok) {
        _log("info", "RuntimeContext handler configured");
      } else {
        _log("warn", `RuntimeContext handler failed: ${rcResult.error || "unknown"}`);
      }
    }
    _metrics.bootTime = Date.now() - startTime;
    _initialized = true;
    _log("info", `\u2705 Boot complete in ${_metrics.bootTime}ms`);
    return {
      ok: true,
      bootTime: _metrics.bootTime,
      config: {
        circuitBreaker: _config.enableCircuitBreaker,
        healthMonitor: _config.enableHealthMonitor,
        hotReload: _config.enableHotReload,
        consoleCommands: _config.enableConsoleCommands,
        runtimeContext: _metrics.runtimeContextSetup
      }
    };
  } catch (e) {
    _log("error", "Boot failed:", e.message);
    return { ok: false, error: e.message };
  }
}
function shutdown(reason) {
  if (!_initialized) {
    return { ok: true, notInitialized: true };
  }
  try {
    if (_metrics.runtimeContextSetup) {
      RuntimeContextHandler.cleanup();
      _metrics.runtimeContextSetup = false;
    }
    if (_config && _config.enableHealthMonitor) {
      HealthMonitor.destroy();
    }
    if (_config && _config.enableHotReload) {
      HotReload.destroy();
    }
    if (_config && _config.enableConsoleCommands) {
      unregisterCommands();
    }
    Kernel.shutdown(reason || "integration-shutdown");
    _initialized = false;
    _log("info", `Shutdown complete: ${reason || "manual"}`);
    return { ok: true, reason };
  } catch (e) {
    _log("error", "Shutdown error:", e.message);
    return { ok: false, error: e.message };
  }
}
function enableFeature(featureId, options) {
  if (_config && _config.enableCircuitBreaker) {
    const cbCheck = CircuitBreaker.canExecute(featureId);
    if (!cbCheck.allowed) {
      _metrics.circuitBreakerTrips++;
      return { ok: false, error: "Circuit breaker open", reason: cbCheck.reason };
    }
  }
  const result = Kernel.enableFeature(featureId, options);
  if (_config && _config.enableCircuitBreaker) {
    if (result.ok) {
      CircuitBreaker.recordSuccess(featureId);
    } else {
      CircuitBreaker.recordFailure(featureId, result.errors && result.errors[0] ? result.errors[0].message : "Enable failed");
    }
  }
  return result;
}
function disableFeature(featureId, reason, options) {
  return Kernel.disableFeature(featureId, reason, options);
}
async function reloadFeature(featureId, options) {
  if (!_config || !_config.enableHotReload) {
    return { ok: false, error: "Hot reload not enabled" };
  }
  const result = await HotReload.reloadFeature(featureId, options);
  if (result.ok) {
    _metrics.hotReloads++;
  }
  return result;
}
function healthCheck() {
  const kernelHealth = Kernel.healthCheck();
  const circuitBreakerHealth = _config && _config.enableCircuitBreaker ? CircuitBreaker.healthCheck() : null;
  const healthMonitorHealth = _config && _config.enableHealthMonitor ? HealthMonitor.healthCheck() : null;
  const hotReloadHealth = _config && _config.enableHotReload ? HotReload.healthCheck() : null;
  const runtimeContextHealth = _metrics.runtimeContextSetup ? RuntimeContextHandler.healthCheck() : null;
  _metrics.lastHealthCheck = Date.now();
  let allHealthy = kernelHealth.status === "HEALTHY";
  if (circuitBreakerHealth && circuitBreakerHealth.status !== "HEALTHY") allHealthy = false;
  if (healthMonitorHealth && healthMonitorHealth.status !== "HEALTHY" && healthMonitorHealth.status !== "RUNNING") allHealthy = false;
  return {
    status: allHealthy ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: _Ports.isInitialized(),
    initialized: _initialized,
    kernel: kernelHealth,
    circuitBreaker: circuitBreakerHealth,
    healthMonitor: healthMonitorHealth,
    hotReload: hotReloadHealth,
    runtimeContext: runtimeContextHealth,
    metrics: Object.assign({}, _metrics),
    timestamp: Date.now()
  };
}
function exportDiagnostics() {
  return {
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    integration: {
      moduleId: MODULE_ID,
      version: VERSION,
      initialized: _initialized,
      config: _config,
      metrics: Object.assign({}, _metrics)
    },
    kernel: Kernel.exportDiagnostics(),
    circuitBreaker: _config && _config.enableCircuitBreaker ? CircuitBreaker.getMetrics() : null,
    healthMonitor: _config && _config.enableHealthMonitor ? HealthMonitor.getMetrics() : null,
    hotReload: _config && _config.enableHotReload ? HotReload.getMetrics() : null,
    runtimeContext: _metrics.runtimeContextSetup ? RuntimeContextHandler.info() : null
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    portsInitialized: _Ports.isInitialized(),
    config: _config ? {
      circuitBreaker: _config.enableCircuitBreaker,
      healthMonitor: _config.enableHealthMonitor,
      hotReload: _config.enableHotReload,
      consoleCommands: _config.enableConsoleCommands,
      runtimeContext: _config.enableRuntimeContext !== false
    } : null,
    metrics: Object.assign({}, _metrics),
    timestamp: Date.now()
  };
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
const kernel = {
  listFeatures: Kernel.listFeatures,
  getFeatureStatus: Kernel.getFeatureStatus,
  getFeature: Kernel.getFeature,
  getFeaturesByStatus: Kernel.getFeaturesByStatus,
  getFeatureMetrics: Kernel.getFeatureMetrics,
  canDisable: Kernel.canDisable,
  getDependents: Kernel.getDependents,
  validateDependencies: Kernel.validateDependencies,
  metrics: Kernel.metrics,
  healthCheck: Kernel.healthCheck,
  exportDiagnostics: Kernel.exportDiagnostics,
  info: Kernel.info
};
const circuitBreaker = {
  getStatus: CircuitBreaker.getStatus,
  getAllStatus: CircuitBreaker.getAllStatus,
  reset: CircuitBreaker.reset,
  getMetrics: CircuitBreaker.getMetrics
};
const healthMonitor = {
  start: HealthMonitor.start,
  stop: HealthMonitor.stop,
  checkNow: HealthMonitor.checkNow,
  getHistory: HealthMonitor.getHistory,
  getMetrics: HealthMonitor.getMetrics
};
const hotReload = {
  reloadFeature: HotReload.reloadFeature,
  reloadAllFeatures: HotReload.reloadAllFeatures,
  getStatus: HotReload.getStatus,
  getHistory: HotReload.getHistory
};
const runtimeContext = {
  healthCheck: RuntimeContextHandler.healthCheck,
  getMetrics: RuntimeContextHandler.getMetrics,
  info: RuntimeContextHandler.info
};
if (typeof window !== "undefined") {
  window.SidebarKernelIntegration = {
    VERSION,
    boot,
    shutdown,
    enableFeature,
    disableFeature,
    reloadFeature,
    healthCheck,
    exportDiagnostics,
    info,
    kernel,
    circuitBreaker,
    healthMonitor,
    hotReload,
    runtimeContext
  };
}
var kernel_integration_default = {
  MODULE_ID,
  VERSION,
  boot,
  shutdown,
  enableFeature,
  disableFeature,
  reloadFeature,
  healthCheck,
  exportDiagnostics,
  info,
  getMetrics,
  injectPorts,
  getPorts,
  kernel,
  circuitBreaker,
  healthMonitor,
  hotReload,
  runtimeContext
};
export {
  MODULE_ID,
  VERSION,
  boot,
  circuitBreaker,
  kernel_integration_default as default,
  disableFeature,
  enableFeature,
  exportDiagnostics,
  getMetrics,
  getPorts,
  healthCheck,
  healthMonitor,
  hotReload,
  info,
  injectPorts,
  kernel,
  reloadFeature,
  runtimeContext,
  shutdown
};
