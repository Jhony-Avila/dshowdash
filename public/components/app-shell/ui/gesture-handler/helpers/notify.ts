// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: gesture-handler/helpers/notify
// PURPOSE: Notificação de subscribers e trigger de handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   handlers, subscribers, incrementMetric from ../state.js
// EXPORTS:
//   notifySubscribers — Notifica todos os subscribers
//   triggerHandlers — Dispara handlers de um gesto
// ═══════════════════════════════════════════════════════════════
/**
 * @module GestureHandlerNotifyHelpers
 * @description Helpers de notificação para gestos
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { handlers, subscribers, incrementMetric } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.gesture-handler.helpers.notify';

/**
 * Notifica todos os subscribers de um evento
 * @param {Object} event - Evento a notificar
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
 * Dispara handlers registrados para um gesto
 * @param {string} gesture - Tipo do gesto
 * @param {Object} data - Dados do gesto
 */
export function triggerHandlers(gesture: string, data: DynObj) {
    const gestureHandlers = handlers.get(gesture);
    if (!gestureHandlers) return;
    
    gestureHandlers.forEach((handler: DynObj) => {
        try {
            handler(data);
        } catch (e) {
            // Log error silently in debug mode
        }
    });
    
    incrementMetric('gesturesDetected');
    
    notifySubscribers({
        type: 'gesture-detected',
        gesture,
        data,
        timestamp: Date.now()
    });
}
