// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: focus-manager/persistence
// PURPOSE: Salvar e restaurar focus entre contextos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   savedFocus, metrics from ./state.js
//   focusElement from ./core.js
// EXPORTS:
//   saveFocus — Salva focus atual com chave
//   restoreFocus — Restaura focus de chave
//   clearSavedFocus — Limpa focus salvo
//   getSavedFocusKeys — Lista chaves salvas
// ═══════════════════════════════════════════════════════════════
/**
 * @module FocusManagerPersistence
 * @description Persistência de focus entre contextos
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { savedFocus, metrics } from './state.js';
import { focusElement } from './core.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.focus-manager.persistence';

/**
 * Salva focus atual com uma chave
 * @param {string} key - Chave identificadora
 * @returns {Object} Resultado { ok, element?, error? }
 */
export function saveFocus(key: string) {
    const current = document.activeElement;
    if (current && current !== document.body) {
        savedFocus.set(key, current);
        return { ok: true, element: current };
    }
    return { ok: false, error: 'No active element' };
}

/**
 * Restaura focus de uma chave
 * @param {string} key - Chave identificadora
 * @param {Object} options - Opções de focus
 * @returns {Object} Resultado { ok, error? }
 */
export function restoreFocus(key: string, options: DynObj) {
    const saved = savedFocus.get(key);
    if (!saved) {
        return { ok: false, error: `No saved focus for key: ${key}` };
    }
    
    if (!document.contains(saved)) {
        savedFocus.delete(key);
        return { ok: false, error: 'Saved element no longer in DOM' };
    }
    
    metrics.restores++;
    return focusElement(saved, options);
}

/**
 * Limpa focus salvo
 * @param {string} key - Chave específica ou undefined para limpar todos
 * @returns {boolean}
 */
export function clearSavedFocus(key: string) {
    if (key) {
        return savedFocus.delete(key);
    }
    savedFocus.clear();
    return true;
}

/**
 * Lista chaves de focus salvo
 * @returns {Array<string>}
 */
export function getSavedFocusKeys() {
    const keys: DynObj[] = [];
    savedFocus.forEach((v, k) => { keys.push(k); });
    return keys;
}
