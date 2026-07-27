// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: skeleton-loader/config
// PURPOSE: Configuração runtime do Skeleton Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config from ./state.js
//   injectStyles, removeStyles from ./styles.js
// EXPORTS:
//   configure — Atualiza configurações
//   getConfig — Retorna cópia das configurações
// ═══════════════════════════════════════════════════════════════
/**
 * @module SkeletonLoaderConfig
 * @description Configuração dinâmica do skeleton loading
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { config } from './state.js';
import { injectStyles, removeStyles } from './styles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.skeleton-loader.config';

/**
 * Atualiza configurações do skeleton loader
 * @param {Object} options - Opções de configuração
 */
export function configure(options: DynObj) {
    if (options.animationType) config.animationType = options.animationType;
    if (options.animationDuration) config.animationDuration = options.animationDuration;
    if (options.baseColor) config.baseColor = options.baseColor;
    if (options.highlightColor) config.highlightColor = options.highlightColor;
    if (options.borderRadius) config.borderRadius = options.borderRadius;
    
    // Reinjecta estilos com novas configurações
    removeStyles();
    injectStyles();
}

/**
 * Retorna cópia das configurações atuais
 * @returns {Object} Configurações
 */
export function getConfig() {
    return {
        animationType: config.animationType,
        animationDuration: config.animationDuration,
        baseColor: config.baseColor,
        highlightColor: config.highlightColor,
        borderRadius: config.borderRadius
    };
}
