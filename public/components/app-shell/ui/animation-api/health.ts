// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: animation-api/health
// PURPOSE: Health check e métricas da Animation API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   activeAnimations, customAnimations, subscribers, config, metrics from ./state.js
//   shouldAnimate from ./utils.js
//   getConfig from ./config.js
//   getActive from ./control.js
//   listAnimations from ./custom.js
// EXPORTS:
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// ═══════════════════════════════════════════════════════════════
/**
 * @module AnimationAPIHealth
 * @description Health e métricas da Animation API
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID } from './constants.js';
import { activeAnimations, customAnimations, subscribers, config, metrics } from './state.js';
import { shouldAnimate } from './utils.js';
import { getConfig } from './config.js';
import { getActive } from './control.js';
import { listAnimations } from './custom.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export function getMetrics() {
    return {
        animationsStarted: metrics.animationsStarted,
        animationsCompleted: metrics.animationsCompleted,
        animationsCancelled: metrics.animationsCancelled,
        activeAnimations: activeAnimations.size,
        customAnimations: customAnimations.size,
        reducedMotionActive: !shouldAnimate()
    };
}

export function healthCheck() {
    const checks = {
        webAnimationsSupported: typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function',
        noExcessiveActive: activeAnimations.size < 20,
        configValid: config.defaultDuration > 0
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
        reducedMotion: !shouldAnimate(),
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
        activeAnimations: getActive(),
        availableAnimations: listAnimations().length,
        reducedMotion: !shouldAnimate(),
        subscriberCount: subscribers.length,
        timestamp: Date.now()
    };
}
