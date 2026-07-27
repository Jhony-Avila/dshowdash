// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation/handlers/global
// PURPOSE: Handler global de teclado (dispatcher)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   KEYS from ../constants.js
//   isEnabled, getTabTrapRegion from ../state.js
//   handleF6 from ./f6.js
//   handleEscape from ./escape.js
//   handleTabTrap from ./tab-trap.js
// EXPORTS:
//   globalKeyHandler — Handler principal para KeyboardEvents
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigationGlobalHandler
 * @description Dispatcher central de eventos de teclado
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { KEYS } from '../constants.js';
import { isEnabled, getTabTrapRegion } from '../state.js';
import { handleF6 } from './f6.js';
import { handleEscape } from './escape.js';
import { handleTabTrap } from './tab-trap.js';

type DynObj = any;

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-navigation.handlers.global';

/**
 * Handler global para eventos de teclado
 * @param {KeyboardEvent} event - Evento de teclado
 */
export function globalKeyHandler(event: DynObj) {
    if (!isEnabled()) return;
    
    switch (event.key) {
        case KEYS.F6:
            handleF6(event, event.shiftKey);
            break;
            
        case KEYS.ESCAPE:
            handleEscape(event);
            break;
            
        case KEYS.TAB:
            if (getTabTrapRegion()) {
                handleTabTrap(event);
            }
            break;
    }
}
