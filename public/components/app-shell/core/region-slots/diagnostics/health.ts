// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-slots/diagnostics/health
// PURPOSE: Health check e diagnóstico do sistema de slots
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, SLOT_POSITIONS from ../constants.js
//   getSlots, getSlotContents, getListeners, getMetrics from ../state.js
// EXPORTS:
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionSlotsDiagnosticsHealth
 * @description Health e diagnóstico de slots
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID, SLOT_POSITIONS } from '../constants.js';
import { getSlots, getSlotContents, getListeners, getMetrics as _getMetrics } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export function getMetrics() {
    return _getMetrics();
}

export function healthCheck() {
    const slots = getSlots();
    const metrics = getMetrics();
    
    let totalSlots = 0;
    const keys = Object.keys(slots);
    for (let i = 0; i < keys.length; i++) {
        totalSlots += Object.keys((slots as DynObj)[keys[i]]).length;
    }
    
    const checks = {
        initialized: true,
        noErrors: metrics.errors === 0,
        slotsTracked: totalSlots >= 0
    };
    
    const checkKeys = Object.keys(checks);
    let passed = 0;
    for (let j = 0; j < checkKeys.length; j++) {
        if ((checks as DynObj)[checkKeys[j]]) passed++;
    }
    const total = checkKeys.length;
    
    let status = 'UNHEALTHY';
    if (passed === total) status = 'HEALTHY';
    else if (passed >= 1) status = 'DEGRADED';
    
    return {
        status,
        score: `${passed}/${total}`,
        checks,
        totalSlots,
        metrics,
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

export function info() {
    const slots = getSlots();
    const slotContents = getSlotContents();
    
    const slotsByRegion = {};
    const keys = Object.keys(slots);
    for (let i = 0; i < keys.length; i++) {
        (slotsByRegion as DynObj)[keys[i]] = Object.keys((slots as DynObj)[keys[i]]).length;
    }
    
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        positions: SLOT_POSITIONS,
        slotsByRegion,
        totalContents: Object.keys(slotContents).length,
        listenerCount: getListeners().length,
        metrics: getMetrics(),
        timestamp: Date.now()
    };
}

export default {
    getMetrics, healthCheck, info
};
