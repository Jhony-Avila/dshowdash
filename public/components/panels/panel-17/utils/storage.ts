// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: storage
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   save() — exported function
//   load() — exported function
//   remove() — exported function
//   clear() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-17.utils.storage';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 17 - Storage Utility
 * @module panel-17/utils/storage
 * @version 1.1.0-AAA
 */

const STORAGE_PREFIX = 'panel-17_';

export function save(key: string, value: unknown) {
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.warn('[panel-17] Storage save failed:', e);
        return false;
    }
}

export function load(key: string, defaultValue: unknown = null) {
    try {
        const item = localStorage.getItem(STORAGE_PREFIX + key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.warn('[panel-17] Storage load failed:', e);
        return defaultValue;
    }
}

export function remove(key: string) {
    localStorage.removeItem(STORAGE_PREFIX + key);
}

export function clear() {
    Object.keys(localStorage)
        .filter(k => k.startsWith(STORAGE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
}

export default { save, load, remove, clear };
