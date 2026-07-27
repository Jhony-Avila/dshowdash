// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.2-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation/trap/manager
// PURPOSE: Gerenciamento de Tab Trap para modais/overlays
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getRegion from ../../../core/dom-regions/index.js
//   getTabTrapRegion, setTabTrapRegion, getPreviousFocus, setPreviousFocus,
//   incrementMetric, notifyListeners from ../state.js
//   focusFirstInRegion from ../helpers/focus.js
// EXPORTS:
//   setTabTrap — Ativa trap em região
//   releaseTabTrap — Libera trap
//   isTabTrapped — Verifica se há trap ativo
//   getTabTrapRegion — Retorna região com trap
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigationTabTrapManager
 * @description Focus trap para modais e overlays
 * @version 1.0.2-IMPORT-FIX-AAA
 * @since 2025-02-02
 * @changelog v1.0.2-IMPORT-FIX - Fixed import path
 */
'use strict';

import { getRegion } from '../../../core/dom-regions/index.js';
import {
    getTabTrapRegion as _getTabTrapRegion,
    setTabTrapRegion,
    getPreviousFocus,
    setPreviousFocus,
    incrementMetric,
    notifyListeners
} from '../state.js';
import { focusFirstInRegion } from '../helpers/focus.js';

type DynObj = any;

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-navigation.trap.manager';

/**
 * Ativa tab trap em uma região
 * @param {string} regionName - Nome da região
 * @returns {boolean} Sucesso
 */
export function setTabTrap(regionName: string) {
    const region = getRegion(regionName);
    if (!region) return false;
    
    setPreviousFocus(document.activeElement as DynObj);
    setTabTrapRegion(regionName);
    incrementMetric('tabTraps');
    
    focusFirstInRegion(regionName);
    
    notifyListeners('tab-trap-set', { region: regionName });
    return true;
}

/**
 * Libera tab trap atual
 * @returns {boolean} Sucesso
 */
export function releaseTabTrap() {
    const tabTrapRegion = _getTabTrapRegion();
    if (!tabTrapRegion) return false;
    
    const regionName = tabTrapRegion;
    setTabTrapRegion(null);
    
    const previousFocus = getPreviousFocus();
    if (previousFocus && document.contains(previousFocus)) {
        previousFocus.focus();
    }
    setPreviousFocus(null);
    
    notifyListeners('tab-trap-released', { region: regionName });
    return true;
}

export function isTabTrapped() {
    return _getTabTrapRegion() !== null;
}

export function getTabTrapRegion() {
    return _getTabTrapRegion();
}
