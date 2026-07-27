// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-shortcuts/core/scope
// PURPOSE: Gerenciamento de escopos de shortcuts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SHORTCUT_SCOPES from ../constants.js
//   getActiveScope, setActiveScope, getScopeStack from ../state.js
// EXPORTS:
//   setScope — Define escopo ativo
//   restoreScope — Restaura escopo anterior
//   getScope — Retorna escopo atual
//   resetScope — Reseta para GLOBAL
//   getScopeDepth — Retorna profundidade da pilha
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardShortcutsScopeManager
 * @description Gerenciamento de escopos de shortcuts
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { SHORTCUT_SCOPES } from '../constants.js';
import { getActiveScope, setActiveScope, getScopeStack } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-shortcuts.core.scope';

/**
 * Define escopo ativo
 * @param {string} scope - Nome do escopo
 * @param {Function} notifyFn - Callback para notificar subscribers
 */
export function setScope(scope: DynObj, notifyFn: DynObj) {
    const scopeStack = getScopeStack();
    const currentScope = getActiveScope();
    
    scopeStack.push(currentScope);
    setActiveScope(scope);
    
    if (notifyFn) {
        notifyFn({
            type: 'scope-changed',
            scope,
            previousScope: currentScope,
            timestamp: Date.now()
        });
    }
}

/**
 * Restaura escopo anterior
 * @returns {string} Escopo restaurado
 */
export function restoreScope() {
    const scopeStack = getScopeStack();
    
    if (scopeStack.length > 0) {
        setActiveScope(scopeStack.pop());
    } else {
        setActiveScope(SHORTCUT_SCOPES.GLOBAL);
    }
    
    return getActiveScope();
}

/**
 * Retorna escopo atual
 * @returns {string}
 */
export function getScope() {
    return getActiveScope();
}

/**
 * Limpa pilha e retorna ao GLOBAL
 */
export function resetScope() {
    const scopeStack = getScopeStack();
    scopeStack.length = 0;
    setActiveScope(SHORTCUT_SCOPES.GLOBAL);
}

/**
 * Retorna profundidade da pilha
 * @returns {number}
 */
export function getScopeDepth() {
    return getScopeStack().length;
}

export default {
    setScope, restoreScope, getScope, resetScope, getScopeDepth
};
