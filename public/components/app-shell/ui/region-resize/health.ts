// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-resize/health
// PURPOSE: Health check e métricas do sistema de resize
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, RESIZE_CONFIGS from ./constants.js
//   initialized, listeners, metrics, dragState from ./state.js
//   getSizes, getResizableRegions from ./core.js
//   isDragging, getDraggingRegion from ./drag.js
// EXPORTS:
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionResizeHealth
 * @description Health e métricas do resize de regiões
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID, RESIZE_CONFIGS } from './constants.js';
import { initialized, listeners, metrics, dragState } from './state.js';
import { getSizes, getResizableRegions } from './core.js';
import { isDragging, getDraggingRegion } from './drag.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export function getMetrics() {
    return {
        resizes: metrics.resizes,
        dragResizes: metrics.dragResizes,
        errors: metrics.errors
    };
}

export function healthCheck() {
    const checks = {
        initialized: initialized.value,
        hasConfigs: Object.keys(RESIZE_CONFIGS).length > 0,
        notDragging: !dragState.active,
        noErrors: metrics.errors === 0
    };
    
    const checkKeys = Object.keys(checks);
    let passed = 0;
    for (let i = 0; i < checkKeys.length; i++) {
        if ((checks as DynObj)[checkKeys[i]]) passed++;
    }
    const total = checkKeys.length;
    
    return {
        status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
        score: `${passed}/${total}`,
        checks,
        currentSizes: getSizes(),
        isDragging: isDragging(),
        draggingRegion: getDraggingRegion(),
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
        sizes: getSizes(),
        configs: RESIZE_CONFIGS,
        resizableRegions: getResizableRegions(),
        isDragging: isDragging(),
        draggingRegion: getDraggingRegion(),
        listenerCount: listeners.length,
        metrics: getMetrics(),
        timestamp: Date.now()
    };
}
