// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: gesture-handler/convenience
// PURPOSE: Métodos de conveniência para registro de gestos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   GESTURES from ./constants.js
//   on from ./registration/core.js
// EXPORTS:
//   onSwipe — Handler para todos os swipes
//   onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown — Swipes direcionais
//   onTap, onDoubleTap, onLongPress — Toques
//   onPinch — Handler para pinch in/out
//   onPan — Handler para pan
// ═══════════════════════════════════════════════════════════════
/**
 * @module GestureHandlerConvenience
 * @description Atalhos para registro de gestos comuns
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { GESTURES } from './constants.js';
import { on } from './registration/core.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.gesture-handler.convenience';

/**
 * Registra handler para todos os swipes
 * @param {Function} handler - Função de callback
 * @returns {Function} Cleanup function
 */
export function onSwipe(handler: DynObj) {
    const unsubs = [
        on(GESTURES.SWIPE_LEFT, handler),
        on(GESTURES.SWIPE_RIGHT, handler),
        on(GESTURES.SWIPE_UP, handler),
        on(GESTURES.SWIPE_DOWN, handler)
    ];
    
    return function unsubscribeSwipe() {
        unsubs.forEach(u => { u(); });
    };
}

export function onSwipeLeft(handler: DynObj) { return on(GESTURES.SWIPE_LEFT, handler); }
export function onSwipeRight(handler: DynObj) { return on(GESTURES.SWIPE_RIGHT, handler); }
export function onSwipeUp(handler: DynObj) { return on(GESTURES.SWIPE_UP, handler); }
export function onSwipeDown(handler: DynObj) { return on(GESTURES.SWIPE_DOWN, handler); }
export function onTap(handler: DynObj) { return on(GESTURES.TAP, handler); }
export function onDoubleTap(handler: DynObj) { return on(GESTURES.DOUBLE_TAP, handler); }
export function onLongPress(handler: DynObj) { return on(GESTURES.LONG_PRESS, handler); }

/**
 * Registra handler para pinch (in e out)
 * @param {Function} handler - Função de callback
 * @returns {Function} Cleanup function
 */
export function onPinch(handler: DynObj) {
    const unsubs = [
        on(GESTURES.PINCH_IN, handler),
        on(GESTURES.PINCH_OUT, handler)
    ];
    return function unsubscribePinch() {
        unsubs.forEach(u => { u(); });
    };
}

export function onPan(handler: DynObj) { return on(GESTURES.PAN, handler); }
