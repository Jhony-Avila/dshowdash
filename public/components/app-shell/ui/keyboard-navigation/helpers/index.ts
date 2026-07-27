// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation/helpers-bridge
// PURPOSE: Re-export agregado - Focus e Regions helpers
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./focus.js, ./regions.js
// EXPORTS: * (all named exports from both modules)
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigationHelpersBridge
 * @description Barrel export para helpers do keyboard navigation
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-navigation.helpers';

export * from './focus.js';
export * from './regions.js';
