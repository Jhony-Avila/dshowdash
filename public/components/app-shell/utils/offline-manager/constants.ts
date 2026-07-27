// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: offline-manager/constants
// PURPOSE: Constantes e enums para Offline Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   CONNECTION_STATUS — Enum de status de conexão (frozen)
//   SYNC_STATUS — Enum de status de sincronização (frozen)
// ═══════════════════════════════════════════════════════════════
/**
 * @module OfflineManagerConstants
 * @description Constantes para sistema offline
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell-offline-manager';

export const CONNECTION_STATUS = Object.freeze({
    ONLINE: 'online',
    OFFLINE: 'offline',
    SLOW: 'slow',
    UNKNOWN: 'unknown'
});

export const SYNC_STATUS = Object.freeze({
    IDLE: 'idle',
    SYNCING: 'syncing',
    COMPLETE: 'complete',
    ERROR: 'error'
});
