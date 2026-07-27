// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: responsive-adapter/subscription
// PURPOSE: Sistema de subscription para mudanças de breakpoint
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   listeners from ./state.js
// EXPORTS:
//   subscribe — Registra callback para mudanças, retorna unsubscribe
// ═══════════════════════════════════════════════════════════════
/**
 * @module ResponsiveAdapterSubscription
 * @description Pub/Sub para eventos de responsividade
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { listeners } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.adapters.responsive-adapter.subscription';

/**
 * Registra callback para mudanças de breakpoint
 * @param {Function} callback - Função a ser chamada em mudanças
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
