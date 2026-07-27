// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: gesture-handler/registration-bridge
// PURPOSE: Re-export agregado - Core e Element registration
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./core.js, ./element.js
// EXPORTS: * (all named exports from both modules)
// ═══════════════════════════════════════════════════════════════
/**
 * @module GestureHandlerRegistrationBridge
 * @description Barrel export para registration do gesture handler
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.gesture-handler.registration';

export * from './core.js';
export * from './element.js';
