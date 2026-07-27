// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: skeleton-loader/health
// PURPOSE: Health check e métricas do skeleton loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   templateConfigs from ./templates.js
//   activeSkeletons, customTemplates, metrics from ./state.js
//   getConfig from ./config.js
//   listTemplates from ./custom.js
// EXPORTS:
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// ═══════════════════════════════════════════════════════════════
/**
 * @module SkeletonLoaderHealth
 * @description Health e métricas do skeleton loader
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID } from './constants.js';
import { templateConfigs } from './templates.js';
import { activeSkeletons, customTemplates, metrics } from './state.js';
import { getConfig } from './config.js';
import { listTemplates } from './custom.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export function getMetrics() {
    return {
        created: metrics.created,
        destroyed: metrics.destroyed,
        activeCount: activeSkeletons.size,
        builtInTemplates: Object.keys(templateConfigs).length,
        customTemplates: customTemplates.size
    };
}

export function healthCheck() {
    const checks = {
        stylesInjected: typeof document === 'undefined' || !!document.getElementById('skeleton-loader-styles'),
        notTooManyActive: activeSkeletons.size < 50,
        templatesAvailable: Object.keys(templateConfigs).length > 0
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
        templates: listTemplates(),
        activeSkeletons: activeSkeletons.size,
        timestamp: Date.now()
    };
}
