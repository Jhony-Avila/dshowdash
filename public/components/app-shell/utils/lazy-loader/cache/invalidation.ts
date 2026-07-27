// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: lazy-loader/cache/invalidation
// PURPOSE: Invalidação de cache de módulos lazy-loaded
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LOAD_STATES from ../constants.js
//   getModules, getModule from ../state.js
// EXPORTS:
//   invalidate — Invalida cache de um módulo
//   invalidateAll — Invalida todos os módulos
//   invalidateErrors — Invalida apenas módulos com erro
// ═══════════════════════════════════════════════════════════════
/**
 * @module LazyLoaderCacheInvalidation
 * @description Invalidação de cache de módulos
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { LOAD_STATES } from '../constants.js';
import { getModules, getModule } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.lazy-loader.cache.invalidation';

/**
 * Invalida cache de um módulo
 * @param {string} name - Nome do módulo
 * @returns {boolean} Sucesso
 */
export function invalidate(name: string) {
    const entry = getModule(name);
    if (!entry) return false;
    
    entry.state = LOAD_STATES.PENDING;
    entry.module = null;
    entry.error = null;
    entry.loadTime = null;
    entry.loadedAt = null;
    
    return true;
}

/**
 * Invalida cache de todos os módulos
 */
export function invalidateAll() {
    const modules = getModules();
    
    modules.forEach((entry: DynObj) => {
        entry.state = LOAD_STATES.PENDING;
        entry.module = null;
        entry.error = null;
        entry.loadTime = null;
        entry.loadedAt = null;
    });
}

/**
 * Invalida módulos com erro
 * @returns {number} Quantidade invalidada
 */
export function invalidateErrors() {
    let count = 0;
    const modules = getModules();
    
    modules.forEach((entry: DynObj) => {
        if (entry.state === LOAD_STATES.ERROR) {
            entry.state = LOAD_STATES.PENDING;
            entry.module = null;
            entry.error = null;
            entry.loadTime = null;
            entry.loadedAt = null;
            count++;
        }
    });
    
    return count;
}

export default {
    invalidate, invalidateAll, invalidateErrors
};
