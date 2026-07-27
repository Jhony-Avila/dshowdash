// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation/handlers-bridge
// PURPOSE: Re-export agregado - Keyboard event handlers
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./f6.js, ./escape.js, ./tab-trap.js, ./global.js
// EXPORTS: * (all named exports from all handler modules)
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigationHandlersBridge
 * @description Barrel export para keyboard handlers (F6, Escape, Tab, Global)
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-navigation.handlers';

export * from './f6.js';
export * from './escape.js';
export * from './tab-trap.js';
export * from './global.js';
