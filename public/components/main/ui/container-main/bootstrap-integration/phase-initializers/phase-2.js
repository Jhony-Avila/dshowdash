import { createPerformanceMonitor } from "../../resources/performance-monitor.js";
import { createFallbackSystem } from "../../resources/fallback-system.js";
import { registerLoaded } from "../../core/dependency-map.js";
import { LIMITS } from "../../config.js";
import { BOOTSTRAP_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap-integration.phase-initializers.phase-2";
async function initPhase2(context) {
  const config = context.config;
  const eventBus = context.eventBus;
  const bootMetrics = context.bootMetrics;
  const managers = context.managers;
  const logger = context.logger;
  bootMetrics?.startPhase("phase2");
  logger?.debug("Phase 2 starting...");
  if (config.enablePerformanceMonitor) {
    const performanceMonitor = createPerformanceMonitor({
      eventBus,
      sampleInterval: config.performanceInterval,
      thresholds: {
        memoryWarningMB: LIMITS.MEMORY_WARNING_MB,
        memoryCriticalMB: LIMITS.MEMORY_CRITICAL_MB,
        fpsWarning: LIMITS.FPS_WARNING,
        fpsCritical: LIMITS.FPS_CRITICAL
      },
      onWarning: (alert) => {
        logger?.warn("Performance warning:", alert);
        config.onPerformanceWarning?.(alert);
      },
      onCritical: (alert) => {
        logger?.error("Performance critical:", alert);
        config.onPerformanceCritical?.(alert);
        eventBus?.emit(BOOTSTRAP_EVENT_NAMES.PERFORMANCE_CRITICAL, alert);
      }
    });
    performanceMonitor.init();
    managers.set("performanceMonitor", performanceMonitor);
    registerLoaded("performance-monitor");
  }
  if (config.enableFallbackSystem) {
    const fallbackSystem = createFallbackSystem({
      eventBus,
      maxRetries: LIMITS.MAX_RETRY,
      cacheEnabled: true,
      onFallback: (info) => logger?.warn("Fallback used:", info),
      onExhausted: (info) => {
        logger?.error("Fallback exhausted:", info);
        eventBus?.emit(BOOTSTRAP_EVENT_NAMES.FALLBACK_EXHAUSTED, info);
      }
    });
    managers.set("fallbackSystem", fallbackSystem);
    registerLoaded("fallback-system");
  }
  bootMetrics?.endPhase("phase2");
}
var phase_2_default = { initPhase2 };
export {
  MODULE_ID,
  VERSION,
  phase_2_default as default,
  initPhase2
};
