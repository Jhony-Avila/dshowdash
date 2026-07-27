// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-slots/convenience/shortcuts
// PURPOSE: Métodos de conveniência para operações de slots
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SLOT_POSITIONS from ../constants.js
//   registerSlot from ../core/registration.js
//   injectContent from ../core/content.js
// EXPORTS:
//   inject — Registra e injeta conteúdo de uma vez
//   createPersistentSlot — Cria slot persistente
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionSlotsConvenienceShortcuts
 * @description Atalhos para operações comuns com slots
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { SLOT_POSITIONS } from '../constants.js';
import { registerSlot } from '../core/registration.js';
import { injectContent } from '../core/content.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-slots.convenience.shortcuts';

/**
 * Registra e injeta conteúdo de uma vez
 * @param {string} regionName - Nome da região
 * @param {string|HTMLElement|Object} content - Conteúdo
 * @param {Object} config - Configuração do slot
 * @returns {string|null} ID do slot ou null
 */
export function inject(regionName: string, content: DynObj, config: DynObj) {
    const slotId = registerSlot(regionName, config);
    if (slotId) {
        injectContent(regionName, slotId, content);
    }
    return slotId;
}

/**
 * Cria slot persistente (header/footer da região)
 * @param {string} regionName - Nome da região
 * @param {string} position - 'header' ou 'footer'
 * @param {string|HTMLElement} content - Conteúdo
 * @returns {string|null} ID do slot ou null
 */
export function createPersistentSlot(regionName: string, position: DynObj, content: DynObj) {
    return inject(regionName, content, {
        name: position,
        position: position === 'header' ? SLOT_POSITIONS.PREPEND : SLOT_POSITIONS.APPEND,
        priority: position === 'header' ? 1000 : -1000,
        persistent: true
    });
}

export default {
    inject,
    createPersistentSlot
};
