// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: maintenance-mode/health
// PURPOSE: Health check e métricas do modo manutenção
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   state, config, subscribers, metrics, scheduledMaintenance from ./state.js
//   getState from ./core.js
//   getScheduled from ./schedule.js
//   getConfig from ./config.js
// EXPORTS:
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// ═══════════════════════════════════════════════════════════════
/**
 * @module MaintenanceModeHealth
 * @description Health e métricas do modo manutenção
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID } from './constants.js';
import { state, config, subscribers, metrics, scheduledMaintenance } from './state.js';
import { getState } from './core.js';
import { getScheduled } from './schedule.js';
import { getConfig } from './config.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export function getMetrics() {
    return {
        activations: metrics.activations,
        deactivations: metrics.deactivations,
        bypasses: metrics.bypasses,
        currentlyActive: state.active
    };
}

export function healthCheck() {
    const checks = {
        stateConsistent: state.active ? !!state.type : !state.type,
        noStaleSchedule: !scheduledMaintenance.value || scheduledMaintenance.value.scheduledFor > Date.now(),
        configValid: typeof config.showBanner === 'boolean'
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
        active: state.active,
        type: state.type,
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
        state: getState(),
        scheduled: getScheduled(),
        config: getConfig(),
        metrics: getMetrics(),
        subscriberCount: subscribers.length,
        timestamp: Date.now()
    };
}
