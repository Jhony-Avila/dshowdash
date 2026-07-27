// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: service-worker-manager/sync-bridge
// PURPOSE: Re-export para compatibilidade - Background Sync Manager
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./manager.js
// EXPORTS: * (all named exports from manager.js)
// ═══════════════════════════════════════════════════════════════
/**
 * @module ServiceWorkerSyncBridge
 * @description Barrel export para background sync manager do service worker
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.service-worker-manager.sync';

export * from './manager.js';
