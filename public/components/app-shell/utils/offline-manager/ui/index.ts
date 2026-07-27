// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: offline-manager/ui-bridge
// PURPOSE: Re-export para compatibilidade - UI Banner
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./banner.js
// EXPORTS: * (all named exports from banner.js)
// ═══════════════════════════════════════════════════════════════
/**
 * @module OfflineManagerUIBridge
 * @description Barrel export para UI banner offline
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.offline-manager.ui';

export * from './banner.js';
