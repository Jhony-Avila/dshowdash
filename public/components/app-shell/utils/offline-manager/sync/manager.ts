// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: offline-manager/sync/manager
// PURPOSE: Gerenciamento de sincronização offline
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SYNC_STATUS from ../constants.js
//   state, incrementMetric, notifySubscribers from ../state.js
//   removeAction from ../queue/manager.js
// EXPORTS:
//   getSyncStatus — Retorna status de sync
//   syncPending — Sincroniza ações pendentes
// BROWSER APIs: fetch, Promise
// ═══════════════════════════════════════════════════════════════
/**
 * @module OfflineManagerSyncManager
 * @description Sincronização de ações offline
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { SYNC_STATUS } from '../constants.js';
import { state, incrementMetric, notifySubscribers } from '../state.js';
import { removeAction } from '../queue/manager.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.offline-manager.sync.manager';

export function getSyncStatus() {
    return state.syncStatus;
}

/**
 * Sincroniza ações pendentes
 * @param {Function} syncHandler - Handler customizado
 * @returns {Promise}
 */
export function syncPending(syncHandler: DynObj) {
    if (!state.isOnline) {
        return Promise.resolve({ ok: false, error: 'Offline' });
    }
    
    if (state.pendingActions.length === 0) {
        return Promise.resolve({ ok: true, synced: 0 });
    }
    
    if (state.syncStatus === SYNC_STATUS.SYNCING) {
        return Promise.resolve({ ok: false, error: 'Sync in progress' });
    }
    
    state.syncStatus = SYNC_STATUS.SYNCING;
    
    notifySubscribers({
        type: 'sync-started',
        count: state.pendingActions.length,
        timestamp: Date.now()
    });
    
    const actions = state.pendingActions.slice();
    let synced = 0;
    const errors: DynObj[] = [];
    
    const processAction = (index: number): DynObj  => {
        if (index >= actions.length) {
            state.syncStatus = errors.length > 0 ? SYNC_STATUS.ERROR : SYNC_STATUS.COMPLETE;
            incrementMetric('actionsSynced', synced);
            incrementMetric('syncErrors', errors.length);
            
            notifySubscribers({
                type: 'sync-complete',
                synced,
                errors: errors.length,
                timestamp: Date.now()
            });
            
            return Promise.resolve({ ok: true, synced, errors });
        }
        
        const action = actions[index];
        
        let syncPromise;
        if (syncHandler) {
            syncPromise = Promise.resolve(syncHandler(action));
        } else if (action.endpoint) {
            syncPromise = fetch(action.endpoint, {
                method: action.method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(action.data)
            }).then(response => ({
                ok: response.ok
            }));
        } else {
            syncPromise = Promise.resolve({ ok: true });
        }
        
        return syncPromise
            .then(result => {
                if (result.ok) {
                    removeAction(action.id);
                    synced++;
                } else {
                    action.retries++;
                    errors.push({ actionId: action.id, error: result.error || 'Failed' });
                }
                return processAction(index + 1);
            })
            .catch(error => {
                action.retries++;
                errors.push({ actionId: action.id, error: error.message });
                return processAction(index + 1);
            });
    };
    
    return processAction(0);
}
