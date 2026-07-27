// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0-MODULAR)
// ═══════════════════════════════════════════════════════════════
// MODULE: gesture-handler
// PURPOSE: Entry point do Gesture Handler para mobile
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID, GESTURES, DIRECTIONS
//   ./registration/core.js — on, off, once, offAll
//   ./registration/element.js — addToElement, removeFromElement
//   ./convenience.js — onSwipe*, onTap, onDoubleTap, onLongPress, onPinch, onPan
//   ./api.js — enable, disable, isEnabled, configure, getConfig, subscribe, healthCheck, info, destroy, getMetrics
// SIDE EFFECTS: Auto-attaches touch event listeners
// ═══════════════════════════════════════════════════════════════
/**
 * @module GestureHandler
 * @description Suporte a gestos mobile
 * @version 1.0.0-MODULAR-AAA
 * @since 2025-02-02
 */
'use strict';

export { VERSION, MODULE_ID, GESTURES, DIRECTIONS } from './constants.js';

// Registration
export { on, off, once, offAll } from './registration/core.js';
export { addToElement, removeFromElement } from './registration/element.js';

// Convenience
export { onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, onLongPress, onPinch, onPan } from './convenience.js';

// API
export { enable, disable, isEnabled, configure, getConfig, subscribe, healthCheck, info, destroy, getMetrics } from './api.js';

// Auto-init
import { config } from './state.js';
import { handleTouchStart, handleTouchMove, handleTouchEnd } from './handlers/index.js';

if (typeof document !== 'undefined') {
    document.addEventListener('touchstart', handleTouchStart, { passive: !config.preventDefaultSwipe });
    document.addEventListener('touchmove', handleTouchMove, { passive: !config.preventDefaultSwipe });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
}

// Default export
import { VERSION, MODULE_ID, GESTURES, DIRECTIONS } from './constants.js';
import { on, off, once, offAll } from './registration/core.js';
import { addToElement, removeFromElement } from './registration/element.js';
import { onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, onLongPress, onPinch, onPan } from './convenience.js';
import { enable, disable, isEnabled, configure, getConfig, subscribe, healthCheck, info, destroy, getMetrics } from './api.js';

export default {
    VERSION, MODULE_ID, GESTURES, DIRECTIONS,
    on, off, once, offAll, addToElement, removeFromElement,
    onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown,
    onTap, onDoubleTap, onLongPress, onPinch, onPan,
    enable, disable, isEnabled, configure, getConfig,
    subscribe, destroy, getMetrics, healthCheck, info
};
