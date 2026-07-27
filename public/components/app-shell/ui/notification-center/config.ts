// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-center/config
// PURPOSE: Configuração runtime do Notification Center
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config from ./state.js
//   updateContainerPosition from ./container.js
// EXPORTS:
//   configure — Atualiza configurações
//   getConfig — Retorna cópia das configurações
//   setPosition — Define posição do container
// ═══════════════════════════════════════════════════════════════
/**
 * @module NotificationCenterConfig
 * @description Configuração dinâmica do notification center
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { config } from './state.js';
import { updateContainerPosition } from './container.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.notification-center.config';

/**
 * Atualiza configurações do notification center
 * @param {Object} options - Opções de configuração
 */
export function configure(options: DynObj) {
    if (options.position !== undefined) {
        config.position = options.position;
        updateContainerPosition();
    }
    if (options.maxVisible !== undefined) {
        config.maxVisible = Math.max(1, options.maxVisible);
    }
    if (options.defaultDuration !== undefined) {
        config.defaultDuration = options.defaultDuration;
    }
    if (options.animationDuration !== undefined) {
        config.animationDuration = options.animationDuration;
    }
    if (options.pauseOnHover !== undefined) {
        config.pauseOnHover = !!options.pauseOnHover;
    }
    if (options.showProgress !== undefined) {
        config.showProgress = !!options.showProgress;
    }
    if (options.groupSimilar !== undefined) {
        config.groupSimilar = !!options.groupSimilar;
    }
}

/**
 * Retorna cópia das configurações atuais
 * @returns {Object} Configurações
 */
export function getConfig() {
    return Object.assign({}, config);
}

/**
 * Define posição do container
 * @param {string} position - Nova posição
 */
export function setPosition(position: DynObj) {
    config.position = position;
    updateContainerPosition();
}
