// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-slots/queries/slot-queries
// PURPOSE: Consultas de slots e conteúdo
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SLOT_ID_ATTRIBUTE from ../constants.js
//   getSlots, getSlot, getSlotContent from ../state.js
//   getRegion from ../../dom-regions/index.js
// EXPORTS:
//   getSlot — Obtém configuração de slot
//   getRegionSlots — Lista slots de região
//   getSlotContent — Obtém conteúdo de slot
//   hasContent — Verifica se slot tem conteúdo
//   findSlotsByName — Encontra slots por nome
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionSlotsQueries
 * @description Consultas de slots
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { SLOT_ID_ATTRIBUTE } from '../constants.js';
import {
    getSlots,
    getSlot as _getSlot,
    getSlotContent as _getSlotContent
} from '../state.js';
import { getRegion } from '../../dom-regions/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell.core.region-slots.queries.slot-queries';

/**
 * Obtém configuração de um slot
 * @param {string} regionName - Nome da região
 * @param {string} slotId - ID do slot
 * @returns {Object|null}
 */
export function getSlot(regionName: string, slotId: string) {
    const slot = _getSlot(regionName, slotId);
    return slot ? Object.assign({}, slot) : null;
}

/**
 * Lista todos os slots de uma região
 * @param {string} regionName - Nome da região
 * @returns {Array}
 */
export function getRegionSlots(regionName: string) {
    const slots = getSlots();
    const regionSlots = (slots as DynObj)[regionName];
    if (!regionSlots) return [];
    
    const result = [];
    const slotIds = Object.keys(regionSlots);
    
    for (let i = 0; i < slotIds.length; i++) {
        result.push(Object.assign({}, regionSlots[slotIds[i]]));
    }
    
    return result.sort((a, b) => b.priority - a.priority);
}

/**
 * Obtém conteúdo atual de um slot
 * @param {string} slotId - ID do slot
 * @returns {*}
 */
export function getSlotContent(slotId: string) {
    return _getSlotContent(slotId);
}

/**
 * Verifica se um slot tem conteúdo
 * @param {string} regionName - Nome da região
 * @param {string} slotId - ID do slot
 * @returns {boolean}
 */
export function hasContent(regionName: string, slotId: string) {
    const region = getRegion(regionName);
    if (!region) return false;
    
    return !!region.querySelector(`[${SLOT_ID_ATTRIBUTE}="${slotId}"]`);
}

/**
 * Encontra slots por nome
 * @param {string} regionName - Nome da região
 * @param {string} slotName - Nome do slot
 * @returns {Array}
 */
export function findSlotsByName(regionName: string, slotName: string) {
    const slots = getSlots();
    const regionSlots = (slots as DynObj)[regionName];
    if (!regionSlots) return [];
    
    const result = [];
    const slotIds = Object.keys(regionSlots);
    
    for (let i = 0; i < slotIds.length; i++) {
        const slot = regionSlots[slotIds[i]];
        if (slot.name === slotName) {
            result.push(Object.assign({}, slot));
        }
    }
    
    return result;
}

export default {
    getSlot, getRegionSlots, getSlotContent, hasContent, findSlotsByName
};
