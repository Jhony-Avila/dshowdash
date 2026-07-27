// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-resize/subscription
// PURPOSE: Sistema de subscription para eventos de resize
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   listeners from ./state.js
// EXPORTS:
//   subscribe — Registra callback, retorna unsubscribe
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionResizeSubscription
 * @description Pub/Sub para eventos de resize de região
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { listeners } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.region-resize.subscription';

/**
 * Registra callback para eventos de resize
 * @param {Function} callback - Função a ser chamada
 * @returns {Function} Função para cancelar subscription
 */
export function subscribe(callback: DynObj) {
    if (typeof callback !== 'function') return () => {};
    
    listeners.push(callback);
    
    return function unsubscribe() {
        const idx = listeners.indexOf(callback);
        if (idx >= 0) listeners.splice(idx, 1);
    };
}
