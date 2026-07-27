// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: gesture-handler/state
// PURPOSE: Estado compartilhado do sistema de gestos
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   handlers — Map de handlers por gesto
//   elementHandlers — Map de handlers por elemento
//   enabled — Flag de enabled
//   subscribers — Array de subscribers
//   setEnabled, isEnabled — Getters/setters
//   touchState — Estado de touch atual
//   config — Configurações
//   metrics — Métricas de uso
//   incrementMetric, getMetrics — Helpers de métricas
// ═══════════════════════════════════════════════════════════════
/**
 * @module GestureHandlerState
 * @description Estado centralizado para reconhecimento de gestos
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.gesture-handler.state';

export const handlers = new Map();
export const elementHandlers = new Map();
export let enabled = true;
export const subscribers: DynObj[] = [];

export function setEnabled(val: DynObj) {
    enabled = val;
}

export function isEnabled() {
    return enabled;
}

export const touchState = {
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
    isMultiTouch: false,
    initialDistance: 0,
    initialAngle: 0,
    longPressTimer: null as DynObj,
    isPanning: false
};

export const config = {
    swipeThreshold: 50,
    swipeVelocity: 0.3,
    tapThreshold: 10,
    doubleTapDelay: 300,
    longPressDelay: 500,
    pinchThreshold: 0.1,
    rotateThreshold: 15,
    preventDefaultSwipe: true,
    passive: false
};

export const metrics = {
    gesturesDetected: 0,
    swipes: 0,
    taps: 0,
    longPresses: 0,
    pinches: 0
};

/**
 * Incrementa uma métrica
 * @param {string} key - Chave da métrica
 */
export function incrementMetric(key: string) {
    if (metrics.hasOwnProperty(key)) (metrics as DynObj)[key]++;
}

/**
 * Retorna snapshot das métricas
 * @returns {Object} Métricas
 */
export function getMetrics() {
    return {
        gesturesDetected: metrics.gesturesDetected,
        swipes: metrics.swipes,
        taps: metrics.taps,
        longPresses: metrics.longPresses,
        pinches: metrics.pinches,
        activeHandlers: handlers.size,
        elementHandlers: elementHandlers.size
    };
}
