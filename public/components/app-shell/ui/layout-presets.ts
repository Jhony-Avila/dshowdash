// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: ui/layout-presets-wrapper
// PURPOSE: Wrapper de compatibilidade para layout-presets modularizado
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./layout-presets/index.js
// EXPORTS: default, VERSION, MODULE_ID, PRESETS, apply, getCurrent,
//          getPrevious, revert, getConfig, listPresets, createPreset,
//          deletePreset, clonePreset, setTransitionDuration,
//          getTransitionDuration, subscribe, getMetrics, healthCheck, info
// DEPRECATION: Importar de './layout-presets/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module LayoutPresetsWrapper
 * @description Compatibilidade retroativa para layout-presets
 * @version 1.1.0-AAA
 * @since 2025-02-02
 * @deprecated Use './layout-presets/index.js' diretamente
 */
'use strict';

export { default } from './layout-presets/index.js';
export {
    VERSION,
    MODULE_ID,
    PRESETS,
    apply,
    getCurrent,
    getPrevious,
    revert,
    getConfig,
    listPresets,
    createPreset,
    deletePreset,
    clonePreset,
    setTransitionDuration,
    getTransitionDuration,
    subscribe,
    getMetrics,
    healthCheck,
    info
} from './layout-presets/index.js';
