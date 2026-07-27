// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-slots
// PURPOSE: Entry point do sistema de slots para regiões
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID, SLOT_POSITIONS
//   ./core/registration.js — registerSlot, unregisterSlot
//   ./core/content.js — injectContent, clearSlot, clearRegionSlots, updateSlot
//   ./queries/slot-queries.js — getSlot, getRegionSlots, getSlotContent, hasContent, findSlotsByName
//   ./convenience/shortcuts.js — inject, createPersistentSlot
//   ./diagnostics/health.js — getMetrics, healthCheck, info
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionSlots
 * @description Sistema de slots para injeção de conteúdo
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID, SLOT_POSITIONS } from './constants.js';
import { addListener, removeListener } from './state.js';
import { registerSlot, unregisterSlot } from './core/registration.js';
import { injectContent, clearSlot, clearRegionSlots, updateSlot } from './core/content.js';
import { getSlot, getRegionSlots, getSlotContent, hasContent, findSlotsByName } from './queries/slot-queries.js';
import { inject, createPersistentSlot } from './convenience/shortcuts.js';
import { getMetrics, healthCheck, info } from './diagnostics/health.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export function subscribe(callback: DynObj) {
    if (typeof callback !== 'function') return () => {};
    
    addListener(callback);
    
    return () => {
        removeListener(callback);
    };
}

// Re-exports
export { VERSION, MODULE_ID, SLOT_POSITIONS };
export { registerSlot, unregisterSlot };
export { injectContent, clearSlot, clearRegionSlots, updateSlot };
export { getSlot, getRegionSlots, getSlotContent, hasContent, findSlotsByName };
export { inject, createPersistentSlot };
export { getMetrics, healthCheck, info };


export default {
    VERSION, MODULE_ID, POSITIONS: SLOT_POSITIONS,
    registerSlot, unregisterSlot,
    injectContent, clearSlot, clearRegionSlots, updateSlot,
    getSlot, getRegionSlots, getSlotContent, hasContent, findSlotsByName,
    inject, createPersistentSlot,
    subscribe, getMetrics, healthCheck, info
};
