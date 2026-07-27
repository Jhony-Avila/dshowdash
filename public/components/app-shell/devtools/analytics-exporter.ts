// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: devtools/analytics-exporter-wrapper
// PURPOSE: Wrapper de compatibilidade para analytics-exporter modularizado
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./analytics-exporter/index.js
// EXPORTS: default, VERSION, MODULE_ID, registerAdapter, unregisterAdapter,
//          enableAdapter, disableAdapter, getAdapters, useBuiltInAdapter,
//          track, trackPerformance, trackError, trackHealthCheck, flush,
//          flushAll, enable, disable, isEnabled, getQueueSize, clearQueue,
//          configure, getConfig, getMetrics, healthCheck, info
// DEPRECATION: Importar de './analytics-exporter/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module AnalyticsExporterWrapper
 * @description Compatibilidade retroativa para analytics-exporter
 * @version 1.1.0-AAA
 * @since 2025-02-02
 * @deprecated Use './analytics-exporter/index.js' diretamente
 */
'use strict';

export { default } from './analytics-exporter/index.js';
export {
    VERSION,
    MODULE_ID,
    registerAdapter,
    unregisterAdapter,
    enableAdapter,
    disableAdapter,
    getAdapters,
    useBuiltInAdapter,
    track,
    trackPerformance,
    trackError,
    trackHealthCheck,
    flush,
    flushAll,
    enable,
    disable,
    isEnabled,
    getQueueSize,
    clearQueue,
    configure,
    getConfig,
    getMetrics,
    healthCheck,
    info
} from './analytics-exporter/index.js';
