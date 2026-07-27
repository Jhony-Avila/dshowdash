// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: gesture-handler/helpers-bridge
// PURPOSE: Re-export agregado - Math e Notify helpers
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./math.js, ./notify.js
// EXPORTS: * (all named exports from both modules)
// ═══════════════════════════════════════════════════════════════
/**
 * @module GestureHandlerHelpersBridge
 * @description Barrel export para helpers do gesture handler
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.gesture-handler.helpers';

export * from './math.js';
export * from './notify.js';
