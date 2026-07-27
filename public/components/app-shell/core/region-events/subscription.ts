// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-events/subscription
// PURPOSE: Métodos avançados de subscription
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   listeners, globalListeners, metrics from ./state.js
//   on from ./core.js
// EXPORTS:
//   onAny — Subscribe em evento para todas as regiões
//   onGlobal — Subscribe em todos os eventos
//   once — Subscribe única vez
//   waitFor — Promise que resolve no evento
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionEventsSubscription
 * @description Métodos avançados de subscription
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { listeners, globalListeners, metrics } from './state.js';
import { on } from './core.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-events.subscription';

/**
 * Subscribe em um tipo de evento para todas as regiões
 * @param {string} eventType - Tipo do evento
 * @param {Function} callback - Callback
 * @returns {Function} Unsubscribe
 */
export function onAny(eventType: DynObj, callback: DynObj) {
    if (typeof callback !== 'function') return () => {};
    
    const unsubscribes: DynObj[] = [];
    const keys = Object.keys(listeners);
    
    for (let i = 0; i < keys.length; i++) {
        unsubscribes.push(on(keys[i], eventType, callback));
    }
    
    return () => {
        for (let j = 0; j < unsubscribes.length; j++) {
            unsubscribes[j]();
        }
    };
}

/**
 * Subscribe em todos os eventos globalmente
 * @param {Function} callback - Callback
 * @returns {Function} Unsubscribe
 */
export function onGlobal(callback: DynObj) {
    if (typeof callback !== 'function') return () => {};
    
    globalListeners.push(callback);
    metrics.listenersAdded++;
    
    return () => {
        const idx = globalListeners.indexOf(callback);
        if (idx >= 0) {
            globalListeners.splice(idx, 1);
            metrics.listenersRemoved++;
        }
    };
}

/**
 * Subscribe única vez
 * @param {string} regionName - Nome da região
 * @param {string} eventType - Tipo do evento
 * @param {Function} callback - Callback
 * @returns {Function} Unsubscribe
 */
export function once(regionName: string, eventType: DynObj, callback: DynObj) {
    if (typeof callback !== 'function') return () => {};
    
    let unsubscribe: DynObj;
    const wrapper = (event: string) => {
        unsubscribe();
        callback(event);
    };
    
    unsubscribe = on(regionName, eventType, wrapper);
    return unsubscribe;
}

/**
 * Promise que resolve quando evento ocorre
 * @param {string} regionName - Nome da região
 * @param {string} eventType - Tipo do evento
 * @param {number} timeout - Timeout em ms
 * @returns {Promise}
 */
export function waitFor(regionName: string, eventType: DynObj, timeout: number) {
    timeout = timeout || 10000;
    
    return new Promise((resolve, reject) => {
        let timeoutId: DynObj;
        const unsubscribe = once(regionName, eventType, (event: string) => {
            if (timeoutId) clearTimeout(timeoutId);
            resolve(event);
        });
        
        timeoutId = setTimeout(() => {
            unsubscribe();
            reject(new Error(`Timeout waiting for ${eventType} on ${regionName}`));
        }, timeout);
    });
}
