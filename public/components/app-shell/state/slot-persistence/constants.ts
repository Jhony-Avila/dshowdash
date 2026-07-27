// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: slot-persistence/constants
// PURPOSE: Constantes e helpers de storage para slot persistence
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION, MODULE_ID — Identificadores
//   STORAGE_KEY — Chave de storage
//   MAX_STORED_SLOTS, MAX_CONTENT_SIZE — Limites
//   getStorage — Retorna storage object
//   loadFromStorage — Carrega dados do storage
//   saveToStorage — Salva dados no storage
// BROWSER APIs: localStorage, sessionStorage
// ═══════════════════════════════════════════════════════════════
/**
 * @module SlotPersistenceConstants
 * @description Constantes e helpers de persistência de slots
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-AAA';
export const MODULE_ID = 'app-shell-slot-persistence';
export const STORAGE_KEY = 'app-shell-slots-state';
export const MAX_STORED_SLOTS = 100;
export const MAX_CONTENT_SIZE = 10000;

/**
 * Retorna objeto de storage apropriado
 * @param {string} storageType - 'localStorage' ou 'sessionStorage'
 * @returns {Storage|null}
 */
export function getStorage(storageType: DynObj) {
    if (typeof window === 'undefined') return null;
    if (storageType === 'sessionStorage') return window.sessionStorage;
    return window.localStorage;
}

/**
 * Carrega dados do storage
 * @param {string} storageType - Tipo de storage
 * @param {Object} metrics - Objeto de métricas
 * @returns {Object|null}
 */
export function loadFromStorage(storageType: DynObj, metrics: DynObj) {
    try {
        const storage = getStorage(storageType);
        if (!storage) return null;
        const data = storage.getItem(STORAGE_KEY);
        if (!data) return null;
        return JSON.parse(data);
    } catch (e) {
        metrics.errors++;
        return null;
    }
}

/**
 * Salva dados no storage
 * @param {Object} data - Dados a salvar
 * @param {string} storageType - Tipo de storage
 * @param {Object} metrics - Objeto de métricas
 * @returns {boolean}
 */
export function saveToStorage(data: DynObj, storageType: DynObj, metrics: DynObj) {
    try {
        const storage = getStorage(storageType);
        if (!storage) return false;
        storage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (e) {
        metrics.errors++;
        return false;
    }
}
