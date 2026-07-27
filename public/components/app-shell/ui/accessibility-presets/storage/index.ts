// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: accessibility-presets/storage-bridge
// PURPOSE: Re-export para compatibilidade - Storage Persistence
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./persistence.js
// EXPORTS: * (all named exports from persistence.js)
// ═══════════════════════════════════════════════════════════════
/**
 * @module AccessibilityPresetsStorageBridge
 * @description Barrel export para storage persistence de acessibilidade
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.accessibility-presets.storage';

export * from './persistence.js';
