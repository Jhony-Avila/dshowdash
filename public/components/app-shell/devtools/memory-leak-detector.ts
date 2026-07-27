// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: devtools/memory-leak-detector-wrapper
// PURPOSE: Wrapper de compatibilidade para memory-leak-detector modularizado
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./memory-leak-detector/index.js
// EXPORTS: default, VERSION, MODULE_ID, enable, disable, isEnabled,
//          checkNow, getTrackedListeners, getTrackedIntervals,
//          getTrackedTimeouts, getLeakReports, getLastReport,
//          clearReports, trackReference, untrackReference,
//          configure, getConfig, getMetrics, healthCheck, info
// DEPRECATION: Importar de './memory-leak-detector/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module MemoryLeakDetectorWrapper
 * @description Compatibilidade retroativa para memory-leak-detector
 * @version 1.1.0-AAA
 * @since 2025-02-02
 * @deprecated Use './memory-leak-detector/index.js' diretamente
 */
'use strict';

export { default } from './memory-leak-detector/index.js';
export {
    VERSION,
    MODULE_ID,
    enable,
    disable,
    isEnabled,
    checkNow,
    getTrackedListeners,
    getTrackedIntervals,
    getTrackedTimeouts,
    getLeakReports,
    getLastReport,
    clearReports,
    trackReference,
    untrackReference,
    configure,
    getConfig,
    getMetrics,
    healthCheck,
    info
} from './memory-leak-detector/index.js';
