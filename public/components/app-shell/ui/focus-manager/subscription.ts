// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: focus-manager/subscription
// PURPOSE: Sistema de subscription para eventos de focus
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   subscribers from ./state.js
// EXPORTS:
//   subscribe — Registra callback, retorna unsubscribe
// ═══════════════════════════════════════════════════════════════
/**
 * @module FocusManagerSubscription
 * @description Pub/Sub para eventos de focus
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { subscribers } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.focus-manager.subscription';

/**
 * Registra callback para eventos de focus
 * @param {Function} callback - Função a ser chamada
 * @returns {Function} Função para cancelar subscription
 */
export function subscribe(callback: DynObj) {
    if (typeof callback !== 'function') return () => {};
    
    subscribers.push(callback);
    
    return function unsubscribe() {
        const idx = subscribers.indexOf(callback);
        if (idx >= 0) subscribers.splice(idx, 1);
    };
}
