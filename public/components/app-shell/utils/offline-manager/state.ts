// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-EXPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: offline-manager/state
// PURPOSE: Estado compartilhado do gerenciador offline
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONNECTION_STATUS, SYNC_STATUS from ./constants.js
// EXPORTS:
//   state, _state — Estado de conexão e fila
//   config, _config — Configurações
//   subscribers, _subscribers — Array de subscribers
//   bannerElement — Referência ao banner
//   setBannerElement, getBannerElement — Getters/setters
//   metrics — Métricas de uso
//   incrementMetric, getMetrics — Helpers
//   notifySubscribers — Notifica subscribers
// @changelog v1.1.0 - Adicionado aliases _state/_config/_subscribers
// ═══════════════════════════════════════════════════════════════
/**
 * @module OfflineManagerState
 * @description Estado centralizado para offline manager
 * @version 1.1.0-EXPORT-FIX
 * @since 2025-02-02
 */
'use strict';

import { CONNECTION_STATUS, SYNC_STATUS } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.offline-manager.state';

export const state: Record<string, any> = {
    isOnline: true,
    connectionStatus: CONNECTION_STATUS.UNKNOWN,
    effectiveType: null,
    downlink: null,
    rtt: null,
    syncStatus: SYNC_STATUS.IDLE,
    pendingActions: [],
    lastOnline: null,
    lastOffline: null
};

export const config: Record<string, any> = {
    showBanner: true,
    bannerPosition: 'bottom',
    autoSync: true,
    syncOnReconnect: true,
    queuePersist: true,
    storageKey: 'app-shell-offline-queue',
    maxQueueSize: 100,
    slowThreshold: 500
};

export const subscribers: DynObj[] = [];

// Aliases with underscore prefix for consumers that import as _state, _config, _subscribers
export { state as _state, config as _config, subscribers as _subscribers };


export let bannerElement: DynObj = null;

export function setBannerElement(el: HTMLElement) {
    bannerElement = el;
}

export function getBannerElement() {
    return bannerElement;
}

export const metrics = {
    offlineEvents: 0,
    onlineEvents: 0,
    actionsSynced: 0,
    actionsQueued: 0,
    syncErrors: 0
};

/**
 * Incrementa uma métrica
 * @param {string} key - Chave da métrica
 * @param {number} amount - Quantidade (default: 1)
 */
export function incrementMetric(key: string, amount?: DynObj) {
    if (metrics.hasOwnProperty(key)) (metrics as DynObj)[key] += (amount || 1);
}

/**
 * Retorna snapshot das métricas
 * @returns {Object} Métricas
 */
export function getMetrics() {
    return {
        offlineEvents: metrics.offlineEvents,
        onlineEvents: metrics.onlineEvents,
        actionsSynced: metrics.actionsSynced,
        actionsQueued: metrics.actionsQueued,
        syncErrors: metrics.syncErrors,
        pendingActions: state.pendingActions.length
    };
}

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
