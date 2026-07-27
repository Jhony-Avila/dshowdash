// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: offline-manager/storage-bridge
// PURPOSE: Re-export para compatibilidade - Storage Queue
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./queue.js
// EXPORTS: * (all named exports from queue.js)
// ═══════════════════════════════════════════════════════════════
/**
 * @module OfflineManagerStorageBridge
 * @description Barrel export para storage queue offline
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.offline-manager.storage';

export * from './queue.js';
