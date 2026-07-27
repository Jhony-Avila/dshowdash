// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: maintenance-mode/storage
// PURPOSE: Persistência do estado de manutenção em localStorage
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STORAGE_KEY from ./constants.js
//   state, config from ./state.js
// EXPORTS:
//   loadState — Carrega estado do localStorage
//   saveState — Salva estado no localStorage
//   clearState — Remove estado do localStorage
// BROWSER APIs: localStorage
// ═══════════════════════════════════════════════════════════════
/**
 * @module MaintenanceModeStorage
 * @description Persistência de estado de manutenção
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { STORAGE_KEY } from './constants.js';
import { state, config } from './state.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.maintenance-mode.storage';

/**
 * Carrega estado do localStorage
 * Ignora se endTime já passou
 */
export function loadState() {
    if (!config.persistState) return;
    
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Ignora se manutenção já terminou
            if (parsed.endTime && Date.now() > parsed.endTime) {
                localStorage.removeItem(STORAGE_KEY);
                return;
            }
            Object.assign(state, parsed);
        }
    } catch (e) {
        // Silently ignore storage errors
    }
}

/**
 * Salva estado no localStorage
 */
export function saveState() {
    if (!config.persistState) return;
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        // Silently ignore storage errors
    }
}

/**
 * Remove estado do localStorage
 */
export function clearState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        // Silently ignore storage errors
    }
}
