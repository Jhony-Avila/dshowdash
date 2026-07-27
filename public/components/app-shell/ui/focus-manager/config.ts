// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: focus-manager/config
// PURPOSE: Configuração runtime do Focus Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config from ./state.js
// EXPORTS:
//   configure — Atualiza configurações
//   getConfig — Retorna cópia das configurações
// ═══════════════════════════════════════════════════════════════
/**
 * @module FocusManagerConfig
 * @description Configuração dinâmica do Focus Manager
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { config } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.focus-manager.config';

/**
 * Atualiza configurações do Focus Manager
 * @param {Object} options - Opções de configuração
 */
export function configure(options: DynObj) {
    if (options.historyLimit !== undefined) {
        config.historyLimit = Math.max(10, options.historyLimit);
    }
    if (options.announceOnFocus !== undefined) {
        config.announceOnFocus = !!options.announceOnFocus;
    }
    if (options.scrollIntoView !== undefined) {
        config.scrollIntoView = !!options.scrollIntoView;
    }
    if (options.preventScroll !== undefined) {
        config.preventScroll = !!options.preventScroll;
    }
    if (options.focusDelay !== undefined) {
        config.focusDelay = Math.max(0, options.focusDelay);
    }
}

/**
 * Retorna cópia das configurações atuais
 * @returns {Object} Configurações
 */
export function getConfig() {
    return Object.assign({}, config);
}
