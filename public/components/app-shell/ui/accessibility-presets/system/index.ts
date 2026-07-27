// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: accessibility-presets/system-bridge
// PURPOSE: Re-export para compatibilidade - System Detection
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./detection.js
// EXPORTS: * (all named exports from detection.js)
// ═══════════════════════════════════════════════════════════════
/**
 * @module AccessibilityPresetsSystemBridge
 * @description Barrel export para system detection de acessibilidade
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.accessibility-presets.system';

export * from './detection.js';
