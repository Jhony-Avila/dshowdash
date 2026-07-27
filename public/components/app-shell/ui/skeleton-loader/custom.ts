// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: skeleton-loader/custom
// PURPOSE: Gerenciamento de templates customizados
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   templateConfigs from ./templates.js
//   customTemplates from ./state.js
// EXPORTS:
//   listTemplates — Lista todos os templates
//   registerTemplate — Registra template custom
//   unregisterTemplate — Remove template custom
// ═══════════════════════════════════════════════════════════════
/**
 * @module SkeletonLoaderCustom
 * @description Templates customizados de skeleton
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { templateConfigs } from './templates.js';
import { customTemplates } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.skeleton-loader.custom';

/**
 * Lista todos os templates disponíveis
 * @returns {Array} Lista de { name, isBuiltIn }
 */
export function listTemplates() {
    const result = Object.keys(templateConfigs).map(name => ({
        name,
        isBuiltIn: true
    }));
    
    customTemplates.forEach((cfg, name) => {
        result.push({ name, isBuiltIn: false });
    });
    
    return result;
}

/**
 * Registra um template customizado
 * @param {string} name - Nome do template
 * @param {Object} cfg - Configuração do template
 * @returns {Object} Resultado { ok, error? }
 */
export function registerTemplate(name: string, cfg: DynObj) {
    if ((templateConfigs as DynObj)[name]) {
        return { ok: false, error: 'Cannot override built-in template' };
    }
    
    customTemplates.set(name, cfg);
    return { ok: true };
}

/**
 * Remove um template customizado
 * @param {string} name - Nome do template
 * @returns {boolean} Sucesso
 */
export function unregisterTemplate(name: string) {
    return customTemplates.delete(name);
}
