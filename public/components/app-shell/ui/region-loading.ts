// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: ui/region-loading-wrapper
// PURPOSE: Wrapper de compatibilidade para region-loading modularizado
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./region-loading/index.js
// EXPORTS: default, VERSION, MODULE_ID, isLoading, setLoading,
//          startLoading, endLoading, setSkeleton, setMultipleLoading,
//          endAllLoading, getLoadingState, getLoadingRegions, isAnyLoading,
//          subscribe, getMetrics, healthCheck, info
// DEPRECATION: Importar de './region-loading/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionLoadingWrapper
 * @description Compatibilidade retroativa para region-loading
 * @version 1.1.0-AAA
 * @since 2025-02-02
 * @deprecated Use './region-loading/index.js' diretamente
 */
'use strict';

export { default } from './region-loading/index.js';
export {
    VERSION,
    MODULE_ID,
    isLoading,
    setLoading,
    startLoading,
    endLoading,
    setSkeleton,
    setMultipleLoading,
    endAllLoading,
    getLoadingState,
    getLoadingRegions,
    isAnyLoading,
    subscribe,
    getMetrics,
    healthCheck,
    info
} from './region-loading/index.js';
