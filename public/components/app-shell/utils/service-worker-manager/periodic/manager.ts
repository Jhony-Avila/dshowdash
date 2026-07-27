// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: service-worker-manager/periodic/manager
// PURPOSE: Gerenciamento de verificações periódicas de update
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getCheckIntervalId, setCheckIntervalId from ../state.js
//   checkForUpdates from ../updates/manager.js
// EXPORTS:
//   startPeriodicCheck — Inicia verificações periódicas
//   stopPeriodicCheck — Para verificações periódicas
// BROWSER APIs: setInterval, clearInterval
// ═══════════════════════════════════════════════════════════════
/**
 * @module ServiceWorkerPeriodicManager
 * @description Verificações periódicas de atualizações do SW
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { getConfig, getCheckIntervalId, setCheckIntervalId } from '../state.js';
import { checkForUpdates } from '../updates/manager.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.service-worker-manager.periodic.manager';

/**
 * Inicia verificações periódicas de atualização
 * @param {number} interval - Intervalo em ms (opcional)
 * @returns {Object} Resultado com ok e interval
 */
export function startPeriodicCheck(interval: number) {
    stopPeriodicCheck();
    
    const config = getConfig();
    interval = interval || config.checkInterval;
    
    setCheckIntervalId(setInterval(() => {
        checkForUpdates();
    }, interval));
    
    return { ok: true, interval };
}

/**
 * Para verificações periódicas
 */
export function stopPeriodicCheck() {
    const id = getCheckIntervalId();
    if (id) {
        clearInterval(id);
        setCheckIntervalId(null);
    }
}
