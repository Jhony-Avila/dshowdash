// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation/handlers/escape
// PURPOSE: Handler para tecla Escape
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getRegion from ../../../core/dom-regions/index.js
//   isEnabled, getTabTrapRegion, incrementMetric, notifyListeners from ../state.js
//   focusFirstInRegion from ../helpers/focus.js
//   releaseTabTrap from ../trap/manager.js
// EXPORTS:
//   handleEscape — Handler para KeyboardEvent de Escape
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigationEscapeHandler
 * @description Comportamento da tecla Escape (release trap, focus main)
 * @version 1.0.1-IMPORT-FIX-AAA
 * @since 2025-02-02
 * @changelog
 *   v1.0.1-IMPORT-FIX - Fixed import path: ../../core → ../../../core
 */
'use strict';

import { getRegion } from '../../../core/dom-regions/index.js';
import { isEnabled, getTabTrapRegion, incrementMetric, notifyListeners } from '../state.js';
import { focusFirstInRegion } from '../helpers/focus.js';
import { releaseTabTrap } from '../trap/manager.js';

type DynObj = any;

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-navigation.handlers.escape';

/**
 * Handler para tecla Escape
 * @param {KeyboardEvent} event - Evento de teclado
 */
export function handleEscape(event: DynObj) {
    if (!isEnabled()) return;
    
    // Se há trap ativo, libera
    if (getTabTrapRegion()) {
        releaseTabTrap();
        incrementMetric('escapeActions');
        event.preventDefault();
        return;
    }
    
    // Escape fora de trap = focus no main
    const mainRegion = getRegion('main');
    if (mainRegion && !mainRegion.contains(document.activeElement)) {
        focusFirstInRegion('main');
        incrementMetric('escapeActions');
        
        notifyListeners('escape-to-main', { from: document.activeElement });
    }
}
