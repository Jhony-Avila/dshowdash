// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-center/health
// PURPOSE: Health check e métricas do notification center
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   notifications, queue, containerElement, stylesInjected,
//   config, metrics, subscribers from ./state.js
//   getConfig from ./config.js
//   getAll from ./queries.js
// EXPORTS:
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   getInfo — Informações do módulo
// ═══════════════════════════════════════════════════════════════
/**
 * @module NotificationCenterHealth
 * @description Health e métricas do notification center
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID } from './constants.js';
import { notifications, queue, containerElement, stylesInjected, config, metrics, subscribers } from './state.js';
import { getConfig } from './config.js';
import { getAll } from './queries.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export function getMetrics() {
    return {
        shown: metrics.shown,
        dismissed: metrics.dismissed,
        clicked: metrics.clicked,
        expired: metrics.expired,
        queued: metrics.queued,
        activeCount: notifications.size,
        queueSize: queue.length
    };
}

export function healthCheck() {
    const checks = {
        containerExists: !!containerElement.value,
        stylesInjected: stylesInjected.value,
        notOverloaded: notifications.size <= config.maxVisible * 2,
        queueReasonable: queue.length < 20
    };
    
    let passed = 0;
    const keys = Object.keys(checks);
    for (let i = 0; i < keys.length; i++) {
        if ((checks as DynObj)[keys[i]]) passed++;
    }
    
    return {
        status: passed >= 3 ? 'HEALTHY' : 'DEGRADED',
        score: `${passed}/${keys.length}`,
        checks,
        metrics: getMetrics(),
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

export function getInfo() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        config: getConfig(),
        metrics: getMetrics(),
        activeNotifications: getAll().length,
        queueSize: queue.length,
        subscriberCount: subscribers.length,
        timestamp: Date.now()
    };
}
