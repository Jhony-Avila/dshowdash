// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: offline-manager/sync-bridge
// PURPOSE: Re-export para compatibilidade - Sync Manager
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./manager.js
// EXPORTS: * (all named exports from manager.js)
// ═══════════════════════════════════════════════════════════════
/**
 * @module OfflineManagerSyncBridge
 * @description Barrel export para sync manager offline
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.offline-manager.sync';

export * from './manager.js';
