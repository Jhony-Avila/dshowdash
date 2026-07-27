// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: layout-persistence/constants
// PURPOSE: Constantes e utilitários para persistência de layout
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION, MODULE_ID — Identificadores
//   STORAGE_KEY, STORAGE_VERSION — Chaves de storage
//   DEFAULT_PREFERENCES — Preferências padrão (frozen)
//   getStorage — Retorna localStorage se disponível
//   deepClone — Clona objeto profundamente
//   deepMerge — Merge profundo de objetos
// BROWSER APIs: localStorage
// ═══════════════════════════════════════════════════════════════
/**
 * @module LayoutPersistenceConstants
 * @description Constantes para persistência de layout
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-AAA';
export const MODULE_ID = 'app-shell-layout-persistence';
export const STORAGE_KEY = 'dsd:app-shell:layout-prefs';
export const STORAGE_VERSION = 1;

export const DEFAULT_PREFERENCES = Object.freeze({
    sidebar: {
        collapsed: false,
        width: 280
    },
    footer: {
        visible: true,
        height: 48
    },
    header: {
        visible: true
    },
    navRail: {
        expanded: false
    },
    theme: {
        mode: 'system'
    },
    layout: {
        mode: 'normal',
        lastRoute: null
    }
});

export function getStorage() {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('__test__', '1');
            localStorage.removeItem('__test__');
            return localStorage;
        }
    } catch (e) { /* not available */ }
    return null;
}

export function deepClone(obj: DynObj) {
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (e) {
        return obj;
    }
}

export function deepMerge(target: DynObj, source: DynObj) {
    const result = deepClone(target);
    if (!source) return result;
    
    const keys = Object.keys(source);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}
