// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: focus-manager/trap
// PURPOSE: Gerenciamento de focus traps para modais
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   focusTraps, metrics from ./state.js
//   getFocusableElements, notifySubscribers from ./utils.js
// EXPORTS:
//   createTrap — Cria focus trap em container
//   releaseTrap — Libera focus trap
//   hasTrap — Verifica se trap existe
//   getActiveTraps — Lista traps ativos
// BROWSER APIs: document.querySelector, document.activeElement
// ═══════════════════════════════════════════════════════════════
/**
 * @module FocusManagerTrap
 * @description Focus traps para modais
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { focusTraps, metrics } from './state.js';
import { getFocusableElements, notifySubscribers } from './utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.focus-manager.trap';

export function createTrap(id: DynObj, container: HTMLElement, options: DynObj) {
    options = options || {};
    
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element) {
        return { ok: false, error: 'Container not found' };
    }
    
    if (focusTraps.has(id)) {
        return { ok: false, error: `Trap already exists: ${id}` };
    }
    
    const focusables = getFocusableElements(element);
    if (focusables.length === 0) {
        return { ok: false, error: 'No focusable elements in container' };
    }
    
    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;
        
        const currentFocusables = getFocusableElements(element);
        if (currentFocusables.length === 0) return;
        
        const first = currentFocusables[0];
        const last = currentFocusables[currentFocusables.length - 1];
        
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };
    
    element.addEventListener('keydown', handleKeydown);
    
    const trap = {
        id,
        container: element,
        handler: handleKeydown,
        active: true,
        previousFocus: document.activeElement,
        createdAt: Date.now()
    };
    
    focusTraps.set(id, trap);
    metrics.trapsActivated++;
    
    if (options.autoFocus !== false) {
        focusables[0].focus();
    }
    
    notifySubscribers({
        type: 'trap-created',
        id,
        container: element,
        timestamp: Date.now()
    });
    
    return { ok: true, trap: id };
}

export function releaseTrap(id: DynObj, options: DynObj) {
    options = options || {};
    
    const trap = focusTraps.get(id);
    if (!trap) {
        return { ok: false, error: `Trap not found: ${id}` };
    }
    
    trap.container.removeEventListener('keydown', trap.handler);
    focusTraps.delete(id);
    
    if (options.restoreFocus !== false && trap.previousFocus && document.contains(trap.previousFocus)) {
        trap.previousFocus.focus();
    }
    
    notifySubscribers({
        type: 'trap-released',
        id,
        timestamp: Date.now()
    });
    
    return { ok: true };
}

export function hasTrap(id: DynObj) {
    return focusTraps.has(id);
}

export function getActiveTraps() {
    const traps: DynObj[] = [];
    focusTraps.forEach((trap, id) => {
        traps.push({ id, active: trap.active, createdAt: trap.createdAt });
    });
    return traps;
}
