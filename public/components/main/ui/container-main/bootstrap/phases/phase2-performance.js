import { createPerformanceMonitor } from "../../resources/performance-monitor.js";
import { createFallbackSystem } from "../../resources/fallback-system.js";
import { registerLoaded } from "../../core/dependency-map.js";
import { LIMITS } from "../../config.js";
import { BOOTSTRAP_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap.phases.phase2-performance";
async function initPhase2(context) {
  const config = context.config;
  const eventBus = context.eventBus;
  const bootMetrics = context.bootMetrics;
  const logger = context.logger;
  bootMetrics?.startPhase("phase2");
  logger?.debug("Phase 2 starting...");
  let performanceMonitor = null;
  let fallbackSystem = null;
  if (config.enablePerformanceMonitor) {
    performanceMonitor = createPerformanceMonitor({
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
    registerLoaded("performance-monitor");
  }
  if (config.enableFallbackSystem) {
    fallbackSystem = createFallbackSystem({
      eventBus,
      maxRetries: LIMITS.MAX_RETRY,
      cacheEnabled: true,
      onFallback: (info) => logger?.warn("Fallback used:", info),
      onExhausted: (info) => {
        logger?.error("Fallback exhausted:", info);
        eventBus?.emit(BOOTSTRAP_EVENT_NAMES.FALLBACK_EXHAUSTED, info);
      }
    });
    registerLoaded("fallback-system");
  }
  bootMetrics?.endPhase("phase2");
  logger?.debug("Phase 2 ready");
  return { performanceMonitor, fallbackSystem };
}
var phase2_performance_default = { initPhase2 };
export {
  MODULE_ID,
  VERSION,
  phase2_performance_default as default,
  initPhase2
};
