// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: gesture-handler/handlers-bridge
// PURPOSE: Re-export agregado - Touch event handlers
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./touch-start.js, ./touch-move.js, ./touch-end.js
// EXPORTS:
//   handleTouchStart — Handler para touchstart events
//   handleTouchMove — Handler para touchmove events
//   handleTouchEnd — Handler para touchend events
// ═══════════════════════════════════════════════════════════════
/**
 * @module GestureHandlerHandlersBridge
 * @description Barrel export para touch handlers do gesture handler
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.gesture-handler.handlers';

export { handleTouchStart } from './touch-start.js';
export { handleTouchMove } from './touch-move.js';
export { handleTouchEnd } from './touch-end.js';
