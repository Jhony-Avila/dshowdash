// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: maintenance-mode/config
// PURPOSE: Configuração runtime do modo de manutenção
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config from ./state.js
// EXPORTS:
//   configure — Atualiza configurações
//   getConfig — Retorna cópia das configurações
// ═══════════════════════════════════════════════════════════════
/**
 * @module MaintenanceModeConfig
 * @description Configuração dinâmica do maintenance mode
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { config } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.maintenance-mode.config';

/**
 * Atualiza configurações do maintenance mode
 * @param {Object} options - Opções de configuração
 */
export function configure(options: DynObj) {
    if (options.showBanner !== undefined) {
        config.showBanner = !!options.showBanner;
    }
    if (options.bannerPosition !== undefined) {
        config.bannerPosition = options.bannerPosition;
    }
    if (options.blockInteraction !== undefined) {
        config.blockInteraction = !!options.blockInteraction;
    }
    if (options.allowDismiss !== undefined) {
        config.allowDismiss = !!options.allowDismiss;
    }
    if (options.persistState !== undefined) {
        config.persistState = !!options.persistState;
    }
}

/**
 * Retorna cópia das configurações atuais
 * @returns {Object} Configurações
 */
export function getConfig() {
    return Object.assign({}, config);
}
