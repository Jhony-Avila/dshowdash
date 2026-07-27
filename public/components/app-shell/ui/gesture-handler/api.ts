// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: gesture-handler/api
// PURPOSE: API pública do Gesture Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   handlers, elementHandlers, subscribers, touchState, config,
//   setEnabled, isEnabled, getMetrics from ./state.js
//   handleTouchStart, handleTouchMove, handleTouchEnd from ./handlers/index.js
// EXPORTS:
//   enable, disable, isEnabled — Controle de ativação
//   configure, getConfig — Configuração
//   subscribe — Subscription
//   healthCheck, info — Diagnósticos
//   destroy — Cleanup
//   getMetrics — Métricas
// ═══════════════════════════════════════════════════════════════
/**
 * @module GestureHandlerAPI
 * @description API pública do gesture handler
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID } from './constants.js';
import { handlers, elementHandlers, subscribers, touchState, config, setEnabled, isEnabled, getMetrics } from './state.js';
import { handleTouchStart, handleTouchMove, handleTouchEnd } from './handlers/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export function enable() {
    setEnabled(true);
}

export function disable() {
    setEnabled(false);
}

export { isEnabled };

export function configure(options: DynObj) {
    if (options.swipeThreshold !== undefined) config.swipeThreshold = options.swipeThreshold;
    if (options.swipeVelocity !== undefined) config.swipeVelocity = options.swipeVelocity;
    if (options.tapThreshold !== undefined) config.tapThreshold = options.tapThreshold;
    if (options.doubleTapDelay !== undefined) config.doubleTapDelay = options.doubleTapDelay;
    if (options.longPressDelay !== undefined) config.longPressDelay = options.longPressDelay;
    if (options.pinchThreshold !== undefined) config.pinchThreshold = options.pinchThreshold;
    if (options.rotateThreshold !== undefined) config.rotateThreshold = options.rotateThreshold;
    if (options.preventDefaultSwipe !== undefined) config.preventDefaultSwipe = !!options.preventDefaultSwipe;
}

export function getConfig() {
    return Object.assign({}, config);
}

export function subscribe(callback: DynObj) {
    if (typeof callback !== 'function') return () => {};
    
    subscribers.push(callback);
    
    return () => {
        const idx = subscribers.indexOf(callback);
        if (idx >= 0) subscribers.splice(idx, 1);
    };
}

export function healthCheck() {
    const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    const checks = {
        enabled: isEnabled(),
        touchSupported: isTouchDevice,
        hasHandlers: handlers.size > 0 || elementHandlers.size > 0,
        configValid: config.swipeThreshold > 0
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
        isTouchDevice,
        metrics: getMetrics(),
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

export function info() {
    const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        enabled: isEnabled(),
        isTouchDevice,
        config: getConfig(),
        metrics: getMetrics(),
        registeredGestures: Array.from(handlers.keys()),
        subscriberCount: subscribers.length,
        timestamp: Date.now()
    };
}

export function destroy() {
    if (typeof document !== 'undefined') {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    }
    
    handlers.clear();
    elementHandlers.clear();
    subscribers.length = 0;
    
    if (touchState.longPressTimer) {
        clearTimeout(touchState.longPressTimer);
    }
}

export { getMetrics };

