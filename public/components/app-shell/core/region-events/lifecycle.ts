// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-events/lifecycle
// PURPOSE: Inicialização e destruição de listeners DOM
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   initialized, domListenersAttached from ./state.js
//   onFocusIn, onFocusOut, onClick from ./dom-listeners.js
// EXPORTS:
//   init — Inicializa listeners globais
//   destroy — Remove listeners globais
// BROWSER APIs: document.addEventListener, document.removeEventListener
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionEventsLifecycle
 * @description Ciclo de vida de eventos de região
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-events.lifecycle';

import { initialized, domListenersAttached } from './state.js';
import { onFocusIn, onFocusOut, onClick } from './dom-listeners.js';

/**
 * Inicializa listeners globais de eventos
 * @returns {boolean} Sucesso
 */
export function init() {
    if (initialized.value) return true;
    if (typeof document === 'undefined') return false;
    
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    document.addEventListener('click', onClick, true);
    
    domListenersAttached.value = true;
    initialized.value = true;
    
    return true;
}

/**
 * Remove listeners globais
 * @returns {boolean} Sucesso
 */
export function destroy() {
    if (!initialized.value) return true;
    
    if (domListenersAttached.value) {
        document.removeEventListener('focusin', onFocusIn, true);
        document.removeEventListener('focusout', onFocusOut, true);
        document.removeEventListener('click', onClick, true);
        domListenersAttached.value = false;
    }
    
    initialized.value = false;
    return true;
}
