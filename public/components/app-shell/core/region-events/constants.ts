// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-events/constants
// PURPOSE: Constantes e enums para sistema de eventos de região
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   REGION_EVENTS — Enum de tipos de eventos (frozen)
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionEventsConstants
 * @description Constantes para eventos de região
 * @version 1.0.1-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '1.0.1-AAA';
export const MODULE_ID = 'app-shell-region-events';

export const REGION_EVENTS = Object.freeze({
    MOUNTED: 'region:mounted',
    UNMOUNTED: 'region:unmounted',
    READY: 'region:ready',
    SHOW: 'region:show',
    HIDE: 'region:hide',
    VISIBILITY_CHANGED: 'region:visibility-changed',
    CONTENT_LOADED: 'region:content-loaded',
    CONTENT_UPDATED: 'region:content-updated',
    CONTENT_CLEARED: 'region:content-cleared',
    LOADING_START: 'region:loading-start',
    LOADING_END: 'region:loading-end',
    RESIZE_START: 'region:resize-start',
    RESIZE: 'region:resize',
    RESIZE_END: 'region:resize-end',
    FOCUS_ENTER: 'region:focus-enter',
    FOCUS_LEAVE: 'region:focus-leave',
    CLICK: 'region:click',
    HOVER_ENTER: 'region:hover-enter',
    HOVER_LEAVE: 'region:hover-leave',
    ERROR: 'region:error'
});
