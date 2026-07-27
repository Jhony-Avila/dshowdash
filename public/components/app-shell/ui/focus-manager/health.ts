// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: focus-manager/health
// PURPOSE: Health check e métricas do Focus Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   focusHistory, savedFocus, focusTraps, focusGuards, subscribers,
//   config, metrics from ./state.js
//   getConfig from ./config.js
//   getActiveTraps from ./trap.js
//   getSavedFocusKeys from ./persistence.js
// EXPORTS:
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// ═══════════════════════════════════════════════════════════════
/**
 * @module FocusManagerHealth
 * @description Health e métricas do Focus Manager
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID } from './constants.js';
import { focusHistory, savedFocus, focusTraps, focusGuards, subscribers, config, metrics } from './state.js';
import { getConfig } from './config.js';
import { getActiveTraps } from './trap.js';
import { getSavedFocusKeys } from './persistence.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export function getMetrics() {
    return {
        focusChanges: metrics.focusChanges,
        trapsActivated: metrics.trapsActivated,
        restores: metrics.restores,
        activeTraps: focusTraps.size,
        activeGuards: focusGuards.size,
        savedFocusCount: savedFocus.size,
        historySize: focusHistory.length
    };
}

export function healthCheck() {
    const checks = {
        noExcessiveTraps: focusTraps.size <= 5,
        noExcessiveGuards: focusGuards.size <= 10,
        historyNotFull: focusHistory.length < config.historyLimit
    };
    
    let passed = 0;
    const keys = Object.keys(checks);
    for (let i = 0; i < keys.length; i++) {
        if ((checks as DynObj)[keys[i]]) passed++;
    }
    
    return {
        status: passed === keys.length ? 'HEALTHY' : 'DEGRADED',
        score: `${passed}/${keys.length}`,
        checks,
        metrics: getMetrics(),
        currentFocus: document.activeElement?.tagName,
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        config: getConfig(),
        metrics: getMetrics(),
        activeTraps: getActiveTraps(),
        savedFocusKeys: getSavedFocusKeys(),
        currentFocus: document.activeElement?.tagName,
        subscriberCount: subscribers.length,
        timestamp: Date.now()
    };
}
