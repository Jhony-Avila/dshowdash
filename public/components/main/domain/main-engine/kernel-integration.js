import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import * as MainKernel from "../../kernel/index.js";
import { getFeaturesSortedByPriority } from "../features/feature-manifest.js";
import { MAIN_FEATURES } from "../features/_barrel.js";
import { registerCommands, unregisterCommands } from "../../kernel/console-commands.js";
const VERSION = "1.5.0-P2-ENTERPRISE";
const MODULE_ID = "main-engine-kernel-integration";
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getPort(name) {
  _initPorts();
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const DEFAULT_CONFIG = {
  featureEnableTimeoutMs: 5e3,
  // 5 segundos por feature
  enableConsoleCommands: true,
  logLevel: "info"
  // 'debug' | 'info' | 'warn' | 'error' | 'none'
};
let _initialized = false;
let _config = { ...DEFAULT_CONFIG };
let _metrics = {
  initAttempts: 0,
  initSuccesses: 0,
  featuresLoaded: 0,
  featuresEnabled: 0,
  featuresFailed: 0,
  featuresTimedOut: 0,
  lastInitTime: null,
  totalBootTimeMs: 0
};
function _getLogger() {
  const portLogger = _getPort("logger");
  if (portLogger) return portLogger;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get("Logger");
    if (waLogger) return waLogger;
  }
  return console;
}
function _log(level, ...args) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3, none: 4 };
  const configLevel = levels[_config.logLevel] ?? 1;
  const msgLevel = levels[level] ?? 1;
  if (msgLevel >= configLevel) {
    const prefix = "[MainKernel]";
    const _L = _getLogger();
    if (!_L) return;
    if (level === "error") _L.error(prefix, ...args);
    else if (level === "warn") _L.warn(prefix, ...args);
    else _L.info(prefix, ...args);
  }
}
function _withTimeout(promise, timeoutMs, featureId) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Feature ${featureId} initialization timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    promise.then((result) => {
      clearTimeout(timer);
      resolve(result);
    }).catch((error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
async function initMainKernel(engine, config = {}) {
  if (_initialized) {
    return MainKernel;
  }
  _config = { ...DEFAULT_CONFIG, ...config };
  const startTime = performance.now();
  _metrics.initAttempts++;
  try {
    const initResult = MainKernel.init({ ports: engine._ports });
    if (!initResult.ok) {
      throw new Error(initResult.errors?.[0]?.message || "Kernel init failed");
    }
    const features = getFeaturesSortedByPriority();
    for (const featureDef of features) {
      try {
        const featureModule = MAIN_FEATURES[featureDef.id];
        if (!featureModule) {
          _log("warn", `Feature not found in barrel: ${featureDef.id}`);
          _metrics.featuresFailed++;
          continue;
        }
        _metrics.featuresLoaded++;
        const registerResult = MainKernel.registerFeature({
          id: featureDef.id,
          // @ts-expect-error TS migration - TS2339
          version: featureModule.VERSION || featureModule.default?.VERSION || "1.0.0",
          category: featureDef.category,
          priority: featureDef.priority,
          dependencies: featureDef.dependencies || [],
          // @ts-expect-error TS migration - TS2339
          init: featureModule.init || featureModule.default?.init,
          // @ts-expect-error TS migration - TS2339
          cleanup: featureModule.destroy || featureModule.cleanup || featureModule.default?.destroy,
          // @ts-expect-error TS migration - TS2339
          healthCheck: featureModule.healthCheck || featureModule.default?.healthCheck,
          // @ts-expect-error TS migration - TS2339
          info: featureModule.info || featureModule.default?.info,
          // @ts-expect-error TS migration - TS2339
          getMetrics: featureModule.getMetrics || featureModule.default?.getMetrics
        });
        if (!registerResult.ok) {
          _log("warn", `Failed to register feature: ${featureDef.id}`, registerResult.errors);
          continue;
        }
        if (featureDef.priority <= 1 && featureDef.enabled !== false) {
          try {
            const enablePromise = Promise.resolve(
              MainKernel.enableFeature(featureDef.id, { ports: engine._ports })
            );
            const enableResult = await _withTimeout(
              enablePromise,
              _config.featureEnableTimeoutMs,
              featureDef.id
            );
            if (enableResult.ok) {
              _metrics.featuresEnabled++;
              _log("debug", `Feature enabled: ${featureDef.id} (${enableResult.data?.initDurationMs}ms)`);
            } else {
              _metrics.featuresFailed++;
              _log("warn", `Failed to enable feature: ${featureDef.id}`, enableResult.errors);
            }
          } catch (timeoutError) {
            _metrics.featuresTimedOut++;
            _metrics.featuresFailed++;
            _log("error", timeoutError.message);
          }
        }
      } catch (featureError) {
        _metrics.featuresFailed++;
        _log("error", `Error loading feature: ${featureDef.id}`, featureError);
        engine._ports?.telemetry?.track?.("main-kernel:feature-load-error", {
          featureId: featureDef.id,
          error: featureError.message
        });
      }
    }
    engine._mainKernel = MainKernel;
    if (_config.enableConsoleCommands) {
      try {
        registerCommands(MainKernel);
      } catch (e) {
        _log("warn", "Failed to register console commands:", e.message);
      }
    }
    const bootTime = Math.round(performance.now() - startTime);
    _metrics.initSuccesses++;
    _metrics.lastInitTime = bootTime;
    _metrics.totalBootTimeMs = bootTime;
    const listResult = MainKernel.listFeatures();
    engine._ports?.telemetry?.track?.("main-kernel:initialized", {
      version: MainKernel.VERSION,
      featuresRegistered: listResult.data?.count || 0,
      featuresEnabled: _metrics.featuresEnabled,
      featuresFailed: _metrics.featuresFailed,
      featuresTimedOut: _metrics.featuresTimedOut,
      bootTime
    });
    _initialized = true;
    _log("info", `\u2705 Initialized in ${bootTime}ms - Features: ${_metrics.featuresEnabled}/${_metrics.featuresLoaded} enabled`);
    return MainKernel;
  } catch (error) {
    _log("error", "\u274C Initialization failed:", error);
    engine._ports?.telemetry?.track?.("main-kernel:init-failed", {
      error: error.message,
      stack: error.stack?.substring(0, 500)
    });
    return null;
  }
}
function shutdownMainKernel(engine) {
  if (!_initialized) return { ok: true, wasNotInitialized: true };
  try {
    if (_config.enableConsoleCommands) {
      unregisterCommands();
    }
    MainKernel.shutdown("engine-destroy");
    engine._mainKernel = null;
    _initialized = false;
    _log("info", "\u2705 Shutdown complete");
    return { ok: true };
  } catch (error) {
    _log("error", "Shutdown error:", error.message);
    return { ok: false, error: error.message };
  }
}
function updateConfig(newConfig) {
  _config = { ...DEFAULT_CONFIG, ..._config, ...newConfig };
  return { ok: true, config: { ..._config } };
}
function getConfig() {
  return { ..._config };
}
function getIntegrationMetrics() {
  return { ..._metrics };
}
function healthCheck() {
  const kernelHealth = _initialized ? MainKernel.healthCheck() : null;
  return {
    status: _initialized ? kernelHealth?.status || "UNKNOWN" : "NOT_INITIALIZED",
    moduleId: MODULE_ID,
    version: VERSION,
    strictMode: isStrict(),
    initialized: _initialized,
    config: _config,
    metrics: _metrics,
    kernel: kernelHealth,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    config: _config,
    metrics: _metrics,
    kernelVersion: MainKernel.VERSION
  };
}
var kernel_integration_default = {
  VERSION,
  MODULE_ID,
  initMainKernel,
  shutdownMainKernel,
  updateConfig,
  getConfig,
  getIntegrationMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  kernel_integration_default as default,
  getConfig,
  getIntegrationMetrics,
  getPorts,
  healthCheck,
  info,
  initMainKernel,
  injectPorts,
  shutdownMainKernel,
  updateConfig
};
