// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core/region-visibility-wrapper
// PURPOSE: Wrapper de compatibilidade para region-visibility modularizado
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./region-visibility/index.js
// EXPORTS: default, VERSION, MODULE_ID, isVisible, show, hide, toggle,
//          setVisibility, getVisibilityState, resetVisibility,
//          enterFullscreen, exitFullscreen, toggleFullscreen,
//          isFullscreenMode, subscribe, getMetrics, healthCheck, info
// DEPRECATION: Importar de './region-visibility/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionVisibilityWrapper
 * @description Compatibilidade retroativa para region-visibility
 * @version 1.1.0-AAA
 * @since 2025-02-02
 * @deprecated Use './region-visibility/index.js' diretamente
 */
'use strict';

export { default } from './region-visibility/index.js';
export {
    VERSION,
    MODULE_ID,
    isVisible,
    show,
    hide,
    toggle,
    setVisibility,
    getVisibilityState,
    resetVisibility,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    isFullscreenMode,
    subscribe,
    getMetrics,
    healthCheck,
    info
} from './region-visibility/index.js';
