// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-events/health
// PURPOSE: Health check e métricas do sistema de eventos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, REGION_EVENTS from ./constants.js
//   initialized, domListenersAttached, eventHistory, historyLimit, metrics from ./state.js
//   getListenerCounts from ./history.js
// EXPORTS:
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionEventsHealth
 * @description Health e métricas do sistema de eventos
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID, REGION_EVENTS } from './constants.js';
import { initialized, domListenersAttached, eventHistory, historyLimit, metrics } from './state.js';
import { getListenerCounts } from './history.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export function getMetrics() {
    return {
        eventsEmitted: metrics.eventsEmitted,
        listenersAdded: metrics.listenersAdded,
        listenersRemoved: metrics.listenersRemoved,
        errors: metrics.errors,
        historySize: eventHistory.length
    };
}

export function healthCheck() {
    const listenerCounts = getListenerCounts();
    let totalListeners = 0;
    const keys = Object.keys(listenerCounts);
    for (let i = 0; i < keys.length; i++) {
        totalListeners += listenerCounts[keys[i]];
    }
    
    const checks = {
        initialized: initialized.value,
        domListenersAttached: domListenersAttached.value,
        noErrors: metrics.errors === 0,
        historyNotFull: eventHistory.length < historyLimit.value
    };
    
    const checkKeys = Object.keys(checks);
    let passed = 0;
    for (let j = 0; j < checkKeys.length; j++) {
        if ((checks as DynObj)[checkKeys[j]]) passed++;
    }
    const total = checkKeys.length;
    
    return {
        status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
        score: `${passed}/${total}`,
        checks,
        totalListeners,
        listenerCounts,
        metrics: getMetrics(),
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        initialized: initialized.value,
        domListenersAttached: domListenersAttached.value,
        eventTypes: REGION_EVENTS,
        listenerCounts: getListenerCounts(),
        historySize: eventHistory.length,
        historyLimit: historyLimit.value,
        metrics: getMetrics(),
        timestamp: Date.now()
    };
}
