// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation/navigation/core
// PURPOSE: Funções core de navegação entre regiões
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   notifyListeners from ../state.js
//   focusFirstInRegion from ../helpers/focus.js
//   handleF6 from ../handlers/f6.js
// EXPORTS:
//   navigateToRegion — Navega para região específica
//   navigateNext — Navega para próxima região
//   navigatePrevious — Navega para região anterior
//   navigateToMain — Atalho para região main
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigationCore
 * @description Navegação core por teclado entre regiões
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { notifyListeners } from '../state.js';
import { focusFirstInRegion } from '../helpers/focus.js';
import { handleF6 } from '../handlers/f6.js';

type DynObj = any;

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-navigation.navigation.core';

/**
 * Navega para uma região específica
 * @param {string} regionName - Nome da região
 * @returns {boolean} Sucesso
 */
export function navigateToRegion(regionName: string) {
    const result = focusFirstInRegion(regionName);
    
    if (result) {
        notifyListeners('navigate-to', { region: regionName });
    }
    
    return result;
}

/**
 * Navega para próxima região (F6)
 * @returns {boolean} true
 */
export function navigateNext() {
    const fakeEvent = { preventDefault() {}, shiftKey: false, key: 'F6' } as DynObj;
    handleF6(fakeEvent, false);
    return true;
}

/**
 * Navega para região anterior (Shift+F6)
 * @returns {boolean} true
 */
export function navigatePrevious() {
    const fakeEvent = { preventDefault() {}, shiftKey: true, key: 'F6' } as DynObj;
    handleF6(fakeEvent, true);
    return true;
}

/**
 * Navega diretamente para região main
 * @returns {boolean} Sucesso
 */
export function navigateToMain() {
    return navigateToRegion('main');
}
