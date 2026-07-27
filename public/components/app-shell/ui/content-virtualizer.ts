// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: ui/content-virtualizer-wrapper
// PURPOSE: Wrapper de compatibilidade para content-virtualizer modularizado
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./content-virtualizer/index.js
// EXPORTS: default, VERSION, MODULE_ID, SCROLL_DIRECTION, create,
//          get, destroy, destroyAll, listInstances, getMetrics,
//          healthCheck, info
// DEPRECATION: Importar de './content-virtualizer/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module ContentVirtualizerWrapper
 * @description Compatibilidade retroativa para content-virtualizer
 * @version 1.1.0-AAA
 * @since 2025-02-02
 * @deprecated Use './content-virtualizer/index.js' diretamente
 */
'use strict';

export { default } from './content-virtualizer/index.js';
export {
    VERSION,
    MODULE_ID,
    SCROLL_DIRECTION,
    create,
    get,
    destroy,
    destroyAll,
    listInstances,
    getMetrics,
    healthCheck,
    info
} from './content-virtualizer/index.js';
