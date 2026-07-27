// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-slots/core/registration
// PURPOSE: Registro e remoção de slots em regiões
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SLOT_POSITIONS from ../constants.js
//   getSlots, setSlot, deleteSlot, deleteSlotContent, incrementMetric from ../state.js
//   generateSlotId, notifyListeners from ./slot-helpers.js
//   clearSlot from ./content.js
// EXPORTS:
//   registerSlot — Registra slot em região
//   unregisterSlot — Remove slot
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionSlotsRegistration
 * @description Registro de slots em regiões
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { SLOT_POSITIONS } from '../constants.js';
import {
    getSlots,
    setSlot,
    deleteSlot,
    deleteSlotContent,
    incrementMetric
} from '../state.js';
import { generateSlotId, notifyListeners } from './slot-helpers.js';
import { clearSlot } from './content.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell.core.region-slots.core.registration';

/**
 * Registra um slot em uma região
 * @param {string} regionName - Nome da região
 * @param {Object} config - Configuração { name, position, priority, persistent }
 * @returns {string|null} ID do slot criado
 */
export function registerSlot(regionName: string, config: DynObj) {
    config = config || {};
    const slots = getSlots();
    
    if (!(slots as DynObj)[regionName]) {
        (slots as DynObj)[regionName] = {};
    }
    
    const slotId = generateSlotId();
    
    const slotConfig = {
        id: slotId,
        name: config.name || 'default',
        position: config.position || SLOT_POSITIONS.APPEND,
        priority: config.priority || 0,
        persistent: config.persistent === true,
        createdAt: Date.now()
    };
    
    setSlot(regionName, slotId, slotConfig);
    
    incrementMetric('slotsRegistered');
    notifyListeners('slot-registered', { region: regionName, slotId, config: slotConfig });
    
    return slotId;
}

/**
 * Remove um slot
 * @param {string} regionName - Nome da região
 * @param {string} slotId - ID do slot
 * @returns {boolean} Sucesso
 */
export function unregisterSlot(regionName: string, slotId: string) {
    const slots = getSlots();
    
    if (!(slots as DynObj)[regionName] || !(slots as DynObj)[regionName][slotId]) {
        return false;
    }
    
    clearSlot(regionName, slotId);
    
    deleteSlot(regionName, slotId);
    deleteSlotContent(slotId);
    
    incrementMetric('slotsUnregistered');
    notifyListeners('slot-unregistered', { region: regionName, slotId });
    
    return true;
}

export default {
    registerSlot, unregisterSlot
};
