// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: offline-manager/queue/manager
// PURPOSE: Gerenciamento da fila de ações offline
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   state, config, incrementMetric, notifySubscribers from ../state.js
//   saveQueue, clearQueue from ../storage/queue.js
// EXPORTS:
//   queueAction — Adiciona ação à fila
//   removeAction — Remove ação por ID
//   getPendingActions — Retorna ações pendentes
//   getPendingCount — Retorna quantidade pendente
//   clearPending — Limpa fila
// ═══════════════════════════════════════════════════════════════
/**
 * @module OfflineManagerQueueManager
 * @description Gerenciamento de fila offline
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { state, config, incrementMetric, notifySubscribers } from '../state.js';
import { saveQueue, clearQueue } from '../storage/queue.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.offline-manager.queue.manager';

/**
 * Adiciona ação à fila offline
 * @param {Object} action - Ação { type, data, endpoint, method }
 * @returns {Object} Resultado
 */
export function queueAction(action: DynObj) {
    if (!action || !action.type) {
        return { ok: false, error: 'Invalid action' };
    }
    
    if (state.pendingActions.length >= config.maxQueueSize) {
        return { ok: false, error: 'Queue full' };
    }
    
    const queuedAction = {
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: action.type,
        data: action.data || {},
        endpoint: action.endpoint || null,
        method: action.method || 'POST',
        createdAt: Date.now(),
        retries: 0
    };
    
    state.pendingActions.push(queuedAction);
    incrementMetric('actionsQueued');
    saveQueue();
    
    notifySubscribers({
        type: 'action-queued',
        action: queuedAction,
        queueSize: state.pendingActions.length,
        timestamp: Date.now()
    });
    
    return { ok: true, actionId: queuedAction.id };
}

export function removeAction(actionId: string) {
    let index = -1;
    for (let i = 0; i < state.pendingActions.length; i++) {
        if (state.pendingActions[i].id === actionId) {
            index = i;
            break;
        }
    }
    
    if (index >= 0) {
        state.pendingActions.splice(index, 1);
        saveQueue();
        return true;
    }
    return false;
}

export function getPendingActions() {
    return state.pendingActions.slice();
}

export function getPendingCount() {
    return state.pendingActions.length;
}

export function clearPending() {
    clearQueue();
    
    notifySubscribers({
        type: 'queue-cleared',
        timestamp: Date.now()
    });
    
    return { ok: true };
}
