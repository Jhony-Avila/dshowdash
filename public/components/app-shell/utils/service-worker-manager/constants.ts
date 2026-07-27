// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: service-worker-manager/constants
// PURPOSE: Constantes e enums para Service Worker Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   SW_STATES — Enum de estados do SW (frozen)
//   UPDATE_STRATEGIES — Enum de estratégias de update (frozen)
// ═══════════════════════════════════════════════════════════════
/**
 * @module ServiceWorkerManagerConstants
 * @description Constantes para gerenciamento de Service Worker
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell-sw-manager';

export const SW_STATES = Object.freeze({
    INSTALLING: 'installing',
    INSTALLED: 'installed',
    ACTIVATING: 'activating',
    ACTIVATED: 'activated',
    REDUNDANT: 'redundant',
    ERROR: 'error',
    NOT_SUPPORTED: 'not-supported',
    NOT_REGISTERED: 'not-registered'
});

export const UPDATE_STRATEGIES = Object.freeze({
    IMMEDIATE: 'immediate',
    PROMPT: 'prompt',
    SILENT: 'silent'
});
