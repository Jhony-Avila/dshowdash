// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: offline-manager/connection-bridge
// PURPOSE: Re-export agregado - Detection e Handlers
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./detection.js, ./handlers.js
// EXPORTS: * (all named exports from both modules)
// ═══════════════════════════════════════════════════════════════
/**
 * @module OfflineManagerConnectionBridge
 * @description Barrel export para connection detection e handlers
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.offline-manager.connection';

export * from './detection.js';
export * from './handlers.js';
