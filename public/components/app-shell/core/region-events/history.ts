// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-events/history
// PURPOSE: Histórico de eventos por região
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   listeners, globalListeners, eventHistory, historyLimit from ./state.js
// EXPORTS:
//   getHistory — Retorna histórico filtrado
//   clearHistory — Limpa histórico
//   setHistoryLimit — Define limite do histórico
//   getListenerCounts — Conta listeners por região
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionEventsHistory
 * @description Histórico de eventos emitidos
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { listeners, globalListeners, eventHistory, historyLimit } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-events.history';

/**
 * Retorna histórico filtrado
 * @param {Object} filter - Filtros { region, type, limit }
 * @returns {Array}
 */
export function getHistory(filter: DynObj) {
    filter = filter || {};
    let result = eventHistory.slice();
    
    if (filter.region) {
        result = result.filter(e => e.region === filter.region);
    }
    
    if (filter.type) {
        result = result.filter(e => e.type === filter.type);
    }
    
    if (filter.limit) {
        result = result.slice(-filter.limit);
    }
    
    return result;
}

/**
 * Limpa todo o histórico
 */
export function clearHistory() {
    eventHistory.length = 0;
}

/**
 * Define limite do histórico
 * @param {number} limit - Novo limite (10-1000)
 */
export function setHistoryLimit(limit: number) {
    historyLimit.value = Math.max(10, Math.min(1000, limit));
}

/**
 * Conta listeners por região
 * @returns {Object} Contagem por região
 */
export function getListenerCounts() {
    const counts: Record<string, number> = {};
    const keys = Object.keys(listeners);
    
    for (let i = 0; i < keys.length; i++) {
        const regionName = keys[i];
        const regionListeners = (listeners as DynObj)[regionName];
        let count = 0;
        
        const eventTypes = Object.keys(regionListeners);
        for (let j = 0; j < eventTypes.length; j++) {
            count += regionListeners[eventTypes[j]].length;
        }
        
        counts[regionName] = count;
    }
    
    counts._global = globalListeners.length;
    return counts;
}
