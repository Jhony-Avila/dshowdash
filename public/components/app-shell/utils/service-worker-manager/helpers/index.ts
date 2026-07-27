// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: service-worker-manager/helpers-bridge
// PURPOSE: Re-export agregado - Notify e Base64 helpers
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./notify.js, ./base64.js
// EXPORTS: * (all named exports from both modules)
// ═══════════════════════════════════════════════════════════════
/**
 * @module ServiceWorkerHelpersBridge
 * @description Barrel export para helpers do service worker manager
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.service-worker-manager.helpers';

export * from './notify.js';
export * from './base64.js';
