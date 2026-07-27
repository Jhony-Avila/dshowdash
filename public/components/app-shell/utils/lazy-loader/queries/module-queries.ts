// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: lazy-loader/queries/module-queries
// PURPOSE: Consultas de estado e informações de módulos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LOAD_STATES from ../constants.js
//   getModules, getModule from ../state.js
// EXPORTS:
//   isLoaded — Verifica se módulo está carregado
//   getState — Retorna estado de módulo
//   getModule — Retorna módulo carregado
//   getModuleInfo — Retorna info de módulo
//   listModules — Lista todos os módulos
//   countByState — Conta módulos por estado
// ═══════════════════════════════════════════════════════════════
/**
 * @module LazyLoaderModuleQueries
 * @description Consultas de módulos
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { LOAD_STATES } from '../constants.js';
import { getModules, getModule as getModuleEntry } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.lazy-loader.queries.module-queries';

/**
 * Verifica se módulo está carregado
 * @param {string} name - Nome do módulo
 * @returns {boolean}
 */
export function isLoaded(name: string) {
    const entry = getModuleEntry(name);
    return entry ? entry.state === LOAD_STATES.LOADED : false;
}

/**
 * Retorna estado de um módulo
 * @param {string} name - Nome do módulo
 * @returns {string|null}
 */
export function getState(name: string) {
    const entry = getModuleEntry(name);
    return entry ? entry.state : null;
}

/**
 * Retorna módulo carregado (síncrono)
 * @param {string} name - Nome do módulo
 * @returns {*}
 */
export function getModule(name: string) {
    const entry = getModuleEntry(name);
    return entry && entry.state === LOAD_STATES.LOADED ? entry.module : null;
}

/**
 * Retorna info de um módulo
 * @param {string} name - Nome do módulo
 * @returns {Object|null}
 */
export function getModuleInfo(name: string) {
    const entry = getModuleEntry(name);
    if (!entry) return null;
    
    return {
        name: entry.name,
        state: entry.state,
        loadTime: entry.loadTime,
        loadedAt: entry.loadedAt,
        attempts: entry.attempts,
        error: entry.error,
        hasOptions: !!entry.options && Object.keys(entry.options).length > 0
    };
}

/**
 * Lista todos os módulos registrados
 * @returns {Array}
 */
export function listModules() {
    const result: DynObj[] = [];
    const modules = getModules();
    
    modules.forEach((entry: DynObj) => {
        result.push(getModuleInfo(entry.name));
    });
    
    return result;
}

/**
 * Conta módulos por estado
 * @returns {Object}
 */
export function countByState() {
    const counts = {
        pending: 0,
        loading: 0,
        loaded: 0,
        error: 0
    };
    
    const modules = getModules();
    modules.forEach((entry: DynObj) => {
        const state = entry.state.toLowerCase();
        if ((counts as DynObj)[state] !== undefined) {
            (counts as DynObj)[state]++;
        }
    });
    
    return counts;
}

export default {
    isLoaded, getState, getModule, getModuleInfo, listModules, countByState
};
