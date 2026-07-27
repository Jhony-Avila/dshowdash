// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: gesture-handler/constants
// PURPOSE: Constantes e enums para sistema de gestos touch
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   GESTURES — Enum de tipos de gestos (frozen)
//   DIRECTIONS — Enum de direções (frozen)
// ═══════════════════════════════════════════════════════════════
/**
 * @module GestureHandlerConstants
 * @description Constantes para reconhecimento de gestos touch
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell-gesture-handler';

export const GESTURES = Object.freeze({
    TAP: 'tap',
    DOUBLE_TAP: 'doubletap',
    LONG_PRESS: 'longpress',
    SWIPE_LEFT: 'swipeleft',
    SWIPE_RIGHT: 'swiperight',
    SWIPE_UP: 'swipeup',
    SWIPE_DOWN: 'swipedown',
    PINCH_IN: 'pinchin',
    PINCH_OUT: 'pinchout',
    ROTATE: 'rotate',
    PAN: 'pan'
});

export const DIRECTIONS = Object.freeze({
    LEFT: 'left',
    RIGHT: 'right',
    UP: 'up',
    DOWN: 'down'
});
