// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: accessibility-presets/css-bridge
// PURPOSE: Re-export para compatibilidade - CSS Manager
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./manager.js
// EXPORTS: * (all named exports from manager.js)
// ═══════════════════════════════════════════════════════════════
/**
 * @module AccessibilityPresetsCSSBridge
 * @description Barrel export para CSS manager de acessibilidade
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.accessibility-presets.css';

export * from './manager.js';
