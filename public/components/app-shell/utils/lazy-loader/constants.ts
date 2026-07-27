// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: lazy-loader/constants
// PURPOSE: Constantes e configuração padrão do Lazy Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   LOAD_STATES — Enum de estados de carregamento (frozen)
//   DEFAULT_CONFIG — Configuração padrão (frozen)
//   default — Objeto com todas as constantes
// ═══════════════════════════════════════════════════════════════
/**
 * @module LazyLoaderConstants
 * @description Constantes para sistema de lazy loading
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell-lazy-loader';

export const LOAD_STATES = Object.freeze({
    PENDING: 'PENDING',
    LOADING: 'LOADING',
    LOADED: 'LOADED',
    ERROR: 'ERROR'
});

export const DEFAULT_CONFIG = Object.freeze({
    timeout: 30000,
    retryAttempts: 2,
    retryDelay: 1000,
    preloadOnIdle: true,
    cacheModules: true
});

export default {
    VERSION,
    MODULE_ID,
    LOAD_STATES,
    DEFAULT_CONFIG
};
