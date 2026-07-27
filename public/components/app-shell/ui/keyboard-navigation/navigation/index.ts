// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation/navigation-bridge
// PURPOSE: Re-export para compatibilidade - Navigation Core
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./core.js
// EXPORTS: * (all named exports from core.js)
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigationNavigationBridge
 * @description Barrel export para navigation core
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-navigation.navigation';

export * from './core.js';
