import { SHELL_EVENTS } from "/core/runtime/events/catalog/shell.events.js";
import { collectAdapterHealths, collectAdapterInfos, getConnectedAdaptersList, ResponsiveAdapter } from "../adapters/adapter-manager.js";
import { getState, getBootTime, getPhaseTimings, getTransitionHistory } from "../state/store.js";
import { getRegionsHealth, validateRegions, getAccessCounts, REGION_MAP, ENTERPRISE_STRICT, getCacheConfig, getCacheStats } from "../core/dom-regions/index.js";
import { getLifecycleInfo } from "../core/lifecycle.js";
import { getReadinessInfo } from "../core/readiness.js";
import { getSystemPagesInfo } from "../utils/system-pages.js";
import { getTransitionState, prefersReducedMotion } from "../ui/transitions.js";
import { trackHealthCheck } from "../telemetry/tracker.js";
import RegionVisibility from "../core/region-visibility.js";
import RegionEvents from "../core/region-events/index.js";
import RegionSlots from "../core/region-slots.js";
import MaintenanceMode from "../core/maintenance-mode/index.js";
import SlotPersistence from "../state/slot-persistence.js";
import RegionLoading from "../ui/region-loading.js";
import KeyboardNavigation from "../ui/keyboard-navigation/index.js";
import RegionResize from "../ui/region-resize/index.js";
import LayoutPresets from "../ui/layout-presets.js";
import SkeletonLoader from "../ui/skeleton-loader/index.js";
import FocusManager from "../ui/focus-manager/index.js";
import AccessibilityPresets from "../ui/accessibility-presets/index.js";
import AnimationAPI from "../ui/animation-api/index.js";
import ContentVirtualizer from "../ui/content-virtualizer.js";
import NotificationCenter from "../ui/notification-center/index.js";
import KeyboardShortcuts from "../ui/keyboard-shortcuts/index.js";
import GestureHandler from "../ui/gesture-handler/index.js";
import CommandPalette from "../ui/command-palette.js";
import Icons from "../ui/icons.js";
import ThemeIntegration from "../adapters/theme-integration.js";
import DebugPanel from "../devtools/debug-panel.js";
import PerformanceMetrics from "../devtools/performance-metrics.js";
import AutoHealthCheck from "../devtools/auto-health-check.js";
import APIUsageMetrics from "../devtools/api-usage-metrics.js";
import MemoryLeakDetector from "../devtools/memory-leak-detector.js";
import AnalyticsExporter from "../devtools/analytics-exporter.js";
import BundleAnalyzer from "../devtools/bundle-analyzer.js";
import DebugPresets from "../devtools/debug-presets.js";
import RegionMetrics from "../devtools/region-metrics.js";
import StateSnapshots from "../devtools/state-snapshots.js";
import Logger from "../utils/logger.js";
import RateLimiter from "../utils/rate-limiter.js";
import ConfigValidator from "../utils/config-validator.js";
import CircuitBreaker from "../utils/circuit-breaker.js";
import LazyLoader from "../utils/lazy-loader.js";
import ServiceWorkerManager from "../utils/service-worker-manager/index.js";
import OfflineManager from "../utils/offline-manager/index.js";
import ConfigExporter from "../utils/config-exporter.js";
const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "app-shell/core/health-info";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
function createHealthCheckFn(ctx) {
  return () => {
    APIUsageMetrics.trackCall("AppShell", "healthCheck");
    const state = getState();
    const regionsHealth = getRegionsHealth();
    const adapterHealths = collectAdapterHealths();
    const issues = [];
    const portsSnapshot = ctx.Ports.snapshot();
    const regionsAllPresent = regionsHealth._summary?.allPresent || false;
    const adaptersHealthy = !Object.values(adapterHealths).some((h) => {
      if (typeof h === "string") return h === "UNHEALTHY";
      if (h && typeof h === "object") return h.status === "UNHEALTHY" || h.status === "ERROR";
      return false;
    });
    const circuitBreakerHealth = CircuitBreaker.healthCheck();
    const maintenanceActive = MaintenanceMode.isActive();
    const offlineStatus = OfflineManager.isOnline();
    const checks = {
      initialized: ctx.isInitialized(),
      mounted: state.mounted,
      ready: state.ready,
      regionsPresent: regionsAllPresent,
      enterpriseStrict: ENTERPRISE_STRICT,
      noErrors: !state.error,
      adaptersHealthy,
      lowErrorRate: ctx.metrics.initCount === 0 || ctx.metrics.errors / ctx.metrics.initCount < 0.1,
      portsInitialized: portsSnapshot._initialized,
      circuitsHealthy: circuitBreakerHealth.status !== "UNHEALTHY",
      notInMaintenance: !maintenanceActive,
      isOnline: offlineStatus
    };
    if (!checks.initialized) issues.push({ type: "not-initialized", severity: "warning" });
    if (!checks.mounted) issues.push({ type: "not-mounted", severity: "error" });
    if (!checks.ready && checks.mounted) issues.push({ type: "not-ready", severity: "warning" });
    if (!checks.regionsPresent) {
      for (const [rName, rHealth] of Object.entries(regionsHealth)) {
        if (rName !== "_summary" && rHealth && !rHealth.exists) issues.push({ type: "region-missing", region: rName, severity: "error" });
      }
    }
    for (const [aName, aHealth] of Object.entries(adapterHealths)) {
      if (aHealth && typeof aHealth === "object" && (aHealth.status === "UNHEALTHY" || aHealth.status === "ERROR")) {
        issues.push({ type: "adapter-unhealthy", adapter: aName, status: aHealth.status, severity: "error" });
      }
    }
    if (state.error) issues.push({ type: "has-error", error: state.error, severity: "error" });
    if (maintenanceActive) issues.push({ type: "maintenance-active", severity: "info" });
    if (!offlineStatus) issues.push({ type: "offline", severity: "warning" });
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const status = passed === total ? "HEALTHY" : passed >= 9 ? "DEGRADED" : "UNHEALTHY";
    if (status === "DEGRADED" || status === "UNHEALTHY") {
      try {
        const eventBus = ctx.getPort("eventBus");
        eventBus?.emit?.(SHELL_EVENTS.DEGRADED, { status, issues, timestamp: Date.now() });
      } catch (e) {
      }
    }
    const result = { status, score: `${passed}/${total}`, checks, issues: issues.length > 0 ? issues : null, adapters: adapterHealths, circuitBreakers: circuitBreakerHealth.metrics, architecture: "KERNEL-AAA-v7", enterpriseStrict: ENTERPRISE_STRICT, version: ctx.VERSION, moduleId: ctx.MODULE_ID, p18Compliant: true, phase2Complete: true, timestamp: Date.now() };
    trackHealthCheck(result);
    AnalyticsExporter.trackHealthCheck(result);
    return result;
  };
}
function createInfoFn(ctx) {
  return () => {
    APIUsageMetrics.trackCall("AppShell", "info");
    const state = getState();
    const portsSnapshot = ctx.Ports.snapshot();
    return {
      name: ctx.MODULE_ID,
      version: ctx.VERSION,
      architecture: "KERNEL-AAA-v7",
      enterpriseStrict: ENTERPRISE_STRICT,
      phase2Complete: true,
      initialized: ctx.isInitialized(),
      phase: state.phase,
      mounted: state.mounted,
      ready: state.ready,
      error: state.error,
      bootTime: getBootTime(),
      phaseTimings: getPhaseTimings(),
      transitionHistory: getTransitionHistory(),
      regions: { map: REGION_MAP, health: getRegionsHealth(), validation: validateRegions(), accessCounts: getAccessCounts(), visibility: RegionVisibility.getVisibilityState(), sizes: RegionResize.getSizes(), loading: RegionLoading.getLoadingState(), slots: RegionSlots.info().slotsByRegion, cacheConfig: getCacheConfig(), cacheStats: getCacheStats() },
      adapters: collectAdapterInfos(),
      connectedAdapters: getConnectedAdaptersList(),
      lifecycle: getLifecycleInfo(),
      readiness: getReadinessInfo(),
      transitions: getTransitionState(),
      systemPages: getSystemPagesInfo(),
      responsive: ResponsiveAdapter.info(),
      keyboard: KeyboardNavigation.info(),
      theme: ThemeIntegration.info(),
      events: RegionEvents.info(),
      performance: PerformanceMetrics.info(),
      autoHealthCheck: AutoHealthCheck.info(),
      logger: Logger.getInfo(),
      rateLimiter: RateLimiter.info(),
      configValidator: ConfigValidator.info(),
      apiUsageMetrics: APIUsageMetrics.info(),
      memoryLeakDetector: MemoryLeakDetector.info(),
      analyticsExporter: AnalyticsExporter.info(),
      circuitBreaker: CircuitBreaker.info(),
      lazyLoader: LazyLoader.info(),
      bundleAnalyzer: BundleAnalyzer.info(),
      layoutPresets: LayoutPresets.info(),
      slotPersistence: SlotPersistence.info(),
      skeletonLoader: SkeletonLoader.info(),
      maintenanceMode: MaintenanceMode.info(),
      focusManager: FocusManager.info(),
      accessibilityPresets: AccessibilityPresets.info(),
      animationAPI: AnimationAPI.info(),
      serviceWorker: ServiceWorkerManager.info(),
      contentVirtualizer: ContentVirtualizer.info(),
      offlineManager: OfflineManager.info(),
      notificationCenter: NotificationCenter.info(),
      keyboardShortcuts: KeyboardShortcuts.info(),
      gestureHandler: GestureHandler.info(),
      debugPresets: DebugPresets.info(),
      configExporter: ConfigExporter.info(),
      regionMetrics: RegionMetrics.info(),
      commandPalette: CommandPalette.info(),
      stateSnapshots: StateSnapshots.info(),
      debugPanel: DebugPanel.info(),
      icons: Icons.info(),
      accessibility: { prefersReducedMotion: prefersReducedMotion(), skipLinksPresent: !!document.getElementById("shell-skip-links"), keyboardNavEnabled: KeyboardNavigation.isEnabled(), activeA11yPresets: AccessibilityPresets.getActivePresets() },
      metrics: { initCount: ctx.metrics.initCount, shutdownCount: ctx.metrics.shutdownCount, errors: ctx.metrics.errors, adaptersConnected: ctx.metrics.adaptersConnected, lastInitAt: ctx.metrics.lastInitAt, lastShutdownAt: ctx.metrics.lastShutdownAt, lastActivity: ctx.metrics.lastActivity, initDuration: ctx.metrics.initDuration },
      portsStatus: { initialized: portsSnapshot._initialized },
      capabilities: ["regions", "adapters", "telemetry", "transitions", "health-check", "system-pages", "focus-management", "aria-live", "skip-links", "reduced-motion", "enterprise-strict", "lazy-adapters", "cache", "layout-persistence", "region-visibility", "responsive-layout", "region-resize", "keyboard-navigation", "region-loading", "theme-integration", "region-events", "region-slots", "debug-panel", "performance-metrics", "auto-health-check", "structured-logger", "rate-limiter", "config-validator", "cache-ttl", "api-usage-metrics", "memory-leak-detector", "analytics-exporter", "circuit-breaker", "lazy-loader", "bundle-analyzer", "layout-presets", "slot-persistence", "skeleton-loader", "maintenance-mode", "focus-manager", "accessibility-presets", "animation-api", "service-worker", "content-virtualizer", "offline-manager", "notification-center", "keyboard-shortcuts", "gesture-handler", "debug-presets", "config-exporter", "region-metrics", "command-palette", "state-snapshots", "unified-ui", "svg-icons"],
      p18Compliant: true,
      timestamp: Date.now()
    };
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
  createHealthCheckFn,
  createInfoFn,
  getLogs,
  setDebug
};
