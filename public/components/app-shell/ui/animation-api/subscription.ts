// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: animation-api/subscription
// PURPOSE: Sistema de subscription para eventos de animação
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   subscribers from ./state.js
// EXPORTS:
//   subscribe — Registra callback, retorna unsubscribe
// ═══════════════════════════════════════════════════════════════
/**
 * @module AnimationAPISubscription
 * @description Pub/Sub para eventos de animação
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { subscribers } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.animation-api.subscription';

/**
 * Registra callback para eventos de animação
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
