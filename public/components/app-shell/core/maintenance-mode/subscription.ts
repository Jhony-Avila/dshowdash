// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: maintenance-mode/subscription
// PURPOSE: Sistema de subscription para eventos de manutenção
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   subscribers from ./state.js
// EXPORTS:
//   notifySubscribers — Notifica todos os subscribers
//   subscribe — Registra callback, retorna unsubscribe
// ═══════════════════════════════════════════════════════════════
/**
 * @module MaintenanceModeSubscription
 * @description Pub/Sub para eventos de maintenance mode
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { subscribers } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.maintenance-mode.subscription';

/**
 * Notifica todos os subscribers de um evento
 * @param {Object} event - Evento a ser notificado
 */
export function notifySubscribers(event: DynObj) {
    for (let i = 0; i < subscribers.length; i++) {
        try {
            subscribers[i](event);
        } catch (e) {
            // Silently ignore subscriber errors
        }
    }
}

/**
 * Registra callback para eventos de manutenção
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
