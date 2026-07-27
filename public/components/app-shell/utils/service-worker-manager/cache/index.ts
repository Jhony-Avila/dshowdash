// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: service-worker-manager/cache-bridge
// PURPOSE: Re-export para compatibilidade - Cache Manager
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./manager.js
// EXPORTS: * (all named exports from manager.js)
// ═══════════════════════════════════════════════════════════════
/**
 * @module ServiceWorkerCacheBridge
 * @description Barrel export para cache manager do service worker
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.service-worker-manager.cache';

export * from './manager.js';
