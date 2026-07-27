// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: accessibility-presets/presets-bridge
// PURPOSE: Re-export para compatibilidade - Presets Manager
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./manager.js
// EXPORTS: * (all named exports from manager.js)
// ═══════════════════════════════════════════════════════════════
/**
 * @module AccessibilityPresetsPresetsBridge
 * @description Barrel export para presets manager de acessibilidade
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.accessibility-presets.presets';

export * from './manager.js';
