// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: performance
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   initPerformanceMonitor() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-01.init.performance';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 01 - Performance Initializer
 * @module panel-01/init/performance
 * @version 1.1.0-AAA
 */

export function initPerformanceMonitor(panelId: string) {
    const metrics: Record<string, number | null> = {
        renderTime: 0,
        dataLoadTime: 0,
        interactionCount: 0,
        lastUpdate: null
    };

    return {
        startTimer(name: string) {
            metrics[`${name}Start`] = performance.now();
        },
        endTimer(name: string) {
            const start = metrics[`${name}Start`];
            if (start) {
                metrics[`${name}Time`] = performance.now() - start;
                delete metrics[`${name}Start`];
            }
        },
        trackInteraction() {
            metrics.interactionCount = (metrics.interactionCount as number) + 1;
            metrics.lastUpdate = Date.now();
        },
        getMetrics() {
            return { ...metrics };
        },
        reset() {
            metrics.renderTime = 0;
            metrics.dataLoadTime = 0;
            metrics.interactionCount = 0;
        }
    };
}

export const initPerformance = initPerformanceMonitor;

export function destroyPerformance(perf: { reset?: () => void } | null | undefined) {
  if (perf && typeof perf.reset === 'function') perf.reset();
}

export default { initPerformanceMonitor, initPerformance, destroyPerformance };
