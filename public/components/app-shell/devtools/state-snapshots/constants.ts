// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: state-snapshots/constants
// PURPOSE: Constantes e utilitários para State Snapshots
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   generateId — Gera ID único para snapshot
//   deepClone — Clona objeto profundamente
//   getSize — Calcula tamanho em bytes
// ═══════════════════════════════════════════════════════════════
/**
 * @module StateSnapshotsConstants
 * @description Constantes e helpers para sistema de snapshots
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-AAA';
export const MODULE_ID = 'app-shell-state-snapshots';

/**
 * Gera ID único para snapshot
 * @returns {string} ID no formato snap_timestamp_random
 */
export function generateId() {
    return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clona objeto profundamente via JSON
 * @param {Object} obj - Objeto a clonar
 * @returns {Object} Clone do objeto
 */
export function deepClone(obj: DynObj) {
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (e) {
        return obj;
    }
}

/**
 * Calcula tamanho aproximado em bytes
 * @param {Object} obj - Objeto a medir
 * @returns {number} Tamanho em bytes
 */
export function getSize(obj: DynObj) {
    try {
        return JSON.stringify(obj).length;
    } catch (e) {
        return 0;
    }
}
