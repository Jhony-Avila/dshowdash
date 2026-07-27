// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: service-worker-manager/helpers/notify
// PURPOSE: Notificação de subscribers e atualização de estado
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   _state, _subscribers from ../state.js
// EXPORTS:
//   notifySubscribers — Notifica todos os subscribers
//   updateState — Atualiza estado e notifica
// ═══════════════════════════════════════════════════════════════
/**
 * @module ServiceWorkerNotifyHelpers
 * @description Helpers de notificação para SW Manager
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { _state, _subscribers } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.service-worker-manager.helpers.notify';

/**
 * Notifica todos os subscribers de um evento
 * @param {Object} event - Evento a notificar
 */
export function notifySubscribers(event: DynObj) {
    for (let i = 0; i < _subscribers.length; i++) {
        try {
            _subscribers[i](event);
        } catch (e) {
            // Silently ignore subscriber errors
        }
    }
}

/**
 * Atualiza estado interno e notifica subscribers
 * @param {string} newState - Novo estado
 * @param {Object} data - Dados adicionais
 */
export function updateState(newState: DynObj, data?: DynObj) {
    const oldState = _state.state;
    _state.state = newState;
    
    if (data) {
        if (data.registration !== undefined) _state.registration = data.registration;
        if (data.updateAvailable !== undefined) _state.updateAvailable = data.updateAvailable;
        if (data.waitingWorker !== undefined) _state.waitingWorker = data.waitingWorker;
        if (data.error !== undefined) _state.error = data.error;
    }
    
    notifySubscribers({
        type: 'state-changed',
        from: oldState,
        to: newState,
        data,
        timestamp: Date.now()
    });
}
