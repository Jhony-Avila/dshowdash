// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: state/slot-persistence-wrapper
// PURPOSE: Wrapper de compatibilidade para slot-persistence modularizado
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./slot-persistence/index.js
// EXPORTS: default, VERSION, MODULE_ID, saveSlotState, getSlotState,
//          removeSlotState, getRegionSlots, saveMultiple, persist,
//          load, restore, clear, configure, getConfig, enable, disable,
//          isEnabled, subscribe, getMetrics, healthCheck, info
// DEPRECATION: Importar de './slot-persistence/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module SlotPersistenceWrapper
 * @description Compatibilidade retroativa para slot-persistence
 * @version 1.1.0-AAA
 * @since 2025-02-02
 * @deprecated Use './slot-persistence/index.js' diretamente
 */
'use strict';

export { default } from './slot-persistence/index.js';
export {
    VERSION,
    MODULE_ID,
    saveSlotState,
    getSlotState,
    removeSlotState,
    getRegionSlots,
    saveMultiple,
    persist,
    load,
    restore,
    clear,
    configure,
    getConfig,
    enable,
    disable,
    isEnabled,
    subscribe,
    getMetrics,
    healthCheck,
    info
} from './slot-persistence/index.js';
