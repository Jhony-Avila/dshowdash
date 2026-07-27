// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: offline-manager/storage/queue
// PURPOSE: Persistência de fila de ações pendentes offline
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   state, config from ../state.js
// EXPORTS:
//   loadQueue — Carrega fila do localStorage
//   saveQueue — Salva fila no localStorage
//   clearQueue — Limpa fila e storage
// BROWSER APIs: localStorage
// ═══════════════════════════════════════════════════════════════
/**
 * @module OfflineManagerStorageQueue
 * @description Persistência de fila offline em localStorage
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { state, config } from '../state.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.offline-manager.storage.queue';

/**
 * Carrega fila de ações do localStorage
 */
export function loadQueue() {
    if (!config.queuePersist) return;
    
    try {
        const data = localStorage.getItem(config.storageKey);
        if (data) {
            state.pendingActions = JSON.parse(data);
        }
    } catch (e) {
        // Silently ignore storage errors
    }
}

/**
 * Salva fila de ações no localStorage
 */
export function saveQueue() {
    if (!config.queuePersist) return;
    
    try {
        localStorage.setItem(config.storageKey, JSON.stringify(state.pendingActions));
    } catch (e) {
        // Silently ignore storage errors
    }
}

/**
 * Limpa fila e remove do storage
 */
export function clearQueue() {
    state.pendingActions = [];
    try {
        localStorage.removeItem(config.storageKey);
    } catch (e) {
        // Silently ignore storage errors
    }
}
