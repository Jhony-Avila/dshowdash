// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: devtools/region-metrics-wrapper
// PURPOSE: Wrapper de compatibilidade para region-metrics modularizado
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./region-metrics/index.js
// EXPORTS: default, VERSION, MODULE_ID, METRIC_TYPES, trackRender,
//          trackUpdate, trackVisibility, trackInteraction, trackError,
//          trackLoad, startTimer, endTimer, getRegionMetrics, getAllMetrics,
//          getPerformanceSummary, getProblematicRegions, enable, disable,
//          isEnabled, reset, resetRegion, configure, getConfig, subscribe,
//          getMetrics, healthCheck, info
// DEPRECATION: Importar de './region-metrics/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionMetricsWrapper
 * @description Compatibilidade retroativa para region-metrics
 * @version 1.1.0-AAA
 * @since 2025-02-02
 * @deprecated Use './region-metrics/index.js' diretamente
 */
'use strict';

export { default } from './region-metrics/index.js';
export {
    VERSION,
    MODULE_ID,
    METRIC_TYPES,
    trackRender,
    trackUpdate,
    trackVisibility,
    trackInteraction,
    trackError,
    trackLoad,
    startTimer,
    endTimer,
    getRegionMetrics,
    getAllMetrics,
    getPerformanceSummary,
    getProblematicRegions,
    enable,
    disable,
    isEnabled,
    reset,
    resetRegion,
    configure,
    getConfig,
    subscribe,
    getMetrics,
    healthCheck,
    info
} from './region-metrics/index.js';
