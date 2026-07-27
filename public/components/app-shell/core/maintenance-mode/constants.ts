// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: maintenance-mode/constants
// PURPOSE: Constantes e enums para Maintenance Mode
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   STORAGE_KEY — Chave para localStorage
//   MAINTENANCE_TYPES — Enum de tipos de manutenção (frozen)
//   SEVERITY — Enum de severidade (frozen)
// ═══════════════════════════════════════════════════════════════
/**
 * @module MaintenanceModeConstants
 * @description Constantes para sistema de manutenção
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell-maintenance-mode';
export const STORAGE_KEY = 'app-shell-maintenance-state';

export const MAINTENANCE_TYPES = Object.freeze({
    FULL: 'full',
    PARTIAL: 'partial',
    SCHEDULED: 'scheduled',
    EMERGENCY: 'emergency',
    FEATURE: 'feature'
});

export const SEVERITY = Object.freeze({
    INFO: 'info',
    WARNING: 'warning',
    CRITICAL: 'critical'
});
