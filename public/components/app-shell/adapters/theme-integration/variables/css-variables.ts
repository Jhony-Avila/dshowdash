// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-BLACK-BG)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-integration/variables/css-variables
// PURPOSE: Gerenciamento de variáveis CSS de tema
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   THEME_VARIABLES from ../constants.js
//   getResolvedTheme from ../state.js
// EXPORTS:
//   getThemeVariable — Lê variável CSS
//   setThemeVariable — Define variável CSS
//   getThemeVariables — Retorna variáveis do tema atual
//   getAllVariableNames — Lista nomes de variáveis
// BROWSER APIs: document.documentElement.style, getComputedStyle
// ═══════════════════════════════════════════════════════════════
/**
 * @module ThemeIntegrationCSSVariables
 * @description API de variáveis CSS para temas
 * @version 1.2.0-BLACK-BG-AAA
 * @since 2025-02-02
 */
'use strict';

import { THEME_VARIABLES } from '../constants.js';
import { getResolvedTheme } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.adapters.theme-integration.variables.css-variables';

/**
 * Lê valor de variável CSS
 * @param {string} variable - Nome da variável
 * @returns {string|null}
 */
export function getThemeVariable(variable: DynObj) {
    if (typeof document === 'undefined') return null;
    
    if (!variable.startsWith('--')) {
        variable = `--${variable}`;
    }
    
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || null;
}

/**
 * Define valor de variável CSS
 * @param {string} variable - Nome da variável
 * @param {string} value - Valor a definir
 */
export function setThemeVariable(variable: DynObj, value: DynObj) {
    if (typeof document === 'undefined') return;
    
    if (!variable.startsWith('--')) {
        variable = `--${variable}`;
    }
    
    document.documentElement.style.setProperty(variable, value);
}

/**
 * Retorna variáveis do tema atual
 * @returns {Object}
 */
export function getThemeVariables() {
    const resolved = getResolvedTheme();
    return (THEME_VARIABLES as DynObj)[resolved] || THEME_VARIABLES.dark;
}

/**
 * Lista nomes de todas as variáveis
 * @returns {Array<string>}
 */
export function getAllVariableNames() {
    return Object.keys(THEME_VARIABLES.light);
}

export default {
    getThemeVariable,
    setThemeVariable,
    getThemeVariables,
    getAllVariableNames
};
