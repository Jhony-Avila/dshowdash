import {
  ADAPTER_CONFIG,
  connectAdapter,
  disconnectAllAdapters,
  getConnectedAdaptersList,
  ResponsiveAdapter
} from "../adapters/adapter-manager.js";
import { mountShell, unmountShell, finalizeShellReady } from "./mount.js";
import { isSystemRoute, renderSystemPage } from "../utils/system-pages.js";
import { setLoadingState, setErrorState } from "../ui/transitions.js";
import { getBootTime } from "../state/store.js";
import { trackShellEvent, trackError } from "../telemetry/tracker.js";
import PerformanceMetrics from "../devtools/performance-metrics.js";
import AutoHealthCheck from "../devtools/auto-health-check.js";
import APIUsageMetrics from "../devtools/api-usage-metrics.js";
import MemoryLeakDetector from "../devtools/memory-leak-detector.js";
import AnalyticsExporter from "../devtools/analytics-exporter.js";
import DebugPanel from "../devtools/debug-panel.js";
import DebugPresets from "../devtools/debug-presets.js";
import RegionMetrics from "../devtools/region-metrics.js";
import StateSnapshots from "../devtools/state-snapshots.js";
import Logger from "../utils/logger.js";
import ConfigValidator from "../utils/config-validator.js";
import CircuitBreaker from "../utils/circuit-breaker.js";
import RateLimiter from "../utils/rate-limiter.js";
import ServiceWorkerManager from "../utils/service-worker-manager/index.js";
import OfflineManager from "../utils/offline-manager/index.js";
import SlotPersistence from "../state/slot-persistence.js";
import AnimationAPI from "../ui/animation-api/index.js";
import ContentVirtualizer from "../ui/content-virtualizer.js";
import NotificationCenter from "../ui/notification-center/index.js";
import KeyboardShortcuts from "../ui/keyboard-shortcuts/index.js";
import GestureHandler from "../ui/gesture-handler/index.js";
import CommandPalette from "../ui/command-palette.js";
import LayoutPresets from "../ui/layout-presets.js";
import AccessibilityPresets from "../ui/accessibility-presets/index.js";
import SkeletonLoader from "../ui/skeleton-loader/index.js";
import KeyboardNavigation from "../ui/keyboard-navigation/index.js";
import MaintenanceMode from "../core/maintenance-mode/index.js";
import RegionEvents from "../core/region-events/index.js";
import ThemeIntegration from "../adapters/theme-integration.js";
import { setCacheTTL } from "../core/dom-regions/index.js";
const VERSION = "1.2.0-ENTERPRISE";
const MODULE_ID = "app-shell/core/init-shutdown";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
function createInitFn(ctx) {
  return (options = {}) => {
    const validation = ConfigValidator.validateInitOptions(options);
    if (!validation.valid) {
      ctx.logger.error("Invalid init options", { errors: validation.errors });
      return Promise.resolve({ ok: false, error: "Invalid configuration", validationErrors: validation.errors });
    }
    if (validation.warnings.length > 0) {
      ctx.logger.warn("Init options warnings", { warnings: validation.warnings });
    }
    const force = options.force === true;
    const startTime = performance.now();
    PerformanceMetrics.mark("app-shell:init:start");
    trackShellEvent("kernel:init:called", { force, alreadyInitialized: ctx.isInitialized() });
    ctx.logger.debug("Init called", { force, alreadyInitialized: ctx.isInitialized() });
    APIUsageMetrics.trackCall("AppShell", "init");
    if (ctx.isInitialized() && !force) return Promise.resolve({ ok: true, alreadyInitialized: true, status: ctx.getStatus() });
    if (ctx.isInitialized() && force) return ctx.shutdown().then(() => ctx.doInit(startTime, options));
    return ctx.doInit(startTime, options);
  };
}
function createDoInitFn(ctx) {
  return (startTime, options = {}) => {
    trackShellEvent("kernel:init:start");
    ctx.logger.debug("Init starting");
    return mountShell().then((mountResult) => {
      if (!mountResult) throw new Error("Mount failed");
      return connectAdapter("globalState", ADAPTER_CONFIG.globalState, {
        globalState: { onLoading: setLoadingState, onMaintenance: (mode) => {
          if (mode) setErrorState(true);
        } }
      }, ctx.logger, ctx.metrics);
    }).then(() => connectAdapter("layout", ADAPTER_CONFIG.layout, {
      layout: { onFullscreen: (route, main) => {
        if (route && isSystemRoute(route) && main) return renderSystemPage(route, main);
        return Promise.resolve();
      } }
    }, ctx.logger, ctx.metrics)).then(() => {
      ctx.setInitialized(true);
      ctx.metrics.initCount++;
      ctx.metrics.lastInitAt = Date.now();
      ctx.metrics.lastActivity = Date.now();
      ctx.metrics.initDuration = Math.round(performance.now() - startTime);
      PerformanceMetrics.mark("app-shell:init:end");
      PerformanceMetrics.measure("app-shell:init", "app-shell:init:start", "app-shell:init:end");
      PerformanceMetrics.setInitDuration(ctx.metrics.initDuration);
      if (options.healthCheck?.autoEnabled) {
        AutoHealthCheck.start({
          interval: options.healthCheck.interval || 3e4,
          onDegraded: (result) => ctx.logger.warn("Health degraded", result),
          onUnhealthy: (result) => ctx.logger.error("Health unhealthy", result),
          onRecovered: (result) => ctx.logger.debug("Health recovered", result)
        });
      }
      if (options.logger) Logger.configure(options.logger);
      if (options.cache?.ttlMs) setCacheTTL(options.cache.ttlMs);
      if (options.circuitBreaker) CircuitBreaker.setDefaultConfig(options.circuitBreaker);
      if (options.layoutPreset) LayoutPresets.apply(options.layoutPreset);
      if (options.a11yPresets) options.a11yPresets.forEach((p) => AccessibilityPresets.enable(p));
      if (options.animations) AnimationAPI.configure(options.animations);
      if (options.serviceWorker?.autoRegister) ServiceWorkerManager.register(options.serviceWorker);
      if (options.offline) OfflineManager.configure(options.offline);
      if (options.notifications) NotificationCenter.configure(options.notifications);
      if (options.shortcuts) options.shortcuts.forEach((s) => KeyboardShortcuts.register(s.combo, s.handler, s));
      if (options.gestures) GestureHandler.configure(options.gestures);
      if (options.debugPreset) DebugPresets.apply(options.debugPreset);
      if (options.regionMetrics) RegionMetrics.configure(options.regionMetrics);
      if (options.commands) options.commands.forEach((c) => CommandPalette.register(c));
      AnalyticsExporter.trackPerformance("app-shell:init", ctx.metrics.initDuration, { adapters: getConnectedAdaptersList().length });
      trackShellEvent("kernel:init:complete", { initCount: ctx.metrics.initCount, duration: ctx.metrics.initDuration, adaptersConnected: getConnectedAdaptersList().length });
      ctx.logger.debug("Init complete", { duration: `${ctx.metrics.initDuration}ms`, adapters: getConnectedAdaptersList().length });
      return { ok: true, alreadyInitialized: false, duration: ctx.metrics.initDuration, status: ctx.getStatus() };
    }).catch((error) => {
      trackError(error, { context: "init" });
      ctx.logger.error("Init failed", error);
      ctx.metrics.errors++;
      AnalyticsExporter.trackError(error, { context: "init" });
      return { ok: false, error: error.message, status: ctx.getStatus() };
    });
  };
}
function createShutdownFn(ctx) {
  return () => {
    trackShellEvent("kernel:shutdown:called");
    ctx.logger.info("Shutdown called");
    APIUsageMetrics.trackCall("AppShell", "shutdown");
    return Promise.resolve().then(() => {
      AutoHealthCheck.stop();
      MemoryLeakDetector.disable();
      AnalyticsExporter.flushAll();
      SlotPersistence.persist();
      AnimationAPI.cancelAll();
      ContentVirtualizer.destroyAll();
      NotificationCenter.dismissAll();
      KeyboardShortcuts.destroy();
      GestureHandler.destroy();
      CommandPalette.hide();
      StateSnapshots.stopAutoSnapshot();
      OfflineManager.destroy();
      ServiceWorkerManager.stopPeriodicCheck();
      CircuitBreaker.resetAll();
      SkeletonLoader.destroyAll();
      MaintenanceMode.deactivate();
      ResponsiveAdapter.destroy();
      KeyboardNavigation.destroy();
      RegionEvents.destroy();
      ThemeIntegration.destroy();
      PerformanceMetrics.destroy();
      DebugPanel.close();
      DebugPresets.disable();
      RegionMetrics.reset();
      RateLimiter.clearAll();
      disconnectAllAdapters();
      ctx.setInitialized(false);
      ctx.metrics.shutdownCount++;
      ctx.metrics.lastShutdownAt = Date.now();
      return unmountShell();
    }).then((result) => {
      trackShellEvent("kernel:shutdown:complete");
      ctx.logger.info("Shutdown complete");
      return { ok: true, result };
    }).catch((error) => {
      trackError(error, { context: "shutdown" });
      ctx.logger.error("Shutdown failed", error);
      ctx.metrics.errors++;
      return { ok: false, error: error.message };
    });
  };
}
function createFinalizeFn(ctx) {
  return () => {
    const result = finalizeShellReady();
    if (result) {
      connectAdapter("auth", ADAPTER_CONFIG.auth, null, ctx.logger, ctx.metrics);
      connectAdapter("theme", ADAPTER_CONFIG.theme, null, ctx.logger, ctx.metrics);
      connectAdapter("notification", ADAPTER_CONFIG.notification, null, ctx.logger, ctx.metrics);
      connectAdapter("router", ADAPTER_CONFIG.router, null, ctx.logger, ctx.metrics);
      PerformanceMetrics.setBootTime(getBootTime());
      ctx.logger.debug("Finalized - Phase 2 Complete");
      if (typeof window !== "undefined") {
        window.AppShellReady = true;
      }
    }
    return result;
  };
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
export {
  MODULE_ID,
  VERSION,
  createDoInitFn,
  createFinalizeFn,
  createInitFn,
  createShutdownFn,
  getLogs,
  setDebug
};
