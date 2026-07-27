// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.3.0-LOG-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: phase-2
// PURPOSE: Bootstrap Phase 2 - PerformanceMonitor, FallbackSystem
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPerformanceMonitor from ../../resources/performance-monitor.js
//   createFallbackSystem from ../../resources/fallback-system.js
//   registerLoaded from ../../core/dependency-map.js
//   LIMITS from ../../config.js
//   BOOTSTRAP_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   (none)
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   BOOTSTRAP_EVENT_NAMES.FALLBACK_EXHAUSTED
//   BOOTSTRAP_EVENT_NAMES.PERFORMANCE_CRITICAL
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPerformanceMonitor } from '../../resources/performance-monitor.js';
import { createFallbackSystem } from '../../resources/fallback-system.js';
import { registerLoaded } from '../../core/dependency-map.js';
import { LIMITS } from '../../config.js';
import { BOOTSTRAP_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap-integration.phase-initializers.phase-2';

export async function initPhase2(context: Record<string, unknown>) {
  const config = context.config as Record<string, unknown>;
  const eventBus = context.eventBus as import("../types.js").ManagerRef | null;
  const bootMetrics = context.bootMetrics as import("../types.js").ManagerRef | null;
  const managers = context.managers as import("../types.js").ManagerRef;
  const logger = context.logger as import("../types.js").ManagerRef | null;
  
  bootMetrics?.startPhase('phase2');
  // v13.3.0: debug — phase start is internal plumbing
  logger?.debug('Phase 2 starting...');
  
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
      onWarning: (alert: Record<string, unknown>) => {
        logger?.warn('Performance warning:', alert);
        (config.onPerformanceWarning as ((...a: unknown[]) => void) | undefined)?.(alert);
      },
      onCritical: (alert: Record<string, unknown>) => {
        logger?.error('Performance critical:', alert);
        (config.onPerformanceCritical as ((...a: unknown[]) => void) | undefined)?.(alert);
        eventBus?.emit(BOOTSTRAP_EVENT_NAMES.PERFORMANCE_CRITICAL, alert);
      }
    });
    performanceMonitor.init();
    managers.set('performanceMonitor', performanceMonitor);
    registerLoaded('performance-monitor');
  }
  
  if (config.enableFallbackSystem) {
    const fallbackSystem = createFallbackSystem({
      eventBus,
      maxRetries: LIMITS.MAX_RETRY,
      cacheEnabled: true,
      onFallback: (info: Record<string, unknown>) => logger?.warn('Fallback used:', info),
      onExhausted: (info: Record<string, unknown>) => {
        logger?.error('Fallback exhausted:', info);
        eventBus?.emit(BOOTSTRAP_EVENT_NAMES.FALLBACK_EXHAUSTED, info);
      }
    });
    managers.set('fallbackSystem', fallbackSystem);
    registerLoaded('fallback-system');
  }
  
  bootMetrics?.endPhase('phase2');
}

export default { initPhase2 };
