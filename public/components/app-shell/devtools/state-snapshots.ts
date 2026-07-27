// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: devtools/state-snapshots-wrapper
// PURPOSE: Wrapper de compatibilidade para state-snapshots modularizado
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./state-snapshots/index.js
// EXPORTS: default, VERSION, MODULE_ID, capture, restore, compare,
//          get, getAll, getLatest, getByLabel, count, remove, clear,
//          exportSnapshot, exportAll, importSnapshot, startAutoSnapshot,
//          stopAutoSnapshot, isAutoSnapshotRunning, configure, getConfig,
//          subscribe, getMetrics, healthCheck, info
// DEPRECATION: Importar de './state-snapshots/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module StateSnapshotsWrapper
 * @description Compatibilidade retroativa para state-snapshots
 * @version 1.1.0-AAA
 * @since 2025-02-02
 * @deprecated Use './state-snapshots/index.js' diretamente
 */
'use strict';

export { default } from './state-snapshots/index.js';
export {
    VERSION,
    MODULE_ID,
    capture,
    restore,
    compare,
    get,
    getAll,
    getLatest,
    getByLabel,
    count,
    remove,
    clear,
    exportSnapshot,
    exportAll,
    importSnapshot,
    startAutoSnapshot,
    stopAutoSnapshot,
    isAutoSnapshotRunning,
    configure,
    getConfig,
    subscribe,
    getMetrics,
    healthCheck,
    info
} from './state-snapshots/index.js';
