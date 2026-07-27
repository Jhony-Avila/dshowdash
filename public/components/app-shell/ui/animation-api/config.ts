// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: animation-api/config
// PURPOSE: Configuração runtime da Animation API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config from ./state.js
// EXPORTS:
//   configure — Atualiza configurações
//   getConfig — Retorna cópia das configurações atuais
// ═══════════════════════════════════════════════════════════════
/**
 * @module AnimationAPIConfig
 * @description Configuração dinâmica para animações
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { config } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.animation-api.config';

/**
 * Atualiza configurações da Animation API
 * @param {Object} options - Opções de configuração
 */
export function configure(options: DynObj) {
    if (options.defaultDuration !== undefined) {
        config.defaultDuration = Math.max(0, options.defaultDuration);
    }
    if (options.defaultEasing !== undefined) {
        config.defaultEasing = options.defaultEasing;
    }
    if (options.respectReducedMotion !== undefined) {
        config.respectReducedMotion = !!options.respectReducedMotion;
    }
    if (options.defaultFill !== undefined) {
        config.defaultFill = options.defaultFill;
    }
}

/**
 * Retorna cópia das configurações atuais
 * @returns {Object} Configurações
 */
export function getConfig() {
    return Object.assign({}, config);
}
