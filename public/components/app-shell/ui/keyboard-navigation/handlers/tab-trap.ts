// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation/handlers/tab-trap
// PURPOSE: Handler para Tab trap em regiões
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getRegion from ../../../core/dom-regions/index.js
//   isEnabled, getTabTrapRegion from ../state.js
//   getFocusableElements from ../helpers/focus.js
// EXPORTS:
//   handleTabTrap — Handler para Tab com trap ativo
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigationTabTrapHandler
 * @description Tab trap para focus dentro de regiões
 * @version 1.0.1-IMPORT-FIX-AAA
 * @since 2025-02-02
 * @changelog
 *   v1.0.1-IMPORT-FIX - Fixed import path: ../../core → ../../../core
 */
'use strict';

import { getRegion } from '../../../core/dom-regions/index.js';
import { isEnabled, getTabTrapRegion } from '../state.js';
import { getFocusableElements } from '../helpers/focus.js';

type DynObj = any;

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-navigation.handlers.tab-trap';

/**
 * Handler para Tab com trap ativo
 * Mantém focus dentro da região especificada
 * @param {KeyboardEvent} event - Evento de teclado
 */
export function handleTabTrap(event: DynObj) {
    const tabTrapRegion = getTabTrapRegion();
    if (!tabTrapRegion || !isEnabled()) return;
    
    const region = getRegion(tabTrapRegion);
    if (!region) return;
    
    const focusable = getFocusableElements(region);
    if (focusable.length === 0) return;
    
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];
    
    if ((event as DynObj).shiftKey) {
        // Shift+Tab no primeiro elemento = vai para último
        if (document.activeElement === firstFocusable) {
            (event as DynObj).preventDefault();
            (lastFocusable as DynObj).focus();
        }
    } else {
        // Tab no último elemento = volta para primeiro
        if (document.activeElement === lastFocusable) {
            (event as DynObj).preventDefault();
            (firstFocusable as DynObj).focus();
        }
    }
}
