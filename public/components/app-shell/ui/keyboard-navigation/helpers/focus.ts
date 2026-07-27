// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation/helpers/focus
// PURPOSE: Helpers para gerenciamento de focus em regiões
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getRegion from ../../../core/dom-regions/index.js
// EXPORTS:
//   getFocusableElements — Retorna elementos focáveis de container
//   focusFirstInRegion — Foca primeiro elemento de região
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigationFocusHelpers
 * @description Helpers de focus para navegação por teclado
 * @version 1.0.1-IMPORT-FIX-AAA
 * @since 2025-02-02
 * @changelog
 *   v1.0.1-IMPORT-FIX - Fixed import path: ../../core → ../../../core
 */
'use strict';

import { getRegion } from '../../../core/dom-regions/index.js';

type DynObj = any;

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-navigation.helpers.focus';

/**
 * Retorna elementos focáveis visíveis de um container
 * @param {HTMLElement} container - Container para buscar
 * @returns {Array} Array de elementos focáveis
 */
export function getFocusableElements(container: HTMLElement) {
    if (!container) return [];
    
    const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
    ].join(', ');
    
    const elements = container.querySelectorAll(selector);
    const focusable = [];
    
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if ((el as DynObj).offsetParent !== null || getComputedStyle(el).position === 'fixed') {
            focusable.push(el);
        }
    }
    
    return focusable;
}

/**
 * Foca primeiro elemento focável de uma região
 * @param {string} regionName - Nome da região
 * @returns {boolean} Sucesso
 */
export function focusFirstInRegion(regionName: string) {
    const region = getRegion(regionName);
    if (!region) return false;
    
    if (region.hasAttribute('tabindex')) {
        region.focus();
        return true;
    }
    
    const focusable = getFocusableElements(region);
    if (focusable.length > 0) {
        (focusable[0] as DynObj).focus();
        return true;
    }
    
    region.setAttribute('tabindex', '-1');
    region.focus();
    return true;
}
