// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-events/core
// PURPOSE: Core API de emissão e assinatura de eventos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   listeners, globalListeners, metrics from ./state.js
//   addToHistory, createEvent from ./helpers.js
// EXPORTS:
//   emit — Emite evento para região
//   on — Registra listener para evento
//   off — Remove listener
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionEventsCore
 * @description Core de eventos por região
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { listeners, globalListeners, metrics } from './state.js';
import { addToHistory, createEvent } from './helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-events.core';

/**
 * Emite evento para uma região
 * @param {string} regionName - Nome da região
 * @param {string} eventType - Tipo do evento
 * @param {*} data - Dados do evento
 * @returns {boolean} Sucesso
 */
export function emit(regionName: string, eventType: DynObj, data: DynObj) {
    const event = createEvent(regionName, eventType, data);
    
    addToHistory(event);
    metrics.eventsEmitted++;
    
    // Region-specific listeners
    const regionListeners = (listeners as DynObj)[regionName];
    if (regionListeners) {
        const typeListeners = regionListeners[eventType] || [];
        for (let i = 0; i < typeListeners.length; i++) {
            try {
                typeListeners[i](event);
            } catch (e) {
                metrics.errors++;
            }
        }
        
        // Wildcard listeners
        const allListeners = regionListeners['*'] || [];
        for (let j = 0; j < allListeners.length; j++) {
            try {
                allListeners[j](event);
            } catch (e) {
                metrics.errors++;
            }
        }
    }
    
    // Global listeners
    for (let k = 0; k < globalListeners.length; k++) {
        try {
            globalListeners[k](event);
        } catch (e) {
            metrics.errors++;
        }
    }
    
    return true;
}

/**
 * Registra listener para evento
 * @param {string} regionName - Nome da região
 * @param {string} eventType - Tipo do evento
 * @param {Function} callback - Callback
 * @returns {Function} Unsubscribe
 */
export function on(regionName: string, eventType: DynObj, callback: DynObj) {
    if (typeof callback !== 'function') return () => {};
    
    if (!(listeners as DynObj)[regionName]) {
        (listeners as DynObj)[regionName] = {};
    }
    
    if (!(listeners as DynObj)[regionName][eventType]) {
        (listeners as DynObj)[regionName][eventType] = [];
    }
    
    (listeners as DynObj)[regionName][eventType].push(callback);
    metrics.listenersAdded++;
    
    return () => {
        off(regionName, eventType, callback);
    };
}

/**
 * Remove listener
 * @param {string} regionName - Nome da região
 * @param {string} eventType - Tipo do evento
 * @param {Function} callback - Callback
 */
export function off(regionName: string, eventType: DynObj, callback: DynObj) {
    const regionListeners = (listeners as DynObj)[regionName];
    if (!regionListeners) return;
    
    const typeListeners = regionListeners[eventType];
    if (!typeListeners) return;
    
    const idx = typeListeners.indexOf(callback);
    if (idx >= 0) {
        typeListeners.splice(idx, 1);
        metrics.listenersRemoved++;
    }
}
