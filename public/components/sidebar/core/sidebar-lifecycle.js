const MODULE_ID = "sidebar.core.sidebar-lifecycle";
import { Sidebar } from "../sidebar.js";
import { setInstance } from "../factory.js";
import { getConfig } from "./config-loader.js";
import * as Kernel from "../kernel/index.js";
import * as MetricsHub from "../telemetry/metrics-hub.js";
import * as CircuitBreaker from "../kernel/circuit-breaker.js";
import * as HealthMonitor from "../kernel/health-monitor.js";
import { registerCommands, unregisterCommands } from "../kernel/console-commands.js";
import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { registerFeatures, enableFeatures } from "./feature-loader.js";
const VERSION = "1.0.0-ENTERPRISE";
function createCreateSidebar(ctx) {
  return (options = {}) => {
    if (ctx.getInstance()) return ctx.getInstance();
    const startTime = Date.now();
    ctx.initPorts();
    try {
      const externalConfig = getConfig();
      ctx.setSafeMode(externalConfig && externalConfig.safeMode === true || options.safeMode === true);
      if (externalConfig && externalConfig.kernel) {
        ctx.setConfig(Object.assign({}, ctx.DEFAULT_CONFIG, externalConfig.kernel, options));
      }
      if (ctx.getSafeMode()) {
        ctx.moduleMetrics.safeModeBoots++;
        ctx.log("info", "SafeMode ACTIVE - minimal boot");
      }
    } catch (e) {
      ctx.setSafeMode(options.safeMode === true);
    }
    Kernel.init({ ports: ctx.Ports.snapshot() });
    MetricsHub.init({ ports: ctx.Ports.snapshot() });
    MetricsHub.registerSource("sidebar-orchestrator", {
      category: "core",
      version: ctx.VERSION,
      getMetrics() {
        return Object.assign({}, ctx.moduleMetrics, { kernel: Kernel.metrics().data });
      }
    });
    if (ctx.getConfig().enableConsoleCommands) {
      try {
        registerCommands(Kernel);
        ctx.log("debug", "Console commands registered (sk.*)");
      } catch (e) {
        ctx.log("warn", "Failed to register console commands:", e.message);
      }
    }
    const instance = new Sidebar();
    ctx.setInstance(instance);
    setInstance(instance);
    ctx.moduleMetrics.instancesCreated++;
    const eb = ctx.getEventBus();
    const featureCtx = {
      log: ctx.log,
      config: ctx.getConfig(),
      moduleMetrics: ctx.moduleMetrics,
      safeMode: ctx.getSafeMode(),
      featuresLoaded: ctx.getFeaturesLoaded(),
      setFeaturesLoaded: ctx.setFeaturesLoaded,
      featureModules: ctx.featureModules
    };
    (async () => {
      try {
        await registerFeatures(featureCtx);
        await enableFeatures(eb, ctx.getSidebarEl(), featureCtx);
        if (ctx.getConfig().enableHealthMonitor) {
          try {
            HealthMonitor.init(Kernel, {
              intervalMs: ctx.getConfig().healthMonitorIntervalMs,
              autoRecover: ctx.getConfig().healthMonitorAutoRecover,
              onDegraded(result) {
                ctx.log("warn", "Kernel health degraded:", `${result.status} ${result.score}%`);
              },
              onRecovered(featureId) {
                ctx.log("info", "Feature recovered:", featureId);
                if (ctx.getConfig().enableCircuitBreaker) {
                  CircuitBreaker.reset(featureId);
                }
              }
            });
            HealthMonitor.start();
            ctx.log("debug", "HealthMonitor started");
          } catch (e) {
            ctx.log("warn", "Failed to start HealthMonitor:", e.message);
          }
        }
        ctx.moduleMetrics.initTime = Date.now() - startTime;
        if (eb && eb.emit) {
          eb.emit(SIDEBAR_EVENTS.KERNEL_READY, {
            version: ctx.VERSION,
            safeMode: ctx.getSafeMode(),
            featuresRegistered: ctx.moduleMetrics.featuresRegistered,
            featuresEnabled: ctx.moduleMetrics.featuresEnabled,
            featuresSkipped: ctx.moduleMetrics.featuresSkipped,
            initTime: ctx.moduleMetrics.initTime
          });
        }
        ctx.log("info", `\u2705 Initialized in ${ctx.moduleMetrics.initTime}ms - Features: ${ctx.moduleMetrics.featuresEnabled}/${ctx.moduleMetrics.featuresRegistered} enabled`);
      } catch (error) {
        ctx.moduleMetrics.featureErrors++;
        ctx.moduleMetrics.lastError = { phase: "feature-init", message: error.message, timestamp: Date.now() };
        ctx.log("error", "Feature initialization error:", error);
      }
    })();
    return instance;
  };
}
function createGetSidebar(ctx) {
  return () => {
    if (!ctx.getInstance()) throw new Error("Sidebar not initialized");
    return ctx.getInstance();
  };
}
function createDestroySidebar(ctx) {
  return () => {
    if (ctx.getConfig().enableHealthMonitor) {
      try {
        HealthMonitor.destroy();
      } catch (e) {
      }
    }
    if (ctx.getConfig().enableConsoleCommands) {
      try {
        unregisterCommands();
      } catch (e) {
      }
    }
    Kernel.shutdown("destroySidebar");
    MetricsHub.cleanup();
    const instance = ctx.getInstance();
    if (instance && instance.destroy) {
      instance.destroy();
    }
    ctx.setInstance(null);
    setInstance(null);
    ctx.setFeaturesLoaded(false);
    ctx.featureModules.clear();
    ctx.setSafeMode(false);
  };
}
export {
  MODULE_ID,
  VERSION,
  createCreateSidebar,
  createDestroySidebar,
  createGetSidebar
};
