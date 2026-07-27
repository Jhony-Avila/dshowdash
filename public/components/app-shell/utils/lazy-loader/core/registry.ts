// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: lazy-loader/core/registry
// PURPOSE: Registro e gerenciamento de módulos lazy
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ModuleEntry, hasModule, getModule, setModule, deleteModule,
//   deleteLoadPromise, getConfig, notifySubscribers from ../state.js
//   load from ./loader.js
// EXPORTS:
//   register — Registra módulo para lazy loading
//   unregister — Remove registro de módulo
//   loadMany — Carrega múltiplos módulos
//   preload — Pré-carrega módulos quando idle
// BROWSER APIs: requestIdleCallback, setTimeout
// ═══════════════════════════════════════════════════════════════
/**
 * @module LazyLoaderCoreRegistry
 * @description Registro de módulos lazy
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import {
    ModuleEntry,
    hasModule,
    getModule,
    setModule,
    deleteModule,
    deleteLoadPromise,
    getConfig,
    notifySubscribers
} from '../state.js';
import { load } from './loader.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell.utils.lazy-loader.core.registry';

/**
 * Registra um módulo para lazy loading
 * @param {string} name - Nome do módulo
 * @param {function} loader - Função de carregamento
 * @param {Object} options - Opções
 * @returns {boolean}
 */
export function register(name: string, loader: DynObj, options: DynObj) {
    if (hasModule(name)) {
        return false;
    }
    
    const entry = new (ModuleEntry as DynObj)(name, loader, options);
    setModule(name, entry);
    
    notifySubscribers({
        type: 'registered',
        module: name,
        timestamp: Date.now()
    });
    
    return true;
}

/**
 * Remove registro de um módulo
 * @param {string} name - Nome do módulo
 * @returns {boolean}
 */
export function unregister(name: string) {
    const entry = getModule(name);
    if (!entry) return false;
    
    deleteModule(name);
    deleteLoadPromise(name);
    
    return true;
}

/**
 * Carrega múltiplos módulos em paralelo
 * @param {Array} names - Nomes dos módulos
 * @returns {Promise}
 */
export function loadMany(names: DynObj) {
    const promises = names.map((name: string) => load(name).then((module: DynObj) => ({
        name,
        module,
        success: true
    })).catch((error: DynObj) => ({
        name,
        error: error.message,
        success: false
    })));
    
    return Promise.all(promises).then(results => {
        const modules = {};
        const errors = [];
        
        for (let i = 0; i < results.length; i++) {
            if (results[i].success) {
                (modules as DynObj)[results[i].name] = results[i].module;
            } else {
                errors.push({ name: results[i].name, error: results[i].error });
            }
        }
        
        return { modules, errors, allLoaded: errors.length === 0 };
    });
}

/**
 * Pré-carrega módulos quando o browser está idle
 * @param {Array} names - Nomes dos módulos
 * @returns {Promise}
 */
export function preload(names: DynObj) {
    const config = getConfig();
    
    if (!config.preloadOnIdle) {
        return loadMany(names);
    }
    
    if (typeof requestIdleCallback === 'function') {
        return new Promise(resolve => {
            requestIdleCallback(() => {
                loadMany(names).then(resolve);
            }, { timeout: 5000 });
        });
    }
    
    return new Promise(resolve => {
        setTimeout(() => {
            loadMany(names).then(resolve);
        }, 100);
    });
}

export default {
    register, unregister, loadMany, preload
};
