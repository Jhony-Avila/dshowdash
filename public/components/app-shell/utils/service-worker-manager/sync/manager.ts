// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: service-worker-manager/sync/manager
// PURPOSE: Gerenciamento de Background Sync API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   _state from ../state.js
// EXPORTS:
//   registerSync — Registra uma tag de sync
//   getSyncTags — Lista tags registradas
// BROWSER APIs: ServiceWorkerRegistration.sync
// ═══════════════════════════════════════════════════════════════
/**
 * @module ServiceWorkerSyncManager
 * @description Background Sync para operações offline
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { _state } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.service-worker-manager.sync.manager';

/**
 * Registra uma tag de background sync
 * @param {string} tag - Nome da tag
 * @returns {Promise<Object>} Resultado da operação
 */
export function registerSync(tag: string) {
    if (!_state.registration || !_state.registration.sync) {
        return Promise.resolve({ ok: false, error: 'Background Sync not supported' });
    }
    
    return _state.registration.sync.register(tag)
        .then(() => ({
        ok: true,
        tag
    }))
        .catch((error: DynObj) => ({
        ok: false,
        error: error.message
    }));
}

/**
 * Lista todas as tags de sync registradas
 * @returns {Promise<Array>} Array de tags
 */
export function getSyncTags() {
    if (!_state.registration || !_state.registration.sync) {
        return Promise.resolve([]);
    }
    
    return _state.registration.sync.getTags();
}
