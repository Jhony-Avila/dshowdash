// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-shortcuts/core/trigger
// PURPOSE: Disparo manual e handler de eventos de teclado
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SHORTCUT_SCOPES from ../constants.js
//   getShortcuts, getActiveScope, isEnabled, getConfig, getLastCombo, setLastCombo,
//   incrementMetric, getSubscribers from ../state.js
//   parseCombo, comboToString, eventToCombo, matchesCombo, isInputElement from ../utils/key-parser.js
// EXPORTS:
//   trigger — Dispara shortcut manualmente
//   handleKeydown — Handler de keydown
//   initKeyboardListener — Inicializa listener
//   removeKeyboardListener — Remove listener
// BROWSER APIs: document.addEventListener, document.removeEventListener, setTimeout
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardShortcutsCoreTrigger
 * @description Trigger de shortcuts
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { SHORTCUT_SCOPES } from '../constants.js';
import { 
    getShortcuts, 
    getActiveScope, 
    isEnabled, 
    getConfig, 
    getLastCombo, 
    setLastCombo,
    incrementMetric,
    getSubscribers
} from '../state.js';
import { parseCombo, comboToString, eventToCombo, matchesCombo, isInputElement } from '../utils/key-parser.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell.ui.keyboard-shortcuts.core.trigger';

/**
 * Dispara shortcut manualmente
 * @param {string} combo - Combo de teclas
 * @param {Object} [context] - Contexto opcional
 * @returns {Object}
 */
export function trigger(combo: DynObj, context: DynObj) {
    const parsed = parseCombo(combo);
    if (!parsed) return { ok: false, error: 'Invalid combo' };
    
    const id = comboToString(parsed);
    const shortcut = getShortcuts().get(id);
    
    if (!shortcut) return { ok: false, error: 'Not found' };
    if (!shortcut.enabled) return { ok: false, error: 'Disabled' };
    
    try {
        shortcut.handler(context || {});
        incrementMetric('triggered');
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: e.message };
    }
}

/**
 * Handler principal de keydown
 * @param {KeyboardEvent} event
 */
export function handleKeydown(event: DynObj) {
    if (!isEnabled()) return;
    
    const eventCombo = eventToCombo(event);
    if (!eventCombo) return;
    
    const comboStr = comboToString(eventCombo);
    const config = getConfig();
    
    // Debounce
    if (getLastCombo() === comboStr) return;
    setLastCombo(comboStr);
    setTimeout(() => { setLastCombo(null); }, config.debounceMs);
    
    // Verifica se está em input
    const isInput = isInputElement((event as DynObj).target);
    const activeScope = getActiveScope();
    const shortcuts = getShortcuts();
    
    // Procura shortcut correspondente
    let matched: DynObj = null;
    shortcuts.forEach((shortcut: DynObj) => {
        if (!shortcut.enabled) return;
        if (!matchesCombo(eventCombo, shortcut.parsed)) return;
        
        // Verifica escopo
        if (shortcut.scope !== SHORTCUT_SCOPES.GLOBAL && shortcut.scope !== activeScope) return;
        
        // Verifica permissão em inputs
        if (isInput && !shortcut.allowInInputs) return;
        
        matched = shortcut;
    });
    
    if (!matched) return;
    
    // Executa
    if (matched.preventDefault) (event as DynObj).preventDefault();
    if (matched.stopPropagation) (event as DynObj).stopPropagation();
    
    try {
        matched.handler({ event, combo: comboStr, shortcut: matched });
        incrementMetric('triggered');
        
        // Notifica subscribers
        const subscribers = getSubscribers();
        for (let i = 0; i < subscribers.length; i++) {
            try {
                subscribers[i]({
                    type: 'triggered',
                    shortcut: matched,
                    timestamp: Date.now()
                });
            } catch (e: any) {}
        }
    } catch (e: any) {
        console.debug('%c[ERROR]%c [KeyboardShortcuts] Handler error:', 'color:#ef4444;font-weight:bold', 'color:inherit', e.message || e);
    }
}

/**
 * Inicializa listener de teclado
 */
export function initKeyboardListener() {
    if (typeof document !== 'undefined') {
        document.addEventListener('keydown', handleKeydown);
    }
}

/**
 * Remove listener de teclado
 */
export function removeKeyboardListener() {
    if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', handleKeydown);
    }
}

export default {
    trigger, handleKeydown, initKeyboardListener, removeKeyboardListener
};
